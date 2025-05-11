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
    ccdDocumentContent: ccdDocumentContent || undefined, 
    validationResult: validationResult,
    status: "Pending" as const, 
    activityLog: [{ ...initialLogEntry, timestamp: Timestamp.fromDate(new Date(initialLogEntry.timestamp)) }],
  };

  try {
    const docRef = await addDoc(collection(db, "enrollments"), newEnrollmentForFirestore);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Firestore write failed:", error);
    
    let errorMessage = "An unknown error occurred while writing to Firestore.";
    if (error instanceof Error) {
      errorMessage = `Error (${error.name}): ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      // Attempt to get more info from non-Error objects
      const errorObj = error as { name?: string; message: string; code?: string };
      errorMessage = `Error (${errorObj.name || errorObj.code || 'UnknownError'}): ${errorObj.message}`;
    }
    // For more detailed debugging on the server, you might log the full error object or stack
    // console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

    return { success: false, error: errorMessage };
  }
}
