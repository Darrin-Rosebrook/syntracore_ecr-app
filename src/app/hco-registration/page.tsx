
"use client";

import React from 'react';
import { ProviderEnrollmentForm } from "@/components/provider-enrollment-form";
import { useAppContext } from "@/context/AppContext";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function HcoRegistrationPage() {
  const { customFieldDefinitions, isLoading } = useAppContext();

  if (isLoading && customFieldDefinitions.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading registration form...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]"> {/* Adjust height to account for header */}
      <div className="container mx-auto py-8">
        <div className="mb-6">
            <Button variant="outline" asChild size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
        </div>
        <ProviderEnrollmentForm 
          customFieldDefinitions={customFieldDefinitions}
        />
      </div>
    </ScrollArea>
  );
}

