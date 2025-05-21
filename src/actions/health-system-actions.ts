
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { HealthSystemEntry } from '@/types';

interface AddHealthSystemData {
  name: string;
  hqAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  corporateWebsite?: string;
}

export async function addHealthSystemAction(
  data: AddHealthSystemData,
  userId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log(`Attempting to add health system: ${data.name} by user ${userId}`);
  try {
    const healthSystemsColRef = collection(db, 'healthSystems');
    const newHealthSystemPayload = {
      ...data,
      registeredByUserId: userId,
      eulaAccepted: true, // Assuming EULA is accepted at this point in the flow
      eulaAcceptedTimestamp: new Date().toISOString(),
      // @ts-ignore
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(healthSystemsColRef, newHealthSystemPayload);
    console.log(`Health system "${data.name}" added successfully with ID ${docRef.id}.`);
    return { success: true, id: docRef.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while adding the health system.';
    console.error("Error in addHealthSystemAction:", message, error);
    return { success: false, error: message };
  }
}

export async function getHealthSystemsAction(): Promise<{ success: boolean; systems?: HealthSystemEntry[]; error?: string }> {
  console.log("Attempting to fetch health systems.");
  try {
    const healthSystemsColRef = collection(db, 'healthSystems');
    const q = query(healthSystemsColRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    const systemsList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        hqAddress: data.hqAddress,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        corporateWebsite: data.corporateWebsite,
        registeredByUserId: data.registeredByUserId,
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        eulaAccepted: data.eulaAccepted || false,
        eulaAcceptedTimestamp: data.eulaAcceptedTimestamp || new Date().toISOString(),
      } as HealthSystemEntry;
    });
    console.log("Health systems fetched successfully:", systemsList.length, "systems found.");
    return { success: true, systems: systemsList };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching health systems.';
    console.error("Error in getHealthSystemsAction:", message, error);
    return { success: false, error: message, systems: [] };
  }
}
