
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { EnrollmentData, CustomFieldDefinition, ActivityLogEntry, EnrollmentFormData, FHIRValidationResult } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
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
  getDoc,
} from 'firebase/firestore';

interface AppContextState {
  enrollments: EnrollmentData[];
  customFieldDefinitions: CustomFieldDefinition[];
  isLoading: boolean; 
}

interface AppContextActions {
  addEnrollment: (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => Promise<boolean>; 
  updateEnrollmentStatus: (id: string, status: EnrollmentData['status'], comments?: string) => Promise<void>;
  updateEnrollmentData: (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>>) => Promise<void>;
  addActivityLogEntry: (enrollmentId: string, entryText: string, type: ActivityLogEntry['type'], user?: string) => Promise<void>;
  addCustomField: (fieldDefinition: CustomFieldDefinition) => Promise<void>;
  removeCustomField: (fieldId: string) => Promise<void>;
  fetchInitialData: () => Promise<void>; // Expose fetchInitialData
}

type AppContextProps = AppContextState & AppContextActions;

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Custom Fields
      const cfdQuery = query(collection(db, 'customFieldDefinitions'), orderBy('order'));
      const cfdSnapshot = await getDocs(cfdQuery);
      const cfdData = cfdSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CustomFieldDefinition));
      setCustomFieldDefinitions(cfdData);

      // Fetch Enrollments
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

  // This method's direct Firestore write is being replaced by the addEnrollmentToFirestore server action for form submissions.
  // It's kept for now, but its usage for form submission from ProviderEnrollmentTab is removed.
  const addEnrollment = async (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult): Promise<boolean> => {
    console.warn("AppContext.addEnrollment called. For form submissions, prefer using the addEnrollmentToFirestore server action.");
    
    // The Firestore write logic below is now primarily handled by the server action.
    // This function might be repurposed or removed if not used for other programmatic additions.
    /*
    const submissionDate = new Date();
    const initialLogEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: 'Enrollment application submitted (via AppContext).', // Modified log entry
      type: 'System',
    };

    const newEnrollmentForFirestore = {
      ...formData,
      submissionDate: Timestamp.fromDate(submissionDate),
      ccdDocumentContent: ccdDocumentContent || null,
      validationResult: validationResult,
      status: "Pending" as EnrollmentData['status'],
      activityLog: [{ ...initialLogEntry, timestamp: Timestamp.fromDate(new Date(initialLogEntry.timestamp)) }],
    };

    try {
      const docRef = await addDoc(collection(db, 'enrollments'), newEnrollmentForFirestore);
      const newEnrollmentForState: EnrollmentData = {
        ...formData,
        id: docRef.id,
        submissionDate: submissionDate.toISOString(),
        ccdDocumentContent: ccdDocumentContent || undefined,
        validationResult: validationResult,
        status: "Pending",
        activityLog: [initialLogEntry],
      };
      setEnrollments(prevEnrollments => [newEnrollmentForState, ...prevEnrollments].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()));
      toast({
        title: "Enrollment Submitted (Context)",
        description: `Practice "${formData.practiceInfo.name}" enrollment has been submitted.`,
        className: "bg-green-500 text-white",
      });
      return true;
    } catch (error) {
      console.error("Error adding enrollment to Firestore (AppContext): ", error);
      toast({ title: 'Database Error (Context)', description: 'Could not submit enrollment data. Please check console.', variant: 'destructive' });
      return false;
    }
    */
    // For now, return a promise that resolves to false as the primary submission path is via server action.
    toast({ title: 'Notice', description: 'Enrollment submission is now handled by a server action. This context function is not writing to DB.', variant: 'default' });
    return Promise.resolve(false);
  };

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

      if (comments) {
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
            messages: [...existingMessages, `PHA Comments: ${comments}`]
        };
         if (status !== "Changes Requested" && updateData.validationResult) {
            updateData.validationResult.isValid = true; 
        } else if (status === "Changes Requested" && updateData.validationResult) {
            updateData.validationResult.isValid = false;
        }
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

  const updateEnrollmentData = async (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>>) => {
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

  return (
    <AppContext.Provider
      value={{
        enrollments,
        customFieldDefinitions,
        isLoading, 
        addEnrollment,
        updateEnrollmentStatus,
        updateEnrollmentData,
        addActivityLogEntry,
        addCustomField,
        removeCustomField,
        fetchInitialData, // Expose fetchInitialData
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
