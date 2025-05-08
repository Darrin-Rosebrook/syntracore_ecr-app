# **App Name**: SyntraHub

## Core Features:

- Project Overview: Display the existing SyntraCore project information, including project name and description.
- AI-Powered Suggestion Tool: Provide a tool that uses the project description to suggest potential new features or improvements using generative AI.
- Firebase Project Integration: Allow users to input the Firebase project ID (SyntraCore) for direct integration and display of relevant data (limited to what can be accessed without backend logic).
- Provider Self-Enroll Portal: Form to enter Practice Info, Contact details, EHR Vendor selection, Document upload (CCD sample), Consent agreement + Submit button
- FHIR Validation Microservice: Run uploaded CCD/FHIR messages through validator (e.g., HAPI FHIR or external API); Return structured validation results; Display results in provider UI (e.g., pass/fail, key issues)
- PHA Reviewer Dashboard: Login as public health admin; View list of submitted enrollments; See validation results; Approve or Request changes

## Style Guidelines:

- Primary color: Use a calming blue (#3498db) to establish trust and reliability.
- Secondary color: Light gray (#ecf0f1) for backgrounds to ensure content readability.
- Accent: Teal (#008080) to indicate interactive elements and calls to action.
- Clean and organized layout with clear sections for project overview and AI suggestions.
- Use simple, modern icons to represent different features and functionalities.
- Subtle transitions and animations to enhance user experience when loading data or displaying suggestions.