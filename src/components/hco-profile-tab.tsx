
'use client';

import React from 'react';
import type { ChangeEvent } from 'react';
import type { EnrollmentData, CustomFieldDefinition, CustomFieldOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { Edit, Save, UserCircle, Building, Settings2, FileText, CalendarDays, Info, Loader2, User, Hash } from 'lucide-react';
import { EHR_VENDORS } from '@/lib/constants';
import { FHIRValidationDisplay } from '@/components/fhir-validation-display';
import { HcoOnboardingWorkflowSteps } from '@/components/hco-onboarding-workflow-steps'; // Added import

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
  icon?: React.ElementType;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label, value, name, isEditing, onChange, type = 'text',
  options, customField, allCustomFields, formData, icon: Icon
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
        <Label className="font-semibold text-foreground/80 flex items-center">
          {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          {customField?.label || label}:
        </Label>
        <p className="text-sm mt-0.5 ml-6">{displayValue(value, customField)}</p>
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
            <Label htmlFor={fieldId} className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                {fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input id={fieldId} name={fieldId} value={value || ''} onChange={onChange} placeholder={customField.placeholder} className="ml-6 w-[calc(100%-1.5rem)]" />
          </div>
        );
      case 'textarea':
        return (
          <div className="mb-3">
            <Label htmlFor={fieldId} className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                {fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea id={fieldId} name={fieldId} value={value || ''} onChange={onChange} placeholder={customField.placeholder} className="ml-6 w-[calc(100%-1.5rem)]" />
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
            <Label htmlFor={fieldId} className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                {fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select name={fieldId} onValueChange={(val) => onChange({ target: { name: fieldId, value: val } })} value={value || ''}
              disabled={customField.parentFieldId && formData && !formData[`additionalData.${customField.parentFieldId}`] && currentOptions.length === 0}
            >
              <SelectTrigger id={fieldId} className="ml-6 w-[calc(100%-1.5rem)]"><SelectValue placeholder={customField.placeholder || "Select an option"} /></SelectTrigger>
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
          <div className="flex items-center space-x-2 mb-3 py-2 ml-6">
            <Checkbox id={fieldId} name={fieldId} checked={!!value} onCheckedChange={(checked) => onChange({ target: { name: fieldId, value: !!checked } })} />
            <Label htmlFor={fieldId} className="font-normal flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                {fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );
      case 'checkbox-group':
        return (
          <div className="mb-3">
            <Label className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                {fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-1 mt-1 ml-6">
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
            <Label className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                {fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup name={fieldId} value={value || ''} onValueChange={(val) => onChange({ target: { name: fieldId, value: val } })} className="space-y-1 mt-1 ml-6">
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
            <Label htmlFor={fieldId} className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                {fieldLabel}{isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`ml-6 w-[calc(100%-1.5rem)] justify-start text-left font-normal ${!value && "text-muted-foreground"}`}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {value && isValid(parseISO(value)) ? format(parseISO(value), "PPP") : <span>{customField.placeholder || "Pick a date"}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={value && isValid(parseISO(value)) ? parseISO(value) : undefined}
                  onSelect={(date) => onChange({ target: { name: fieldId, value: date ? date.toISOString() : '' } })} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        );
      default: return <p>Unsupported custom field type: {customField.type}</p>;
    }
  }

  // Standard fields (not custom fields)
  if (type === 'textarea') {
    return (
      <div className="mb-3">
        <Label htmlFor={fieldId} className="flex items-center">
            {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
            {fieldLabel}
        </Label>
        <Textarea id={fieldId} name={fieldId} value={value || ''} onChange={onChange} className="ml-6 w-[calc(100%-1.5rem)]" />
      </div>
    );
  }
  if (type === 'select' && options) {
     return (
      <div className="mb-3">
        <Label htmlFor={fieldId} className="flex items-center">
            {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
            {fieldLabel}
        </Label>
        <Select name={fieldId} onValueChange={(val) => onChange({target: {name: fieldId, value: val}})} value={value || ''}>
          <SelectTrigger id={fieldId} className="ml-6 w-[calc(100%-1.5rem)]"><SelectValue placeholder={`Select ${fieldLabel.toLowerCase()}`} /></SelectTrigger>
          <SelectContent>
            {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <Label htmlFor={fieldId} className="flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
        {fieldLabel}
      </Label>
      <Input id={fieldId} name={fieldId} type={type} value={value || ''} onChange={onChange} className="ml-6 w-[calc(100%-1.5rem)]" />
    </div>
  );
};


interface HcoProfileTabProps {
  enrollment: EnrollmentData;
  customFieldDefinitions: CustomFieldDefinition[];
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  handleSave: () => Promise<void>;
  isSaving: boolean;
  currentEnrollment: EnrollmentData | undefined; // To reset form on cancel
}

export function HcoProfileTab({
  enrollment,
  customFieldDefinitions,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  handleSave,
  isSaving,
  currentEnrollment,
}: HcoProfileTabProps) {

  const handleInputChange = (e: EditableFieldOnChangeEvent) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setFormData(prev => {
      const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
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

  const sortedCustomFieldDefinitions = [...customFieldDefinitions].sort((a, b) => a.order - b.order);
  const submissionDate = enrollment.submissionDate && isValid(parseISO(enrollment.submissionDate))
    ? format(parseISO(enrollment.submissionDate), 'PPP p')
    : 'Invalid Date';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-2">
        <h2 className="text-xl font-semibold text-primary">HCO Profile Details</h2>
        <div className="flex space-x-2">
          {isEditing && (
            <Button onClick={() => { 
                setIsEditing(false); 
                if(currentEnrollment) { // Reset formData to currentEnrollment state on cancel
                    setFormData({ 
                        practiceInfo: { ...currentEnrollment.practiceInfo }, 
                        contactDetails: { ...currentEnrollment.contactDetails }, 
                        ehrVendor: currentEnrollment.ehrVendor, 
                        additionalData: { ...(currentEnrollment.additionalData || {}) }
                    });
                }
            }} variant="outline" size="sm" disabled={isSaving}>
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
        <div>
            <h4 className="text-md font-medium mb-2 mt-2 flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground"/>Practice Information</h4>
            <EditableField label="Organization NPI" name="practiceInfo.organizationNPI" value={formData.practiceInfo?.organizationNPI} isEditing={isEditing} onChange={handleInputChange} icon={Hash} />
            <EditableField label="Practice Name" name="practiceInfo.name" value={formData.practiceInfo?.name} isEditing={isEditing} onChange={handleInputChange} />
            <EditableField label="Address" name="practiceInfo.address" value={formData.practiceInfo?.address} type="textarea" isEditing={isEditing} onChange={handleInputChange} />
            <EditableField label="Phone" name="practiceInfo.phone" value={formData.practiceInfo?.phone} type="tel" isEditing={isEditing} onChange={handleInputChange} />
        </div>
        <div>
            <h4 className="text-md font-medium mb-2 mt-2 flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Primary Contact Details</h4>
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
              icon={Settings2}
            />
            <div className="mb-3">
                <Label className="font-semibold text-foreground/80 flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>
                    Submission Date:
                </Label>
                <p className="text-sm mt-0.5 ml-6">{submissionDate}</p>
            </div>
             <div className="mb-3">
                <Label className="font-semibold text-foreground/80 flex items-center">
                    <Info className="mr-2 h-4 w-4 text-muted-foreground"/>
                    Status:
                </Label>
                 <p className="text-sm mt-0.5 ml-6">{enrollment.status}</p>
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
                icon={Info}
              />
            ))}
            </div>
        </div>
      )}

      {/* Workflow Steps Rendered Here */}
      <div className="mt-6 border-t pt-6">
        <HcoOnboardingWorkflowSteps enrollment={enrollment} />
      </div>
      
      {enrollment.ccdDocumentName && (
         <div className="mt-6 border-t pt-4">
             <h4 className="text-md font-medium mb-2 flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>FHIR/CCD Document</h4>
             <p className="mb-2 ml-6"><strong>Document Name:</strong> {enrollment.ccdDocumentName}</p>
            {enrollment.validationResult && <FHIRValidationDisplay result={enrollment.validationResult} />}
         </div>
      )}
    </div>
  );
}
