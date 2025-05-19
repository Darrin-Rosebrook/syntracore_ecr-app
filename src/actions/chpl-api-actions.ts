'use server';

import type { ChplDeveloper, ChplDeveloperResponse, ChplCertifiedProduct, ChplProductsResponse } from '@/types/chpl';

const CHPL_API_BASE_URL = 'https://chpl.healthit.gov/ehr/edge-service';
const API_KEY = process.env.CHPL_API_KEY;

interface FetchOptions {
  headers: {
    'API-KEY': string;
    'Content-Type': string;
  };
}

function getFetchOptions(): FetchOptions | null {
  if (!API_KEY) {
    console.error("CHPL API Key is not configured in environment variables.");
    return null;
  }
  return {
    headers: {
      'API-KEY': API_KEY,
      'Content-Type': 'application/json',
    },
  };
}

export async function fetchChplDevelopersAction(): Promise<{ success: boolean; developers?: ChplDeveloper[]; error?: string }> {
  const options = getFetchOptions();
  if (!options) {
    return { success: false, error: "CHPL API Key not configured." };
  }

  try {
    const response = await fetch(`${CHPL_API_BASE_URL}/developers`, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CHPL API Error (Developers): ${response.status} - ${errorText}`);
      return { success: false, error: `Failed to fetch developers from CHPL API: ${response.statusText}` };
    }
    // The /developers endpoint directly returns an array of developers, not a structured response object.
    const developers: ChplDeveloper[] = await response.json();
    
    // Add a simplified current status to each developer based on their statusEvents
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
  if (!options) {
    return { success: false, error: "CHPL API Key not configured." };
  }

  try {
    // Fetch all products for the developer first, then filter client-side for active status
    // as direct filtering by certificationStatus.name might be tricky with the API.
    // The API docs suggest ?certificationStatusName=Active should work. Let's try it.
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