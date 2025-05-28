
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, FilePenLine, Building, Share2, ArrowRight, TvMinimalPlay, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { LoginForm } from "@/components/login-form";
import { PHAReviewerDashboard } from '@/components/pha-reviewer-dashboard';
import { WorkflowDemoTab } from '@/components/workflow-demo-tab';
import { DashboardTab } from '@/components/dashboard-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from '@/context/AppContext';
import { EhrVendorsTab } from '@/components/ehr-vendors-tab';
import { HealthSystemsTab } from '@/components/health-systems-tab';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function HomePage() {
  const { currentUser, isPhaUser, userType, loading: authLoading } = useAuth();
  const router = useRouter();
  const { enrollments, updateEnrollmentStatus, isLoading: isContextLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>("hco-registration"); // Default for guests

  const phaTabs = [
    { value: "pha-reviewer", label: "PHA Reviewer", icon: FilePenLine },
    { value: "health-systems", label: "Health Systems", icon: Share2 },
    { value: "ehr-vendors", label: "EHR/LIMS Vendors", icon: Building },
    { value: "reports", label: "Reports", icon: TvMinimalPlay, disabled: true },
  ];

  const guestTabs = [
    { value: "hco-registration", label: "HCO & Lab Registration", icon: FilePenLine },
    { value: "vendor-registration", label: "EHR/LIMS Vendor Registration", icon: Building },
    { value: "health-system-registration", label: "Health System Registration", icon: Share2 },
  ];
  
  const loggedInUserTabs = [
    { value: "dashboard", label: "Project Dashboard", icon: FilePenLine },
    // Future: Add specific portal dashboard trigger if user is HCO/Vendor/HealthSystem but not PHA
  ];

  const tabsToRender = React.useMemo(() => {
    if (isPhaUser) return phaTabs;
    if (!currentUser) return guestTabs; // Guest user
    return loggedInUserTabs; // Default for other logged-in users (e.g. HCO, Vendor after login but before portal redirect)
  }, [isPhaUser, currentUser]);

  useEffect(() => {
    if (authLoading || isContextLoading) return;

    let defaultTabValue = "hco-registration"; // Default for guests
    if (isPhaUser) {
      defaultTabValue = "pha-reviewer";
    } else if (currentUser) {
      // This case is mainly for when a non-PHA user logs in and lands on '/'
      // before being redirected to their specific portal.
      // The actual portal redirection is handled in login-form.tsx or login/page.tsx
      defaultTabValue = "dashboard";
    }
    // Only set activeTab if it's different or if it's one of the current tabsToRender
    if (activeTab !== defaultTabValue && tabsToRender.some(t => t.value === defaultTabValue)) {
        setActiveTab(defaultTabValue);
    } else if (!tabsToRender.some(t => t.value === activeTab)) {
        // If current activeTab is not in the new list of tabs, set to default
        setActiveTab(defaultTabValue);
    }
  }, [isPhaUser, currentUser, authLoading, isContextLoading, tabsToRender, activeTab]);


  if (authLoading || (currentUser && !userType && !isPhaUser)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  // Main content for non-PHA logged-in users (like HCOs/Vendors immediately after login, before portal redirect) or guests
  if (!isPhaUser) {
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
                  data-ai-hint="company logo"
                />
                <h1 className="text-3xl font-bold tracking-tight text-primary mt-4">Welcome to Onboard eCR</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Streamlining Electronic Case Reporting for Public Health.
                </p>
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center"><UserPlus className="mr-2 h-6 w-6 text-accent" />New User? Register Here</CardTitle>
                  <CardDescription>Select your organization type to begin the account creation process.</CardDescription>
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
              {!currentUser && (
                <Card className="shadow-lg mt-4">
                  <CardHeader>
                      <CardTitle className="flex items-center"><Settings className="mr-2 h-6 w-6 text-accent" />Admin Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Button asChild size="lg" variant="outline" className="w-full justify-start">
                          <Link href="/admin">
                              <Settings className="mr-3 h-5 w-5" /> Admin Console
                          </Link>
                      </Button>
                  </CardContent>
                </Card>
              )}
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

  // PHA User View (Tabs for PHA-specific functionalities)
  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full h-auto mb-6 shadow-md sm:grid-cols-${tabsToRender.length}`}>
          {tabsToRender.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg text-xs sm:text-sm">
              <tab.icon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="pha-reviewer">
          <PHAReviewerDashboard enrollments={enrollments} updateEnrollmentStatus={updateEnrollmentStatus} isLoadingContext={isContextLoading} />
        </TabsContent>
        <TabsContent value="ehr-vendors">
           <EhrVendorsTab />
        </TabsContent>
        <TabsContent value="health-systems">
            <HealthSystemsTab />
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader><CardTitle>Reports Dashboard</CardTitle></CardHeader>
            <CardContent><p>Reporting features are under development.</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
