
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Share2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCircle } from 'lucide-react';


export default function HealthSystemDetailedRegistrationPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/signup?type=healthsystem');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
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
                <Link href="/signup?type=healthsystem">Create Account for Health System Registration</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
             <Share2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Health System Detailed Registration</CardTitle>
          <CardDescription>
            Provide detailed information about your Health System. Your email: {currentUser.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center p-8">
            This section is under development. <br/>
            Future enhancements will include fields to capture:
          </p>
          <ul className="list-disc list-inside text-muted-foreground p-4 space-y-1 text-sm">
            <li>Official Health System Name</li>
            <li>Headquarters Address & Contact Information</li>
            <li>List of affiliated NPIs or a mechanism to link HCOs</li>
            <li>Primary contact person for the Health System</li>
            <li>Technical POC for interoperability efforts</li>
          </ul>
           <div className="text-center mt-6">
            <Button disabled>Submit Health System Details (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
