'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { EnrollmentFormData, FHIRValidationResult, ActivityLogEntry } from "@/types";

export async function addEnrollmentToFirestore(
  formData: EnrollmentFormData,
  ccdDocumentContent: string | null,
  validationResult: FHIRValidationResult
): Promise<{ success: boolean; id?: string; error?: string }> {
  let dataToLogForDebug: any = null;
  try {
    const submissionDate = new Date();
    const initialLogEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: 'Enrollment application submitted.',
      type: 'System',
    };

    // Explicitly construct the object to be sent to Firestore
    const dataForFirestore: any = {
      practiceInfo: formData.practiceInfo,
      contactDetails: formData.contactDetails,
      ehrVendor: formData.ehrVendor,
      consent: formData.consent,
      submissionDate: Timestamp.fromDate(submissionDate),
      validationResult: validationResult, // Ensure validationResult is a plain, serializable object
      status: "Pending" as const,
      activityLog: [{ ...initialLogEntry, timestamp: Timestamp.fromDate(new Date(initialLogEntry.timestamp)) }],
    };

    // Handle optional fields explicitly
    if (formData.ccdDocumentName !== undefined) {
      dataForFirestore.ccdDocumentName = formData.ccdDocumentName;
    }
    // Ensure additionalData is an object, even if formData.additionalData is undefined
    dataForFirestore.additionalData = formData.additionalData || {}; 
    
    if (ccdDocumentContent !== null) {
      dataForFirestore.ccdDocumentContent = ccdDocumentContent;
    }
    // If ccdDocumentContent is null, the ccdDocumentContent field will not be added to dataForFirestore,
    // which means Firestore will omit it. This is generally fine.

    dataToLogForDebug = dataForFirestore; // For debugging in catch block

    // console.log("Data being sent to Firestore (Server Action):", JSON.stringify(dataForFirestore, null, 2));

    const docRef = await addDoc(collection(db, "enrollments"), dataForFirestore);
    console.log("Firestore document written with ID (Server Action): ", docRef.id);
    return { success: true, id: docRef.id };

  } catch (error) {
    console.error("Firestore write failed in addEnrollmentToFirestore (Server Action). Error:", error);
    // For more detailed debugging, you can log the data that was attempted to be written:
    // console.error("Data that was attempted to be written (Server Action):", JSON.stringify(dataToLogForDebug, null, 2));
    
    let errorMessage = "An unknown error occurred while writing to Firestore.";
    if (error instanceof Error) {
      errorMessage = `Error (${error.name}): ${error.message}`;
      // Attempt to get more specific Firebase error codes if available
      const firebaseError = error as any; // Type assertion to check for 'code'
      if (firebaseError.code) {
        errorMessage += ` (Code: ${firebaseError.code})`;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      // Handle cases where the error might be an object with a message property
      const errorObj = error as { name?: string; message: string; code?: string };
      errorMessage = `Error (${errorObj.name || errorObj.code || 'UnknownError'}): ${errorObj.message}`;
    }

    return { success: false, error: errorMessage };
  }
}
