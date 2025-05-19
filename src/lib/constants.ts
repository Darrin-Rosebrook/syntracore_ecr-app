
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

// Constants for localStorage keys (Note: LocalStorage usage for pending form data was removed in a previous refactor)
export const PENDING_ENROLLMENT_DATA_KEY = 'syntrahub_pending_enrollment_data';
export const PENDING_CCD_FILE_CONTENT_KEY = 'syntrahub_pending_ccd_file_content';
export const PENDING_VALIDATION_RESULT_KEY = 'syntrahub_pending_validation_result';

export const OHIO_HEALTH_SYSTEMS = [
  { label: "Cleveland Clinic", value: "cleveland-clinic", location: "Ohio", hcoCount: 0 },
  { label: "OhioHealth", value: "ohiohealth", location: "Ohio", hcoCount: 0 },
  { label: "The Ohio State University Wexner Medical Center", value: "osu-wexner", location: "Ohio", hcoCount: 0 },
  { label: "University Hospitals (UH)", value: "university-hospitals", location: "Ohio", hcoCount: 0 },
  { label: "Mercy Health", value: "mercy-health", location: "Ohio", hcoCount: 0 },
  { label: "ProMedica", value: "promedica", location: "Ohio", hcoCount: 0 },
  { label: "Premier Health", value: "premier-health", location: "Ohio", hcoCount: 0 },
  { label: "Kettering Health", value: "kettering-health", location: "Ohio", hcoCount: 0 },
  { label: "TriHealth", value: "trihealth", location: "Ohio", hcoCount: 0 },
  { label: "Summa Health", value: "summa-health", location: "Ohio", hcoCount: 0 },
  { label: "Mount Carmel Health System", value: "mount-carmel", location: "Ohio", hcoCount: 0 },
  { label: "Aultman Hospital", value: "aultman-hospital", location: "Ohio", hcoCount: 0 },
  { label: "Adena Health System", value: "adena-health", location: "Ohio", hcoCount: 0 },
  { label: "The Christ Hospital Health Network", value: "christ-hospital", location: "Ohio", hcoCount: 0 },
  { label: "Bon Secours Mercy Health", value: "bon-secours-mercy-health", location: "Ohio", hcoCount: 0 },
];

export const US_STATES = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
];

export type OnboardingStageStatus = 'Not Started' | 'In Progress' | 'Complete' | 'Failed' | 'Action Required' | 'Ongoing' | 'Not Yet Applicable';

export interface OnboardingStage {
  id: number;
  name: string;
  description: string;
  defaultUiSymbol: '🔵' | '🟡' | '✅' | '❌' | '🟠' | '♻️' | '⚪'; // For initial display, actual determined by logic
}

export const ECR_ONBOARDING_STAGES: OnboardingStage[] = [
  { id: 1, name: 'Intent to Register', description: 'HCO submits interest form (basic info + contact).', defaultUiSymbol: '✅' },
  { id: 2, name: 'Provider Enrollment', description: 'Detailed form: org info, system used, CLIA, NPI, contacts, upload support documents.', defaultUiSymbol: '✅' },
  { id: 3, name: 'PHA Review', description: 'PHA verifies and approves or requests changes.', defaultUiSymbol: '🟡' },
  { id: 4, name: 'eCR Readiness Validation', description: 'Auto-checks: FHIR, HL7 readiness. Can include test message validation using eCR test bundle.', defaultUiSymbol: '🔵' },
  { id: 5, name: 'EHR/LIMS Confirmation', description: 'Linked vendor confirms readiness and assists with config.', defaultUiSymbol: '🔵' },
  { id: 6, name: 'Data Exchange Testing', description: 'HCO sends test data. PHA reviews for correctness.', defaultUiSymbol: '🔵' },
  { id: 7, name: 'Production Approval', description: 'PHA grants production go-live approval.', defaultUiSymbol: '🔵' },
  { id: 8, name: 'Ongoing Monitoring & Support', description: 'Status updates, message error monitoring, contact updates.', defaultUiSymbol: '⚪' },
];

export const EULA_TEXT = `
END-USER LICENSE AGREEMENT (EULA)
SyntraCore eCR Onboard Registration Platform
Effective Date: [Insert Date]

PLEASE READ THIS AGREEMENT CAREFULLY BEFORE ACCESSING OR USING THE PLATFORM.

This End-User License Agreement (“Agreement”) is a legally binding agreement by and between you (“End User,” “you,” or “your”), whether acting as an individual or on behalf of an entity, and SyntraCore, LLC (“SyntraCore,” “we,” “us,” or “our”), a United States-based software provider. By accessing or using the SyntraCore eCR Onboard Registration Platform (the “Platform”), you agree to be bound by the terms and conditions set forth herein. If you do not agree to this Agreement in its entirety, you are not authorized to access or use the Platform.

1. Purpose of the Platform
The SyntraCore eCR Onboard Registration Platform is expressly designed and intended for use by health care organizations (HCOs), public health agencies (PHAs), electronic health record (EHR) vendors, and other authorized stakeholders involved in the onboarding process for Electronic Case Reporting (eCR) in accordance with public health surveillance obligations under state and federal law.

The Platform enables:

Registration and enrollment of HCOs in eCR programs;

Submission and tracking of provider onboarding documentation;

Communication and coordination between providers, vendors, and public health agencies;

Validation of electronic case report messages for compliance with applicable standards (e.g., HL7 CDA, FHIR).

You understand and acknowledge that the primary purpose of this Platform is to facilitate and support timely and accurate public health reporting, not for direct patient care, diagnosis, or treatment.

2. User Acknowledgements and Representations
By using this Platform, you expressly represent and warrant that:

You are an authorized representative of a regulated health care provider, laboratory, health system, or affiliated entity subject to mandatory or voluntary public health reporting requirements;

You understand that participation in electronic case reporting may involve the collection, transmission, and validation of data that constitutes Protected Health Information (“PHI”) under the Health Insurance Portability and Accountability Act of 1996 (“HIPAA”) or other sensitive health information under state law;

You agree to use the Platform solely for the legitimate purpose of supporting public health interoperability and onboarding as contemplated by this Agreement and applicable law;

You are responsible for ensuring the accuracy, completeness, and lawful basis of any data submitted to or accessed through the Platform.

3. Permitted Use and Scope of License
SyntraCore grants you a non-exclusive, non-transferable, revocable, limited license to use the Platform for purposes directly related to electronic case reporting onboarding. This includes submitting required information to PHAs, reviewing validation results, and coordinating technical readiness among stakeholders.

This license does not grant you any rights to sublicense, distribute, or use the Platform for commercial resale or clinical treatment purposes.

4. Data Use, Privacy, and Compliance with Public Health Laws
You expressly acknowledge and agree that:

Data submitted through the Platform may be accessed by PHAs and other designated entities to fulfill their lawful duties under public health surveillance statutes, disease reporting laws, or communicable disease control regulations;

Such access may occur without individual patient authorization pursuant to HIPAA §164.512(b) (Public Health Activities) and similar state provisions permitting disclosure of PHI to public health authorities;

SyntraCore may process, store, and transmit submitted data on behalf of PHAs or in accordance with their legal mandates;

SyntraCore implements reasonable administrative, technical, and physical safeguards to protect submitted data but does not guarantee absolute security or immunity from disclosure due to lawful requests, subpoenas, or breaches beyond its control;

You are solely responsible for obtaining any consents, authorizations, or notices required under applicable law from affected individuals whose data may be indirectly referenced.

5. Prohibited Uses
You agree not to:

Submit false, misleading, or unauthorized information;

Misrepresent your identity or the legal status of your organization;

Use the Platform to store or transmit malware or attempt unauthorized access to other systems;

Reproduce, reverse-engineer, disassemble, or otherwise attempt to derive the source code of the Platform.

6. Indemnification
To the maximum extent permitted by law, you agree to indemnify, defend, and hold harmless SyntraCore, its affiliates, officers, directors, and agents from and against all claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys’ fees) arising out of or relating to:

Your violation of this Agreement;

Your submission of inaccurate or unauthorized data;

Your breach of any applicable law or regulation related to public health, data privacy, or interoperability standards;

Any third-party claim resulting from your use of the Platform.

7. Disclaimers and Limitation of Liability
THE PLATFORM IS PROVIDED “AS IS” AND “AS AVAILABLE.” SYNTRACORE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
IN NO EVENT SHALL SYNTRACORE BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING LOSS OF DATA, BUSINESS INTERRUPTION, OR LOSS OF PROFITS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

Your sole and exclusive remedy for any dissatisfaction with the Platform is to discontinue use.

8. Regulatory and Legal Compliance
You acknowledge that:

Your use of the Platform may be subject to audit, investigation, or oversight by PHAs or federal agencies such as CDC, ONC, or OCR;

You may be required to comply with federal or state-specific requirements concerning electronic case reporting, including HL7, FHIR, SNOMED, and LOINC conformance;

SyntraCore is not responsible for ensuring your compliance with these obligations.

9. Modifications
SyntraCore reserves the right to modify this Agreement at any time by posting the revised version to the Platform. Continued use after such posting constitutes acceptance of the amended terms.

10. Governing Law and Jurisdiction
This Agreement shall be governed by and construed in accordance with the laws of the State of [Insert State], without regard to conflicts of law principles. Any dispute shall be resolved exclusively in a court of competent jurisdiction within [Insert County and State].

11. Entire Agreement
This Agreement constitutes the entire agreement between the parties regarding use of the Platform and supersedes all prior or contemporaneous understandings, agreements, representations, or warranties, written or oral.

BY ACCESSING OR USING THE SYNTRACORE eCR ONBOARD REGISTRATION PLATFORM, YOU AFFIRM THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS AGREEMENT.
`;
