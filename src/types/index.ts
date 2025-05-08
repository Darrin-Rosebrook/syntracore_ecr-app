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

export interface CustomFieldDefinition {
  id: string; // Unique identifier for the field, used as key in additionalData
  label: string; // Display label for the field
  type: 'text' | 'select' | 'textarea' | 'checkbox' | 'date'; // Type of the field
  options?: string[]; // For 'select' type, list of option values
  placeholder?: string; // Placeholder text for input fields
  required?: boolean; // Whether the field is mandatory
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

export interface EnrollmentData extends EnrollmentFormData {
  id: string;
  submissionDate: string;
  ccdDocumentContent?: string; // Store actual content for mock processing
  validationResult?: FHIRValidationResult;
  status: 'Pending' | 'Approved' | 'Changes Requested';
}
