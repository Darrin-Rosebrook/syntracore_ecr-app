'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { EnrollmentData, CustomFieldDefinition, ActivityLogEntry, EnrollmentFormData, FHIRValidationResult } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AppContextState {
  enrollments: EnrollmentData[];
  customFieldDefinitions: CustomFieldDefinition[];
}

interface AppContextActions {
  addEnrollment: (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => void;
  updateEnrollmentStatus: (id: string, status: EnrollmentData['status'], comments?: string) => void;
  updateEnrollmentData: (enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>>) => void;
  addActivityLogEntry: (enrollmentId: string, entryText: string, type: ActivityLogEntry['type'], user?: string) => void;
  addCustomField: (fieldDefinition: CustomFieldDefinition) => void;
  removeCustomField: (fieldId: string) => void;
}

type AppContextProps = AppContextState & AppContextActions;

const AppContext = createContext<AppContextProps | undefined>(undefined);

const initialEnrollments: EnrollmentData[] = []; // Replace with actual initial data if needed
const initialCustomFields: CustomFieldDefinition[] = []; // Replace with actual initial data if needed

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>(initialEnrollments);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>(initialCustomFields);
  const { toast } = useToast();

  const addActivityLogEntry = useCallback((enrollmentId: string, entryText: string, type: ActivityLogEntry['type'], user?: string) => {
    const newLogEntry: ActivityLogEntry = {
      timestamp: new Date().toISOString(),
      entry: entryText,
      type,
      user: user || 'System',
    };
    setEnrollments(prevEnrollments =>
      prevEnrollments.map(e =>
        e.id === enrollmentId
          ? { ...e, activityLog: [...(e.activityLog || []), newLogEntry] }
          : e
      )
    );
  }, []);

  const addEnrollment = useCallback((formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => {
    const id = Date.now().toString();
    const newEnrollment: EnrollmentData = {
      ...formData,
      id,
      submissionDate: new Date().toISOString(),
      ccdDocumentContent: ccdDocumentContent || undefined,
      validationResult: validationResult,
      status: "Pending",
      activityLog: [
        {
          timestamp: new Date().toISOString(),
          entry: 'Enrollment application submitted.',
          type: 'System',
        },
      ],
    };
    setEnrollments(prevEnrollments => [newEnrollment, ...prevEnrollments]);
    toast({
      title: "Enrollment Submitted",
      description: `Practice "${formData.practiceInfo.name}" enrollment has been successfully submitted.`,
      className: "bg-green-500 text-white",
    });
  }, [toast]);

  const updateEnrollmentStatus = useCallback((id: string, status: EnrollmentData['status'], comments?: string) => {
    setEnrollments(prevEnrollments =>
      prevEnrollments.map(enrollment => {
        if (enrollment.id === id) {
          const updatedEnrollment = {
            ...enrollment,
            status,
          };
          if (comments) {
            const phaCommentEntry: ActivityLogEntry = {
              timestamp: new Date().toISOString(),
              entry: `PHA Reviewer Comment: ${comments}`,
              type: 'PHAComment',
              user: 'PHA Reviewer',
            };
            updatedEnrollment.activityLog = [...(updatedEnrollment.activityLog || []), phaCommentEntry];
             if (updatedEnrollment.validationResult) {
              updatedEnrollment.validationResult.messages = [...(updatedEnrollment.validationResult.messages || []), `PHA Comments: ${comments}`];
            } else {
               updatedEnrollment.validationResult = { isValid: false, messages: [`PHA Comments: ${comments}`]};
            }
          }
          const statusChangeEntry: ActivityLogEntry = {
            timestamp: new Date().toISOString(),
            entry: `Status changed to ${status}.`,
            type: 'UserAction',
            user: 'PHA Reviewer',
          };
          updatedEnrollment.activityLog = [...(updatedEnrollment.activityLog || []), statusChangeEntry];
          return updatedEnrollment;
        }
        return enrollment;
      })
    );
    // Toast is handled by the component calling this for more specific feedback
  }, []);

  const updateEnrollmentData = useCallback((enrollmentId: string, updatedFields: Partial<Omit<EnrollmentData, 'id' | 'activityLog'>>) => {
    setEnrollments(prevEnrollments =>
      prevEnrollments.map(e =>
        e.id === enrollmentId
          ? { ...e, ...updatedFields }
          : e
      )
    );
    addActivityLogEntry(enrollmentId, 'Provider details updated.', 'UserAction');
    toast({ title: 'Success', description: 'Provider details updated.' });
  }, [addActivityLogEntry, toast]);


  const addCustomField = useCallback((fieldDefinition: CustomFieldDefinition) => {
    setCustomFieldDefinitions(prevFields => {
      if (prevFields.some(f => f.id === fieldDefinition.id)) {
        toast({ title: 'Error', description: 'Field ID already exists.', variant: 'destructive' });
        return prevFields;
      }
      toast({ title: 'Success', description: `Custom field "${fieldDefinition.label}" added.` });
      return [...prevFields, fieldDefinition];
    });
  }, [toast]);

  const removeCustomField = useCallback((fieldId: string) => {
    setCustomFieldDefinitions(prevFields => {
      const fieldToRemove = prevFields.find(f => f.id === fieldId);
      if (fieldToRemove) {
        toast({ title: 'Success', description: `Custom field "${fieldToRemove.label}" removed.` });
      }
      return prevFields.filter(field => field.id !== fieldId);
    });
  }, [toast]);


  return (
    <AppContext.Provider
      value={{
        enrollments,
        customFieldDefinitions,
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