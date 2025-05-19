
'use server';

import type { NpiRegistryResponse, ProviderData } from '@/types/npi';

/**
 * Fetches provider information from the NPI registry.
 * @param npi The National Provider Identifier.
 * @returns A promise that resolves to provider data.
 * @throws An error if the NPI is not found or if the request fails.
 */
export async function fetchProviderByNPI(npi: string): Promise<ProviderData> {
  console.log("[npi-service] fetchProviderByNPI called with NPI:", npi);
  if (!/^\d{10}$/.test(npi)) {
    console.error("[npi-service] Invalid NPI format:", npi);
    throw new Error("Invalid NPI format. NPI must be 10 digits.");
  }

  const url = `https://npiregistry.cms.hhs.gov/api/?number=${npi}&version=2.1`;
  console.log("[npi-service] Fetching URL:", url);

  try {
    const response = await fetch(url);
    console.log("[npi-service] NPI Registry API Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[npi-service] NPI registry request failed. Status:", response.status, "Response Text:", errorText);
      throw new Error(`NPI registry request failed with status: ${response.status}. Response: ${errorText}`);
    }

    const data: NpiRegistryResponse = await response.json();
    console.log("[npi-service] NPI Registry API Parsed Data:", JSON.stringify(data, null, 2));

    if (data.result_count > 0 && data.results && data.results.length > 0) {
      const provider = data.results[0];
      const primaryAddress = provider.addresses.find(addr => addr.address_purpose === 'LOCATION') || provider.addresses[0];
      
      const providerResult: ProviderData = {
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
      console.log("[npi-service] Formatted ProviderData:", providerResult);
      return providerResult;
    } else {
      console.warn("[npi-service] NPI not found or no results for:", npi, "API Response:", data);
      throw new Error(`NPI ${npi} not found or no results.`);
    }
  } catch (error) {
    console.error("[npi-service] Error fetching NPI data:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while fetching NPI data.");
  }
}

