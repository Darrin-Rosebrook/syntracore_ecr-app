// src/app/api/enroll/route.ts
import { NextResponse } from "next/server";
import { addEnrollmentToFirestore } from "@/lib/firestore-add-enrollment";

export async function POST(req: Request) {
  try {
    // Ensure the request body is properly parsed as JSON
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError: any) {
      console.error("API error in /api/enroll: Failed to parse JSON payload", jsonError);
      return NextResponse.json({ success: false, error: "Invalid JSON payload provided." }, { status: 400 });
    }

    const { formData, ccdDocumentContent, validationResult } = requestBody;

    // Basic validation for required fields in the payload
    if (!formData || !validationResult) {
        console.error("API error in /api/enroll: Missing formData or validationResult in payload");
        return NextResponse.json({ success: false, error: "Missing required data in payload (formData or validationResult)." }, { status: 400 });
    }
    
    const result = await addEnrollmentToFirestore(formData, ccdDocumentContent, validationResult);
    
    // Ensure the result from addEnrollmentToFirestore is also structured correctly for NextResponse.json
    if (result && typeof result.success === 'boolean') {
        return NextResponse.json(result);
    } else {
        console.error("API error in /api/enroll: Unexpected result structure from addEnrollmentToFirestore", result);
        return NextResponse.json({ success: false, error: "Internal server error processing enrollment." }, { status: 500 });
    }

  } catch (error: any) {
    let errorMessage = "An unexpected error occurred in the API.";
    if (error.message) {
        errorMessage = error.message;
    }
    console.error("API error in /api/enroll:", error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
