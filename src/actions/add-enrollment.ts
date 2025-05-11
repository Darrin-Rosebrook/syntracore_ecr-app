'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { EnrollmentFormData, FHIRValidationResult, ActivityLogEntry } from "@/types";

export async function addEnrollmentToFirestore(
  formData: EnrollmentFormData,
  ccdDocumentContent: string | null,
  validationResult: FHIRValidationResult
): Promise<{ success: boolean; id?: string; error?: string }> {
  let dataToSubmit: any = null;
  try {
    const submissionDate = new Date();
    const initialLogEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: 'Enrollment application submitted.',
      type: 'System',
    };

    dataToSubmit = {
      practiceInfo: formData.practiceInfo,
      contactDetails: formData.contactDetails,
      ehrVendor: formData.ehrVendor,
      consent: formData.consent,
      submissionDate: Timestamp.fromDate(submissionDate),
      validationResult: validationResult, 
      status: "Pending" as const,
      activityLog: [{ ...initialLogEntry, timestamp: Timestamp.fromDate(new Date(initialLogEntry.timestamp)) }],
      additionalData: formData.additionalData || {},
    };

    if (formData.ccdDocumentName !== undefined) {
      dataToSubmit.ccdDocumentName = formData.ccdDocumentName;
    }
    
    if (ccdDocumentContent !== null) {
      dataToSubmit.ccdDocumentContent = ccdDocumentContent;
    }

    // console.log("Data being sent to Firestore (Server Action):", JSON.stringify(dataToSubmit, null, 2));

    const docRef = await addDoc(collection(db, "enrollments"), dataToSubmit);
    console.log("Firestore document written with ID (Server Action): ", docRef.id);
    return { success: true, id: docRef.id };

  } catch (error) {
    console.error("--- START: Firestore write failed in addEnrollmentToFirestore (Server Action) ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Form Data (partial, for context):", { practiceName: formData?.practiceInfo?.name, contactName: formData?.contactDetails?.name });
    
    let errorMessage = "Failed to submit enrollment due to an unexpected server error.";

    if (error instanceof Error) {
      console.error("Error Type: Standard Error");
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      if (error.stack) {
        console.error("Stack Trace:", error.stack);
      }
      errorMessage = `Failed to submit enrollment: ${error.message}`;
      
      // Attempt to get Firebase error code if present
      const firebaseError = error as any; // Cast to any to check for code
      if (firebaseError.code) {
        console.error("Firebase Error Code:", firebaseError.code);
        errorMessage += ` (Code: ${firebaseError.code})`;
      }
    } else if (typeof error === 'string') {
      console.error("Error Type: String");
      console.error("Error String:", error);
      errorMessage = `Failed to submit enrollment: ${error}`;
    } else if (error && typeof error === 'object') {
      console.error("Error Type: Object");
      console.error("Error Object (raw):", JSON.stringify(error, null, 2)); // Log the raw object structure
      // Try to access common error properties
      const errorObj = error as { name?: string; message?: string; code?: string };
      if(errorObj.message) {
        errorMessage = `Failed to submit enrollment: ${errorObj.message}`;
        if(errorObj.code) errorMessage += ` (Code: ${errorObj.code})`;
        else if(errorObj.name) errorMessage += ` (Name: ${errorObj.name})`;
      } else {
         errorMessage = `Failed to submit enrollment: An non-standard error object was received. Check server logs.`;
      }
    } else {
      console.error("Error Type: Unknown");
      console.error("Raw error value:", error);
    }
    
    console.error("Data that was attempted to be written (if available):", JSON.stringify(dataToSubmit, null, 2));
    console.error("--- END: Firestore write failed in addEnrollmentToFirestore (Server Action) ---");
    
    return { success: false, error: errorMessage };
  }
}
