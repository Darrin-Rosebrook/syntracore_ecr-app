
import type { FHIRValidationResult as ExternalFHIRValidationResult } from '@/services/fhir-validator';

export interface PracticeInfo {
  organizationNPI: string;
  name: string;
  address: string;
  phone: string;
}

export interface ContactDetails { // This will represent the primary contact
  name: string;
  email: string;
  phone: string;
}

export interface CustomFieldOption {
  label: string;
  value: string;
  defaultChecked?: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'checkbox-group'
    | 'radio-group';
  options?: CustomFieldOption[];
  placeholder?: string;
  required?: boolean;
  order: number;
  parentFieldId?: string;
  dependentOptionsJson?: string;
}

export interface ContactEntry {
  id: string; // Unique ID for the contact
  name: string;
  email: string;
  phone: string;
  role?: string; // e.g., 'Billing Contact', 'Technical Contact'
  isAlternative?: boolean; // To mark as an alternative contact
}

export interface EnrollmentFormData {
  practiceInfo: PracticeInfo;
  contactDetails: ContactDetails; // Primary contact
  ehrVendor: string;
  ccdDocumentName?: string;
  consent: boolean;
  additionalData?: Record<string, any>;
  additionalContacts?: ContactEntry[]; // Added to store contacts from signup
}

export interface FHIRValidationResult extends ExternalFHIRValidationResult {
  summary?: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  entry: string;
  type: 'System' | 'UserAction' | 'Communication' | 'PHAComment' | 'DocumentChange' | 'ContactChange';
  user?: string;
}

export interface DocumentEntry {
  id: string; // Unique ID for the document
  name: string;
  type: string; // MIME type
  size: number; // in bytes
  uploadDate: string; // ISO string
  uploadedBy: string; // User ID or 'Provider'/'System'
  url?: string; // URL if stored in Firebase Storage
}


export interface EnrollmentData extends EnrollmentFormData {
  id: string;
  submissionDate: string;
  ccdDocumentContent?: string; 
  validationResult?: FHIRValidationResult;
  status: 'Pending' | 'Approved' | 'Changes Requested' | 'Denied';
  activityLog?: ActivityLogEntry[];
  documents?: DocumentEntry[]; 
  // additionalContacts is now part of EnrollmentFormData, inherited here.
}

// Types for PHA User Management
export type PhaProgram = 'Case Reporting'; // Can be expanded later
export type PhaRole = 'Admin' | 'User'; // Can be expanded later
export type PhaUserStatus = 'Active' | 'Inactive';

export interface PhaUser {
  id: string; // Firebase Auth UID or Firestore doc ID
  username?: string; // Auto-generated or chosen
  name: string;
  email: string;
  phone?: string;
  program: PhaProgram;
  role: PhaRole;
  status: PhaUserStatus; // New status field
}

// Type for PHA Jurisdiction Configuration
export interface PhaJurisdictionConfig {
  state: string; // e.g., 'OH', 'CA'
  phaName?: string; // Optional: Official name of the PHA
  logoUrl?: string; // Optional: URL for custom logo
  lastUpdated: string; // ISO string

  // Regulatory Information
  stateRegulationsUrl?: string;
  requiredReportingFieldsInfo?: string;

  // Contact Information
  phaContactName?: string;
  phaContactEmail?: string;
  phaContactPhone?: string;

  // Program-Specific Data
  reportableConditionsUrl?: string;
  dataStandardsInfo?: string;

  // Geographic Information
  autoPopulateCounties?: boolean; // If true, attempt to provide county lists
  autoPopulateHealthSystems?: boolean; // Already present, kept for clarity

  // Branding and Communications
  stateSealUrl?: string;
  legalDisclaimers?: string;
  customWelcomeMessage?: string;
  emailSignature?: string; // For future use

  // Third-Party Integrations
  immunizationRegistryUrl?: string;
  hieConnectionInfo?: string;
}

// Types for Email Template Configuration
export type EmailEventTrigger = 
  | 'provider_enrollment_submission'
  | 'new_user_account_invite'
  | 'enrollment_status_approved'
  | 'enrollment_status_changes_requested'
  | 'enrollment_status_denied'
  | 'password_reset_request'; // Example triggers

export const EMAIL_EVENT_TRIGGERS: { value: EmailEventTrigger; label: string }[] = [
  { value: 'provider_enrollment_submission', label: 'Provider Enrollment Submitted' },
  { value: 'new_user_account_invite', label: 'New PHA User Account Invite' },
  { value: 'enrollment_status_approved', label: 'Enrollment Approved' },
  { value: 'enrollment_status_changes_requested', label: 'Enrollment Changes Requested' },
  { value: 'enrollment_status_denied', label: 'Enrollment Denied' },
  { value: 'password_reset_request', label: 'User Password Reset Requested' },
];


export interface EmailAttachmentInfo {
  id: string; // Unique ID for the attachment reference
  fileName: string;
  description?: string;
  // In a real scenario, this might include a URL or storage path
  // For now, it's just informational.
}

export interface EmailTemplate {
  id: string; // Firestore document ID
  name: string; // User-friendly name for the template, e.g., "Welcome Email for New Providers"
  eventTrigger: EmailEventTrigger;
  subject: string;
  htmlBody: string; // HTML content of the email
  attachments?: EmailAttachmentInfo[]; // List of attachment info
  placeholders?: string[]; // List of available placeholders for this template type, e.g. ['{{hcoName}}', '{{contactName}}']
  lastUpdated: string; // ISO string
  createdAt: string; // ISO string
}
