'use server';

import { fetchProviderByNPI } from '@/services/npi-service';
import { sendEmail } from '@/services/email-service';
import { simulateAIMSValidation } from '@/services/aims-validator';
import type { ProviderData } from '@/types/npi';
import type { AIMSValidationResult } from '@/services/aims-validator';

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

export async function sendWelcomeEmailAction(providerData: ProviderData): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!providerData.address?.telephone_number && !providerData.name.includes('@')) { // crude check for email in name for orgs
     // In a real app, you'd fetch contact email from your DB or another source for the provider
     console.warn("No direct email contact found for provider, using a placeholder. This should be improved.");
  }
  
  // Determine a recipient email. This is a placeholder logic.
  // For individuals, you'd ideally have an email field. For orgs, it's trickier without a contact person.
  // This example assumes the NPI lookup might return an org name that might contain an email, or uses a placeholder.
  const recipientEmail = providerData.orgName?.includes('@') ? providerData.orgName : process.env.SENDGRID_FROM_EMAIL || 'test@example.com';
  
  if (!recipientEmail) {
      return { success: false, error: "Could not determine recipient email address."};
  }

  const emailContent = `
    <h1>Welcome to Onboard eCR, ${providerData.name}!</h1>
    <p>We are excited to have you join our platform.</p>
    <p>Your NPI: ${providerData.orgName ? providerData.name.split(' ')[0] : providerData.name /* this is crude*/}</p>
    <p>Organization: ${providerData.orgName || 'N/A'}</p>
    <p>Primary Taxonomy: ${providerData.taxonomy || 'N/A'}</p>
    <p>Thank you for joining!</p>
  `;

  try {
    const result = await sendEmail({
      to: recipientEmail, // This should be a real contact email associated with the NPI/provider
      subject: `Welcome to Onboard eCR, ${providerData.name}`,
      htmlContent: emailContent,
    });
    if (result.success) {
      return { success: true, message: result.message };
    } else {
      return { success: false, error: result.message || 'Failed to send email.', message: result.error?.errors.map(e => e.message).join(', ') };
    }
  } catch (error) {
     const message = error instanceof Error ? error.message : 'An unexpected error occurred while sending email.';
    return { success: false, error: message };
  }
}

export async function simulateAimsValidationAction(providerData: ProviderData): Promise<{ success: boolean; data?: AIMSValidationResult; error?: string }> {
  try {
    const validationResult = await simulateAIMSValidation(providerData);
    return { success: true, data: validationResult };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to simulate AIMS validation.';
    return { success: false, error: message };
  }
}
