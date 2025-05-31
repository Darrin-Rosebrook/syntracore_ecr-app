
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Loader2, Hospital, FilePenLine, UploadCloud, Info, LogOut, Building, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCircle } from 'lucide-react';
import { Enrollment } from '@/types';


export default function HealthSystemPortalPage() {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const { healthSystems, enrollments, loading: contextLoading } = useAppContext();
  const router = useRouter();
  const [userHealthSystemId, setUserHealthSystemId] = useState<string | null>(null);
  const [filteredHcos, setFilteredHcos] = useState<Enrollment[]>([]);
  const [hcosLoading, setHcosLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser && healthSystems.length > 0) {
      const foundHealthSystem = healthSystems.find(hs => hs.registeredByUserId === currentUser.uid);
      if (foundHealthSystem) {
        setUserHealthSystemId(foundHealthSystem.id);
      } else {
        setUserHealthSystemId(null); // Explicitly set to null if not found
        setHcosLoading(false); // No need to load HCOs if no health system
      }
    } else if (!contextLoading) {
      // If context is not loading and healthSystems is empty or no currentUser
      setHcosLoading(false);
    }
  }, [currentUser, healthSystems, contextLoading]);

  useEffect(() => {
    if (userHealthSystemId && enrollments.length > 0) {
      setHcosLoading(true);
      const hcos = enrollments.filter(e => e.practiceInformation?.healthSystem === userHealthSystemId);
      setFilteredHcos(hcos);
      setHcosLoading(false);
    } else if (userHealthSystemId === null && !contextLoading) {
      // If userHealthSystemId is explicitly null (found no matching HS)
      setFilteredHcos([]);
      setHcosLoading(false);
    } else if (enrollments.length === 0 && !contextLoading) {
		setFilteredHcos([]);
		setHcosLoading(false);
	}
  }, [userHealthSystemId, enrollments, contextLoading]);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  if (authLoading || contextLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Health System Portal data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
         <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
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
          Health System Portal: {currentUser.displayName || "Your Health System"}
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* HCOs Table Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-3 h-6 w-6 text-primary" />
            Registered Health Care Organizations (HCOs)
          </CardTitle>
          <CardDescription>
            HCOs and Labs registered under your Health System.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hcosLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading your HCOs...</p>
            </div>
          ) : !userHealthSystemId ? (
             <Alert variant="default" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Health System Not Identified</AlertTitle>
              <AlertDescription>
                We could not identify a Health System associated with your user account. Please contact support if you believe this is an error.
                You can still register new HCOs, and they will be pending association.
              </AlertDescription>
            </Alert>
          ) : filteredHcos.length === 0 ? (
            <Alert variant="default" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No HCOs Found</AlertTitle>
              <AlertDescription>
                No HCOs or Labs are currently registered under your Health System. Use the options below to register new ones.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HCO Name</TableHead>
                  <TableHead>NPI</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHcos.map((hco) => (
                  <TableRow key={hco.id}>
                    <TableCell>{hco.organizationInformation?.name || 'N/A'}</TableCell>
                    <TableCell>{hco.organizationInformation?.npi || 'N/A'}</TableCell>
                    <TableCell>{hco.practiceInformation?.address?.city || 'N/A'}</TableCell>
                    <TableCell>{hco.practiceInformation?.address?.state || 'N/A'}</TableCell>
                    <TableCell>{hco.status || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilePenLine className="mr-2 h-6 w-6 text-primary" />
              Register Individual HCO/Lab
            </CardTitle>
            <CardDescription>
              Register a new Health Care Organization or Laboratory. It will be associated with your Health System if identified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to open the HCO & Lab Registration form.
            </p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/hco-registration">
                <FilePenLine className="mr-2 h-4 w-4" />
                Go to HCO & Lab Registration Form
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-6 w-6 text-primary" />
              Bulk Upload HCOs/Labs
            </CardTitle>
            <CardDescription>
              Upload a CSV file to register multiple HCOs or Labs at once. This will associate them with your Health System if identified.
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
       <div className="text-center mt-8 mb-4">
            <Button variant="link" asChild>
                <Link href="/">Back to SyntraCore Homepage</Link>
            </Button>
        </div>
    </div>
  );
}
