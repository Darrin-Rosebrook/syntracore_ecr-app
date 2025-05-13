
export const PROJECT_NAME = "SyntraCore";
export const PROJECT_DESCRIPTION = "An innovative platform for streamlining healthcare provider data management and integration, focusing on public health reporting and interoperability. SyntraCore aims to simplify the enrollment process for providers and enhance data quality for public health agencies.";

export const EHR_VENDORS = [
  { label: "Epic Systems", value: "epic", type: "EHR" },
  { label: "Cerner Corporation (Oracle Health)", value: "cerner", type: "EHR" },
  { label: "MEDITECH", value: "meditech", type: "EHR" },
  { label: "Allscripts (Veradigm)", value: "allscripts", type: "EHR" },
  { label: "eClinicalWorks", value: "eclinicalworks", type: "EHR" },
  { label: "Athenahealth", value: "athenahealth", type: "EHR" },
  { label: "NextGen Healthcare", value: "nextgen", type: "EHR" },
  { label: "Greenway Health", value: "greenway", type: "EHR" },
  { label: "AdvancedMD", value: "advancedmd", type: "EHR" },
  { label: "Practice Fusion", value: "practicefusion", type: "EHR" },
  { label: "CPSI (Computer Programs and Systems, Inc.)", value: "cpsi", type: "EHR" },
  { label: "Kareo", value: "kareo", type: "EHR" },
  { label: "DrChrono", value: "drchrono", type: "EHR" },
  { label: "ModMed (Modernizing Medicine)", value: "modmed", type: "EHR" },
  { label: "Virence Health (formerly GE Healthcare IT)", value: "virence", type: "EHR" },
  { label: "Office Practicum", value: "officepracticum", type: "EHR" },
  { label: "Compulink Healthcare Solutions", value: "compulink", type: "EHR" },
  { label: "InterSystems", value: "intersystems", type: "EHR" }, // Could be LIMS or EHR/Integration
  { label: "PointClickCare", value: "pointclickcare", type: "EHR" },
  { label: "Netsmart", value: "netsmart", type: "EHR" },
  { label: "Qualifacts", value: "qualifacts", type: "EHR" },
  { label: "WellSky", value: "wellsky", type: "EHR" },
  { label: "DSS, Inc.", value: "dss", type: "EHR" },
  { label: "Harris Healthcare", value: "harrishealthcare", type: "EHR" },
  { label: "Bizmatics (PrognoCIS)", value: "bizmatics", type: "EHR" },
  { label: "Aprima", value: "aprima", type: "EHR" },
  { label: "Sevocity", value: "sevocity", type: "EHR" },
  { label: "iSalus Healthcare", value: "isalus", type: "EHR" },
  { label: "WebPT", value: "webpt", type: "EHR" },
  { label: "RXNT", value: "rxnt", type: "EHR" },
  // Example LIMS (Add actual LIMS vendors as needed)
  { label: "LabCorp", value: "labcorp", type: "LIMS" },
  { label: "Quest Diagnostics", value: "quest", type: "LIMS" },
  { label: "Sunquest Information Systems", value: "sunquest", type: "LIMS" },
  { label: "Orchard Software", value: "orchard", type: "LIMS" },
  { label: "Other", value: "other", type: "EHR" }, // Keep 'Other' for unlisted vendors, default to EHR or make selectable
];

// Constants for localStorage keys
export const PENDING_ENROLLMENT_DATA_KEY = 'syntrahub_pending_enrollment_data';
export const PENDING_CCD_FILE_CONTENT_KEY = 'syntrahub_pending_ccd_file_content';
export const PENDING_VALIDATION_RESULT_KEY = 'syntrahub_pending_validation_result';

