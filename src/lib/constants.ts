export const PROJECT_NAME = "SyntraCore";
export const PROJECT_DESCRIPTION = "An innovative platform for streamlining healthcare provider data management and integration, focusing on public health reporting and interoperability. SyntraCore aims to simplify the enrollment process for providers and enhance data quality for public health agencies.";

export const EHR_VENDORS = [
  { label: "Epic", value: "epic" },
  { label: "Cerner", value: "cerner" },
  { label: "Meditech", value: "meditech" },
  { label: "Allscripts", value: "allscripts" },
  { label: "eClinicalWorks", value: "eclinicalworks" },
  { label: "Athenahealth", value: "athenahealth" },
  { label: "NextGen Healthcare", value: "nextgen" },
  { label: "Other", value: "other" },
];

// Constants for localStorage keys
export const PENDING_ENROLLMENT_DATA_KEY = 'syntrahub_pending_enrollment_data';
export const PENDING_CCD_FILE_CONTENT_KEY = 'syntrahub_pending_ccd_file_content';
export const PENDING_VALIDATION_RESULT_KEY = 'syntrahub_pending_validation_result';