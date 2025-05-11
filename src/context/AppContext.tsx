
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

  const addEnrollment = async (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult): Promise<boolean> => {
    console.log("AppContext: addEnrollment called with formData:", formData); 

    const submissionDate = new Date();
    const initialLogEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: 'Enrollment application submitted.',
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
      console.log("AppContext: Attempting to add document to Firestore:", newEnrollmentForFirestore); 
      const docRef = await addDoc(collection(db, 'enrollments'), newEnrollmentForFirestore);
      console.log("AppContext: Document added to Firestore with ID:", docRef.id); 

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
      console.log("AppContext: addEnrollment returning true (success)"); 
      return true; 
    } catch (error) {
      console.error("Error adding enrollment to Firestore: ", error); 
      toast({ title: 'Database Error', description: 'Could not submit enrollment data to the database. Please check console for details.', variant: 'destructive' });
      console.log("AppContext: addEnrollment returning false (failure)"); 
      return false; 
    } finally {
      console.log("AppContext: addEnrollment finally block."); 
    }
  };

  const updateEnrollmentStatus = async (id: string, status: EnrollmentData['status'], comments?: string) => {
    // setIsLoading(true); // Removed to let local component handle its loading state
    const enrollmentDocRef = doc(db, 'enrollments', id);
    try {
      const updateData: Partial<EnrollmentData> & { activityLog?: any } = { status }; // Explicitly type activityLog as any for arrayUnion
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
      
      // Ensure updateData.activityLog is correctly typed for arrayUnion
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
      // setIsLoading(false); // Removed
    }
  };

  const updateEnrollmentData = async (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>>) => {
    // setIsLoading(true); // Removed
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
    } finally {
      // setIsLoading(false); // Removed
    }
  };

  const addCustomField = async (fieldDefinition: CustomFieldDefinition) => {
    // setIsLoading(true); // Removed
    if (customFieldDefinitions.some(f => f.id === fieldDefinition.id)) {
      toast({ title: 'Error', description: 'Field ID already exists.', variant: 'destructive' });
      // setIsLoading(false); // Removed
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
    } finally {
      // setIsLoading(false); // Removed
    }
  };

  const removeCustomField = async (fieldId: string) => {
    // setIsLoading(true); // Removed
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
      // setIsLoading(false); // Removed
    }
  };

  return (
    <AppContext.Provider
      value={{
        enrollments,
        customFieldDefinitions,
        isLoading, // This is for initial data loading
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

