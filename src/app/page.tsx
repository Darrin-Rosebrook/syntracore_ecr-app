
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/dashboard-tab";
import { HcoRegistrationSplashPage } from "@/components/hco-registration-splash-page";
import { PHAReviewerDashboard } from "@/components/pha-reviewer-dashboard";
import { EhrVendorsTab } from "@/components/ehr-vendors-tab";
import { HealthSystemsTab } from "@/components/health-systems-tab"; 
import { LayoutDashboard, UserPlus, ShieldCheck, Loader2, ListTree, Network, FilePenLine, Building, ArrowRight } from "lucide-react"; // Added Building, ArrowRight
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext"; 
import Link from 'next/link'; // Added Link
import { Button } from '@/components/ui/button'; // Added Button
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card components

export default function HomePage() {
  const { 
    enrollments, 
    customFieldDefinitions,
    updateEnrollmentStatus, 
    isLoading 
  } = useAppContext();
  const { currentUser } = useAuth(); 
  
  const [activeTab, setActiveTab] = React.useState("dashboard"); 

  if (isLoading && !enrollments.length && !customFieldDefinitions.length) { 
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading SyntraHub...</p>
      </div>
    );
  }

  const tabListCols = currentUser ? "sm:grid-cols-5" : "sm:grid-cols-3"; // Updated for non-logged-in users

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-1 ${tabListCols} h-auto sm:h-12 mb-6 shadow-md`}>
              <TabsTrigger value="dashboard" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Project Dashboard
              </TabsTrigger>
              <TabsTrigger value="hco-registration" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <FilePenLine className="mr-2 h-5 w-5" /> 
                HCO Registration
              </TabsTrigger>
              {!currentUser && (
                <TabsTrigger value="vendor-registration" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                  <Building className="mr-2 h-5 w-5" />
                  EHR/LIMS Vendor Registration
                </TabsTrigger>
              )}
              {currentUser && (
                <>
                  <TabsTrigger value="pha-reviewer" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    PHA Reviewer
                  </TabsTrigger>
                  <TabsTrigger value="ehr-vendors" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <ListTree className="mr-2 h-5 w-5" />
                    EHR/LIMS Vendors
                  </TabsTrigger>
                  <TabsTrigger value="health-systems" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <Network className="mr-2 h-5 w-5" />
                    Health Systems (Parent)
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            <TabsContent value="dashboard" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
              <DashboardTab />
            </TabsContent>
            <TabsContent value="hco-registration" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
              <HcoRegistrationSplashPage /> 
            </TabsContent>
            {!currentUser && (
              <TabsContent value="vendor-registration" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
                <Card className="w-full max-w-2xl mx-auto shadow-xl text-center">
                  <CardHeader>
                    <CardTitle className="text-3xl font-bold flex items-center justify-center">
                      <Building className="mr-3 h-8 w-8 text-primary" />
                      EHR/LIMS Vendor Registration
                    </CardTitle>
                    <CardDescription className="text-lg text-foreground/80 mt-2">
                      For Electronic Health Record (EHR) or Laboratory Information Management System (LIMS) vendors.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-md leading-relaxed">
                      If you represent an EHR or LIMS vendor, create an account to access the Vendor Portal.
                      The portal will allow you to view the onboarding status of your client Health Care Organizations
                      and access tools to assist them through the eCR onboarding process.
                    </p>
                    <Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link href="/vendor-registration">
                        Proceed to Vendor Registration <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {currentUser && (
              <>
                <TabsContent value="pha-reviewer" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
                  <PHAReviewerDashboard enrollments={enrollments} updateEnrollmentStatus={updateEnrollmentStatus} isLoadingContext={isLoading} />
                </TabsContent>
                <TabsContent value="ehr-vendors" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
                  <EhrVendorsTab enrollments={enrollments} />
                </TabsContent>
                <TabsContent value="health-systems" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
                  <HealthSystemsTab />
                </TabsContent>
              </>
            )}
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

