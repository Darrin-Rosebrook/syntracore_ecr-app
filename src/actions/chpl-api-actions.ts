
'use server';

import type { ChplDeveloper, ChplDeveloperResponse, ChplCertifiedProduct, ChplProductsResponse } from '@/types/chpl';

const CHPL_API_BASE_URL = 'https://certified.healthit.gov/rest'; // Updated Base URL

interface FetchOptions {
  headers: {
    'Content-Type': string;
  };
}

function getFetchOptions(): FetchOptions {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

export async function fetchChplDevelopersAction(): Promise<{ success: boolean; developers?: ChplDeveloper[]; error?: string }> {
  const options = getFetchOptions();

  try {
    // Note: The CHPL API documentation suggests most data endpoints require an API key.
    // This implementation proceeds without one based on user instruction.
    // The endpoint path /developers might be different under the new base URL.
    // The original code used `/ehr/edge-service/developers`.
    // Assuming the new base URL is meant to replace the entire prefix.
    const response = await fetch(`${CHPL_API_BASE_URL}/developers`, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CHPL API Error (Developers): ${response.status} - ${errorText}`);
      return { success: false, error: `Failed to fetch developers from CHPL API: ${response.statusText}` };
    }
    // The /developers endpoint might return a structured object like { results: [] } or an array directly.
    // Assuming it's an array directly for now, adjust if needed based on actual API response.
    // If it's structured, it might be: const developerData: ChplDeveloperResponse = await response.json();
    // and then use developerData.results
    const developers: ChplDeveloper[] = await response.json();
    
    const developersWithStatus = developers.map(dev => {
        const currentStatusEvent = dev.statusEvents?.sort((a, b) => b.statusDate - a.statusDate)[0];
        return {
            ...dev,
            status: currentStatusEvent ? currentStatusEvent.status : { name: "Unknown" }
        };
    });

    return { success: true, developers: developersWithStatus };
  } catch (error) {
    console.error("Error in fetchChplDevelopersAction:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: message };
  }
}

export async function fetchChplProductsByDeveloperAction(developerId: number): Promise<{ success: boolean; products?: ChplCertifiedProduct[]; error?: string }> {
  const options = getFetchOptions();

  try {
    // Adjust endpoint path if necessary. Original was /ehr/edge-service/certified_products
    // Assuming the new base URL is meant to replace the entire prefix.
    // The parameter for developer might be 'developerId' or different. The API documentation will clarify.
    // This example assumes the API can filter by developerId and certificationStatusName.
    const response = await fetch(`${CHPL_API_BASE_URL}/certified_products?developerId=${developerId}&certificationStatusName=Active&pageSize=1000`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CHPL API Error (Products for Developer ${developerId}): ${response.status} - ${errorText}`);
      return { success: false, error: `Failed to fetch products for developer ${developerId}: ${response.statusText}` };
    }
    const productsResponse: ChplProductsResponse = await response.json();
    
    // The API call with `certificationStatusName=Active` should already filter,
    // but as a safeguard, we can double-check.
    const activeProducts = productsResponse.results.filter(
      product => product.certificationStatus.name.toLowerCase() === 'active'
    );

    return { success: true, products: activeProducts };
  } catch (error) {
    console.error(`Error in fetchChplProductsByDeveloperAction for developer ${developerId}:`, error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: message };
  }
}
