
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlusIcon, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EULA_TEXT } from '@/lib/constants';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationType = searchParams.get('type') || 'hco';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  // const [role, setRole] = useState(''); // Role is not set directly at signup anymore

  const { signUp, loading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [showEulaDialog, setShowEulaDialog] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // This effect is for users who are ALREADY logged in when they visit the signup page.
      // It redirects them to the appropriate next step if they somehow land here.
      // It should NOT interfere with the redirect logic *after* a new signup on this page.
      console.log("[SignupPage] useEffect - currentUser exists. Type:", registrationType, "Email:", currentUser.email);
      // If a user is already logged in and lands here, guide them.
      // This is less common if the main page already routes them away from signup options when logged in.
      // For now, we'll let the proceedWithSignup handle post-signup redirect.
    }
  }, [currentUser, router, registrationType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match!", variant: "destructive" });
      return;
    }
    setShowEulaDialog(true);
  };

  const proceedWithSignup = async () => {
    setIsSubmitting(true);
    console.log("[SignupPage] proceedWithSignup called. Registration Type from searchParams:", registrationType);

    const user = await signUp(email, password, name);
    setIsSubmitting(false);

    if (user) {
      toast({ title: "Account Created", description: "Redirecting to complete your registration..." });
      console.log("[SignupPage] Account created for user:", user.email, "Attempting redirect for type:", registrationType);
      switch (registrationType) {
        case 'hco':
          console.log("[SignupPage] Redirecting to /hco-registration");
          router.push('/hco-registration');
          break;
        case 'vendor':
          console.log("[SignupPage] Redirecting to /vendor-registration");
          router.push('/vendor-registration');
          break;
        case 'healthsystem':
          console.log("[SignupPage] Redirecting to /health-system-detailed-registration");
          router.push('/health-system-detailed-registration');
          break;
        default:
          console.error("[SignupPage] Unknown registration type during redirect:", registrationType);
          toast({ title: "Error", description: `Unknown registration type: ${registrationType}. Redirecting to home.`, variant: "destructive" });
          router.push('/');
      }
    } else {
      console.error("[SignupPage] Signup failed, user object is null. No redirect will occur from proceedWithSignup.");
      // Error toast is handled by signUp in AuthContext
    }
  };

  const handleEulaAccept = () => {
    setShowEulaDialog(false);
    proceedWithSignup();
  };

  const handleEulaDecline = () => {
    setShowEulaDialog(false);
    toast({
      title: "EULA Agreement Required",
      description: "You must agree to the EULA to create an account.",
      variant: "destructive",
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <UserPlusIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Enter your details to create an account. You are registering as a
            {registrationType === 'hco' && ' Health Care Organization / Laboratory representative.'}
            {registrationType === 'vendor' && ' EHR/LIMS Vendor representative.'}
            {registrationType === 'healthsystem' && ' Health System representative.'}
            {!['hco', 'vendor', 'healthsystem'].includes(registrationType || '') && ' representative (type not specified).'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(XXX) XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={authLoading || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={authLoading || isSubmitting}
                minLength={6} // Firebase default min password length
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
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
              Proceed to EULA & Create Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showEulaDialog} onOpenChange={setShowEulaDialog}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
              End-User License Agreement (EULA)
            </DialogTitle>
            <DialogDescription>
              Please read and agree to the terms before creating your account.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow border rounded-md my-4">
            <div className="p-4 whitespace-pre-wrap text-sm">
              {EULA_TEXT.replace("[Insert Date]", new Date().toLocaleDateString()).replace("[Insert State]", "Ohio").replace("[Insert County and State]", "Franklin County, Ohio")}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleEulaDecline} disabled={isSubmitting}>
              Decline
            </Button>
            <Button type="button" onClick={handleEulaAccept} disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              I Agree & Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
