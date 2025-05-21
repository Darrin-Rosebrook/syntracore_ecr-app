
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { EnrollmentData, CustomFieldDefinition, ActivityLogEntry, FHIRValidationResult, DocumentEntry, ContactEntry, MessageEntry, HealthSystemEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
// import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getHealthSystemsAction } from '@/actions/health-system-actions'; // Import new action

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
import { useAuth } from './AuthContext';

interface AppContextState {
  enrollments: EnrollmentData[];
  customFieldDefinitions: CustomFieldDefinition[];
  healthSystems: HealthSystemEntry[]; // Add health systems state
  isLoading: boolean;
}

interface AppContextActions {
  updateEnrollmentStatus: (id: string, status: EnrollmentData['status'], comments?: string) => Promise<void>;
  updateEnrollmentData: (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog' | 'documents' | 'additionalContacts' | 'messages'>>) => Promise<void>;
  addActivityLogEntry: (enrollmentId: string, entryText: string, type: ActivityLogEntry['type'], user?: string) => Promise<void>;
  addCustomField: (fieldDefinition: CustomFieldDefinition) => Promise<void>;
  removeCustomField: (fieldId: string) => Promise<void>;
  removeEnrollment: (enrollmentId: string) => Promise<void>;
  fetchInitialData: () => Promise<void>;

  addDocumentToEnrollment: (enrollmentId: string, documentFile: File, uploadedBy: string) => Promise<void>;
  deleteDocumentFromEnrollment: (enrollmentId: string, documentId: string) => Promise<void>;

  addContactToEnrollment: (enrollmentId: string, contact: Omit<ContactEntry, 'id'>) => Promise<void>;
  updateContactInEnrollment: (enrollmentId: string, contact: ContactEntry) => Promise<void>;
  deleteContactFromEnrollment: (enrollmentId: string, contactId: string) => Promise<void>;
  setPrimaryContactForEnrollment: (enrollmentId: string, newPrimaryContactId: string) => Promise<void>;

  addMessageToEnrollment: (enrollmentId: string, messageContent: string, senderId: string, senderName: string, senderRole: 'PHA' | 'Provider' | 'Vendor' | 'System') => Promise<void>;
}

type AppContextProps = AppContextState & AppContextActions;

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [healthSystems, setHealthSystems] = useState<HealthSystemEntry[]>([]); // State for health systems
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useAuth();

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
          messages: data.messages?.map((msg: any) => ({
            ...msg,
            timestamp: (msg.timestamp as Timestamp)?.toDate ? (msg.timestamp as Timestamp).toDate().toISOString() : msg.timestamp,
          })) || [],
        } as EnrollmentData;
      });
      setEnrollments(enrollmentsData);

      // Fetch Health Systems
      const healthSystemsResult = await getHealthSystemsAction();
      if (healthSystemsResult.success && healthSystemsResult.systems) {
        setHealthSystems(healthSystemsResult.systems);
      } else {
        console.error("Error fetching health systems for AppContext:", healthSystemsResult.error);
        // Optionally toast error for health systems loading
      }

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
        user: currentUser?.displayName || currentUser?.email || 'PHA Reviewer',
      };
      activityLogsToAdd.push(statusChangeEntry);

      if (comments && status === 'Changes Requested') {
        const phaCommentEntry: ActivityLogEntry = {
          timestamp: new Date().toISOString(),
          entry: `PHA Reviewer Comment: ${comments}`,
          type: 'PHAComment',
          user: currentUser?.displayName || currentUser?.email || 'PHA Reviewer',
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
          user: currentUser?.displayName || currentUser?.email || 'PHA Reviewer',
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

  const updateEnrollmentData = async (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog' | 'documents' | 'additionalContacts' | 'messages'>>) => {
    const enrollmentDocRef = doc(db, 'enrollments', enrollmentId);
    try {
      await updateDoc(enrollmentDocRef, updatedFields);
      await addActivityLogEntry(enrollmentId, 'Provider details updated by PHA Admin.', 'UserAction', currentUser?.displayName || currentUser?.email || 'PHA Admin');

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
      setEnrollments(prevEnrollments => prevEnrollments.filter(e => e.id !== enrollmentId));
      toast({ title: 'Enrollment Removed', description: `Enrollment ID ${enrollmentId.slice(0,6)}... has been removed.` });
    } catch (error) {
      console.error("Error removing enrollment from Firestore: ", error);
      toast({ title: 'Error', description: 'Could not remove enrollment.', variant: 'destructive' });
    }
  };

  const addDocumentToEnrollment = async (enrollmentId: string, documentFile: File, uploadedBy: string) => {
    console.log("Attempting to add document", documentFile.name, "for enrollment", enrollmentId, "by", uploadedBy);
    const newDocEntry: DocumentEntry = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
      name: documentFile.name,
      type: documentFile.type,
      size: documentFile.size,
      uploadDate: new Date().toISOString(),
      uploadedBy: uploadedBy,
    };
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
      await updateDoc(enrollmentDocRef, {
        documents: arrayUnion({...newDocEntry, uploadDate: Timestamp.fromDate(new Date(newDocEntry.uploadDate))})
      });
      await addActivityLogEntry(enrollmentId, `Document "${newDocEntry.name}" uploaded.`, 'DocumentChange', uploadedBy);
      fetchInitialData();
      toast({title: "Document Uploaded", description: `${newDocEntry.name} added.`});
    } catch (error) {
      console.error("Error adding document:", error);
      toast({title: "Upload Failed", description: "Could not add document.", variant: "destructive"});
    }
  };

  const deleteDocumentFromEnrollment = async (enrollmentId: string, documentId: string) => {
    console.log("Attempting to delete document", documentId, "for enrollment", enrollmentId);
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    const currentEnrollment = enrollments.find(e => e.id === enrollmentId);
    const docToDelete = currentEnrollment?.documents?.find(d => d.id === documentId);

    if (!docToDelete) {
        toast({title: "Error", description: "Document not found.", variant: "destructive"});
        return;
    }
    try {
      const docSnap = await getDoc(enrollmentDocRef);
      const currentDocs = docSnap.data()?.documents || [];
      const updatedDocs = currentDocs.filter((d: DocumentEntry) => d.id !== documentId);
      await updateDoc(enrollmentDocRef, { documents: updatedDocs });
      await addActivityLogEntry(enrollmentId, `Document "${docToDelete.name}" deleted.`, 'DocumentChange', currentUser?.displayName || currentUser?.email || 'PHA Admin');
      fetchInitialData();
      toast({title: "Document Deleted", description: `${docToDelete.name} removed.`});
    } catch (error) {
        console.error("Error deleting document:", error);
        toast({title: "Delete Failed", description: "Could not delete document.", variant: "destructive"});
    }
  };

  const addContactToEnrollment = async (enrollmentId: string, contactData: Omit<ContactEntry, 'id'>) => {
    const newContact: ContactEntry = {
        ...contactData,
        id: `contact_${Date.now()}_${Math.random().toString(36).substring(2,9)}`
    };
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        await updateDoc(enrollmentDocRef, {
            additionalContacts: arrayUnion(newContact)
        });
        await addActivityLogEntry(enrollmentId, `Contact "${newContact.name}" added.`, 'ContactChange', currentUser?.displayName || currentUser?.email || 'PHA Admin');
        fetchInitialData();
        toast({title: "Contact Added", description: `${newContact.name} added.`});
    } catch (error) {
        console.error("Error adding contact:", error);
        toast({title: "Add Contact Failed", description: "Could not add contact.", variant: "destructive"});
    }
  };

  const updateContactInEnrollment = async (enrollmentId: string, contact: ContactEntry) => {
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        const docSnap = await getDoc(enrollmentDocRef);
        const currentContacts = docSnap.data()?.additionalContacts || [];
        const updatedContacts = currentContacts.map((c: ContactEntry) => c.id === contact.id ? contact : c);
        await updateDoc(enrollmentDocRef, { additionalContacts: updatedContacts });
        await addActivityLogEntry(enrollmentId, `Contact "${contact.name}" updated.`, 'ContactChange', currentUser?.displayName || currentUser?.email || 'PHA Admin');
        fetchInitialData();
        toast({title: "Contact Updated", description: `${contact.name} updated.`});
    } catch (error) {
        console.error("Error updating contact:", error);
        toast({title: "Update Contact Failed", description: "Could not update contact.", variant: "destructive"});
    }
  };

  const deleteContactFromEnrollment = async (enrollmentId: string, contactId: string) => {
     const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        const docSnap = await getDoc(enrollmentDocRef);
        const currentContacts = docSnap.data()?.additionalContacts || [];
        const contactToDelete = currentContacts.find((c: ContactEntry) => c.id === contactId);
        if (!contactToDelete) throw new Error("Contact not found for deletion.");
        const updatedContacts = currentContacts.filter((c: ContactEntry) => c.id !== contactId);
        await updateDoc(enrollmentDocRef, { additionalContacts: updatedContacts });
        await addActivityLogEntry(enrollmentId, `Contact "${contactToDelete.name}" deleted.`, 'ContactChange', currentUser?.displayName || currentUser?.email || 'PHA Admin');
        fetchInitialData();
        toast({title: "Contact Deleted", description: `${contactToDelete.name} deleted.`});
    } catch (error) {
        console.error("Error deleting contact:", error);
        toast({title: "Delete Contact Failed", description: (error as Error).message || "Could not delete contact.", variant: "destructive"});
    }
  };

  const setPrimaryContactForEnrollment = async (enrollmentId: string, newPrimaryContactIdFromAdditional: string) => {
    const enrollmentDocRef = doc(db, "enrollments", enrollmentId);
    try {
        const docSnap = await getDoc(enrollmentDocRef);
        if (!docSnap.exists()) throw new Error("Enrollment not found.");

        const currentData = docSnap.data() as EnrollmentData;
        const currentPrimaryContact = currentData.contactDetails;
        const additionalContacts = currentData.additionalContacts || [];

        const newPrimaryContact = additionalContacts.find(c => c.id === newPrimaryContactIdFromAdditional);
        if (!newPrimaryContact) throw new Error("New primary contact not found in additional contacts.");

        const updatedAdditionalContacts = additionalContacts.filter(c => c.id !== newPrimaryContactIdFromAdditional);
        if (currentPrimaryContact && currentPrimaryContact.name) {
            updatedAdditionalContacts.push({
                id: `contact_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
                name: currentPrimaryContact.name,
                email: currentPrimaryContact.email,
                phone: currentPrimaryContact.phone,
                role: 'Former Primary',
                isAlternative: false,
            });
        }

        await updateDoc(enrollmentDocRef, {
            contactDetails: {
                name: newPrimaryContact.name,
                email: newPrimaryContact.email,
                phone: newPrimaryContact.phone,
            },
            additionalContacts: updatedAdditionalContacts
        });

        await addActivityLogEntry(enrollmentId, `Primary contact changed to "${newPrimaryContact.name}".`, 'ContactChange', currentUser?.displayName || currentUser?.email || 'PHA Admin');
        fetchInitialData();
        toast({title: "Primary Contact Updated", description: `Primary contact is now ${newPrimaryContact.name}.`});

    } catch (error) {
         console.error("Error setting primary contact:", error);
        toast({title: "Update Failed", description: (error as Error).message || "Could not set primary contact.", variant: "destructive"});
    }
  };

  const addMessageToEnrollment = async (enrollmentId: string, messageContent: string, senderId: string, senderName: string, senderRole: 'PHA' | 'Provider' | 'Vendor' | 'System') => {
    const newMessageEntry: MessageEntry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
      timestamp: new Date().toISOString(),
      senderId,
      senderName,
      senderRole,
      content: messageContent,
    };
    const enrollmentDocRef = doc(db, 'enrollments', enrollmentId);
    try {
      const messageForFirestore = { ...newMessageEntry, timestamp: Timestamp.fromDate(new Date(newMessageEntry.timestamp)) };
      await updateDoc(enrollmentDocRef, {
        messages: arrayUnion(messageForFirestore)
      });

      setEnrollments(prevEnrollments =>
        prevEnrollments.map(e =>
          e.id === enrollmentId
            ? { ...e, messages: [...(e.messages || []), newMessageEntry] }
            : e
        )
      );
      toast({ title: 'Message Sent', description: 'Your message has been sent.' });
    } catch (error) {
      console.error("Error adding message to Firestore: ", error);
      toast({ title: 'Error Sending Message', description: 'Could not send message.', variant: 'destructive' });
    }
  };


  return (
    <AppContext.Provider
      value={{
        enrollments,
        customFieldDefinitions,
        healthSystems, // Provide health systems
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
        addMessageToEnrollment,
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
