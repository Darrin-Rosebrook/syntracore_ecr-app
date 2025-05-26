
// src/lib/firestore-add-enrollment.ts
'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, doc, updateDoc } from "firebase/firestore";
import type { EnrollmentFormData, ActivityLogEntry } from "@/types"; // Removed FHIRValidationResult

export async function addEnrollmentToFirestore(
  formData: EnrollmentFormData,
  userId: string,
  userEmail: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log("[firestore-add-enrollment] addEnrollmentToFirestore server action called by user:", userId, "with email:", userEmail);
  console.log("[firestore-add-enrollment] Received formData:", JSON.stringify(formData, null, 2));

  try {
    const submissionDate = new Date();
    const logEntry: ActivityLogEntry = {
      timestamp: submissionDate.toISOString(),
      entry: `HCO & Lab Registration submitted by ${userEmail}.`,
      type: "System",
      user: userId,
    };

    const dataToSave = {
      userId: userId,
      userEmail: userEmail,
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
        organizationType: formData.practiceInfo.organizationType || undefined,
      },
      contactDetails: formData.contactDetails,
      ehrVendor: formData.ehrVendor,
      consent: formData.consent,
      submissionDate: Timestamp.fromDate(submissionDate),
      // validationResult removed
      status: "Pending" as const,
      activityLog: [{ ...logEntry, timestamp: Timestamp.fromDate(new Date(logEntry.timestamp)) }],
      additionalData: formData.additionalData || {},
      // ccdDocumentName removed
      // ccdDocumentContent removed
      additionalContacts: formData.additionalContacts || [],
      messages: [],
    };

    console.log("[firestore-add-enrollment] Data prepared for Firestore (no CCD/FHIR validation):", JSON.stringify(dataToSave, null, 2));

    const docRef = await addDoc(collection(db, "enrollments"), dataToSave);
    console.log("[firestore-add-enrollment] ✅ Document successfully written to Firestore with ID: ", docRef.id);

    try {
      const userProfileRef = doc(db, 'userProfiles', userId);
      await updateDoc(userProfileRef, {
        isHcoProfileComplete: true,
        hcoEnrollmentId: docRef.id,
        updatedAt: Timestamp.now()
      });
      console.log(`[firestore-add-enrollment] UserProfile ${userId} marked with isHcoProfileComplete: true and hcoEnrollmentId.`);
    } catch (profileUpdateError) {
      console.error(`[firestore-add-enrollment] ⚠️ Failed to update UserProfile for ${userId} with HCORegComplete flag:`, profileUpdateError);
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("❌ [firestore-add-enrollment] Firestore enrollment write failed:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    console.error("Error stack:", error.stack);
    return { success: false, error: `Failed to save enrollment to Firestore: ${error.message || "Unknown Firestore error."}` };
  }
}
