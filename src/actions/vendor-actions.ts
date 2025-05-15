
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';

export interface VendorProfileData {
  vendorName: string;
  contactName: string;
  email: string; // Should match auth email
  // userId is the doc ID (Firebase Auth UID)
  createdAt?: Timestamp; 
  lastLogin?: Timestamp;
}

// data parameter excludes fields automatically set by the server or derived from userId
export async function createVendorProfileAction(userId: string, data: { vendorName: string; contactName: string; email: string }): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to create vendor profile for UID: ${userId}`, data);
  try {
    const vendorRef = doc(db, 'vendors', userId); // Store vendors in a 'vendors' collection
    
    // Construct the full payload including server-generated timestamps
    const profilePayload: VendorProfileData & { userId: string } = {
      ...data,
      userId: userId, // Storing userId also within the document for easier querying if needed
      // @ts-ignore // Firestore will convert this to a Timestamp
      createdAt: serverTimestamp(),
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
