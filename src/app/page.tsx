
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/dashboard-tab";
import { HcoRegistrationSplashPage } from "@/components/hco-registration-splash-page";
// PHA Reviewer Dashboard is not shown to default users or guests in this reverted state
// import { PHAReviewerDashboard } from "@/components/pha-reviewer-dashboard";
// EHRVendorsTab and HealthSystemsTab are PHA-specific, so not shown by default here
// import { EhrVendorsTab } from "@/components/ehr-vendors-tab";
// import { HealthSystemsTab } from "@/components/health-systems-tab";
import { LayoutDashboard, FilePenLine, Building, Loader2, ArrowRight } from "lucide-react"; // Adjusted icons
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const {
    enrollments,
    customFieldDefinitions,
    // updateEnrollmentStatus, // Not used directly by non-PHA view
    isLoading
  } = useAppContext();
  const { currentUser } = useAuth();

  // Determine tab layout and visible tabs based on user type
  let tabListCols = "sm:grid-cols-1"; // Default
  const tabsToRender: { value: string; label: string; icon: React.ElementType; content: React.ReactNode; condition?: boolean }[] = [];

  if (!currentUser) { // Guest user
    tabListCols = "sm:grid-cols-3";
    tabsToRender.push(
      { value: "dashboard", label: "Project Dashboard", icon: LayoutDashboard, content: <DashboardTab />, condition: true },
      { value: "hco-registration", label: "HCO Registration", icon: FilePenLine, content: <HcoRegistrationSplashPage />, condition: true },
      { value: "vendor-registration", label: "EHR/LIMS Vendor Registration", icon: Building, content: (
        <Card className="w-full max-w-2xl mx-auto shadow-xl text-center">
          <CardHeader><CardTitle className="text-3xl font-bold flex items-center justify-center"><Building className="mr-3 h-8 w-8 text-primary" />EHR/LIMS Vendor Registration</CardTitle><CardDescription className="text-lg text-foreground/80 mt-2">For Electronic Health Record (EHR) or Laboratory Information Management System (LIMS) vendors.</CardDescription></CardHeader>
          <CardContent className="space-y-6"><p className="text-md leading-relaxed">If you represent an EHR or LIMS vendor, create an account to access the Vendor Portal. The portal will allow you to view the onboarding status of your client Health Care Organizations and access tools to assist them through the eCR onboarding process.</p><Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"><Link href="/vendor-registration">Proceed to Vendor Registration <ArrowRight className="ml-2 h-5 w-5" /></Link></Button></CardContent>
        </Card>
      ), condition: true }
    );
  } else { // Any logged-in user (generic view before role-specific tailoring)
    tabListCols = "sm:grid-cols-1";
    tabsToRender.push(
      { value: "dashboard", label: "Project Dashboard", icon: LayoutDashboard, content: <DashboardTab />, condition: true }
    );
  }
  
  const visibleTabs = tabsToRender.filter(tab => tab.condition !== false);

  const getDefaultTab = React.useCallback(() => {
    if (!currentUser) return "hco-registration"; // Default for guests
    return "dashboard"; // Default for other logged-in users
  }, [currentUser]);
  
  const [activeTab, setActiveTab] = React.useState(getDefaultTab());

  React.useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [getDefaultTab]);


  if (isLoading && !enrollments.length && !customFieldDefinitions.length) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading SyntraCore...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-1 ${tabListCols} h-auto sm:h-12 mb-6 shadow-md`}>
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                  <tab.icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {visibleTabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by SyntraHub. &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
