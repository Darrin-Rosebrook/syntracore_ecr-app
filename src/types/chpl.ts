
// Types for ONC CHPL API

export interface ChplDeveloperContact {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface ChplDeveloperStatusEvent {
  status: {
    id: number;
    name: string; // e.g., "Active", "Suspended by ONC-ACB", "Withdrawn by Developer"
  };
  statusDate: number; // Timestamp
}

export interface ChplDeveloper {
  developerId: number;
  developerCode: string;
  name: string;
  website?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    country?: string;
  };
  contact?: ChplDeveloperContact;
  statusEvents?: ChplDeveloperStatusEvent[];
  status?: { // Simplified current status based on statusEvents
    name: string;
  };
  // Other fields as needed
}

export interface ChplDeveloperResponse {
  results: ChplDeveloper[];
}

export interface ChplProductCertificationStatus {
  id: number;
  name: string; // "Active", "Withdrawn by Developer", "Suspended by ONC", etc.
}

export interface ChplProductVersion {
  versionId: number;
  version: string;
  // Other version details if needed
}

export interface ChplCertifiedProduct {
  id: number;
  chplProductNumber: string;
  listingAnnouncedDate?: string;
  lastModifiedDate: string; // Timestamp
  product: {
    productId: number;
    name: string;
  };
  version: {
    versionId: number;
    version: string;
  };
  developer: {
    developerId: number;
    name: string;
  };
  certifyingBody: {
    id: number;
    name: string;
    code: string;
  };
  certificationDate: number; // Timestamp
  certificationStatus: ChplProductCertificationStatus;
  // Other fields like surveillance, criteria met, etc.
}

export interface ChplProductsResponse {
  results