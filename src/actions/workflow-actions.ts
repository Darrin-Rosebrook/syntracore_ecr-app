'use server';

import { fetchProviderByNPI } from '@/services/npi-service';
import { sendEmail } from '@/services/email-service';
import { simulateAIMSValidation } from '@/services/aims-validator';
import { validateFHIR } from '@/services/fhir-validator'; // Renamed import
import type { ProviderData } from '@/types/npi';
import type { AIMSValidationResult as AimsSimulatedResult } from '@/services/aims-validator'; // aliased to avoid confusion
import type { FHIRValidationResult } from '@/services/fhir-validator';


export async function fetchNpiDataAction(npi: string): Promise<{ success: boolean; data?: ProviderData; error?: string }> {
  if (!npi) {
    return { success: false, error: 'NPI is required.' };
  }
  try {
    const providerData = await fetchProviderByNPI(npi);
    return { success: true, data: providerData };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch NPI data.';
    return { success: false, error: message };
  }
}

export async function sendWelcomeEmailAction(providerData: ProviderData, userEmail: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!userEmail) {
    return { success: false, error: 'User email is required to send welcome message.' };
  }
  if (!providerData) {
    return { success: false, error: 'Provider data is required.' };
  }

  // Construct a simple text email, as per the user's example logic
  const textContent = `Welcome ${providerData.name || 'Provider'}${providerData.orgName ? ` from ${providerData.orgName}` : ''}! Thank you for starting the enrollment process with Onboard eCR.`;
  
  const htmlContent = `
    <h1>Welcome to Onboard eCR, ${providerData.name || 'Provider'}!</h1>
    <p>We are excited to have you join our platform.</p>
    ${providerData.orgName ? `<p>Organization: ${providerData.orgName}</p>` : ''}
    <p>Thank you for starting the enrollment process!</p>
  `;

  try {
    // Using the existing sendEmail service function which expects an object
    const result = await sendEmail({
      to: userEmail,
      subject: `Welcome to Onboard eCR, ${providerData.name || 'Provider'}`,
      htmlContent: htmlContent,
      textContext: textContent, // Provide plain text version
    });

    if (result.success) {
      return { success: true, message: result.message };
    } else {
      // Ensure potential SendGrid error details are passed back
      const errorMessage = result.error?.errors.map(e => e.message).join(', ') || result.message || 'Failed to send email.';
      return { success: false, error: errorMessage };
    }
  } catch (error) {
     const message = error instanceof Error ? error.message : 'An unexpected error occurred while sending email.';
    return { success: false, error: message };
  }
}

export async function simulateAimsValidationAction(providerData: ProviderData): Promise<{ success: boolean; data?: AimsSimulatedResult; error?: string }> {
  try {
    const validationResult = await simulateAIMSValidation(providerData);
    return { success: true, data: validationResult };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to simulate AIMS validation.';
    return { success: false, error: message };
  }
}

// New action for the simpler FHIR validation simulation
export async function simulateFhirValidationAction(resource: any): Promise<{ success: boolean; data?: FHIRValidationResult; error?: string }> {
  try {
    const validationResult = await validateFHIR(resource);
    return { success: true, data: validationResult };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to simulate FHIR validation.';
    return { success: false, error: message };
  }
}
