"use client";

import * as React from 'react';
import { ProviderEnrollmentForm } from "@/components/provider-enrollment-form";
import type { EnrollmentFormData, FHIRValidationResult, CustomFieldDefinition } from "@/types";
// Removed useToast as it's handled by AppContext's addEnrollment now
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProviderEnrollmentTabProps {
  addEnrollment: (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => void;
  customFieldDefinitions: CustomFieldDefinition[];
}

export function ProviderEnrollmentTab({ addEnrollment, customFieldDefinitions }: ProviderEnrollmentTabProps) {
  // Toast logic moved to AppContext.addEnrollment

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]"> {/* Adjust height as needed */}
      <div className="p-4 md:p-6">
        <ProviderEnrollmentForm 
          onSubmitEnrollment={addEnrollment} // Directly pass the context's addEnrollment function
          customFieldDefinitions={customFieldDefinitions}
        />
      </div>
    </ScrollArea>
  );
}