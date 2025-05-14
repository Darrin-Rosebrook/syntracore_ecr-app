
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { PhaJurisdictionConfig } from '@/types';

const JURISDICTION_CONFIG_DOC_ID = 'mainJurisdictionConfig';

export async function savePhaJurisdictionAction(config: Omit<PhaJurisdictionConfig, 'lastUpdated'>): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to save PHA jurisdiction configuration:`, config);
  try {
    const configRef = doc(db, 'phaConfiguration', JURISDICTION_CONFIG_DOC_ID);
    const newConfig: PhaJurisdictionConfig = {
      ...config,
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(configRef, newConfig, { merge: true }); 
    console.log(`PHA jurisdiction configuration saved successfully.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while saving PHA jurisdiction configuration.';
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
      // Return a default structure if no config is found, ensuring all keys are present
      const defaultConfig: PhaJurisdictionConfig = {
        state: '',
        lastUpdated: new Date().toISOString(),
        phaName: '',
        logoUrl: '',
        stateRegulationsUrl: '',
        requiredReportingFieldsInfo: '',
        phaContactName: '',
        phaContactEmail: '',
        phaContactPhone: '',
        reportableConditionsUrl: '',
        dataStandardsInfo: '',
        autoPopulateCounties: false,
        autoPopulateHealthSystems: false,
        stateSealUrl: '',
        legalDisclaimers: '',
        customWelcomeMessage: '',
        emailSignature: '',
        immunizationRegistryUrl: '',
        hieConnectionInfo: '',
      };
      return { success: true, data: defaultConfig };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching PHA jurisdiction.';
    console.error("Error in getPhaJurisdictionAction:", message, error);
    return { success: false, error: message };
  }
}

