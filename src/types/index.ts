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

export interface EnrollmentFormData {
  practiceInfo: PracticeInfo;
  contactDetails: ContactDetails;
  ehrVendor: string;
  ccdDocumentName?: string;
  consent: boolean;
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
