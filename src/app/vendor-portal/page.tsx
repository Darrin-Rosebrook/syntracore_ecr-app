
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, LogOut, Loader2, Building } from 'lucide-react';
import Link from 'next/link';

export default function VendorPortalPage() {
  const { currentUser, loading, logOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login'); 
    }
    // Future: Add logic here to verify if currentUser is actually a vendor, if roles are implemented
    // For example, by checking a 'role' claim or a Firestore document.
  }, [currentUser, loading, router]);

  const handleLogout = async () => {
    await logOut();
    router.push('/'); // Redirect to home page after logout
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Vendor Portal...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Building className="mr-3 h-8 w-8 text-primary" />
          EHR/LIMS Vendor Portal
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Welcome, {currentUser.email}!</CardTitle>
          <CardDescription>This is your dashboard to manage your HCO clients and access vendor tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Future features will include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Viewing a list of Health Care Organizations (HCOs) using your EHR/LIMS.</li>
            <li>Tracking the onboarding status of your client HCOs.</li>
            <li>Accessing vendor-specific documentation and tools.</li>
            <li>Managing your vendor profile and company information.</li>
          </ul>
           <div className="mt-6 p-10 border-2 border-dashed border-muted rounded-lg text-center bg-muted/30">
            <LayoutDashboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Portal Under Construction</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The Vendor Portal is currently under development. More features and functionality will be available soon. Thank you for your patience.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="text-center mt-4">
        <Button variant="link" asChild>
          <Link href="/"> Back to SyntraCore Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
