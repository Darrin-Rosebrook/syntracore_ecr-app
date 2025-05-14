
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { PhaJurisdictionConfig } from '@/types';

const JURISDICTION_CONFIG_DOC_ID = 'mainJurisdictionConfig';

export async function savePhaJurisdictionAction(stateAbbreviation: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to save PHA jurisdiction state: ${stateAbbreviation}`);
  try {
    const configRef = doc(db, 'phaConfiguration', JURISDICTION_CONFIG_DOC_ID);
    const newConfig: PhaJurisdictionConfig = {
      state: stateAbbreviation,
      // Potentially add other branding/config fields here later
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(configRef, newConfig, { merge: true }); // Use merge to update existing or create new
    console.log(`PHA jurisdiction state saved successfully to ${stateAbbreviation}.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while saving PHA jurisdiction.';
    console.error("Error in savePhaJurisdictionAction:", message, error);
    return { success: false, error: message };
  }
}

export async function getPhaJurisdictionAction(): Promise<{ success: boolean; data?: PhaJurisdictionConfig; error?: string }> {
  console.log("Attempting to fetch PHA jurisdiction configuration.");
  try {
    const configRef = doc(db, 'phaConfiguration', JURISDICTION_CONFIG_DOC_ID);
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      const configData = docSnap.data() as PhaJurisdictionConfig;
      console.log("PHA jurisdiction configuration fetched successfully:", configData);
      return { success: true, data: configData };
    } else {
      console.log("No PHA jurisdiction configuration found.");
      return { success: true, data: undefined }; // No config set yet is not an error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching PHA jurisdiction.';
    console.error("Error in getPhaJurisdictionAction:", message, error);
    return { success: false, error: message };
  }
}
