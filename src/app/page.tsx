
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/dashboard-tab";
import { ProviderEnrollmentTab } from "@/components/provider-enrollment-tab";
import { PHAReviewerDashboard } from "@/components/pha-reviewer-dashboard";
// import { AdminConsoleTab } from "@/components/admin-console-tab"; // AdminConsoleTab removed
import { EhrVendorsTab } from "@/components/ehr-vendors-tab";
import { HealthSystemsTab } from "@/components/health-systems-tab"; 
import { LayoutDashboard, UserPlus, ShieldCheck, Loader2, ListTree, Network } from "lucide-react"; // Settings icon removed as tab is removed
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext"; 

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

  // Determine number of columns for TabsList based on currentUser
  const tabListCols = currentUser ? "sm:grid-cols-5" : "sm:grid-cols-2"; // Adjusted from 6 to 5

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
              <TabsTrigger value="provider-enrollment" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <UserPlus className="mr-2 h-5 w-5" />
                Provider Enrollment
              </TabsTrigger>
              {/* Conditionally render PHA user tabs */}
              {currentUser && (
                <>
                  <TabsTrigger value="pha-reviewer" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    PHA Reviewer
                  </TabsTrigger>
                  {/* Admin Console Tab Trigger Removed
                  <TabsTrigger value="admin-console" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <Settings className="mr-2 h-5 w-5" />
                    Admin Console
                  </TabsTrigger>
                  */}
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
            <TabsContent value="provider-enrollment" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
              <ProviderEnrollmentTab customFieldDefinitions={customFieldDefinitions} />
            </TabsContent>
            {/* Conditionally render PHA user tab contents */}
            {currentUser && (
              <>
                <TabsContent value="pha-reviewer" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
                  <PHAReviewerDashboard enrollments={enrollments} updateEnrollmentStatus={updateEnrollmentStatus} isLoadingContext={isLoading} />
                </TabsContent>
                {/* Admin Console Tab Content Removed
                <TabsContent value="admin-console" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
                  <AdminConsoleTab />
                </TabsContent>
                */}
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

