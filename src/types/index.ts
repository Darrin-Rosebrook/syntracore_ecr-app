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

export interface EnrollmentFormData {
  practiceInfo: PracticeInfo;
  contactDetails: ContactDetails; // Primary contact
  ehrVendor: string;
  ccdDocumentName?: string;
  consent: boolean;
  additionalData?: Record<string, any>;
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
  // content?: string; // Not recommended for large files, use Storage instead
}

export interface ContactEntry {
  id: string; // Unique ID for the contact
  name: string;
  email: string;
  phone: string;
  role?: string; // e.g., 'Billing Contact', 'Technical Contact'
  isAlternative?: boolean; // To mark as an alternative contact
}

export interface EnrollmentData extends EnrollmentFormData {
  id: string;
  submissionDate: string;
  ccdDocumentContent?: string; 
  validationResult?: FHIRValidationResult;
  status: 'Pending' | 'Approved' | 'Changes Requested' | 'Denied';
  activityLog?: ActivityLogEntry[];
  documents?: DocumentEntry[]; // Array for uploaded documents
  additionalContacts?: ContactEntry[]; // Array for additional contacts
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
  // Potentially add createdAt, createdBy etc.
}

