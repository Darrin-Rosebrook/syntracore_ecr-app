'use client';

import React, { useEffect } from 'react'; // Added useEffect
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, FilePenLine, Building, Share2, ArrowRight } from 'lucide-react'; // Or your preferred loader
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { LoginForm } from "@/components/login-form"; 


export default function HomePage() {
  const { currentUser, userType, loading: authLoading } = useAuth(); // Removed isPhaUser as userType is primary
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      console.log('HomePage Effect: Auth loading, waiting...');
      return; // Wait until auth state is resolved
    }

    if (currentUser && userType) {
      console.log(`HomePage Effect: User logged in. Type: ${userType}. Attempting redirect.`);
      // Using a micro-task to ensure router is stable after state updates
      Promise.resolve().then(() => {
        switch (userType) {
          case 'PHA':
            router.push('/admin');
            break;
          case 'HCO':
            // For now, direct to portal. Profile completion check is an enhancement.
            router.push('/provider-portal');
            break;
          case 'EHR_VENDOR':
            router.push('/vendor-portal');
            break;
          case 'HEALTH_SYSTEM':
            router.push('/health-system-portal');
            break;
          default:
            console.warn(`HomePage Effect: Unknown userType ('${userType}') for logged-in user. Staying on home.`);
            // Stay on home page or redirect to a generic logged-in dashboard
            // If staying, ensure the loading screen below doesn't persist indefinitely
            break;
        }
      });
    } else if (!currentUser && !authLoading) {
      console.log('HomePage Effect: User is logged out.');
      // User is logged out, public content will be shown (handled by the return statement below)
    } else if (currentUser && !userType && !authLoading) {
        console.warn('HomePage Effect: User logged in but userType is null. Staying on home page for now.');
        // This case might indicate profile data is still loading or an issue with profile creation.
        // The loading screen below will be active if (currentUser && !userType) is part of its condition.
        // Let's adjust the loading screen condition.
    }
  }, [currentUser, userType, authLoading, router]);

  // Show loader if auth is loading OR if user is logged in but userType is not yet determined (implying redirect might happen)
  // OR if user is logged in AND userType is known (implying redirect is actively being processed)
  if (authLoading || (currentUser && !userType) || (currentUser && userType) ) {
    // The third condition (currentUser && userType) ensures loader stays until redirect happens.
    // However, if a default case in switch leads to no redirect, this could be an infinite loader.
    // Let's refine: show loader if authLoading, or if user is logged in and we are expecting a redirect based on userType.
    // If userType is unknown and we decide to keep them on HomePage, this loader must not persist.
    // For now, the provided logic is: if (loading || (currentUser && userType))
    // The original example was: if (loading || (currentUser && userType)) - this is safer.
    // If userType is one that doesn't redirect, they won't see this loader.
    // Let's stick to the initial simpler logic from example:
     if (authLoading || (currentUser && userType && ['PHA', 'HCO', 'EHR_VENDOR', 'HEALTH_SYSTEM'].includes(userType))) {
        return (
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading your experience...</p>
          </div>
        );
    }
  }


  // Default content for logged-out users, or users whose type doesn't trigger a redirect.
  // This will be shown if:
  // 1. !currentUser && !authLoading (logged out)
  // 2. currentUser && !userType && !authLoading (logged in, but type is null - e.g. error state or profile incomplete)
  // 3. currentUser && userType (but userType is not one of the redirecting types)
  return (
    <main className="flex-1">
      <div className="container mx-auto py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          <div className="space-y-6">
            <div className="text-center lg:text-left mb-8">
              <Image
                src="/images/SyntraCore_Logo.png"
                alt="SyntraCore Logo"
                width={250} 
                height={84} 
                priority
                className="mx-auto lg:mx-0"
              />
              <h1 className="text-3xl font-bold tracking-tight text-primary mt-4">Welcome to Onboard eCR</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Streamlining Electronic Case Reporting for Public Health.
              </p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center"><UserPlus className="mr-2 h-6 w-6 text-accent" />New User? Register Here</CardTitle>
                <CardDescription>Select your organization type to begin the registration process.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-start">
                   <Link href="/signup?type=hco">
                    <FilePenLine className="mr-3 h-5 w-5" /> HCO & Lab Registration <ArrowRight className="ml-auto h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-start">
                  <Link href="/signup?type=vendor">
                    <Building className="mr-3 h-5 w-5" /> EHR/LIMS Vendor Registration <ArrowRight className="ml-auto h-5 w-5" />
                  </Link>
                </Button>
                 <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-start">
                   <Link href="/signup?type=healthsystem">
                     <Share2 className="mr-3 h-5 w-5" /> Health System Registration <ArrowRight className="ml-auto h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
             <p className="text-sm text-muted-foreground text-center lg:text-left">
              Electronic Case Reporting (eCR) is the automated, real-time exchange of case report information between electronic health records (EHRs) and public health agencies.
            </p>
          </div>
          
          <div>
            <LoginForm />
          </div>
        </div>
      </div>
      <footer className="py-6 md:px-8 md:py-0 border-t mt-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by SyntraCore. &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
