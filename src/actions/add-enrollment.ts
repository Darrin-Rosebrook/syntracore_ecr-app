
'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { EnrollmentFormData, FHIRValidationResult, ActivityLogEntry } from "@/types";

export async function addEnrollmentToFirestore(
  formData: EnrollmentFormData,
  ccdDocumentContent: string | null,
  validationResult: FHIRValidationResult
): Promise<{ success: boolean; id?: string; error?: string }> {
  const submissionDate = new Date();
  const initialLogEntry: ActivityLogEntry = {
    timestamp: submissionDate.toISOString(),
    entry: 'Enrollment application submitted.',
    type: 'System',
  };

  const newEnrollmentForFirestore = {
    ...formData,
    submissionDate: Timestamp.fromDate(submissionDate),
    ccdDocumentContent: ccdDocumentContent || undefined, // Match EnrollmentData type
    validationResult: validationResult,
    status: "Pending" as const, // Ensure status is correctly typed
    activityLog: [{ ...initialLogEntry, timestamp: Timestamp.fromDate(new Date(initialLogEntry.timestamp)) }],
  };

  try {
    const docRef = await addDoc(collection(db, "enrollments"), newEnrollmentForFirestore);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Firestore write failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while writing to Firestore.";
    return { success: false, error: errorMessage };
  }
}
