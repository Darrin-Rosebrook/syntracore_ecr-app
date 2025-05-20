
import type { FHIRValidationResult as ExternalFHIRValidationResult } from '@/services/fhir-validator';

export interface PracticeInfo {
  organizationNPI: string;
  name: string;
  address: string;
  phone: string;
  healthSystem?: string;
  isLabOrPerformsLabServices?: 'yes' | 'no';
  cliaNumber?: string;
  cliaLabName?: string;
  cliaLabType?: string;
}

export interface ContactDetails {
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
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  isAlternative?: boolean;
}

export interface EnrollmentFormData {
  userId?: string;
  userEmail?: string;
  practiceInfo: PracticeInfo;
  contactDetails: ContactDetails;
  ehrVendor: string;
  ccdDocumentName?: string;
  consent: boolean;
  additionalData?: Record<string, any>;
  additionalContacts?: ContactEntry[];
}

export interface FHIRValidationResult extends ExternalFHIRValidationResult {
  summary?: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  entry: string;
  type: 'System' | 'UserAction' | 'Communication' | 'PHAComment' | 'DocumentChange' | 'ContactChange';
  user?: string; // Name or email of the user performing the action
}

export interface VendorActivityLogEntry {
  id: string; // Firestore document ID for the log entry
  vendorValue: string; // e.g., "epic", "cerner" - to link to the vendor company
  timestamp: string; // ISO string of when the log was created/updated
  entry: string; // The text content of the log
  type: 'UserAction' | 'SystemNote' | 'CommunicationAttempt'; // Type of log
  creatorId: string; // Firebase Auth UID of the PHA user who created/owns this log
  creatorName: string; // Display name/email of the creator
}


export interface DocumentEntry {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  uploadedBy: string;
  url?: string;
}

export interface MessageEntry {
  id: string;
  timestamp: string; // ISO string
  senderId: string; // User ID of sender (e.g., Firebase Auth UID)
  senderName: string; // Display name of sender
  senderRole: 'PHA' | 'Provider' | 'Vendor' | 'System';
  content: string;
  readBy?: { [userId: string]: string }; // userId: ISO timestamp when read
}

export interface EnrollmentData extends EnrollmentFormData {
  id: string;
  submissionDate: string;
  ccdDocumentContent?: string;
  validationResult?: FHIRValidationResult;
  status: 'Pending' | 'Approved' | 'Changes Requested' | 'Denied';
  activityLog?: ActivityLogEntry[];
  documents?: DocumentEntry[];
  messages?: MessageEntry[];
}

// Types for PHA User Management
export type PhaProgram = 'Case Reporting';
export type PhaRole = 'Admin' | 'User';
export type PhaUserStatus = 'Active' | 'Inactive';

export interface PhaUser {
  id: string;
  authUid?: string;
  username?: string;
  name: string;
  email: string;
  phone?: string;
  program: PhaProgram;
  role: PhaRole;
  status: PhaUserStatus;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

// Type for PHA Jurisdiction Configuration
export interface PhaJurisdictionConfig {
  state: string;
  phaName?: string;
  logoUrl?: string;
  lastUpdated: string;

  stateRegulationsUrl?: string;
  requiredReportingFieldsInfo?: string;

  phaContactName?: string;
  phaContactEmail?: string;
  phaContactPhone?: string;

  reportableConditionsUrl?: string;
  dataStandardsInfo?: string;

  autoPopulateCounties?: boolean;
  autoPopulateHealthSystems?: boolean;

  stateSealUrl?: string;
  legalDisclaimers?: string;
  customWelcomeMessage?: string;
  emailSignature?: string;

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
  | 'password_reset_request';

export const EMAIL_EVENT_TRIGGERS: { value: EmailEventTrigger; label: string }[] = [
  { value: 'provider_enrollment_submission', label: 'HCO Registration Submitted' },
  { value: 'new_user_account_invite', label: 'New PHA User Account Invite' },
  { value: 'enrollment_status_approved', label: 'Enrollment Approved' },
  { value: 'enrollment_status_changes_requested', label: 'Enrollment Changes Requested' },
  { value: 'enrollment_status_denied', label: 'Enrollment Denied' },
  { value: 'password_reset_request', label: 'User Password Reset Requested' },
];


export interface EmailAttachmentInfo {
  id: string;
  fileName: string;
  description?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  eventTrigger: EmailEventTrigger;
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachmentInfo[];
  placeholders?: string[];
  lastUpdated: string;
  createdAt: string;
}

// Onboarding Workflow Types
export type OnboardingStageStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Complete'
  | 'Failed'
  | 'Action Required'
  | 'Ongoing'
  | 'Not Yet Applicable';

export interface OnboardingStage {
  id: number;
  name: string;
  description: string;
  defaultUiSymbol: '🔵' | '🟡' | '✅' | '❌' | '🟠' | '♻️' | '⚪';
}

// Vendor Profile Data
export interface VendorProfileData {
  userId: string; // Firebase Auth UID
  vendorName: string;
  contactName: string;
  email: string;
  representedEhrSystemValue: string;
  createdAt: string; // ISO string
  lastLogin?: string; // ISO string
  eulaAccepted?: boolean;
  eulaAcceptedTimestamp?: string; // ISO string
  lastUpdatedAt?: string; // ISO string
}

// CLIA Data Types
export interface CliaAddress {
  st_adr: string;
  city_nme: string;
  st_cd: string;
  zip_cd: string;
}

export interface CliaApiResult {
  clia_number: string;
  fac_nme?: string;
  st_adr?: string;
  city_nme?: string;
  st_cd?: string;
  zip_cd?: string;
  phn_numbr?: string;
  lab_type_dsc?: string;
  clia_waiver_ind_yn?: 'Y' | 'N';
}

export interface CliaApiResponse {
  results: CliaApiResult[];
  count: number;
}

export interface CliaData {
  cliaNumber: string;
  facilityName?: string;
  address?: string;
  phone?: string;
  labType?: string;
}

// Resource Item Types
export type ResourceItemType = 'link' | 'text' | 'document_placeholder';

export interface ResourceItem {
  id: string;
  title: string;
  type: ResourceItemType;
  content: string;
  order: number;
  createdAt: string; // ISO string
  lastUpdated: string; // ISO string
}

    
