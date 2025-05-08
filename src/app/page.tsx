
"use client";

import React from "react";
import { MainHeader } from "@/components/main-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/dashboard-tab";
import { ProviderEnrollmentTab } from "@/components/provider-enrollment-tab";
import { PHAReviewerDashboard } from "@/components/pha-reviewer-dashboard";
import { AdminConsoleTab } from "@/components/admin-console-tab";
import { LayoutDashboard, UserPlus, ShieldCheck, Settings } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export default function HomePage() {
  const { 
    enrollments, 
    customFieldDefinitions, 
    addEnrollment, 
    updateEnrollmentStatus, 
    addCustomField, 
    removeCustomField 
  } = useAppContext();
  
  const [activeTab, setActiveTab] = React.useState("dashboard");

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <MainHeader />
      <main className="flex-1">
        <div className="container mx-auto py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto sm:h-12 mb-6 shadow-md">
              <TabsTrigger value="dashboard" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Project Dashboard
              </TabsTrigger>
              <TabsTrigger value="provider-enrollment" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <UserPlus className="mr-2 h-5 w-5" />
                Provider Enrollment
              </TabsTrigger>
              <TabsTrigger value="pha-reviewer" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <ShieldCheck className="mr-2 h-5 w-5" />
                PHA Reviewer
              </TabsTrigger>
              <TabsTrigger value="admin-console" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <Settings className="mr-2 h-5 w-5" />
                Admin Console
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
              <DashboardTab />
            </TabsContent>
            <TabsContent value="provider-enrollment" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
              <ProviderEnrollmentTab addEnrollment={addEnrollment} customFieldDefinitions={customFieldDefinitions} />
            </TabsContent>
            <TabsContent value="pha-reviewer" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
              <PHAReviewerDashboard enrollments={enrollments} updateEnrollmentStatus={updateEnrollmentStatus} />
            </TabsContent>
            <TabsContent value="admin-console" className="transition-opacity duration-300 data-[state=active]:animate-fadeIn">
              <AdminConsoleTab
                customFieldDefinitions={customFieldDefinitions}
                onAddCustomField={addCustomField}
                onRemoveCustomField={removeCustomField}
              />
            </TabsContent>
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