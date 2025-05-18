
'use server';

import type { CliaApiResponse, CliaData, CliaApiResult } from '@/types';

/**
 * Fetches laboratory information from the CMS CLIA registry by CLIA number.
 * @param cliaNumber The CLIA number.
 * @returns A promise that resolves to CLIA data or null if not found/error.
 */
export async function fetchCliaDataAction(cliaNumber: string): Promise<{ success: boolean; data?: CliaData; error?: string }> {
  if (!cliaNumber || cliaNumber.trim().length === 0) {
    return { success: false, error: "CLIA number is required." };
  }
  // Basic CLIA format check (10 characters, typically 2 digits, 1 letter, 7 digits)
  // This is a loose check; the API will be the ultimate validator.
  if (!/^[0-9A-Z]{10}$/i.test(cliaNumber.trim())) {
     return { success: false, error: "Invalid CLIA number format. Expected 10 alphanumeric characters." };
  }

  const encodedCliaNumber = encodeURIComponent(cliaNumber.trim());
  const url = `https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0?conditions[0][property]=clia_number&conditions[0][value]=${encodedCliaNumber}&conditions[0][operator]=%3D`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`CLIA API request failed with status: ${response.status} for CLIA: ${cliaNumber}`);
      return { success: false, error: `CLIA registry request failed (status: ${response.status}).` };
    }

    const apiResponse: CliaApiResponse = await response.json();

    if (apiResponse.count > 0 && apiResponse.results && apiResponse.results.length > 0) {
      const labResult: CliaApiResult = apiResponse.results[0];
      const formattedAddress = [
        labResult.st_adr,
        labResult.city_nme,
        labResult.st_cd,
        labResult.zip_cd,
      ].filter(Boolean).join(', ');

      const cliaData: CliaData = {
        cliaNumber: labResult.clia_number,
        facilityName: labResult.fac_nme,
        address: formattedAddress || undefined,
        phone: labResult.phn_numbr,
        labType: labResult.lab_type_dsc,
      };
      return { success: true, data: cliaData };
    } else {
      return { success: false, error: `CLIA number ${cliaNumber} not found.` };
    }
  } catch (error) {
    console.error("Error fetching CLIA data:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred while fetching CLIA data.";
    return { success: false, error: message };
  }
}
