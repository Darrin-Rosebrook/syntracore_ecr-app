
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LayoutDashboard, LogOut, Loader2, Building, Users, ExternalLink, Workflow, List, Lock } from 'lucide-react';
import Link from 'next/link';
import type { VendorProfileData, EnrollmentData } from '@/types';
import { getVendorProfileAction, updateVendorLastLoginAction } from '@/actions/vendor-actions';
import { HcoOnboardingWorkflowSteps } from '@/components/hco-onboarding-workflow-steps';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ECR_ONBOARDING_STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Helper function to determine current phase name
const getCurrentPhaseName = (enrollmentStatus: EnrollmentData['status']): string => {
  switch (enrollmentStatus) {
    case 'Pending':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 3)?.name || 'PHA Review';
    case 'Changes Requested':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 3)?.name || 'PHA Review';
    case 'Approved':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 4)?.name || 'eCR Readiness Validation';
    case 'Denied':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 3)?.name || 'PHA Review';
    default:
      const initialStage = ECR_ONBOARDING_STAGES.find(s => s.id === 1);
      return initialStage?.name || 'Initial Stage';
  }
};

export default function VendorPortalPage() {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const { enrollments, isLoading: appContextLoading } = useAppContext();
  const router = useRouter();

  const [vendorProfile, setVendorProfile] = useState<VendorProfileData | null>(null);
  const [linkedHcos, setLinkedHcos] = useState<EnrollmentData[]>([]);
  const [selectedHco, setSelectedHco] = useState<EnrollmentData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    async function fetchProfileAndHcos() {
      if (currentUser && currentUser.uid) {
        setIsLoadingProfile(true);
        await updateVendorLastLoginAction(currentUser.uid);
        const profileResult = await getVendorProfileAction(currentUser.uid);
        if (profileResult.success && profileResult.data) {
          setVendorProfile(profileResult.data);
          if (profileResult.data.representedEhrSystemValue && enrollments.length > 0) {
            const filteredHcos = enrollments.filter(
              (e) => e.ehrVendor === profileResult.data!.representedEhrSystemValue
            );
            setLinkedHcos(filteredHcos);
            if (filteredHcos.length > 0 && !selectedHco) {
              setSelectedHco(filteredHcos[0]);
            }
          }
        } else {
          console.error("Failed to fetch vendor profile:", profileResult.error);
        }
        setIsLoadingProfile(false);
      } else if (!authLoading) {
        setIsLoadingProfile(false);
      }
    }
    if (!authLoading && currentUser) {
        fetchProfileAndHcos();
    }
  }, [currentUser, authLoading, enrollments, selectedHco]); // Added selectedHco to dependencies to avoid re-selecting

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  if (authLoading || isLoadingProfile || (appContextLoading && !vendorProfile)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Vendor Portal...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  // DEBUG: Log linkedHcos before rendering the list
  console.log("[VendorPortalPage] Rendering HCO list. Linked HCOs count:", linkedHcos.length, "Data:", linkedHcos);

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

      {vendorProfile ? (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Welcome, {vendorProfile.contactName} from {vendorProfile.vendorName}!</CardTitle>
            <CardDescription>
              You are representing: {vendorProfile.representedEhrSystemValue}. Below are the HCOs using your system.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-3">
              <h3 className="text-xl font-semibold flex items-center mb-2">
                <List className="mr-2 h-5 w-5 text-primary" />
                Client HCOs ({linkedHcos.length})
              </h3>
              {linkedHcos.length > 0 ? (
                <ScrollArea className="h-[450px] border rounded-md p-2 bg-muted/20"> {/* Slightly increased height for debugging */}
                  <ul className="space-y-2">
                    {linkedHcos.map((hco) => (
                      <li key={hco.id}>
                        <Button
                          variant={selectedHco?.id === hco.id ? "default" : "outline"}
                          className="w-full justify-start text-left h-auto py-2 px-3 leading-snug flex flex-col items-start"
                          onClick={() => setSelectedHco(hco)}
                        >
                          <span className="font-semibold block w-full whitespace-normal break-words">{hco.practiceInfo.name}</span>
                          <span className={cn("text-xs", selectedHco?.id === hco.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            NPI: {hco.practiceInfo.organizationNPI || 'N/A'}
                          </span>
                          <span className={cn("text-xs", selectedHco?.id === hco.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            Status: {hco.status}
                          </span>
                           <span className={cn("text-xs", selectedHco?.id === hco.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            Phase: {getCurrentPhaseName(hco.status)}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                 <Alert>
                    <Users className="h-4 w-4" />
                    <AlertTitle>No Linked HCOs Found</AlertTitle>
                    <AlertDescription>
                    Currently, there are no HCOs registered with your EHR/LIMS: {vendorProfile.representedEhrSystemValue}.
                    </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="md:col-span-2">
              {selectedHco ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Workflow className="mr-2 h-5 w-5 text-primary" />
                      Onboarding Workflow: {selectedHco.practiceInfo.name}
                    </h3>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/provider-profile/${selectedHco.id}`} target="_blank">
                        View Full HCO Profile <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <HcoOnboardingWorkflowSteps enrollment={selectedHco} isVendorView={true} />
                </div>
              ) : linkedHcos.length > 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-10 border-2 border-dashed border-muted rounded-lg bg-muted/30">
                  <List className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">Select an HCO</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose an HCO from the list on the left to view their onboarding workflow.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-10 border-2 border-dashed border-muted rounded-lg bg-muted/30">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">No Client HCOs</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no Health Care Organizations currently linked to your vendor profile.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
         <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>Vendor Profile Not Fully Loaded</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                Your vendor profile information could not be fully loaded. This might be due to a setup issue.
                If you have just registered, please try logging out and logging back in.
                If the problem persists, please contact support.
                </p>
                 <Button onClick={handleLogout} variant="link" className="mt-2">Logout and try again</Button>
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
