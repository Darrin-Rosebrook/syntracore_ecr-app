
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
  isLoading: boolean; // For loading state from Firestore
}

interface AppContextActions {
  addEnrollment: (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => Promise<void>;
  updateEnrollmentStatus: (id: string, status: EnrollmentData['status'], comments?: string) => Promise<void>;
  updateEnrollmentData: (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>>) => Promise<void>;
  addActivityLogEntry: (enrollmentId: string, entryText: string, type: ActivityLogEntry['type'], user?: string) => Promise<void>;
  addCustomField: (fieldDefinition: CustomFieldDefinition) => Promise<void>;
  removeCustomField: (fieldId: string) => Promise<void>;
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
          // Convert Firestore Timestamps to ISO strings if necessary (especially for submissionDate)
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
      timestamp: new Date().toISOString(), // Will be converted to Firestore Timestamp on save
      entry: entryText,
      type,
      user: user || 'System',
    };
    const enrollmentDocRef = doc(db, 'enrollments', enrollmentId);
    try {
      // Firestore Timestamps should be used for date fields
      const logEntryForFirestore = { ...newLogEntry, timestamp: Timestamp.fromDate(new Date(newLogEntry.timestamp)) };
      await updateDoc(enrollmentDocRef, {
        activityLog: arrayUnion(logEntryForFirestore)
      });
      // Update local state for immediate UI feedback
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

  const addEnrollment = async (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => {
    setIsLoading(true);
    const submissionDate = new Date();
    const initialLogEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: 'Enrollment application submitted.',
      type: 'System',
    };

    const newEnrollmentForFirestore = {
      ...formData,
      submissionDate: Timestamp.fromDate(submissionDate), // Use Firestore Timestamp
      ccdDocumentContent: ccdDocumentContent || null, // Firestore prefers null over undefined for missing fields
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
        title: "Enrollment Submitted",
        description: `Practice "${formData.practiceInfo.name}" enrollment has been successfully submitted.`,
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error adding enrollment to Firestore: ", error);
      toast({ title: 'Error', description: 'Could not submit enrollment.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateEnrollmentStatus = async (id: string, status: EnrollmentData['status'], comments?: string) => {
    setIsLoading(true);
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
        
        // Safely add comments to validationResult messages
        const currentEnrollmentDoc = await getDoc(enrollmentDocRef);
        const currentEnrollmentData = currentEnrollmentDoc.data() as EnrollmentData | undefined;
        const existingMessages = currentEnrollmentData?.validationResult?.messages || [];
        updateData.validationResult = {
            ...(currentEnrollmentData?.validationResult || { isValid: status !== "Changes Requested" }), // assume valid if not 'Changes Requested'
            messages: [...existingMessages, `PHA Comments: ${comments}`]
        };
         if (status !== "Changes Requested" && updateData.validationResult) {
            updateData.validationResult.isValid = true; // Reset to valid if approved, for example
        } else if (status === "Changes Requested" && updateData.validationResult) {
            updateData.validationResult.isValid = false;
        }

      }
      
      const firestoreLogEntries = activityLogsToAdd.map(log => ({...log, timestamp: Timestamp.fromDate(new Date(log.timestamp))}));
      updateData.activityLog = arrayUnion(...firestoreLogEntries);

      await updateDoc(enrollmentDocRef, updateData);

      setEnrollments(prevEnrollments =>
        prevEnrollments.map(e =>
          e.id === id
            ? { 
                ...e, 
                status, 
                validationResult: updateData.validationResult ? {
                    ...updateData.validationResult,
                     summary: e.validationResult?.summary // Preserve existing summary
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
    } finally {
      setIsLoading(false);
    }
  };

  const updateEnrollmentData = async (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>>) => {
    setIsLoading(true);
    const enrollmentDocRef = doc(db, 'enrollments', enrollmentId);
    try {
      await updateDoc(enrollmentDocRef, updatedFields);
      // Add activity log for this update
      await addActivityLogEntry(enrollmentId, 'Provider details updated by PHA Admin.', 'UserAction', 'PHA Admin');
      
      // Local state update (including the new log entry from addActivityLogEntry)
      setEnrollments(prevEnrollments =>
        prevEnrollments.map(e =>
          e.id === enrollmentId
            ? { ...e, ...updatedFields } // The activity log is handled by addActivityLogEntry's local update
            : e
        )
      );
      toast({ title: 'Success', description: 'Provider details updated.' });
    } catch (error) {
      console.error("Error updating enrollment data in Firestore: ", error);
      toast({ title: 'Error', description: 'Could not update provider details.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomField = async (fieldDefinition: CustomFieldDefinition) => {
    setIsLoading(true);
    // Check for duplicate ID client-side (Firestore rules should also enforce uniqueness if id is doc id)
    if (customFieldDefinitions.some(f => f.id === fieldDefinition.id)) {
      toast({ title: 'Error', description: 'Field ID already exists.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    const fieldDocRef = doc(db, 'customFieldDefinitions', fieldDefinition.id);
    try {
      await setDoc(fieldDocRef, fieldDefinition); // Using setDoc with explicit ID
      setCustomFieldDefinitions(prevFields => [...prevFields, fieldDefinition].sort((a, b) => a.order - b.order));
      toast({ title: 'Success', description: `Custom field "${fieldDefinition.label}" added.` });
    } catch (error) {
      console.error("Error adding custom field to Firestore: ", error);
      toast({ title: 'Error', description: 'Could not add custom field.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const removeCustomField = async (fieldId: string) => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
