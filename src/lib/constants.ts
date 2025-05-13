export const PROJECT_NAME = "SyntraCore";
export const PROJECT_DESCRIPTION = "An innovative platform for streamlining healthcare provider data management and integration, focusing on public health reporting and interoperability. SyntraCore aims to simplify the enrollment process for providers and enhance data quality for public health agencies.";

export const EHR_VENDORS = [
  { label: "Epic Systems", value: "epic" },
  { label: "Cerner Corporation (Oracle Health)", value: "cerner" },
  { label: "MEDITECH", value: "meditech" },
  { label: "Allscripts (Veradigm)", value: "allscripts" },
  { label: "eClinicalWorks", value: "eclinicalworks" },
  { label: "Athenahealth", value: "athenahealth" },
  { label: "NextGen Healthcare", value: "nextgen" },
  { label: "Greenway Health", value: "greenway" },
  { label: "AdvancedMD", value: "advancedmd" },
  { label: "Practice Fusion", value: "practicefusion" },
  { label: "CPSI (Computer Programs and Systems, Inc.)", value: "cpsi" },
  { label: "Kareo", value: "kareo" },
  { label: "DrChrono", value: "drchrono" },
  { label: "ModMed (Modernizing Medicine)", value: "modmed" },
  { label: "Virence Health (formerly GE Healthcare IT)", value: "virence" },
  { label: "Office Practicum", value: "officepracticum" },
  { label: "Compulink Healthcare Solutions", value: "compulink" },
  { label: "InterSystems", value: "intersystems" },
  { label: "PointClickCare", value: "pointclickcare" },
  { label: "Netsmart", value: "netsmart" },
  { label: "Qualifacts", value: "qualifacts" },
  { label: "WellSky", value: "wellsky" },
  { label: "DSS, Inc.", value: "dss" },
  { label: "Harris Healthcare", value: "harrishealthcare" },
  { label: "Bizmatics (PrognoCIS)", value: "bizmatics" },
  { label: "Aprima", value: "aprima" },
  { label: "Sevocity", value: "sevocity" },
  { label: "iSalus Healthcare", value: "isalus" },
  { label: "WebPT", value: "webpt" },
  { label: "RXNT", value: "rxnt" },
  { label: "Other", value: "other" }, // Keep 'Other' for unlisted vendors
];

// Constants for localStorage keys
export const PENDING_ENROLLMENT_DATA_KEY = 'syntrahub_pending_enrollment_data';
export const PENDING_CCD_FILE_CONTENT_KEY = 'syntrahub_pending_ccd_file_content';
export const PENDING_VALIDATION_RESULT_KEY = 'syntrahub_pending_validation_result';
