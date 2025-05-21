
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, type Timestamp, collection, getDocs, query, orderBy, updateDoc } from 'firebase/firestore';
import type { VendorProfileData } from '@/types';

// Data parameter now includes representedEhrSystemValue and excludes fields automatically set by server or derived from userId
export async function createVendorProfileAction(
  userId: string,
  data: {
    vendorName: string;
    contactName: string;
    email: string;
    representedEhrSystemValue: string;
  }
): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to create vendor profile for UID: ${userId}`, data);
  try {
    const vendorRef = doc(db, 'vendors', userId); // Store vendors in a 'vendors' collection

    const profilePayload: VendorProfileData = {
      ...data,
      userId: userId,
      // @ts-ignore
      createdAt: serverTimestamp(),
      eulaAccepted: true,
      eulaAcceptedTimestamp: new Date().toISOString(),
      // lastLogin and lastUpdatedAt will be updated separately
    };
    await setDoc(vendorRef, profilePayload);
    console.log(`Vendor profile created successfully for UID: ${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while creating vendor profile.';
    console.error("Error in createVendorProfileAction:", message, error);
    return { success: false, error: message };
  }
}

export async function updateVendorProfileAction(
  userId: string,
  data: Partial<Pick<VendorProfileData, 'vendorName' | 'contactName' | 'representedEhrSystemValue'>>
): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to update vendor profile for UID: ${userId}`, data);
  if (Object.keys(data).length === 0) {
    return { success: true }; // No actual data to update
  }
  try {
    const vendorRef = doc(db, 'vendors', userId);
    const updatePayload = {
      ...data,
      // @ts-ignore
      lastUpdatedAt: serverTimestamp(),
    };
    await updateDoc(vendorRef, updatePayload);
    console.log(`Vendor profile updated successfully for UID: ${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while updating vendor profile.';
    console.error("Error in updateVendorProfileAction:", message, error);
    return { success: false, error: message };
  }
}


export async function getVendorProfileAction(userId: string): Promise<{ success: boolean; data?: VendorProfileData; error?: string }> {
  console.log(`Attempting to fetch vendor profile for UID: ${userId}`);
  try {
    const vendorRef = doc(db, 'vendors', userId);
    const docSnap = await getDoc(vendorRef);

    if (docSnap.exists()) {
      const rawData = docSnap.data();
      const profileData: VendorProfileData = {
        userId: rawData.userId,
        vendorName: rawData.vendorName,
        contactName: rawData.contactName,
        email: rawData.email,
        representedEhrSystemValue: rawData.representedEhrSystemValue,
        createdAt: (rawData.createdAt as Timestamp)?.toDate ? (rawData.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        lastLogin: (rawData.lastLogin as Timestamp)?.toDate ? (rawData.lastLogin as Timestamp).toDate().toISOString() : undefined,
        eulaAccepted: rawData.eulaAccepted || false,
        eulaAcceptedTimestamp: rawData.eulaAcceptedTimestamp,
        lastUpdatedAt: (rawData.lastUpdatedAt as Timestamp)?.toDate ? (rawData.lastUpdatedAt as Timestamp).toDate().toISOString() : undefined,
      };
      console.log(`Vendor profile fetched successfully for UID: ${userId}`, profileData);
      return { success: true, data: profileData };
    } else {
      console.log(`No vendor profile found for UID: ${userId}`);
      return { success: false, error: "Vendor profile not found." };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching vendor profile.';
    console.error("Error in getVendorProfileAction:", message, error);
    return { success: false, error: message };
  }
}

export async function updateVendorLastLoginAction(userId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to update last login for vendor UID: ${userId}`);
  try {
    const vendorRef = doc(db, 'vendors', userId);
    // @ts-ignore
    await updateDoc(vendorRef, { lastLogin: serverTimestamp() });
    console.log(`Last login updated successfully for vendor UID: ${userId}`);
    return { success: true };
  } catch (error) {
    if ((error as any).code === 'not-found') {
        console.warn(`Vendor profile not found for UID ${userId} when trying to update last login. This might happen if profile creation is pending or failed.`);
        return { success: false, error: "Vendor profile not found to update last login." };
    }
    const message = error instanceof Error ? error.message : 'An unknown error occurred while updating vendor last login.';
    console.error("Error in updateVendorLastLoginAction:", message, error);
    return { success: false, error: message };
  }
}

export async function getVendorsAction(): Promise<{ success: boolean; vendors?: VendorProfileData[]; error?: string }> {
  console.log("Attempting to fetch all vendor profiles.");
  try {
    const vendorsColRef = collection(db, 'vendors');
    const q = query(vendorsColRef, orderBy('vendorName'));
    const querySnapshot = await getDocs(q);
    const vendorsList = querySnapshot.docs.map(docSnap => {
      const rawData = docSnap.data();
      return {
        userId: rawData.userId,
        vendorName: rawData.vendorName,
        contactName: rawData.contactName,
        email: rawData.email,
        representedEhrSystemValue: rawData.representedEhrSystemValue,
        createdAt: (rawData.createdAt as Timestamp)?.toDate ? (rawData.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        lastLogin: (rawData.lastLogin as Timestamp)?.toDate ? (rawData.lastLogin as Timestamp).toDate().toISOString() : undefined,
        eulaAccepted: rawData.eulaAccepted || false,
        eulaAcceptedTimestamp: rawData.eulaAcceptedTimestamp,
        lastUpdatedAt: (rawData.lastUpdatedAt as Timestamp)?.toDate ? (rawData.lastUpdatedAt as Timestamp).toDate().toISOString() : undefined,
      } as VendorProfileData;
    });
    console.log("Vendor profiles fetched successfully:", vendorsList.length, "vendors found.");
    return { success: true, vendors: vendorsList };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching vendor profiles.';
    console.error("Error in getVendorsAction:", message, error);
    return { success: false, error: message, vendors: [] };
  }
}

    
