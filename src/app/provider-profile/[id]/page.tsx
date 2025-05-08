'use client';

import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import type { EnrollmentData, CustomFieldDefinition, ActivityLogEntry, CustomFieldOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Edit, Save, MessageSquare, PlusCircle, Activity, UserCircle, Building, Settings2, FileText, CalendarDays, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EHR_VENDORS } from '@/lib/constants';
import { FHIRValidationDisplay } from '@/components/fhir-validation-display';
import Link from 'next/link';

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, icon: Icon, children, actions }) => (
  <Card className="shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center">
        <Icon className="mr-2 h-5 w-5 text-primary" />
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

interface EditableFieldProps {
  label: string;
  value: any;
  name: string;
  isEditing: boolean;
  onChange: (ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => void;
  type?: string; // 'text', 'textarea', 'tel', 'email' (for standard inputs)
  options?: { label: string; value: string }[]; // for standard select
  customField?: CustomFieldDefinition;
  allCustomFields?: CustomFieldDefinition[];
  formData?: Record<string, any>; // Current form data, needed for dependent dropdowns
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  label, value, name, isEditing, onChange, type = 'text', 
  options, customField, allCustomFields, formData 
}) => {

  const displayValue = (val: any, cf?: CustomFieldDefinition) => {
    if (val === undefined || val === null || val === '') return <span className="italic text-muted-foreground">Not provided</span>;
    
    if (cf?.type === 'date' && val) {
      try { return format(parseISO(val), 'PPP'); } catch { return String(val); }
    }
    if (cf?.type === 'checkbox') return val ? 'Yes' : 'No';
    if (cf?.type === 'checkbox-group' && Array.isArray(val)) {
      if (val.length === 0) return <span className="italic text-muted-foreground">None selected</span>;
      return val.map(v => cf.options?.find(o => o.value === v)?.label || v).join(', ');
    }
    if ((cf?.type === 'select' || cf?.type === 'radio-group') && cf.options) {
      const option = cf.options.find(o => o.value === val);
      return option ? option.label : String(val);
    }
    if (name === 'ehrVendor' && EHR_VENDORS) {
        const vendor = EHR_VENDORS.find(v => v.value === val);
        return vendor ? vendor.label : String(val);
    }
    return String(val);
  };

  if (!isEditing) {
    return (
      <div className="mb-3">
        <Label className="font-semibold text-foreground/80">{customField?.label || label}:</Label>
        <p className="text-sm mt-0.5">{displayValue(value, customField)}</p>
      </div>
    );
  }

  // Editing mode
  const fieldId = customField ? `additionalData.${customField.id}` : name;
  const fieldLabel = customField?.label || label;
  const isRequired = customField?.required || false; // Add other required logic for standard fields if necessary

  if (customField) {
    switch (customField.type) {
      case 'text':
        return (
          <div className="mb-3">
            <Label htmlFor={fieldId}>{fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            <Input id={fieldId} name={fieldId} value={value || ''} onChange={onChange} placeholder={customField.placeholder} />
          </div>
        );
      case 'textarea':
        return (
          <div className="mb-3">
            <Label htmlFor={fieldId}>{fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            <Textarea id={fieldId} name={fieldId} value={value || ''} onChange={onChange} placeholder={customField.placeholder} />
          </div>
        );
      case 'select':
        let currentOptions = customField.options || [];
        if (customField.parentFieldId && customField.dependentOptionsJson && formData && allCustomFields) {
            const parentValue = formData[`additionalData.${customField.parentFieldId}`];
            if (parentValue) {
              try {
                const dependentOptionsMap = JSON.parse(customField.dependentOptionsJson);
                currentOptions = dependentOptionsMap[parentValue] || [];
              } catch (e) { console.error("Error parsing dependentOptionsJson", e); }
            } else {
              currentOptions = [];
            }
        }
        return (
          <div className="mb-3">
            <Label htmlFor={fieldId}>{fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            <Select name={fieldId} onValueChange={(val) => onChange({ target: { name: fieldId, value: val } })} value={value || ''}
              disabled={customField.parentFieldId && formData && !formData[`additionalData.${customField.parentFieldId}`] && currentOptions.length === 0}
            >
              <SelectTrigger id={fieldId}><SelectValue placeholder={customField.placeholder || "Select an option"} /></SelectTrigger>
              <SelectContent>
                {currentOptions.map((option: CustomFieldOption) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                 {currentOptions.length === 0 && customField.parentFieldId && formData && formData[`additionalData.${customField.parentFieldId}`] && (
                    <SelectItem value="" disabled>No options for selected parent</SelectItem>
                )}
                 {currentOptions.length === 0 && customField.parentFieldId && (!formData || !formData[`additionalData.${customField.parentFieldId}`]) && (
                    <SelectItem value="" disabled>Select parent field first</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2 mb-3 py-2">
            <Checkbox id={fieldId} name={fieldId} checked={!!value} onCheckedChange={(checked) => onChange({ target: { name: fieldId, value: !!checked } })} />
            <Label htmlFor={fieldId} className="font-normal">{fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}</Label>
          </div>
        );
      case 'checkbox-group':
        return (
          <div className="mb-3">
            <Label>{fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            <div className="space-y-1 mt-1">
              {customField.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}.${option.value}`}
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentArray = Array.isArray(value) ? value : [];
                      const newArray = checked
                        ? [...currentArray, option.value]
                        : currentArray.filter(v => v !== option.value);
                      onChange({ target: { name: fieldId, value: newArray } });
                    }}
                  />
                  <Label htmlFor={`${fieldId}.${option.value}`} className="font-normal">{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      case 'radio-group':
        return (
          <div className="mb-3">
            <Label>{fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            <RadioGroup name={fieldId} value={value || ''} onValueChange={(val) => onChange({ target: { name: fieldId, value: val }})} className="space-y-1 mt-1">
              {customField.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${fieldId}.${option.value}`} />
                  <Label htmlFor={`${fieldId}.${option.value}`} className="font-normal">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
       case 'date':
        return (
          <div className="mb-3">
            <Label htmlFor={fieldId}>{fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`w-full justify-start text-left font-normal ${!value && "text-muted-foreground"}`}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {value ? format(parseISO(value), "PPP") : <span>{customField.placeholder || "Pick a date"}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={value ? parseISO(value) : undefined} 
                  onSelect={(date) => onChange({ target: { name: fieldId, value: date ? date.toISOString() : '' }})} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        );
      default: return <p>Unsupported custom field type: {customField.type}</p>;
    }
  }

  // Standard fields (non-custom)
  if (type === 'textarea') {
    return (
      <div className="mb-3">
        <Label htmlFor={fieldId}>{fieldLabel}</Label>
        <Textarea id={fieldId} name={fieldId} value={value || ''} onChange={onChange} />
      </div>
    );
  }
  if (type === 'select' && options) { // This is for standard select like EHR Vendor
     return (
      <div className="mb-3">
        <Label htmlFor={fieldId}>{fieldLabel}</Label>
        <Select name={fieldId} onValueChange={(val) => onChange({target: {name: fieldId, value: val}})} value={value || ''}>
          <SelectTrigger id={fieldId}><SelectValue placeholder={`Select ${fieldLabel.toLowerCase()}`} /></SelectTrigger>
          <SelectContent>
            {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return ( // Default to standard input
    <div className="mb-3">
      <Label htmlFor={fieldId}>{fieldLabel}</Label>
      <Input id={fieldId} name={fieldId} type={type} value={value || ''} onChange={onChange} />
    </div>
  );
};

export default function ProviderProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { enrollments, customFieldDefinitions, updateEnrollmentData, addActivityLogEntry } = useAppContext();
  const { toast } = useToast();

  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({}); // Using Record<string, any> for easier nested updates
  const [newActivityLog, setNewActivityLog] = useState('');
  const [newCommunication, setNewCommunication] = useState('');
  
  const currentEnrollment = useMemo(() => {
    return enrollments.find(e => e.id === id);
  }, [id, enrollments]);

  useEffect(() => {
    if (currentEnrollment) {
      setEnrollment(currentEnrollment);
      // Initialize formData with structured data
      const initialFormData: Record<string, any> = {
        practiceInfo: { ...currentEnrollment.practiceInfo },
        contactDetails: { ...currentEnrollment.contactDetails },
        ehrVendor: currentEnrollment.ehrVendor,
        additionalData: { ...(currentEnrollment.additionalData || {}) },
      };
      setFormData(initialFormData);
    } else if (id) {
      console.warn(`Enrollment with ID ${id} not found in context.`);
    }
  }, [id, currentEnrollment]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setFormData(prev => {
      // Deep clone previous state to avoid direct mutation
      const newState = JSON.parse(JSON.stringify(prev));
      let currentLevel = newState;
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          currentLevel[key] = value;
        } else {
          if (!currentLevel[key] || typeof currentLevel[key] !== 'object') {
            currentLevel[key] = {};
          }
          currentLevel = currentLevel[key];
        }
      });
      return newState;
    });
  };
  
  const handleSave = () => {
    if (!enrollment || !id || Object.keys(formData).length === 0) return;
    
    const dataToUpdate: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>> = {
        practiceInfo: formData.practiceInfo,
        contactDetails: formData.contactDetails,
        ehrVendor: formData.ehrVendor,
        additionalData: formData.additionalData,
    };

    updateEnrollmentData(id as string, dataToUpdate);
    setIsEditing(false);
    addActivityLogEntry(id as string, 'Provider profile details updated by PHA Admin.', 'UserAction', 'PHA Admin');
  };

  const handleAddActivity = () => {
    if (!newActivityLog.trim() || !id) return;
    addActivityLogEntry(id as string, newActivityLog, 'UserAction', 'PHA Admin');
    setNewActivityLog('');
  };

  const handleSendCommunication = () => {
    if (!newCommunication.trim() || !id || !enrollment) return;
    addActivityLogEntry(id as string, `Message to ${enrollment.contactDetails.name}: ${newCommunication}`, 'Communication', 'PHA Admin');
    toast({ title: 'Communication Sent (Mock)', description: `Message to ${enrollment.contactDetails.name} logged.` });
    setNewCommunication('');
  };

  if (!enrollment) {
    return <div className="container mx-auto py-10 text-center flex items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
             <span>Loading provider profile... If this persists, the profile may not exist or there was an error.</span>
             <Button asChild variant="link" className="ml-2"><Link href="/">Go Home</Link></Button>
           </div>;
  }
  
  const sortedCustomFieldDefinitions = [...customFieldDefinitions].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 container mx-auto">
         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        <h1 className="text-xl font-semibold">Provider Profile: {enrollment.practiceInfo.name}</h1>
      </header>

      <main className="container mx-auto py-6 space-y-6">
        <SectionCard
          title="Enrollment Overview"
          icon={UserCircle}
          actions={
            <Button onClick={() => {
              if (isEditing) handleSave(); // Save if currently editing
              else setIsEditing(true); // Otherwise, toggle to edit
            }} variant={isEditing ? 'default' : 'outline'} size="sm" className={isEditing ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
              {isEditing ? <Save className="mr-1 h-4 w-4" /> : <Edit className="mr-1 h-4 w-4" />}
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <div>
                <h4 className="text-md font-medium mb-2 mt-2 flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground"/>Practice Information</h4>
                <EditableField label="Practice Name" name="practiceInfo.name" value={formData.practiceInfo?.name} isEditing={isEditing} onChange={handleInputChange} />
                <EditableField label="Address" name="practiceInfo.address" value={formData.practiceInfo?.address} type="textarea" isEditing={isEditing} onChange={handleInputChange} />
                <EditableField label="Phone" name="practiceInfo.phone" value={formData.practiceInfo?.phone} type="tel" isEditing={isEditing} onChange={handleInputChange} />
            </div>
            <div>
                <h4 className="text-md font-medium mb-2 mt-2 flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Contact Details</h4>
                <EditableField label="Contact Name" name="contactDetails.name" value={formData.contactDetails?.name} isEditing={isEditing} onChange={handleInputChange} />
                <EditableField label="Email" name="contactDetails.email" value={formData.contactDetails?.email} type="email" isEditing={isEditing} onChange={handleInputChange} />
                <EditableField label="Phone" name="contactDetails.phone" value={formData.contactDetails?.phone} type="tel" isEditing={isEditing} onChange={handleInputChange} />
            </div>
             <div className="md:col-span-2">
                <h4 className="text-md font-medium mb-2 mt-3 flex items-center"><Settings2 className="mr-2 h-4 w-4 text-muted-foreground"/>EHR & System Info</h4>
                <EditableField 
                  label="EHR Vendor" 
                  name="ehrVendor" 
                  value={formData.ehrVendor} 
                  isEditing={isEditing} 
                  onChange={handleInputChange} 
                  type="select"
                  options={EHR_VENDORS}
                />
                <div className="mb-3">
                    <Label className="font-semibold text-foreground/80">Submission Date:</Label>
                    <p className="text-sm mt-0.5">{format(parseISO(enrollment.submissionDate), 'PPP p')}</p>
                </div>
                 <div className="mb-3">
                    <Label className="font-semibold text-foreground/80">Status:</Label>
                     <p className="text-sm mt-0.5">{enrollment.status}</p>
                </div>
            </div>
          </div>

          {sortedCustomFieldDefinitions.length > 0 && (
             <div className="md:col-span-2 mt-4 pt-4 border-t">
                <h4 className="text-md font-medium mb-3 flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground"/>Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
                {sortedCustomFieldDefinitions.map(fieldDef => (
                  <EditableField
                    key={fieldDef.id}
                    label={fieldDef.label} // Passed for display in non-editing mode & for label in editing
                    name={`additionalData.${fieldDef.id}`} // Full path for formData access
                    value={formData.additionalData?.[fieldDef.id]}
                    isEditing={isEditing}
                    onChange={handleInputChange}
                    customField={fieldDef} // Pass the full definition
                    allCustomFields={customFieldDefinitions} // For dependent dropdowns
                    formData={formData} // Pass current form data for dependent logic
                  />
                ))}
                </div>
            </div>
          )}
          
          {isEditing && (
            <Button onClick={() => { setIsEditing(false); if(currentEnrollment) setFormData({ practiceInfo: { ...currentEnrollment.practiceInfo }, contactDetails: { ...currentEnrollment.contactDetails }, ehrVendor: currentEnrollment.ehrVendor, additionalData: { ...(currentEnrollment.additionalData || {}) }}); }} variant="outline" size="sm" className="mt-4 ml-2">
                 Cancel
            </Button>
          )}
        </SectionCard>

        {enrollment.ccdDocumentName && (
             <SectionCard title="FHIR/CCD Document" icon={FileText}>
                 <p className="mb-2"><strong>Document Name:</strong> {enrollment.ccdDocumentName}</p>
                {enrollment.validationResult && <FHIRValidationDisplay result={enrollment.validationResult} />}
             </SectionCard>
        )}
        
        <SectionCard title="Activity Log" icon={Activity}>
          <div className="max-h-60 overflow-y-auto space-y-2 mb-4 p-2 bg-muted/30 rounded-md">
            {enrollment.activityLog && enrollment.activityLog.length > 0 ? (
              [...enrollment.activityLog].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()).map((log, index) => (
                <div key={index} className="text-xs p-1.5 border-b border-dashed">
                  <span className="font-semibold">{format(parseISO(log.timestamp), 'MMM d, yyyy h:mm a')}</span> ({log.type} by {log.user || 'System'}): {log.entry}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No activity logged yet.</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={newActivityLog}
              onChange={(e) => setNewActivityLog(e.target.value)}
              placeholder="Add new log entry..."
              className="flex-grow"
            />
            <Button onClick={handleAddActivity} size="sm"><PlusCircle className="mr-1 h-4 w-4" />Add Log</Button>
          </div>
        </SectionCard>

        <SectionCard title="Communication Center (Mock)" icon={MessageSquare}>
          <p className="text-sm text-muted-foreground mb-3">Log communications with the provider. (This is a mock interface)</p>
          <Textarea
            value={newCommunication}
            onChange={(e) => setNewCommunication(e.target.value)}
            placeholder={`Type message for ${enrollment.contactDetails.name} (${enrollment.contactDetails.email})...`}
            rows={3}
            className="mb-2"
          />
          <Button onClick={handleSendCommunication} size="sm">Send Message (Log)</Button>
        </SectionCard>
      </main>
    </div>
  );
}