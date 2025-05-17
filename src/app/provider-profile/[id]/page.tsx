
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import type { EnrollmentData, CustomFieldDefinition, ActivityLogEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Info, UserCircle, FileTextIcon, Users, Activity, Edit, Save, Building, Settings2, FileText, CalendarDays, User, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Import Tab Components
import { HcoProfileTab } from '@/components/hco-profile-tab';
import { DocumentsTab } from '@/components/documents-tab';
import { ContactsTab } from '@/components/contacts-tab';
import { ScrollArea } from '@/components/ui/scroll-area';
// Removed import for HcoOnboardingWorkflowSteps as it's now in HcoProfileTab

// Define SectionCard here as it was in the original file, now fixed.
// This component might be intended for use within the tabs or was part of a previous design.
// Ensuring it's syntactically correct.
const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, icon: Icon, children, actions }) => (
  <Card className="shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="flex items-center text-xl font-semibold">
        <Icon className="mr-2 h-5 w-5 text-primary" />
        {title}
      </CardTitle>
      {actions && <div className="ml-auto">{actions}</div>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);


export default function ProviderProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { enrollments, customFieldDefinitions, updateEnrollmentData, addActivityLogEntry, isLoading: isContextLoading } = useAppContext();
  const { toast } = useToast();

  const [currentEnrollment, setCurrentEnrollment] = useState<EnrollmentData | null>(null);
  const [isEditingHcoProfile, setIsEditingHcoProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Unified formData state for HcoProfileTab
  const [hcoFormData, setHcoFormData] = useState<Record<string, any>>({
    practiceInfo: {},
    contactDetails: {},
    ehrVendor: '',
    additionalData: {},
  });
  
  const [newActivityLog, setNewActivityLog] = useState('');
  const [newCommunication, setNewCommunication] = useState('');

  const activeEnrollment = useMemo(() => {
    if (typeof id !== 'string') return null;
    return enrollments.find(e => e.id === id);
  }, [id, enrollments]);

  useEffect(() => {
    if (activeEnrollment) {
      setCurrentEnrollment(activeEnrollment);
      setHcoFormData({
        practiceInfo: { ...(activeEnrollment.practiceInfo || {}) },
        contactDetails: { ...(activeEnrollment.contactDetails || {}) },
        ehrVendor: activeEnrollment.ehrVendor || '',
        additionalData: { ...(activeEnrollment.additionalData || {}) },
      });
    } else if (id && !isContextLoading && enrollments.length > 0) {
      setCurrentEnrollment(null); // Explicitly set to null if not found after loading
    }
  }, [id, activeEnrollment, isContextLoading, enrollments.length]);


  const handleSaveHcoProfile = async () => {
    if (!currentEnrollment || typeof id !== 'string' || Object.keys(hcoFormData).length === 0) return;
    
    setIsSaving(true);
    const dataToUpdate: Partial<Omit<EnrollmentData, 'id' | 'activityLog' | 'documents' | 'additionalContacts'>> = {
        practiceInfo: hcoFormData.practiceInfo,
        contactDetails: hcoFormData.contactDetails,
        ehrVendor: hcoFormData.ehrVendor,
        additionalData: hcoFormData.additionalData,
    };

    await updateEnrollmentData(id, dataToUpdate);
    setIsEditingHcoProfile(false); 
    setIsSaving(false);
    // The toast for success/failure is handled in AppContext.updateEnrollmentData
  };

  const handleAddActivity = async () => {
    if (!newActivityLog.trim() || typeof id !== 'string') return;
    setIsSaving(true); 
    await addActivityLogEntry(id, newActivityLog, 'UserAction', 'PHA Admin');
    setNewActivityLog('');
    setIsSaving(false);
  };

  const handleSendCommunication = async () => {
    if (!newCommunication.trim() || typeof id !== 'string' || !currentEnrollment) return;
    setIsSaving(true);
    await addActivityLogEntry(id, `Message to ${currentEnrollment.contactDetails.name}: ${newCommunication}`, 'Communication', 'PHA Admin');
    toast({ title: 'Communication Sent (Mock)', description: `Message to ${currentEnrollment.contactDetails.name} logged.` });
    setNewCommunication('');
    setIsSaving(false);
  };

  if (isContextLoading && !currentEnrollment) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading HCO profile...</p>
      </div>
    );
  }

  if (!currentEnrollment && !isContextLoading) { 
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">HCO Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">The profile with ID "{id}" could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!currentEnrollment) {
    return null; 
  }
  
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">HCO: {currentEnrollment.practiceInfo.name}</h1>
          <div>{/* Placeholder for global profile actions if any */}</div>
        </div>
        
        <Tabs defaultValue="hco-profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto sm:h-12 mb-6 shadow-md">
            <TabsTrigger value="hco-profile" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <UserCircle className="mr-2 h-5 w-5" /> HCO Profile
            </TabsTrigger>
            <TabsTrigger value="documents" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <FileTextIcon className="mr-2 h-5 w-5" /> Documents
            </TabsTrigger>
            <TabsTrigger value="contacts" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <Users className="mr-2 h-5 w-5" /> Contacts
            </TabsTrigger>
            <TabsTrigger value="activity" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <Activity className="mr-2 h-5 w-5" /> Activity & Comms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hco-profile">
            <HcoProfileTab 
              enrollment={currentEnrollment} 
              customFieldDefinitions={customFieldDefinitions}
              isEditing={isEditingHcoProfile}
              setIsEditing={setIsEditingHcoProfile}
              formData={hcoFormData}
              setFormData={setHcoFormData}
              handleSave={handleSaveHcoProfile}
              isSaving={isSaving}
              currentEnrollment={currentEnrollment} 
            />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab enrollment={currentEnrollment} />
          </TabsContent>
          <TabsContent value="contacts">
            <ContactsTab enrollment={currentEnrollment} />
          </TabsContent>
          <TabsContent value="activity">
            <Card className="mt-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Activity className="mr-2 h-5 w-5 text-primary" /> Activity Log & Communication Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Log New Activity/Note</h3>
                    <textarea
                      value={newActivityLog}
                      onChange={(e) => setNewActivityLog(e.target.value)}
                      placeholder="Enter activity details or notes..."
                      className="w-full p-2 border rounded-md min-h-[80px]"
                      disabled={isSaving}
                    />
                    <Button onClick={handleAddActivity} disabled={isSaving || !newActivityLog.trim()} className="mt-2" size="sm">
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add Log Entry
                    </Button>
                  </div>
                  <hr/>
                  <div>
                     <h3 className="font-semibold mb-2">Send Communication (Mock)</h3>
                     <textarea
                        value={newCommunication}
                        onChange={(e) => setNewCommunication(e.target.value)}
                        placeholder="Type message to provider (this will be logged)..."
                        className="w-full p-2 border rounded-md min-h-[80px]"
                        disabled={isSaving}
                     />
                     <Button onClick={handleSendCommunication} disabled={isSaving || !newCommunication.trim()} className="mt-2" size="sm">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Send Message
                     </Button>
                  </div>
                  <hr/>
                  <h3 className="font-semibold mb-2">History</h3>
                  <ScrollArea className="h-[300px] border rounded-md p-3 bg-muted/30">
                    {(currentEnrollment.activityLog && currentEnrollment.activityLog.length > 0) ? (
                      <ul className="space-y-3">
                        {[...currentEnrollment.activityLog].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, index) => (
                          <li key={index} className="text-sm p-2 rounded-md bg-background shadow-sm">
                            <span className="font-medium text-primary">
                              {new Date(log.timestamp).toLocaleString()} ({log.type})
                              {log.user && ` - ${log.user}`}:
                            </span>{' '}
                            {log.entry}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No activity logged yet.</p>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
