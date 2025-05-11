"use client";

import * as React from 'react';
import { ProviderEnrollmentForm } from "@/components/provider-enrollment-form";
import type { EnrollmentFormData, FHIRValidationResult, CustomFieldDefinition } from "@/types";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProviderEnrollmentTabProps {
  addEnrollment: (formData: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => Promise<boolean>; // Updated return type
  customFieldDefinitions: CustomFieldDefinition[];
}

export function ProviderEnrollmentTab({ addEnrollment, customFieldDefinitions }: ProviderEnrollmentTabProps) {

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]"> 
      <div className="p-4 md:p-6">
        <ProviderEnrollmentForm 
          onSubmitEnrollment={addEnrollment} 
          customFieldDefinitions={customFieldDefinitions}
        />
      </div>
    </ScrollArea>
  );
}
