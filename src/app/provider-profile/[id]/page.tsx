
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
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
import { format, parseISO, isValid } from 'date-fns';
import { ArrowLeft, Edit, Save, MessageSquare, PlusCircle, Activity, UserCircle, Building, Settings2, FileText, CalendarDays, Info, Loader2, User } from 'lucide-react';
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

type EditableFieldOnChangeEvent =
  | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  | { target: { name: string; value: any } };

interface EditableFieldProps {
  label: string;
  value: any;
  name: string;
  isEditing: boolean;
  onChange: (event: EditableFieldOnChangeEvent) => void;
  type?: string; 
  options?: { label: string; value: string }[]; 
  customField?: CustomFieldDefinition;
  allCustomFields?: CustomFieldDefinition[];
  formData?: Record<string, any>; 
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  label, value, name, isEditing, onChange, type = 'text', 
  options, customField, allCustomFields, formData 
}) => {

  const displayValue = (val: any, cf?: CustomFieldDefinition) => {
    if (val === undefined || val === null || val === '') return <span className="italic text-muted-foreground">Not provided</span>;
    
    if (cf?.type === 'date' && val) {
      try { 
        const date = parseISO(val);
        return isValid(date) ? format(date, 'PPP') : String(val); 
      } catch { return String(val); }
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

  const fieldId = customField ? `additionalData.${customField.id}` : name;
  const fieldLabel = customField?.label || label;
  const isRequired = customField?.required || false; 

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
                  {value && isValid(parseISO(value)) ? format(parseISO(value), "PPP") : <span>{customField.placeholder || "Pick a date"}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={value && isValid(parseISO(value)) ? parseISO(value) : undefined} 
                  onSelect={(date) => onChange({ target: { name: fieldId, value: date ? date.toISOString() : '' }})} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        );
      default: return <p>Unsupported custom field type: {customField.type}</p>;
    }
  }

  if (type === 'textarea') {
    return (
      <div className="mb-3">
        <Label htmlFor={fieldId}>{fieldLabel}</Label>
        <Textarea id={fieldId} name={fieldId} value={value || ''} onChange={onChange} />
      </div>
    );
  }
  if (type === 'select' && options) {
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

  return (
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
  const { enrollments, customFieldDefinitions, updateEnrollmentData, addActivityLogEntry, isLoading: isContextLoading } = useAppContext();
  const { toast } = useToast();

  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [newActivityLog, setNewActivityLog] = useState('');
  const [newCommunication, setNewCommunication] = useState('');
  
  const currentEnrollment = useMemo(() => {
    if (typeof id !== 'string') return null;
    return enrollments.find(e => e.id === id);
  }, [id, enrollments]);

  useEffect(() => {
    if (currentEnrollment) {
      setEnrollment(currentEnrollment);
      const initialFormData: Record<string, any> = {
        practiceInfo: { ...currentEnrollment.practiceInfo },
        contactDetails: { ...currentEnrollment.contactDetails },
        ehrVendor: currentEnrollment.ehrVendor,
        additionalData: { ...(currentEnrollment.additionalData || {}) },
      };
      setFormData(initialFormData);
    } else if (id && !isContextLoading && enrollments.length > 0) {
      // Enrollments loaded but this one not found
      setEnrollment(null); 
    }
  }, [id, currentEnrollment, isContextLoading, enrollments.length]);

  const handleInputChange = (e: EditableFieldOnChangeEvent) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setFormData(prev => {
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
  
  const handleSave = async () => {
    if (!enrollment || !id || Object.keys(formData).length === 0) return;
    
    setIsSaving(true);
    const dataToUpdate: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>> = {
        practiceInfo: formData.practiceInfo,
        contactDetails: formData.contactDetails,
        ehrVendor: formData.ehrVendor,
        additionalData: formData.additionalData,
    };

    await updateEnrollmentData(id as string, dataToUpdate);
    setIsEditing(false);
    setIsSaving(false);
    // Activity log for save is handled within updateEnrollmentData in context now
  };

  const handleAddActivity = async () => {
    if (!newActivityLog.trim() || !id) return;
    setIsSaving(true); // Use same saving flag for simplicity or add a new one
    await addActivityLogEntry(id as string, newActivityLog, 'UserAction', 'PHA Admin');
    setNewActivityLog('');
    setIsSaving(false);
  };

  const handleSendCommunication = async () => {
    if (!newCommunication.trim() || !id || !enrollment) return;
    setIsSaving(true);
    await addActivityLogEntry(id as string, `Message to ${enrollment.contactDetails.name}: ${newCommunication}`, 'Communication', 'PHA Admin');
    toast({ title: 'Communication Sent (Mock)', description: `Message to ${enrollment.contactDetails.name} logged.` });
    setNewCommunication('');
    setIsSaving(false);
  };

  if (isContextLoading && !enrollment) {
    return <div className="container mx-auto py-10 text-center flex items-center justify-center h-screen">
             <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
             <span>Loading provider profile...</span>
           </div>;
  }

  if (!enrollment) {
    return <div className="container mx-auto py-10 text-center h-screen flex flex-col items-center justify-center">
             <Info className="h-12 w-12 text-destructive mb-4" />
             <h2 className="text-2xl font-semibold mb-2">Provider Profile Not Found</h2>
             <p className="text-muted-foreground mb-6">The profile with ID "{id}" could not be found.</p>
             <Button asChild variant="outline">
               <Link href="/">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
               </Link>
             </Button>
           </div>;
  }
  
  const sortedCustomFieldDefinitions = [...customFieldDefinitions].sort((a, b) => a.order - b.order);
  const submissionDate = enrollment.submissionDate && isValid(parseISO(enrollment.submissionDate)) 
    ? format(parseISO(enrollment.submissionDate), 'PPP p') 
    : 'Invalid Date';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 container mx-auto">
         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()} disabled={isSaving}>
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
            <div className="flex space-x-2">
              {isEditing && (
                <Button onClick={() => { setIsEditing(false); if(currentEnrollment) setFormData({ practiceInfo: { ...currentEnrollment.practiceInfo }, contactDetails: { ...currentEnrollment.contactDetails }, ehrVendor: currentEnrollment.ehrVendor, additionalData: { ...(currentEnrollment.additionalData || {}) }}); }} variant="outline" size="sm" disabled={isSaving}>
                     Cancel
                </Button>
              )}
              <Button onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }} variant={isEditing ? 'default' : 'outline'} size="sm" className={isEditing ? 'bg-green-600 hover:bg-green-700 text-white' : ''} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : (isEditing ? <Save className="mr-1 h-4 w-4" /> : <Edit className="mr-1 h-4 w-4" />)}
                {isSaving ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
              </Button>
            </div>
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
                    <p className="text-sm mt-0.5">{submissionDate}</p>
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
                    label={fieldDef.label}
                    name={`additionalData.${fieldDef.id}`}
                    value={formData.additionalData?.[fieldDef.id]}
                    isEditing={isEditing}
                    onChange={handleInputChange}
                    customField={fieldDef}
                    allCustomFields={customFieldDefinitions}
                    formData={formData}
                  />
                ))}
                </div>
            </div>
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
              [...enrollment.activityLog].sort((a,b) => {
                  const dateA = a.timestamp ? parseISO(a.timestamp) : new Date(0);
                  const dateB = b.timestamp ? parseISO(b.timestamp) : new Date(0);
                  if (!isValid(dateA)) return 1;
                  if (!isValid(dateB)) return -1;
                  return dateB.getTime() - dateA.getTime();
              }).map((log, index) => (
                <div key={index} className="text-xs p-1.5 border-b border-dashed">
                  <span className="font-semibold">
                    {log.timestamp && isValid(parseISO(log.timestamp)) ? format(parseISO(log.timestamp), 'MMM d, yyyy h:mm a') : 'Invalid Date'}
                  </span> ({log.type} by {log.user || 'System'}): {log.entry}
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
              disabled={isSaving}
            />
            <Button onClick={handleAddActivity} size="sm" disabled={isSaving || !newActivityLog.trim()}>
              {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-1 h-4 w-4" />}
              Add Log
            </Button>
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
            disabled={isSaving}
          />
          <Button onClick={handleSendCommunication} size="sm" disabled={isSaving || !newCommunication.trim()}>
            {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Send Message (Log)
          </Button>
        </SectionCard>
      </main>
    </div>
  );
}
