"use client";

import type * as React from 'react';
import { ProviderEnrollmentForm } from "@/components/provider-enrollment-form";
import type { EnrollmentFormData, EnrollmentData, FHIRValidationResult } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProviderEnrollmentTabProps {
  addEnrollment: (enrollment: EnrollmentData) => void;
}

export function ProviderEnrollmentTab({ addEnrollment }: ProviderEnrollmentTabProps) {
  const { toast } = useToast();

  const handleEnrollmentSubmit = (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => {
    const newEnrollment: EnrollmentData = {
      ...formData,
      id: Date.now().toString(), // Simple ID generation
      submissionDate: new Date().toISOString(),
      ccdDocumentContent: ccdDocumentContent || undefined,
      validationResult: validationResult,
      status: "Pending", 
    };
    addEnrollment(newEnrollment);
    toast({
      title: "Enrollment Submitted",
      description: `Practice "${formData.practiceInfo.name}" enrollment has been successfully submitted.`,
      variant: "default",
      className: "bg-green-500 text-white"
    });
  };

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]"> {/* Adjust height as needed */}
      <div className="p-4 md:p-6">
        <ProviderEnrollmentForm onSubmitEnrollment={handleEnrollmentSubmit} />
      </div>
    </ScrollArea>
  );
}
