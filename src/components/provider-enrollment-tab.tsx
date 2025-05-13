"use client";

import * as React from 'react';
import { ProviderEnrollmentForm } from "@/components/provider-enrollment-form";
import type { CustomFieldDefinition } from "@/types";
import { ScrollArea } from '@/components/ui/scroll-area';
// addEnrollmentToFirestore is no longer called directly from here.

interface ProviderEnrollmentTabProps {
  customFieldDefinitions: CustomFieldDefinition[];
}

export function ProviderEnrollmentTab({ customFieldDefinitions }: ProviderEnrollmentTabProps) {

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]"> 
      <div className="p-4 md:p-6">
        <ProviderEnrollmentForm 
          customFieldDefinitions={customFieldDefinitions}
        />
      </div>
    </ScrollArea>
  );
}
