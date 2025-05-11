// src/app/api/enroll/route.ts
import { NextResponse } from "next/server";
import { addEnrollmentToFirestore } from "@/lib/firestore-add-enrollment";
import { NextResponse } from "next/server";
import { addEnrollmentToFirestore } from "@/lib/firestore-add-enrollment";



export async function POST(req: Request) {
  try {
    const { formData, ccdDocumentContent, validationResult } = await req.json();
    const result = await addEnrollmentToFirestore(formData, ccdDocumentContent, validationResult);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API error in /api/enroll:", error);
    return NextResponse.json({ success: false, error: "API error" }, { status: 500 });
  }
  export async function POST(req: Request) {
    try {
      const body = await req.json();
}
