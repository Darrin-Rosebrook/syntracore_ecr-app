Onboard eCR

Onboard eCR is a modern onboarding and collaboration platform designed to streamline electronic case reporting (eCR) across the U.S. public health ecosystem.

The platform enables Healthcare Organizations (HCOs) to efficiently enroll and onboard to submit electronic Initial Case Reports (eICR) to the correct Public Health Authority (PHA) while providing visibility and collaboration across providers, vendors, and public health agencies.

This project also explores how AI-assisted development tools can accelerate the creation and iteration of healthcare interoperability platforms.

Repository:
https://github.com/Darrin-Rosebrook/syntracore_ecr-app

The Problem

Electronic Case Reporting allows clinical systems to automatically report certain conditions to public health agencies. While national standards exist, the onboarding process for healthcare organizations remains complex and fragmented.

Common challenges include:

• Healthcare providers unsure which jurisdiction they should report to
• EHR vendors needing to validate eICR message compliance
• Public health agencies manually coordinating onboarding activities
• Limited visibility between providers, vendors, and public health reviewers

These operational barriers often delay adoption of electronic reporting programs.

Project Goal

Onboard eCR explores whether a centralized onboarding and collaboration platform can reduce the operational friction involved in connecting healthcare organizations to public health reporting systems.

The platform focuses on three core areas:

Provider onboarding

Interoperability validation

Multi-stakeholder collaboration

Platform Capabilities
Provider Enrollment

Healthcare organizations can:

• register their organization
• identify reporting jurisdictions
• submit onboarding documentation
• track onboarding progress across multiple reporting programs

eICR Message Validation

The platform provides tools to validate whether clinical messages meet electronic case reporting requirements.

Capabilities include:

• FHIR validation
• CDA eICR validation
• structural message verification
• feedback to help EHR vendors troubleshoot integrations

These tools help vendors and healthcare organizations test interoperability before connecting to production public health systems.

Jurisdiction Routing

The system determines the appropriate reporting jurisdiction using metadata such as:

• NPI
• CLIA
• geographic location

This helps ensure that providers are connected to the correct public health authority.

Stakeholder Collaboration

Role-based access supports multiple participants in the onboarding process:

• Healthcare Organizations (HCOs)
• EHR / LIMS Vendors
• Public Health Authorities (PHAs)
• Federal partners

Dashboards allow onboarding progress to be tracked across stakeholders.

Federal Ecosystem Alignment

Electronic Case Reporting in the United States involves collaboration between several national organizations.

Onboard eCR is designed to support coordination across:

CDC
Federal leadership for eCR adoption and reporting policy.

APHL / AIMS
Operational infrastructure and routing services for electronic case reporting.

State Public Health Authorities
Jurisdictional reporting systems responsible for receiving and managing case reports.

AI-Assisted Prototyping

This project also serves as an exploration of how AI coding tools can accelerate product prototyping.

Tools used during development include:

• Claude
• Codex
• Grok
• Gemini
• Cursor

These tools were used to:

• scaffold APIs and backend services
• accelerate UI development
• prototype validation workflows
• iterate quickly on interoperability features

AI-assisted development significantly reduces the time required to move from concept to working prototype, allowing product design to focus on solving real healthcare workflow challenges.

Technology Stack

Frontend
React + Tailwind UI (ShadCN)

Backend
Firebase (Firestore, Auth, Hosting)

Language
TypeScript / Node.js

CI/CD
GitHub Actions (optional)

Repository Structure

/src
Application source code

/components
Reusable UI components

/utils
Helper functions and utilities

/firebase
Firebase configuration and security rules

Project Status

Onboard eCR is currently a working prototype exploring how modern development tools and platform design can simplify healthcare interoperability onboarding.

Future work may include:

• expanded validation capabilities
• additional public health integrations
• workflow automation for provider onboarding
• enhanced analytics for onboarding progress

Author

Darrin Rosebrook
SyntraCore

© 2025 SyntraCore
