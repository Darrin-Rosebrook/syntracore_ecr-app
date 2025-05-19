
// src/lib/firestore-add-enrollment.ts
'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { EnrollmentFormData, FHIRValidationResult, ActivityLogEntry } from "@/types";

export async function addEnrollmentToFirestore(
  formData: EnrollmentFormData,
  ccdDocumentContent: string | null,
  validationResult: FHIRValidationResult,
  userId: string, // Added userId
  userEmail: string // Added userEmail
): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log("addEnrollmentToFirestore server action called by user:", userId);
  
  try {
    const submissionDate = new Date();
    const logEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: `HCO & Lab Registration submitted by ${userEmail}.`,
      type: "System",
      user: userId, // Log which user submitted
    };

    const dataToSave = {
      userId: userId, // Store the UID of the user submitting
      userEmail: userEmail, // Store the email of the user submitting
      practiceInfo: {
        organizationNPI: formData.practiceInfo.organizationNPI || '',
        name: formData.practiceInfo.name,
        address: formData.practiceInfo.address,
        phone: formData.practiceInfo.phone,
        healthSystem: formData.practiceInfo.healthSystem || undefined,
        isLabOrPerformsLabServices: formData.practiceInfo.isLabOrPerformsLabServices || 'no',
        cliaNumber: formData.practiceInfo.cliaNumber || undefined,
        cliaLabName: formData.practiceInfo.cliaLabName || undefined,
        cliaLabType: formData.practiceInfo.cliaLabType || undefined,
      },
      contactDetails: formData.contactDetails,
      ehrVendor: formData.ehrVendor,
      consent: formData.consent,
      submissionDate: Timestamp.fromDate(submissionDate),
      validationResult,
      status: "Pending" as const, 
      activityLog: [{ ...logEntry, timestamp: Timestamp.fromDate(new Date(logEntry.timestamp)) }],
      additionalData: formData.additionalData || {},
      ccdDocumentName: formData.ccdDocumentName,
      ccdDocumentContent: ccdDocumentContent, 
      additionalContacts: formData.additionalContacts || [], 
    };

    console.log("Data prepared for Firestore:", JSON.stringify(dataToSave, (key, value) => {
      if (key === 'ccdDocumentContent' && typeof value === 'string' && value.length > 100) {
        return `${value.substring(0,100)}... (truncated for log)`;
      }
      return value;
    }, 2));

    const docRef = await addDoc(collection(db, "enrollments"), dataToSave);
    console.log("✅ Document successfully written to Firestore with ID: ", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("❌ Firestore enrollment write failed in addEnrollmentToFirestore:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    console.error("Error stack:", error.stack);
    return { success: false, error: `Failed to save enrollment to Firestore: ${error.message || "Unknown Firestore error."}` };
  }
}
