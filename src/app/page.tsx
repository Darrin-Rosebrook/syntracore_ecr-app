
"use client";

import React from "react";
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/dashboard-tab";
import { PHAReviewerDashboard } from "@/components/pha-reviewer-dashboard";
import { EhrVendorsTab } from "@/components/ehr-vendors-tab";
import { HealthSystemsTab } from "@/components/health-systems-tab";
import { LayoutDashboard, FilePenLine, Building, Loader2, ArrowRight, ClipboardList, Network, ListTree, BarChart3, Share2, UserPlus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from "@/components/login-form"; // Import the new LoginForm

export default function HomePage() {
  const {
    enrollments,
    customFieldDefinitions,
    updateEnrollmentStatus,
    isLoading
  } = useAppContext();
  const { currentUser, isPhaUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = React.useState(""); // Will be set in useEffect

  // Determine default tab and tabs to render based on user state
  React.useEffect(() => {
    if (authLoading) return; // Wait for auth state to be determined

    let newDefaultTabValue = "";
    if (isPhaUser) {
      newDefaultTabValue = "pha-reviewer";
    } else if (currentUser) { // Any other logged-in user (Vendor, HCO)
      newDefaultTabValue = "dashboard";
    }
    // For guest users, there are no tabs, so activeTab remains empty or isn't used for tabs.
    setActiveTab(newDefaultTabValue);

  }, [isPhaUser, currentUser, authLoading]);


  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading SyntraCore...</p>
      </div>
    );
  }

  // Guest View: Registration Options on Left, Login Form on Right
  if (!currentUser) {
    return (
      <main className="flex-1">
        <div className="container mx-auto py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column: Registration Options */}
            <div className="space-y-6">
              <div className="text-center lg:text-left mb-8">
                <Image
                  src="/images/OnboardeCR.png"
                  alt="Onboard eCR Logo"
                  width={250}
                  height={84}
                  priority
                  className="mx-auto lg:mx-0"
                  data-ai-hint="logo health"
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

            {/* Right Column: Login Form */}
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

  // Logged-in User View (PHA, Vendor, HCO)
  let tabListCols = "sm:grid-cols-1";
  const tabsToRender: { value: string; label: string; icon: React.ElementType; content: React.ReactNode; condition?: boolean }[] = [];

  if (isPhaUser) {
    tabListCols = "sm:grid-cols-3"; // PHA Reviewer, Health Systems, EHR/LIMS Vendors
    tabsToRender.push(
      { value: "pha-reviewer", label: "PHA Reviewer", icon: ClipboardList, content: <PHAReviewerDashboard enrollments={enrollments} updateEnrollmentStatus={updateEnrollmentStatus} isLoadingContext={isLoading} />, condition: true },
      { value: "health-systems", label: "Health Systems", icon: Network, content: <HealthSystemsTab />, condition: true },
      { value: "ehr-vendors", label: "EHR/LIMS Vendors", icon: ListTree, content: <EhrVendorsTab enrollments={enrollments} />, condition: true },
      { value: "reports", label: "Reports", icon: BarChart3, content: (
          <Card className="w-full shadow-xl text-center">
            <CardHeader><CardTitle className="text-3xl font-bold flex items-center justify-center"><BarChart3 className="mr-3 h-8 w-8 text-primary" />Reports Dashboard</CardTitle><CardDescription className="text-lg text-foreground/80 mt-2">Access and generate various reports related to HCO onboarding and system data.</CardDescription></CardHeader>
            <CardContent className="space-y-6"><p className="text-md leading-relaxed">This section is under development. Future enhancements will include customizable reports, data visualizations, and export functionalities to provide insights into the eCR onboarding process and related metrics.</p></CardContent>
          </Card>
        ), condition: true
      }
    );
  } else if (currentUser) { // Any other logged-in user (e.g., Vendor, HCO navigating back to main page)
    tabListCols = "sm:grid-cols-1";
    tabsToRender.push(
      { value: "dashboard", label: "Project Dashboard", icon: LayoutDashboard, content: <DashboardTab />, condition: true }
    );
  }

  const visibleTabs = tabsToRender.filter(tab => tab.condition !== false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto py-6">
          {activeTab && visibleTabs.length > 0 ? (
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
          ) : currentUser && visibleTabs.length === 0 ? ( // Logged in but no specific role tabs yet
             <Card className="w-full shadow-xl text-center">
                <CardHeader><CardTitle className="text-3xl font-bold flex items-center justify-center">Welcome</CardTitle></CardHeader>
                <CardContent><p className="text-md leading-relaxed">Your portal will be available after completing your profile or if you are an administrator.</p></CardContent>
            </Card>
          ) : null}
        </div>
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by SyntraCore. &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
