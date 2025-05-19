
"use client";

import React, { useEffect } from 'react'; // Added useEffect
import { ProviderEnrollmentForm } from "@/components/provider-enrollment-form";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext"; // Added useAuth
import { useRouter } from 'next/navigation'; // Added useRouter
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCircle } from 'lucide-react';


export default function HcoRegistrationPage() {
  const { customFieldDefinitions, isLoading: isContextLoading } = useAppContext();
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      // If auth is not loading and there's no current user,
      // redirect to signup page with type=hco, as they need an account first.
      router.push('/signup?type=hco');
    }
  }, [currentUser, authLoading, router]);

  if (isContextLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading registration form...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the useEffect redirect,
    // but it's a fallback or if the redirect hasn't happened yet.
    return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center">
            <Alert variant="destructive" className="max-w-md text-center">
                <UserCircle className="h-5 w-5 mx-auto mb-2" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                You must be logged in to access this page. Please proceed to account creation.
                </AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
                <Link href="/signup?type=hco">Create Account for HCO Registration</Link>
            </Button>
        </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
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
