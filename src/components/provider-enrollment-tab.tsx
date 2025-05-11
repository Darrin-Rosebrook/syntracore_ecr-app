
"use client";

import * as React from 'react';
import { ProviderEnrollmentForm } from "@/components/provider-enrollment-form";
import type { EnrollmentFormData, FHIRValidationResult, CustomFieldDefinition } from "@/types";
import { ScrollArea } from '@/components/ui/scroll-area';
import { addEnrollmentToFirestore } from '@/actions/add-enrollment'; // Import the server action

interface ProviderEnrollmentTabProps {
  // addEnrollment prop is no longer needed from AppContext for this component
  customFieldDefinitions: CustomFieldDefinition[];
}

export function ProviderEnrollmentTab({ customFieldDefinitions }: ProviderEnrollmentTabProps) {

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]"> 
      <div className="p-4 md:p-6">
        <ProviderEnrollmentForm 
          onSubmitEnrollment={addEnrollmentToFirestore} // Pass the server action directly
          customFieldDefinitions={customFieldDefinitions}
        />
      </div>
    </ScrollArea>
  );
}
