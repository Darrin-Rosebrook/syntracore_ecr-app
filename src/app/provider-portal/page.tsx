
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCircle, LayoutDashboard, LogOut, Workflow } from 'lucide-react';
import Link from 'next/link';
import type { EnrollmentData } from '@/types';
import { HcoOnboardingWorkflowSteps } from '@/components/hco-onboarding-workflow-steps';

export default function ProviderPortalPage() {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const { enrollments, isLoading: appContextLoading } = useAppContext();
  const router = useRouter();
  const [hcoEnrollment, setHcoEnrollment] = useState<EnrollmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser && currentUser.email && enrollments.length > 0) {
      // Attempt to find enrollment associated with the logged-in user's email
      // This is a simplified approach for the prototype
      const foundEnrollment = enrollments.find(
        (e) => e.contactDetails.email.toLowerCase() === currentUser.email!.toLowerCase() ||
               e.additionalContacts?.some(c => c.email.toLowerCase() === currentUser.email!.toLowerCase())
      );
      
      if (foundEnrollment) {
        setHcoEnrollment(foundEnrollment);
      } else {
        // Fallback or no specific enrollment found message
        // For demo, could use first enrollment, or show a message
        // setHcoEnrollment(enrollments[0]); // Example: fallback to first for demo
        console.warn("No specific enrollment found for user:", currentUser.email);
      }
    }
    if (!authLoading && !appContextLoading) {
        setIsLoading(false);
    }

  }, [currentUser, enrollments, authLoading, appContextLoading]);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  if (isLoading || authLoading || appContextLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Provider Portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    // Should be redirected by useEffect, but as a fallback
    return null; 
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
          HCO Provider Portal
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {hcoEnrollment ? (
        <>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{hcoEnrollment.practiceInfo.name}</CardTitle>
              <CardDescription>
                Welcome, {hcoEnrollment.contactDetails.name}. Here's an overview of your organization's eCR onboarding status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Organization NPI:</strong> {hcoEnrollment.practiceInfo.organizationNPI}</p>
              <p><strong>Primary Contact Email:</strong> {hcoEnrollment.contactDetails.email}</p>
              <p><strong>EHR/LIMS Vendor:</strong> {hcoEnrollment.ehrVendor}</p>
              <p><strong>Current Status:</strong> <span className={`font-semibold ${
                hcoEnrollment.status === 'Approved' ? 'text-green-600' :
                hcoEnrollment.status === 'Pending' ? 'text-yellow-600' :
                hcoEnrollment.status === 'Changes Requested' ? 'text-orange-600' :
                hcoEnrollment.status === 'Denied' ? 'text-red-600' : ''
              }`}>{hcoEnrollment.status}</span></p>
            </CardContent>
          </Card>

          <HcoOnboardingWorkflowSteps enrollment={hcoEnrollment} />
        </>
      ) : (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">No Enrollment Data Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We could not find an active enrollment associated with your account ({currentUser.email}).
              If you have recently submitted an enrollment, please allow some time for processing.
              If you believe this is an error, please contact support.
            </p>
            <Button asChild className="mt-4">
              <Link href="/hco-registration">Start New HCO Registration</Link>
            </Button>
          </CardContent>
        </Card>
      )}
       <div className="text-center mt-4">
        <Button variant="link" asChild>
          <Link href="/"> Back to SyntraCore Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
