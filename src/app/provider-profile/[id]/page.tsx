'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import type { EnrollmentData, CustomFieldDefinition, ActivityLogEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Card used for overall page structure, not section card
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Info, UserCircle, FileTextIcon, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Import Tab Components
import { HcoProfileTab } from '@/components/hco-profile-tab';
import { DocumentsTab } from '@/components/documents-tab';
import { ContactsTab } from '@/components/contacts-tab';
import { ScrollArea } from '@/components/ui/scroll-area';


const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, icon: Icon, children, actions }) => (
  
    
      
        
        
      
       {actions && }
    
     {children}
  
);


export default function ProviderProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { enrollments, customFieldDefinitions, updateEnrollmentData, addActivityLogEntry, isLoading: isContextLoading } = useAppContext();
  const { toast } = useToast();

  const [currentEnrollment, setCurrentEnrollment] = useState(null);
  const [isEditingHcoProfile, setIsEditingHcoProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // General saving state, can be used by multiple tabs if simple
  const [hcoFormData, setHcoFormData] = useState({});
  
  const [newActivityLog, setNewActivityLog] = useState('');
  const [newCommunication, setNewCommunication] = useState(''); // Kept for Communication Center mock

  const activeEnrollment = useMemo(() => {
    if (typeof id !== 'string') return null;
    return enrollments.find(e => e.id === id);
  }, [id, enrollments]);

  useEffect(() => {
    if (activeEnrollment) {
      setCurrentEnrollment(activeEnrollment);
      // Initialize HCO form data only when activeEnrollment changes or for the first time
      setHcoFormData({
        practiceInfo: { ...activeEnrollment.practiceInfo },
        contactDetails: { ...activeEnrollment.contactDetails },
        ehrVendor: activeEnrollment.ehrVendor,
        additionalData: { ...(activeEnrollment.additionalData || {}) },
      });
    } else if (id && !isContextLoading && enrollments.length > 0) {
      setCurrentEnrollment(null);
    }
  }, [id, activeEnrollment, isContextLoading, enrollments.length]);


  const handleSaveHcoProfile = async () => {
    if (!currentEnrollment || !id || Object.keys(hcoFormData).length === 0) return;
    
    setIsSaving(true);
    const dataToUpdate: Partial> = {
        practiceInfo: hcoFormData.practiceInfo,
        contactDetails: hcoFormData.contactDetails, // Primary contact
        ehrVendor: hcoFormData.ehrVendor,
        additionalData: hcoFormData.additionalData,
    };

    await updateEnrollmentData(id as string, dataToUpdate);
    setIsEditingHcoProfile(false);
    setIsSaving(false);
  };

  const handleAddActivity = async () => {
    if (!newActivityLog.trim() || !id) return;
    setIsSaving(true); 
    await addActivityLogEntry(id as string, newActivityLog, 'UserAction', 'PHA Admin');
    setNewActivityLog('');
    setIsSaving(false);
  };

  const handleSendCommunication = async () => {
    if (!newCommunication.trim() || !id || !currentEnrollment) return;
    setIsSaving(true);
    await addActivityLogEntry(id as string, `Message to ${currentEnrollment.contactDetails.name}: ${newCommunication}`, 'Communication', 'PHA Admin');
    toast({ title: 'Communication Sent (Mock)', description: `Message to ${currentEnrollment.contactDetails.name} logged.` });
    setNewCommunication('');
    setIsSaving(false);
  };

  if (isContextLoading && !currentEnrollment) {
    return (

             
             Loading provider profile...
           
    );
  }

  if (!currentEnrollment) {
    return (

             
             Provider Profile Not Found
             The profile with ID "{id}" could not be found.
             
               
                 Go Back to Dashboard
               
             
           
    );
  }
  
  return (


               
                 Back
              
             Provider: {currentEnrollment.practiceInfo.name}
             
        
          
           
                HCO Profile
                Documents
                Contacts
                Activity & Comms
              

              
                
                  

                    
                        
                         HCO Profile
                        
                        
                         Documents
                        
                        
                         Contacts
                        
                        
                         Activity & Comms
                    
                
              
            
          
        
      
    
  );
}