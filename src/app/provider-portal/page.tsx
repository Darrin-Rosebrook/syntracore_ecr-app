
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCircle, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import type { EnrollmentData } from '@/types';
import { HcoOnboardingWorkflowSteps } from '@/components/hco-onboarding-workflow-steps';

export default function ProviderPortalPage() {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const { enrollments, isLoading: appContextLoading, fetchInitialData } = useAppContext();
  const router = useRouter();
  const [hcoEnrollment, setHcoEnrollment] = useState<EnrollmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      console.log("[ProviderPortalPage] No current user, redirecting to login.");
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    console.log("[ProviderPortalPage] useEffect for finding enrollment triggered.");
    console.log("[ProviderPortalPage] currentUser:", currentUser ? currentUser.uid : "null");
    console.log("[ProviderPortalPage] enrollments count:", enrollments.length);
    console.log("[ProviderPortalPage] appContextLoading:", appContextLoading);
    console.log("[ProviderPortalPage] authLoading:", authLoading);

    if (currentUser && currentUser.uid && enrollments.length > 0 && !appContextLoading) {
      console.log("[ProviderPortalPage] Attempting to find enrollment for UID:", currentUser.uid);
      const foundEnrollment = enrollments.find(
        (e) => e.userId === currentUser.uid // Primary check using UID
      );
      
      if (foundEnrollment) {
        console.log("[ProviderPortalPage] Enrollment found by UID:", foundEnrollment.id, foundEnrollment.practiceInfo.name);
        setHcoEnrollment(foundEnrollment);
      } else {
        // Fallback to email check if UID match fails (e.g., for older records or if UID wasn't always set)
        console.warn("[ProviderPortalPage] No enrollment found by UID for:", currentUser.uid, "Trying email match for:", currentUser.email);
        const foundByEmail = enrollments.find(
          (e) => {
            const primaryMatch = e.contactDetails.email.toLowerCase() === currentUser.email!.toLowerCase();
            const additionalMatch = e.additionalContacts?.some(c => c.email.toLowerCase() === currentUser.email!.toLowerCase());
            const submitterEmailMatch = e.userEmail?.toLowerCase() === currentUser.email!.toLowerCase();
            return primaryMatch || additionalMatch || submitterEmailMatch;
          }
        );
        if (foundByEmail) {
           console.log("[ProviderPortalPage] Enrollment found by Email:", foundByEmail.id, foundByEmail.practiceInfo.name);
           setHcoEnrollment(foundByEmail);
        } else {
            console.warn("[ProviderPortalPage] No specific enrollment found for user UID:", currentUser.uid, "or email:", currentUser.email, "in current enrollments list.");
            setHcoEnrollment(null);
        }
      }
    } else if (currentUser && (currentUser.uid || currentUser.email) && enrollments.length === 0 && !appContextLoading) {
        console.warn("[ProviderPortalPage] No enrollments in context to check against for user:", currentUser.uid, currentUser.email);
        setHcoEnrollment(null);
    }

    if (!authLoading && !appContextLoading) {
        console.log("[ProviderPortalPage] Setting isLoading to false.");
        setIsLoading(false);
    } else {
        console.log("[ProviderPortalPage] Setting isLoading to true because authLoading or appContextLoading is true.");
        setIsLoading(true);
    }

  }, [currentUser, enrollments, authLoading, appContextLoading]);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Provider Portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
          HCO Provider Portal
        </h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
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
              <p><strong>Organization NPI:</strong> {hcoEnrollment.practiceInfo.organizationNPI || 'N/A'}</p>
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
