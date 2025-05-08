import type { FHIRValidationResult as ExternalFHIRValidationResult } from '@/services/fhir-validator';

export interface PracticeInfo {
  name: string;
  address: string;
  phone: string;
}

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
}

export interface CustomFieldOption {
  label: string;
  value: string;
  defaultChecked?: boolean; // For checkbox-group initial state
}

export interface CustomFieldDefinition {
  id: string; // Unique identifier for the field, used as key in additionalData
  label: string; // Display label for the field
  type:
    | 'text'
    | 'textarea'
    | 'select' // Standard select
    | 'checkbox' // Single boolean checkbox
    | 'date'
    | 'checkbox-group' // Multiple checkboxes, store as array of values
    | 'radio-group'; // Multiple radio options, one selectable
  options?: CustomFieldOption[]; // For 'select', 'checkbox-group', 'radio-group'
  placeholder?: string; // Placeholder text for input fields
  required?: boolean; // Whether the field is mandatory
  order: number; // For ordering fields on the enrollment form

  // For 'select' type if it's dependent
  parentFieldId?: string; // ID of the field this one depends on (must be a 'select' or 'radio-group' type)
  // Admin will input this as JSON string. Parsed into object for use.
  // e.g., {"parentValue1": [{"label": "Child1", "value": "c1"}], "parentValue2": [{"label": "Child2", "value": "c2"}]}
  dependentOptionsJson?: string; 
}

export interface EnrollmentFormData {
  practiceInfo: PracticeInfo;
  contactDetails: ContactDetails;
  ehrVendor: string;
  ccdDocumentName?: string;
  consent: boolean;
  additionalData?: Record<string, any>; // For custom fields
}

export interface FHIRValidationResult extends ExternalFHIRValidationResult {
  summary?: string; // Optional summary from AI
}

export interface ActivityLogEntry {
  timestamp: string;
  entry: string;
  type: 'System' | 'UserAction' | 'Communication' | 'PHAComment';
  user?: string; // Optional: user who performed the action
}

export interface EnrollmentData extends EnrollmentFormData {
  id: string;
  submissionDate: string;
  ccdDocumentContent?: string; // Store actual content for mock processing
  validationResult?: FHIRValidationResult;
  status: 'Pending' | 'Approved' | 'Changes Requested';
  activityLog?: ActivityLogEntry[];
}