
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import type { VendorActivityLogEntry } from '@/types';

const VENDOR_ACTIVITY_LOGS_COLLECTION = 'vendorActivityLogs';

export async function addVendorActivityLogAction(
  logData: Omit<VendorActivityLogEntry, 'id' | 'timestamp'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log('[VendorActivityLogActions] Adding log for vendor:', logData.vendorValue);
  try {
    const logPayload = {
      ...logData,
      timestamp: serverTimestamp(), // Let Firestore set the timestamp
    };
    const docRef = await addDoc(collection(db, VENDOR_ACTIVITY_LOGS_COLLECTION), logPayload);
    console.log(`[VendorActivityLogActions] Log entry added with ID ${docRef.id} for vendor ${logData.vendorValue}.`);
    return { success: true, id: docRef.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while adding vendor activity log.';
    console.error("[VendorActivityLogActions] Error in addVendorActivityLogAction:", message, error);
    return { success: false, error: message };
  }
}

export async function getVendorActivityLogsAction(
  vendorValue: string
): Promise<{ success: boolean; logs?: VendorActivityLogEntry[]; error?: string }> {
  console.log('[VendorActivityLogActions] Fetching logs for vendor:', vendorValue);
  try {
    const logsColRef = collection(db, VENDOR_ACTIVITY_LOGS_COLLECTION);
    const q = query(
      logsColRef,
      where('vendorValue', '==', vendorValue),
      orderBy('timestamp', 'desc') // Show newest first
    );
    const querySnapshot = await getDocs(q);
    const logsList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate().toISOString() : new Date().toISOString(),
      } as VendorActivityLogEntry;
    });
    console.log(`[VendorActivityLogActions] Fetched ${logsList.length} logs for vendor ${vendorValue}.`);
    return { success: true, logs: logsList };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching vendor activity logs.';
    console.error("[VendorActivityLogActions] Error in getVendorActivityLogsAction:", message, error);
    return { success: false, error: message, logs: [] };
  }
}

export async function updateVendorActivityLogAction(
  logId: string,
  newEntryText: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[VendorActivityLogActions] Updating log ID: ${logId} by user: ${currentUserId}`);
  try {
    const logDocRef = doc(db, VENDOR_ACTIVITY_LOGS_COLLECTION, logId);
    const docSnap = await getDoc(logDocRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Log entry not found.' };
    }
    const logData = docSnap.data() as VendorActivityLogEntry;
    if (logData.creatorId !== currentUserId) {
      return { success: false, error: 'Permission denied. You can only edit your own log entries.' };
    }

    await updateDoc(logDocRef, {
      entry: newEntryText,
      timestamp: serverTimestamp(), // Update timestamp on edit
    });
    console.log(`[VendorActivityLogActions] Log entry ${logId} updated successfully.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while updating vendor activity log.';
    console.error("[VendorActivityLogActions] Error in updateVendorActivityLogAction:", message, error);
    return { success: false, error: message };
  }
}

export async function deleteVendorActivityLogAction(
  logId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[VendorActivityLogActions] Deleting log ID: ${logId} by user: ${currentUserId}`);
  try {
    const logDocRef = doc(db, VENDOR_ACTIVITY_LOGS_COLLECTION, logId);
    const docSnap = await getDoc(logDocRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Log entry not found.' };
    }
    const logData = docSnap.data() as VendorActivityLogEntry;
    if (logData.creatorId !== currentUserId) {
      return { success: false, error: 'Permission denied. You can only delete your own log entries.' };
    }

    await deleteDoc(logDocRef);
    console.log(`[VendorActivityLogActions] Log entry ${logId} deleted successfully.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while deleting vendor activity log.';
    console.error("[VendorActivityLogActions] Error in deleteVendorActivityLogAction:", message, error);
    return { success: false, error: message };
  }
}
