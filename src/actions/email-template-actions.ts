
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { EmailTemplate, EmailEventTrigger } from '@/types';

export async function saveEmailTemplateAction(
  templateData: Omit<EmailTemplate, 'id' | 'lastUpdated' | 'createdAt'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log('Attempting to save email template:', templateData.name);
  try {
    const templatesColRef = collection(db, 'emailTemplates');
    const newTemplate: Omit<EmailTemplate, 'id'> = {
      ...templateData,
      // @ts-ignore
      createdAt: serverTimestamp(),
      // @ts-ignore
      lastUpdated: serverTimestamp(),
    };
    const docRef = await addDoc(templatesColRef, newTemplate);
    console.log(`Email template "${templateData.name}" saved successfully with ID ${docRef.id}.`);
    return { success: true, id: docRef.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while saving the email template.';
    console.error("Error in saveEmailTemplateAction:", message, error);
    return { success: false, error: message };
  }
}

export async function updateEmailTemplateAction(
  templateId: string,
  templateData: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'lastUpdated'>>
): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to update email template: ${templateId}`);
  try {
    const templateDocRef = doc(db, 'emailTemplates', templateId);
    const updatePayload = {
        ...templateData,
        // @ts-ignore
        lastUpdated: serverTimestamp(),
    };
    await updateDoc(templateDocRef, updatePayload);
    console.log(`Email template "${templateId}" updated successfully.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while updating the email template.';
    console.error("Error in updateEmailTemplateAction:", message, error);
    return { success: false, error: message };
  }
}

export async function getEmailTemplatesAction(): Promise<{ success: boolean; templates?: EmailTemplate[]; error?: string }> {
  console.log("Attempting to fetch email templates.");
  try {
    const templatesColRef = collection(db, 'emailTemplates');
    const q = query(templatesColRef, orderBy('name')); // Order by name, for example
    const querySnapshot = await getDocs(q);
    const templatesList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        eventTrigger: data.eventTrigger,
        subject: data.subject,
        htmlBody: data.htmlBody,
        attachments: data.attachments || [],
        placeholders: data.placeholders || [],
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        lastUpdated: (data.lastUpdated as Timestamp)?.toDate ? (data.lastUpdated as Timestamp).toDate().toISOString() : new Date().toISOString(),
      } as EmailTemplate;
    });
    console.log("Email templates fetched successfully:", templatesList.length, "templates found.");
    return { success: true, templates: templatesList };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching email templates.';
    console.error("Error in getEmailTemplatesAction:", message, error);
    return { success: false, error: message, templates: [] };
  }
}

export async function deleteEmailTemplateAction(templateId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to delete email template: ${templateId}`);
  try {
    const templateDocRef = doc(db, 'emailTemplates', templateId);
    await deleteDoc(templateDocRef);
    console.log(`Email template "${templateId}" deleted successfully.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while deleting the email template.';
    console.error("Error in deleteEmailTemplateAction:", message, error);
    return { success: false, error: message };
  }
}
