# Onboard eCR – Project Overview

## 🎯 Purpose

Onboard eCR aims to modernize and simplify the onboarding process for electronic case reporting (eCR) in the United States. It serves as a unified platform for managing onboarding workflows, validating message readiness, and connecting HCOs to their respective Public Health Authorities (PHAs).

## 🧩 Stakeholders

The platform supports the following entities:

- **Health Care Organizations (HCOs)** — Register, enroll, validate messages, and onboard
- **EHR and LIMS Vendors** — View client progress, assist with technical validation
- **Public Health Authorities (PHAs)** — Review submissions, approve onboarding
- **Federal Entities** — Oversight and standards alignment
  - **CDC** (Centers for Disease Control and Prevention)
  - **APHL** (Association of Public Health Laboratories)

## ⚙️ Workflow Phases

| Customer Phase      | SyntraCore eCR Phase             | Notes                                           |
|---------------------|----------------------------------|-------------------------------------------------|
| 1. Registration      | Intent to Register               | Captures initial interest and contact info      |
| 2. Enrollment        | Provider Enrollment              | Full org data, CLIA/NPI, EHR/LIMS details       |
| 3. Legal Readiness   | Legal Review                     | Terms of Service, Data Use, Consent              |
| 4. EHR Readiness     | FHIR/CDA Validation              | Test message validation and onboarding support  |
| 5. Testing & AIMS    | AIMS/APHL Integration            | Messaging infrastructure setup                  |
| 6. Production        | Final Approval + Monitoring      | Go-live, ongoing updates and alerting           |

## 🔐 Security & Compliance

- HIPAA-compliant infrastructure via Firebase
- Fine-grained role-based permissions
- Secure storage of sensitive metadata (CLIA, NPI, contact info)

## 🛠 Roadmap (Coming Soon)

- Provider communication log
- API integrations with AIMS, SNOMED, LOINC
- PHA jurisdiction lookup automation
- Support for national onboarding testbeds

---

This document serves as a technical and strategic orientation guide for contributors, stakeholders, and AI assistants like Jules.
