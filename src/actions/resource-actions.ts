
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { ResourceItem, ResourceItemType } from '@/types';

export async function addResourceItemAction(
  itemData: Omit<ResourceItem, 'id' | 'createdAt' | 'lastUpdated'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log('Attempting to save resource item:', itemData.title);
  try {
    const resourcesColRef = collection(db, 'siteResources');
    const newItem: Omit<ResourceItem, 'id'> = {
      ...itemData,
      // @ts-ignore
      createdAt: serverTimestamp(),
      // @ts-ignore
      lastUpdated: serverTimestamp(),
    };
    const docRef = await addDoc(resourcesColRef, newItem);
    console.log(`Resource item "${itemData.title}" saved successfully with ID ${docRef.id}.`);
    return { success: true, id: docRef.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while saving the resource item.';
    console.error("Error in addResourceItemAction:", message, error);
    return { success: false, error: message };
  }
}

export async function getResourceItemsAction(): Promise<{ success: boolean; items?: ResourceItem[]; error?: string }> {
  console.log("Attempting to fetch resource items.");
  try {
    const resourcesColRef = collection(db, 'siteResources');
    const q = query(resourcesColRef, orderBy('order'), orderBy('title'));
    const querySnapshot = await getDocs(q);
    const itemsList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        type: data.type,
        content: data.content,
        order: data.order,
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        lastUpdated: (data.lastUpdated as Timestamp)?.toDate ? (data.lastUpdated as Timestamp).toDate().toISOString() : new Date().toISOString(),
      } as ResourceItem;
    });
    console.log("Resource items fetched successfully:", itemsList.length, "items found.");
    return { success: true, items: itemsList };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching resource items.';
    console.error("Error in getResourceItemsAction:", message, error);
    return { success: false, error: message, items: [] };
  }
}

export async function updateResourceItemAction(
  itemId: string,
  itemData: Partial<Omit<ResourceItem, 'id' | 'createdAt' | 'lastUpdated'>>
): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to update resource item: ${itemId}`);
  try {
    const itemDocRef = doc(db, 'siteResources', itemId);
    const updatePayload = {
      ...itemData,
      // @ts-ignore
      lastUpdated: serverTimestamp(),
    };
    await updateDoc(itemDocRef, updatePayload);
    console.log(`Resource item "${itemId}" updated successfully.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while updating the resource item.';
    console.error("Error in updateResourceItemAction:", message, error);
    return { success: false, error: message };
  }
}

export async function deleteResourceItemAction(itemId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to delete resource item: ${itemId}`);
  try {
    const itemDocRef = doc(db, 'siteResources', itemId);
    await deleteDoc(itemDocRef);
    console.log(`Resource item "${itemId}" deleted successfully.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while deleting the resource item.';
    console.error("Error in deleteResourceItemAction:", message, error);
    return { success: false, error: message };
  }
}
