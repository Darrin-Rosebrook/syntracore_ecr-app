'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { EnrollmentData, CustomFieldDefinition, ActivityLogEntry, EnrollmentFormData, FHIRValidationResult, DocumentEntry, ContactEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase'; // Assuming Firebase is set up for Firestore
// TODO: Import Firebase Storage if document uploads are to be handled via Firebase Storage
// import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  setDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';

interface AppContextState {
  enrollments: EnrollmentData[];
  customFieldDefinitions: CustomFieldDefinition[];
  isLoading: boolean; 
}

interface AppContextActions {
  // addEnrollment is handled by server action, but keeping for context structure consistency if needed elsewhere
  // addEnrollment: (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => Promise<boolean>; 
  updateEnrollmentStatus: (id: string, status: EnrollmentData['status'], comments?: string) => Promise<void>;
  updateEnrollmentData: (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog' | 'documents' | 'additionalContacts'>>) => Promise<void>;
  addActivityLogEntry: (enrollmentId: string, entryText: string, type: ActivityLogEntry['type'], user?: string) => Promise<void>;
  addCustomField: (fieldDefinition: CustomFieldDefinition) => Promise<void>;
  removeCustomField: (fieldId: string) => Promise<void>;
  removeEnrollment: (enrollmentId: string) => Promise<void>;
  fetchInitialData: () => Promise<void>;

  // Document Management Actions
  addDocumentToEnrollment: (enrollmentId: string, documentFile: File, uploadedBy: string) => Promise<void>;
  deleteDocumentFromEnrollment: (enrollmentId: string, documentId: string) => Promise<void>;
  
  // Contact Management Actions
  addContactToEnrollment: (enrollmentId: string, contact: Omit<ContactEntry, 'id'>) => Promise<void>;
  updateContactInEnrollment: (enrollmentId: string, contact: ContactEntry) => Promise<void>;
  deleteContactFromEnrollment: (enrollmentId: string, contactId: string) => Promise<void>;
  setPrimaryContactForEnrollment: (enrollmentId: string, newPrimaryContactId: string) => Promise<void>;
}

type AppContextProps = AppContextState & AppContextActions;

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // const storage = getStorage(db.app); // Initialize storage if using Firebase Storage

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const cfdQuery = query(collection(db, 'customFieldDefinitions'), orderBy('order'));
      const cfdSnapshot = await getDocs(cfdQuery);
      const cfdData = cfdSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CustomFieldDefinition));
      setCustomFieldDefinitions(cfdData);

      const enrollmentsQuery = query(collection(db, 'enrollments'), orderBy('submissionDate', 'desc'));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollmentsData = enrollmentsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          submissionDate: (data.submissionDate as Timestamp)?.toDate ? (data.submissionDate as Timestamp).toDate().toISOString() : data.submissionDate,
          activityLog: data.activityLog?.map((log: any) => ({
            ...log,
            timestamp: (log.timestamp as Timestamp)?.toDate ? (log.timestamp as Timestamp).toDate().toISOString() : log.timestamp,
          })) || [],
          documents: data.documents?.map((doc: any) => ({
            ...doc,
            uploadDate: (doc.uploadDate as Timestamp)?.toDate ? (doc.uploadDate as Timestamp).toDate().toISOString() : doc.uploadDate,
          })) || [],
          additionalContacts: data.additionalContacts || [],
        } as EnrollmentData;
      });
      setEnrollments(enrollmentsData);

    } catch (error) {
      console.error("Error fetching initial data from Firestore:", error);
      toast({ title: 'Error', description: 'Could not load data from database.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const addActivityLogEntry = useCallback(async (enrollmentId: string, entryText: string, type: ActivityLogEntry['type'], user?: string) => {
    const newLogEntry: ActivityLogEntry = {
      timestamp: new Date().toISOString(), 
      entry: entryText,
      type,
      user: user || 'System',
    };
    const enrollmentDocRef = doc(db, 'enrollments', enrollmentId);
    try {
      const logEntryForFirestore = { ...newLogEntry, timestamp: Timestamp.fromDate(new Date(newLogEntry.timestamp)) };
      await updateDoc(enrollmentDocRef, {
        activityLog: arrayUnion(logEntryForFirestore)
      });
      setEnrollments(prevEnrollments =>
        prevEnrollments.map(e =>
          e.id === enrollmentId
            ? { ...e, activityLog: [...(e.activityLog || []), newLogEntry] }
            : e
        )
      );
    } catch (error) {
      console.error("Error adding activity log to Firestore: ", error);
      toast({ title: 'Error', description: 'Could not save activity log.', variant: 'destructive' });
    }
  }, [toast]);
  
  const updateEnrollmentStatus = async (id: string, status: EnrollmentData['status'], comments?: string) => {
    const enrollmentDocRef = doc(db, 'enrollments', id);
    try {
      const updateData: Partial<EnrollmentData> & { activityLog?: any } = { status }; 
      const activityLogsToAdd: ActivityLogEntry[] = [];

      const statusChangeEntry: ActivityLogEntry = {
        timestamp: new Date().toISOString(),
        entry: `Status changed to ${status}.`,
        type: 'UserAction',
        user: 'PHA Reviewer',
      };
      activityLogsToAdd.push(statusChangeEntry);

      if (comments && status === 'Changes Requested') {
        const phaCommentEntry: ActivityLogEntry = {
          timestamp: new Date().toISOString(),
          entry: `PHA Reviewer Comment: ${comments}`,
          type: 'PHAComment',
          user: 'PHA Reviewer',
        };
        activityLogsToAdd.push(phaCommentEntry);
        
        const currentEnrollmentDoc = await getDoc(enrollmentDocRef);
        const currentEnrollmentData = currentEnrollmentDoc.data() as EnrollmentData | undefined;
        const existingMessages = currentEnrollmentData?.validationResult?.messages || [];
        updateData.validationResult = {
            ...(currentEnrollmentData?.validationResult || { isValid: status !== "Changes Requested", messages: [] }), 
            messages: [...existingMessages.filter(msg => !msg.startsWith("PHA Comments:")), `PHA Comments: ${comments}`] 
        };
         if (status !== "Changes Requested" && updateData.validationResult) {
            updateData.validationResult.isValid = true; 
        } else if (status === "Changes Requested" && updateData.validationResult) {
            updateData.validationResult.isValid = false;
        }
      } else if (status === 'Denied' && comments) {
         const denialReasonEntry: ActivityLogEntry = {
          timestamp: new Date().toISOString(),
          entry: `Denial Reason: ${comments}`,
          type: 'System',
          user: 'PHA Reviewer',
        };
        activityLogsToAdd.push(denialReasonEntry);
      }
      
      const firestoreLogEntries = activityLogsToAdd.map(log => ({...log, timestamp: Timestamp.fromDate(new Date(log.timestamp))}));
      
      const updatePayload: { status: EnrollmentData['status'], activityLog?: any, validationResult?: FHIRValidationResult } = { status };
      if (firestoreLogEntries.length > 0) {
          updatePayload.activityLog = arrayUnion(...firestoreLogEntries);
      }
      if (updateData.validationResult) {
          updatePayload.validationResult = updateData.validationResult;
      }

      await updateDoc(enrollmentDocRef, updatePayload);

      setEnrollments(prevEnrollments =>
        prevEnrollments.map(e =>
          e.id === id
            ? { 
                ...e, 
                status, 
                validationResult: updateData.validationResult ? {
                    ...updateData.validationResult,
                     summary: e.validationResult?.summary 
                } : e.validationResult,
                activityLog: [...(e.activityLog || []), ...activityLogsToAdd] 
              }
            : e
        )
      );
      toast({ title: 'Status Updated', description: `Enrollment status changed to ${status}.` });
    } catch (error) {
      console.error("Error updating enrollment status in Firestore: ", error);
      toast({ title: 'Error', description: 'Could not update enrollment status.', variant: 'destructive' });
    }
  };

  const updateEnrollmentData = async (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog' | 'documents' | 'additionalContacts'>>) => {
    const enrollmentDocRef = doc(db, 'enrollments', enrollmentId);
    try {
      await updateDoc(enrollmentDocRef, updatedFields);
      await addActivityLogEntry(enrollmentId, 'Provider details updated by PHA Admin.', 'UserAction', 'PHA Admin');
      
      setEnrollments(prevEnrollments =>
        prevEnrollments.map(e =>
          e.id === enrollmentId
            ? { ...e, ...updatedFields } 
            : e
        )
      );
      toast({ title: 'Success', description: 'Provider details updated.' });
    } catch (error) {
      console.error("Error updating enrollment data in Firestore: ", error);
      toast({ title: 'Error', description: 'Could not update provider details.', variant: 'destructive' });
    }
  };

  const addCustomField = async (fieldDefinition: CustomFieldDefinition) => {
    if (customFieldDefinitions.some(f => f.id === fieldDefinition.id)) {
      toast({ title: 'Error', description: 'Field ID already exists.', variant: 'destructive' });
      return;
    }
    const fieldDocRef = doc(db, 'customFieldDefinitions', fieldDefinition.id);
    try {
      await setDoc(fieldDocRef, fieldDefinition); 
      setCustomFieldDefinitions(prevFields => [...prevFields, fieldDefinition].sort((a, b) => a.order - b.order));
      toast({ title: 'Success', description: `Custom field "${fieldDefinition.label}" added.` });
    } catch (error) {
      console.error("Error adding custom field to Firestore: ", error);
      toast({ title: 'Error', description: 'Could not add custom field.', variant: 'destructive' });
    }
  };

  const removeCustomField = async (fieldId: string) => {
    const fieldDocRef = doc(db, 'customFieldDefinitions', fieldId);
    try {
      await deleteDoc(fieldDocRef);
      const fieldToRemove = customFieldDefinitions.find(f => f.id === fieldId);
      setCustomFieldDefinitions(prevFields => prevFields.filter(field => field.id !== fieldId));
      if (fieldToRemove) {
        toast({ title: 'Success', description: `Custom field "${fieldToRemove.label}" removed.` });
      }
    } catch (error) {
      console.error("Error removing custom field from Firestore: ", error);
      toast({ title: 'Error', description: 'Could not remove custom field.', variant: 'destructive' });
    }
  };

  const removeEnrollment = async (enrollmentId: string) => {
    const enrollmentDocRef = doc(db, 'enrollments', enrollmentId);
    try {
      await deleteDoc(enrollmentDocRef);
      // TODO: If documents are in Firebase Storage, delete them here as well.
      setEnrollments(prevEnrollments => prevEnrollments.filter(e => e.id !== enrollmentId));
      toast({ title: 'Enrollment Removed', description: `Enrollment ID ${enrollmentId.slice(0,6)}... has been removed.` });
    } catch (error) {
      console.error("Error removing enrollment from Firestore: ", error);
      toast({ title: 'Error', description: 'Could not remove enrollment.', variant: 'destructive' });
    }
  };

  // --- Document Management Stubs ---
  const addDocumentToEnrollment = async (enrollmentId: string, documentFile: File, uploadedBy: string) => {
    console.log("Attempting to add document", documentFile.name, "for enrollment", enrollmentId, "by", uploadedBy);
    // Placeholder: Implement Firebase Storage upload and Firestore metadata update
    // Example:
    // const storageRef = ref(storage, `enrollments/${enrollmentId}/documents/${documentFile.name}`);
    // await uploadBytes(storageRef, documentFile);
    // const downloadURL = await getDownloadURL(storageRef);
    const newDocEntry: DocumentEntry = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, // Temp ID
      name: documentFile.name,
      type: documentFile.type,
      size: documentFile.size,
      uploadDate: new Date().toISOString(),
      uploadedBy: uploadedBy,
      // url: downloadURL, 
    };
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
      await updateDoc(enrollmentDocRef, {
        documents: arrayUnion({...newDocEntry, uploadDate: Timestamp.fromDate(new Date(newDocEntry.uploadDate))})
      });
      await addActivityLogEntry(enrollmentId, `Document "${newDocEntry.name}" uploaded.`, 'DocumentChange', uploadedBy);
      fetchInitialData(); // Re-fetch to update local state correctly
      toast({title: "Document Uploaded", description: `${newDocEntry.name} added.`});
    } catch (error) {
      console.error("Error adding document:", error);
      toast({title: "Upload Failed", description: "Could not add document.", variant: "destructive"});
    }
  };

  const deleteDocumentFromEnrollment = async (enrollmentId: string, documentId: string) => {
    console.log("Attempting to delete document", documentId, "for enrollment", enrollmentId);
    // Placeholder: Implement Firebase Storage delete and Firestore metadata update
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    const currentEnrollment = enrollments.find(e => e.id === enrollmentId);
    const docToDelete = currentEnrollment?.documents?.find(d => d.id === documentId);

    if (!docToDelete) {
        toast({title: "Error", description: "Document not found.", variant: "destructive"});
        return;
    }
    // const storageRef = ref(storage, `enrollments/${enrollmentId}/documents/${docToDelete.name}`);
    // await deleteObject(storageRef);
    try {
      await updateDoc(enrollmentDocRef, {
        documents: arrayRemove(docToDelete) // This requires the exact object from Firestore or a query.
                                             // A more robust way is to fetch, filter, and set.
                                             // For simplicity here, we assume docToDelete is structured correctly.
                                             // A better Firestore approach:
                                             // const docSnap = await getDoc(enrollmentDocRef);
                                             // const currentDocs = docSnap.data()?.documents || [];
                                             // const updatedDocs = currentDocs.filter(d => d.id !== documentId);
                                             // await updateDoc(enrollmentDocRef, { documents: updatedDocs });
      });
      await addActivityLogEntry(enrollmentId, `Document "${docToDelete.name}" deleted.`, 'DocumentChange', 'PHA Admin');
      fetchInitialData();
      toast({title: "Document Deleted", description: `${docToDelete.name} removed.`});
    } catch (error) {
        console.error("Error deleting document:", error);
        toast({title: "Delete Failed", description: "Could not delete document.", variant: "destructive"});
    }
  };
  
  // --- Contact Management Stubs ---
  const addContactToEnrollment = async (enrollmentId: string, contactData: Omit<ContactEntry, 'id'>) => {
    const newContact: ContactEntry = {
        ...contactData,
        id: `contact_${Date.now()}_${Math.random().toString(36).substring(2,9)}`
    };
    console.log("Adding contact to enrollment", enrollmentId, newContact);
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        await updateDoc(enrollmentDocRef, {
            additionalContacts: arrayUnion(newContact)
        });
        await addActivityLogEntry(enrollmentId, `Contact "${newContact.name}" added.`, 'ContactChange', 'PHA Admin');
        fetchInitialData();
        toast({title: "Contact Added", description: `${newContact.name} added.`});
    } catch (error) {
        console.error("Error adding contact:", error);
        toast({title: "Add Contact Failed", description: "Could not add contact.", variant: "destructive"});
    }
  };

  const updateContactInEnrollment = async (enrollmentId: string, contact: ContactEntry) => {
    console.log("Updating contact in enrollment", enrollmentId, contact);
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        const docSnap = await getDoc(enrollmentDocRef);
        const currentContacts = docSnap.data()?.additionalContacts || [];
        const updatedContacts = currentContacts.map(c => c.id === contact.id ? contact : c);
        await updateDoc(enrollmentDocRef, { additionalContacts: updatedContacts });
        await addActivityLogEntry(enrollmentId, `Contact "${contact.name}" updated.`, 'ContactChange', 'PHA Admin');
        fetchInitialData();
        toast({title: "Contact Updated", description: `${contact.name} updated.`});
    } catch (error) {
        console.error("Error updating contact:", error);
        toast({title: "Update Contact Failed", description: "Could not update contact.", variant: "destructive"});
    }
  };

  const deleteContactFromEnrollment = async (enrollmentId: string, contactId: string) => {
    console.log("Deleting contact from enrollment", enrollmentId, contactId);
     const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        const docSnap = await getDoc(enrollmentDocRef);
        const currentContacts = docSnap.data()?.additionalContacts || [];
        const contactToDelete = currentContacts.find(c => c.id === contactId);
        if (!contactToDelete) throw new Error("Contact not found for deletion.");
        const updatedContacts = currentContacts.filter(c => c.id !== contactId);
        await updateDoc(enrollmentDocRef, { additionalContacts: updatedContacts });
        await addActivityLogEntry(enrollmentId, `Contact "${contactToDelete.name}" deleted.`, 'ContactChange', 'PHA Admin');
        fetchInitialData();
        toast({title: "Contact Deleted", description: `${contactToDelete.name} deleted.`});
    } catch (error) {
        console.error("Error deleting contact:", error);
        toast({title: "Delete Contact Failed", description: (error as Error).message || "Could not delete contact.", variant: "destructive"});
    }
  };
  
  const setPrimaryContactForEnrollment = async (enrollmentId: string, newPrimaryContactIdFromAdditional: string) => {
    console.log("Setting primary contact for enrollment", enrollmentId, "to", newPrimaryContactIdFromAdditional);
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        const docSnap = await getDoc(enrollmentDocRef);
        if (!docSnap.exists()) throw new Error("Enrollment not found.");

        const currentData = docSnap.data() as EnrollmentData;
        const currentPrimaryContact = currentData.contactDetails;
        const additionalContacts = currentData.additionalContacts || [];
        
        const newPrimaryContact = additionalContacts.find(c => c.id === newPrimaryContactIdFromAdditional);
        if (!newPrimaryContact) throw new Error("New primary contact not found in additional contacts.");

        // New list of additional contacts: current primary becomes an additional contact (if it has a name),
        // and the new primary is removed from additional contacts.
        const updatedAdditionalContacts = additionalContacts.filter(c => c.id !== newPrimaryContactIdFromAdditional);
        if (currentPrimaryContact && currentPrimaryContact.name) { // Ensure there's an actual current primary to move
            updatedAdditionalContacts.push({
                id: `contact_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, // Give it a new ID if it was the original primary
                name: currentPrimaryContact.name,
                email: currentPrimaryContact.email,
                phone: currentPrimaryContact.phone,
                role: 'Former Primary', // Or some other role
                isAlternative: false,
            });
        }
        
        await updateDoc(enrollmentDocRef, {
            contactDetails: { // This becomes the new primary
                name: newPrimaryContact.name,
                email: newPrimaryContact.email,
                phone: newPrimaryContact.phone,
            },
            additionalContacts: updatedAdditionalContacts
        });

        await addActivityLogEntry(enrollmentId, `Primary contact changed to "${newPrimaryContact.name}".`, 'ContactChange', 'PHA Admin');
        fetchInitialData();
        toast({title: "Primary Contact Updated", description: `Primary contact is now ${newPrimaryContact.name}.`});

    } catch (error) {
         console.error("Error setting primary contact:", error);
        toast({title: "Update Failed", description: (error as Error).message || "Could not set primary contact.", variant: "destructive"});
    }
  };


  return (
    <AppContext.Provider
      value={{
        enrollments,
        customFieldDefinitions,
        isLoading, 
        updateEnrollmentStatus,
        updateEnrollmentData,
        addActivityLogEntry,
        addCustomField,
        removeCustomField,
        removeEnrollment,
        fetchInitialData,
        addDocumentToEnrollment,
        deleteDocumentFromEnrollment,
        addContactToEnrollment,
        updateContactInEnrollment,
        deleteContactFromEnrollment,
        setPrimaryContactForEnrollment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};