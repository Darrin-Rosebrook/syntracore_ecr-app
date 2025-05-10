'use server';

import type { NpiRegistryResponse, ProviderData } from '@/types/npi';

/**
 * Fetches provider information from the NPI registry.
 * @param npi The National Provider Identifier.
 * @returns A promise that resolves to provider data.
 * @throws An error if the NPI is not found or if the request fails.
 */
export async function fetchProviderByNPI(npi: string): Promise<ProviderData> {
  // Validate NPI format (basic check, can be more robust)
  if (!/^\d{10}$/.test(npi)) {
    throw new Error("Invalid NPI format. NPI must be 10 digits.");
  }

  const url = `https://npiregistry.cms.hhs.gov/api/?number=${npi}&version=2.1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NPI registry request failed with status: ${response.status}`);
    }
    const data: NpiRegistryResponse = await response.json();

    if (data.result_count > 0 && data.results && data.results.length > 0) {
      const provider = data.results[0];
      const primaryAddress = provider.addresses.find(addr => addr.address_purpose === 'LOCATION') || provider.addresses[0];
      
      return {
        name: `${provider.basic.first_name || ''} ${provider.basic.last_name || ''}`.trim() || provider.basic.organization_name || 'N/A',
        firstName: provider.basic.first_name,
        lastName: provider.basic.last_name,
        orgName: provider.basic.organization_name,
        address: primaryAddress ? {
          address_1: primaryAddress.address_1,
          address_2: primaryAddress.address_2,
          city: primaryAddress.city,
          state: primaryAddress.state,
          postal_code: primaryAddress.postal_code,
          country_code: primaryAddress.country_code,
          telephone_number: primaryAddress.telephone_number,
        } : undefined,
        taxonomy: provider.taxonomies[0]?.desc || 'N/A'
      };
    } else {
      throw new Error(`NPI ${npi} not found or no results.`);
    }
  } catch (error) {
    console.error("Error fetching NPI data:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while fetching NPI data.");
  }
}
