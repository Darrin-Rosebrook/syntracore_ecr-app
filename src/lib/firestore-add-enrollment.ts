// src/lib/firestore-add-enrollment.ts
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { EnrollmentFormData, FHIRValidationResult, ActivityLogEntry } from "@/types";

export async function addEnrollmentToFirestore(
  formData: EnrollmentFormData,
  ccdDocumentContent: string | null,
  validationResult: FHIRValidationResult
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const submissionDate = new Date();
    const logEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: "Enrollment application submitted.",
      type: "System",
    };

    const data = {
      practiceInfo: formData.practiceInfo,
      contactDetails: formData.contactDetails,
      ehrVendor: formData.ehrVendor,
      consent: formData.consent,
      submissionDate: Timestamp.fromDate(submissionDate),
      validationResult,
      status: "Pending",
      activityLog: [{ ...logEntry, timestamp: Timestamp.fromDate(new Date(logEntry.timestamp)) }],
      additionalData: formData.additionalData || {},
      ccdDocumentName: formData.ccdDocumentName,
      ccdDocumentContent,
    };

    const docRef = await addDoc(collection(db, "enrollments"), data);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Firestore enrollment write failed:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
