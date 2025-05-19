
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
import { Loader2, Building, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createVendorProfileAction } from '@/actions/vendor-actions';
import { EHR_VENDORS } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VendorRegistrationPage() {
  const [vendorName, setVendorName] = useState('');
  const [contactName, setContactName] = useState('');
  // Email is now from currentUser
  const [representedEhrSystemValue, setRepresentedEhrSystemValue] = useState('');

  const { loading: authLoading, currentUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      // If not loading and no user, redirect to login/signup, they shouldn't be here directly
      // unless they just signed up and were redirected.
      toast({ title: "Authentication Required", description: "Please create an account or log in first.", variant: "destructive"});
      router.push('/signup?type=vendor'); // Or just /login
    } else if (currentUser && !contactName) {
      // Pre-fill contact name from user's display name if available
      setContactName(currentUser.displayName || '');
    }
  }, [currentUser, authLoading, router, toast, contactName]);

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
    
    const profileData = { 
        vendorName: vendorName.trim(), 
        contactName: contactName.trim(), 
        email: currentUser.email, // Use email from authenticated user
        representedEhrSystemValue 
    };
    const profileResult = await createVendorProfileAction(currentUser.uid, profileData);
    
    if (profileResult.success) {
      toast({ title: "Vendor Profile Created", description: "Redirecting to vendor portal..." });
      router.push('/vendor-portal');
    } else {
      toast({ title: "Profile Creation Failed", description: profileResult.error || "Could not save vendor profile details.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!currentUser) {
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
            <Building className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Vendor Profile</CardTitle>
          <CardDescription>
            Provide your company details to access the Vendor Portal. Your email: {currentUser.email}
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
              Complete Profile & Enter Portal
            </Button>
             <p className="text-center text-sm text-muted-foreground">
              Not a vendor?{' '}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Go to Homepage
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
