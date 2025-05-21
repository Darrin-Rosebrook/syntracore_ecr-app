
// 'use server';

// import type { ChplDeveloper, ChplDeveloperResponse, ChplCertifiedProduct, ChplProductsResponse } from '@/types/chpl';

// const CHPL_API_BASE_URL = 'https://certified.healthit.gov/rest';

// interface FetchOptions {
 //  headers: {
 //    'Content-Type': string;
 //  };
// }

// function getFetchOptions(): FetchOptions {
  // return {
   //  headers: {
    //   'Content-Type': 'application/json',
    //  },
 // }

//  export async function fetchChplDevelopersAction(): Promise<{ success: boolean; developers?: ChplDeveloper[]; error?: string }> {
  //  const options = getFetchOptions();

 //    try {
   //  console.log("[chpl-api-actions] CHPL API call to /developers is DISABLED.");
    // const response = await fetch(`${CHPL_API_BASE_URL}/developers`, options);
    // if (!response.ok) {
    //   const errorText = await response.text();
    //   console.error(`CHPL API Error (Developers): ${response.status} - ${errorText}`);
    //   return { success: false, error: `Failed to fetch developers from CHPL API: ${response.statusText}` };
    // }
    // const developers: ChplDeveloper[] = await response.json();
    
    // const developersWithStatus = developers.map(dev => {
    //     const currentStatusEvent = dev.statusEvents?.sort((a, b) => b.statusDate - a.statusDate)[0];
    //     return {
    //         ...dev,
    //         status: currentStatusEvent ? currentStatusEvent.status : { name: "Unknown" }
    //     };
    // });

    // Return empty successful response as API call is disabled
   //  return { success: true, developers: [] };
 //  } catch (error) {
 //    console.error("Error in fetchChplDevelopersAction (API call disabled):", error);
 //    const message = error instanceof Error ? error.message : "An unknown error occurred.";
 //    return { success: false, error: message };
 //  }
// }

// export async function fetchChplProductsByDeveloperAction(developerId: number): Promise<{ success: boolean; products?: ChplCertifiedProduct[]; error?: string }> {
  // const options = getFetchOptions();

 //  try {
    // console.log(`[chpl-api-actions] CHPL API call to /certified_products for developer ${developerId} is DISABLED.`);
    // const response = await fetch(`${CHPL_API_BASE_URL}/certified_products?developerId=${developerId}&certificationStatusName=Active&pageSize=1000`, options);
    
    // if (!response.ok) {
    //   const errorText = await response.text();
    //   console.error(`CHPL API Error (Products for Developer ${developerId}): ${response.status} - ${errorText}`);
    //   return { success: false, error: `Failed to fetch products for developer ${developerId}: ${response.statusText}` };
    // }
    // const productsResponse: ChplProductsResponse = await response.json();
    
    // const activeProducts = productsResponse.results.filter(
    //   product => product.certificationStatus.name.toLowerCase() === 'active'
    // );

    // Return empty successful response as API call is disabled
    // return { success: true, products: [] };
 //  } catch (error) {
 //    console.error(`Error in fetchChplProductsByDeveloperAction for developer ${developerId} (API call disabled):`, error);
 //    const message = error instanceof Error ? error.message : "An unknown error occurred.";
 //    return { success: false, error: message };
//   }
// }

