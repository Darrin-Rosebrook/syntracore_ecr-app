
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createVendorProfileAction } from '@/actions/vendor-actions';

export default function VendorRegistrationPage() {
  const [vendorName, setVendorName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signUp, loading: authLoading, currentUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in, they might not need to be on this page.
    // Specific redirection logic can be added if needed (e.g., if already a vendor, go to portal).
    if (currentUser) {
      // router.push('/vendor-portal'); // Or simply '/'
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      toast({ title: "Vendor Name Required", description: "Please enter the vendor company name.", variant: "destructive" });
      return;
    }
    if (!contactName.trim()) {
      toast({ title: "Contact Name Required", description: "Please enter a contact person's name.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match!", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const user = await signUp(email, password);

    if (user && user.uid) {
      const profileData = { vendorName, contactName, email };
      const profileResult = await createVendorProfileAction(user.uid, profileData);
      
      if (profileResult.success) {
        toast({ title: "Vendor Account Created", description: "Redirecting to vendor portal..." });
        router.push('/vendor-portal');
      } else {
        toast({ title: "Profile Creation Failed", description: profileResult.error || "Could not save vendor profile details.", variant: "destructive" });
        // Potentially, here you might want to delete the Firebase Auth user if profile creation fails criticaly
        // For now, we let the auth account exist.
      }
    } else if (!user) {
      // signUp in AuthContext already handles toasting for auth failure
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">EHR/LIMS Vendor Registration</CardTitle>
          <CardDescription>
            Create an account to access the Vendor Portal.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Company Name</Label>
              <Input
                id="vendorName"
                type="text"
                placeholder="Your Company Inc."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person Name</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Full Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email (for login)</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={authLoading || isSubmitting}>
              {(authLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Vendor Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have a vendor account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login
              </Link>
            </p>
             <p className="text-center text-sm text-muted-foreground">
              Are you a PHA User?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                PHA Sign Up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
