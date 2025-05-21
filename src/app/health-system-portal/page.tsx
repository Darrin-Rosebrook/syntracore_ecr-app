
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Hospital, FilePenLine, UploadCloud, Info, LogOut, Building } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCircle } from 'lucide-react';


export default function HealthSystemPortalPage() {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login'); // Or to the signup page if preferred
    }
  }, [currentUser, authLoading, router]);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Health System Portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This state should ideally be caught by the useEffect redirect
    return (
         <div className="container mx-auto py-8 flex flex-col items-center justify-center">
            <Alert variant="destructive" className="max-w-md text-center">
                <UserCircle className="h-5 w-5 mx-auto mb-2" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                You must be logged in to access this portal.
                </AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
                <Link href="/login">Login</Link>
            </Button>
        </div>
    );
  }

  // Placeholder for fetching Health System name - in a real app, fetch from DB
  const healthSystemName = currentUser.displayName || "Your Health System";

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Hospital className="mr-3 h-8 w-8 text-primary" />
          Health System Portal: {healthSystemName}
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilePenLine className="mr-2 h-6 w-6 text-accent" />
              Register Individual HCO/Lab
            </CardTitle>
            <CardDescription>
              Register a new Health Care Organization or Laboratory that is part of your Health System.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to open the HCO & Lab Registration form. The submitted HCO will be associated with your Health System.
            </p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/hco-registration">
                <Building className="mr-2 h-4 w-4" />
                Go to HCO & Lab Registration Form
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-6 w-6 text-accent" />
              Bulk Upload HCOs/Labs
            </CardTitle>
            <CardDescription>
              Upload a CSV file to register multiple HCOs or Labs at once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-muted rounded-lg bg-muted/30">
              <Info className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-md font-semibold text-muted-foreground">Bulk Upload Coming Soon</h3>
              <p className="text-xs text-muted-foreground">
                This feature is under development. It will allow you to upload a CSV file with details for multiple HCOs/Labs.
              </p>
            </div>
            <Button className="w-full mt-4" disabled>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload CSV (Disabled)
            </Button>
          </CardContent>
        </Card>
      </div>
       <div className="text-center mt-6">
            <Button variant="link" asChild>
                <Link href="/">Back to SyntraCore Homepage</Link>
            </Button>
        </div>
    </div>
  );
}
