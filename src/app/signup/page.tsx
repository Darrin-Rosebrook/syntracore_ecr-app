'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlusIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addEnrollmentToFirestore } from '@/lib/firestore-add-enrollment';
import type { EnrollmentFormData, FHIRValidationResult, ContactEntry } from '@/types';
import { PENDING_ENROLLMENT_DATA_KEY, PENDING_CCD_FILE_CONTENT_KEY, PENDING_VALIDATION_RESULT_KEY } from '@/lib/constants';
import { useAppContext } from '@/context/AppContext';


export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');

  const { signUp, loading: authLoading, currentUser } = useAuth();
  const { fetchInitialData } = useAppContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const { toast } = useToast();

  const [hasPendingEnrollment, setHasPendingEnrollment] = useState(false);

  useEffect(() => {
    const pendingData = localStorage.getItem(PENDING_ENROLLMENT_DATA_KEY);
    if (pendingData) {
      setHasPendingEnrollment(true);
    } else {
      setHasPendingEnrollment(false);
      if (currentUser) {
        router.push('/'); 
      }
    }
  }, [currentUser, router]);


  const clearPendingEnrollmentData = () => {
    localStorage.removeItem(PENDING_ENROLLMENT_DATA_KEY);
    localStorage.removeItem(PENDING_CCD_FILE_CONTENT_KEY);
    localStorage.removeItem(PENDING_VALIDATION_RESULT_KEY);
    setHasPendingEnrollment(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting signup form..."); 
    if (!name.trim()) {
      toast({title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({title: "Password Mismatch", description: "Passwords do not match!", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const user = await signUp(email, password);

    if (user) {
      const pendingEnrollmentDataString = localStorage.getItem(PENDING_ENROLLMENT_DATA_KEY);
      const pendingCcdFileContent = localStorage.getItem(PENDING_CCD_FILE_CONTENT_KEY);
      const pendingValidationResultString = localStorage.getItem(PENDING_VALIDATION_RESULT_KEY);

      if (pendingEnrollmentDataString && pendingCcdFileContent !== null && pendingValidationResultString) {
        try {
          const enrollmentData: EnrollmentFormData = JSON.parse(pendingEnrollmentDataString);
          const validationResult: FHIRValidationResult = JSON.parse(pendingValidationResultString);
          
          // Integrate signup user's details as a contact
          const submitterContactName = name;
          const submitterContactPhone = phone;
          const submitterContactRole = role.trim() || 'Enrollment Submitter';

          // If primary contact details from original form are minimal/empty, use signup user as primary
          if (!enrollmentData.contactDetails.name && !enrollmentData.contactDetails.email) {
            enrollmentData.contactDetails = {
              name: submitterContactName,
              email: user.email!, 
              phone: submitterContactPhone,
            };
          } else {
            // Otherwise, add as an additional contact
            const newAdditionalContact: ContactEntry = {
              id: `contact_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
              name: submitterContactName,
              email: user.email!,
              phone: submitterContactPhone,
              role: submitterContactRole,
              isAlternative: false, 
            };
            if (!enrollmentData.additionalContacts) {
                enrollmentData.additionalContacts = [];
            }
            enrollmentData.additionalContacts.push(newAdditionalContact);
          }
          
          toast({ title: "Account Created", description: "Now submitting your enrollment..."});

          const submissionResult = await addEnrollmentToFirestore(
            enrollmentData,
            pendingCcdFileContent,
            validationResult
          );

          if (submissionResult.success && submissionResult.id) {
            toast({
              title: "Enrollment Submitted Successfully",
              description: `Practice "${enrollmentData.practiceInfo.name}" enrollment complete. ID: ${submissionResult.id.slice(0,8)}...`,
              className: "bg-green-500 text-white",
            });
            await fetchInitialData(); 
            clearPendingEnrollmentData();
            router.push('/'); 
          } else {
            toast({
              title: "Enrollment Submission Failed",
              description: submissionResult.error || "Could not submit enrollment after account creation. Please contact support.",
              variant: "destructive",
            });
            router.push('/'); 
          }
        } catch (error) {
          console.error("Error processing or submitting enrollment data:", error);
          toast({
            title: "Enrollment Error",
            description: "An error occurred while processing your enrollment after account creation. Please contact support.",
            variant: "destructive",
          });
          router.push('/');
        }
      } else {
        await fetchInitialData(); // Refresh data in case of regular signup post-login/logout cycle
        router.push('/');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
           <div className="flex justify-center mb-2">
            <UserPlusIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            {hasPendingEnrollment 
              ? "Final step: Create your account to complete the enrollment."
              : "Enter your details to sign up."
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="role">Your Role (e.g., Office Manager, Provider - Optional)</Label>
              <Input 
                id="role" 
                type="text" 
                placeholder="Your role in the practice" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
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
              {hasPendingEnrollment ? "Create Account & Submit Enrollment" : "Sign Up"}
            </Button>
             <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline" onClick={clearPendingEnrollmentData}>
                Login
              </Link>
            </p>
            {hasPendingEnrollment && (
                <p className="text-center text-xs text-muted-foreground">
                    Changed your mind? <Link href="/" className="font-semibold text-primary hover:underline" onClick={clearPendingEnrollmentData}>Cancel enrollment and go to dashboard</Link>.
                </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
