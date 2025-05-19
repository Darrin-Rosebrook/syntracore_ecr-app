
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building, UserPlus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createVendorProfileAction, getVendorProfileAction, updateVendorProfileAction } from '@/actions/vendor-actions';
import { EHR_VENDORS } from '@/lib/constants';
import type { VendorProfileData } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VendorRegistrationPage() {
  const [vendorName, setVendorName] = useState('');
  const [contactName, setContactName] = useState('');
  const [representedEhrSystemValue, setRepresentedEhrSystemValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [existingProfile, setExistingProfile] = useState<VendorProfileData | null>(null);

  const { loading: authLoading, currentUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      if (currentUser && currentUser.uid) {
        setIsLoadingProfile(true);
        const result = await getVendorProfileAction(currentUser.uid);
        if (result.success && result.data) {
          setExistingProfile(result.data);
          setVendorName(result.data.vendorName);
          setContactName(result.data.contactName);
          setRepresentedEhrSystemValue(result.data.representedEhrSystemValue);
          setIsEditing(true);
        } else {
          // No existing profile, or error fetching. Treat as new registration.
          // Pre-fill contact name from auth if available and not editing.
          if (currentUser.displayName && !contactName) {
            setContactName(currentUser.displayName);
          }
        }
        setIsLoadingProfile(false);
      } else if (!authLoading) {
         // If no currentUser and auth is not loading, means user needs to log in/sign up
        toast({ title: "Authentication Required", description: "Please create an account or log in first.", variant: "destructive"});
        router.push('/signup?type=vendor');
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [currentUser, authLoading, router, toast]); // Removed contactName from deps to avoid loop

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !currentUser.uid || !currentUser.email) {
        toast({ title: "Error", description: "User not properly authenticated.", variant: "destructive" });
        return;
    }
    if (!vendorName.trim()) {
      toast({ title: "Vendor Name Required", description: "Please enter the vendor company name.", variant: "destructive" });
      return;
    }
    if (!contactName.trim()) {
      toast({ title: "Contact Name Required", description: "Please enter a contact person's name.", variant: "destructive" });
      return;
    }
    if (!representedEhrSystemValue) {
      toast({ title: "EHR/LIMS System Required", description: "Please select the EHR/LIMS system your company represents.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    let result;
    if (isEditing && existingProfile) {
      const updateData: Partial<Pick<VendorProfileData, 'vendorName' | 'contactName' | 'representedEhrSystemValue'>> = {};
      if (vendorName.trim() !== existingProfile.vendorName) updateData.vendorName = vendorName.trim();
      if (contactName.trim() !== existingProfile.contactName) updateData.contactName = contactName.trim();
      if (representedEhrSystemValue !== existingProfile.representedEhrSystemValue) updateData.representedEhrSystemValue = representedEhrSystemValue;

      if (Object.keys(updateData).length > 0) {
        result = await updateVendorProfileAction(currentUser.uid, updateData);
      } else {
        toast({ title: "No Changes Detected", description: "Profile information is the same." });
        setIsSubmitting(false);
        router.push('/vendor-portal'); // Or stay on page
        return;
      }
    } else {
      const profileData = { 
          vendorName: vendorName.trim(), 
          contactName: contactName.trim(), 
          email: currentUser.email,
          representedEhrSystemValue 
      };
      result = await createVendorProfileAction(currentUser.uid, profileData);
    }
    
    if (result && result.success) {
      toast({ title: isEditing ? "Profile Updated" : "Vendor Profile Created", description: isEditing ? "Your profile has been updated." : "Redirecting to vendor portal..." });
      router.push('/vendor-portal');
    } else if (result) {
      toast({ title: isEditing ? "Update Failed" : "Profile Creation Failed", description: result.error || "Could not save vendor profile details.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (authLoading || isLoadingProfile) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!currentUser && !authLoading && !isLoadingProfile) { // Added !isLoadingProfile
     return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
                <UserPlus className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                You need to be logged in to complete vendor registration. 
                Please <Link href="/login" className="underline hover:text-primary/80">login</Link> or 
                <Link href="/signup?type=vendor" className="underline hover:text-primary/80"> create an account</Link>.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            {isEditing ? <Edit className="h-8 w-8 text-primary" /> : <Building className="h-8 w-8 text-primary" />}
          </div>
          <CardTitle className="text-2xl">{isEditing ? "Edit Vendor Profile" : "Complete Vendor Profile"}</CardTitle>
          <CardDescription>
            {isEditing ? "Update your company details." : "Provide your company details to access the Vendor Portal."} 
            Your email: {currentUser?.email}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Company Name <span className="text-destructive">*</span></Label>
              <Input
                id="vendorName"
                type="text"
                placeholder="Your Company Inc."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person Name <span className="text-destructive">*</span></Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Full Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="representedEhrSystemValue">EHR/LIMS System Represented <span className="text-destructive">*</span></Label>
              <Select
                value={representedEhrSystemValue}
                onValueChange={setRepresentedEhrSystemValue}
                required
                disabled={isSubmitting}
              >
                <SelectTrigger id="representedEhrSystemValue">
                  <SelectValue placeholder="Select your primary EHR/LIMS" />
                </SelectTrigger>
                <SelectContent>
                  {EHR_VENDORS.map((vendor) => (
                    <SelectItem key={vendor.value} value={vendor.value}>
                      {vendor.label} ({vendor.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Profile" : "Complete Profile & Enter Portal"}
            </Button>
             <Button variant="outline" type="button" onClick={() => router.push(isEditing ? '/vendor-portal' : '/')} disabled={isSubmitting}>
                Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    