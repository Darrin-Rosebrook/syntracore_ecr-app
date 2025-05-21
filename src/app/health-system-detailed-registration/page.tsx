
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Share2, ArrowLeft, Building, Phone, Mail, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCircle } from 'lucide-react';

export default function HealthSystemDetailedRegistrationPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [officialName, setOfficialName] = useState('');
  const [hqAddress, setHqAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [corporateWebsite, setCorporateWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/signup?type=healthsystem');
    }
  }, [currentUser, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit.", variant: "destructive" });
      return;
    }
    if (!officialName.trim() || !hqAddress.trim() || !contactPhone.trim() || !contactEmail.trim() || !corporateWebsite.trim()) {
      toast({ title: "Missing Information", description: "All fields are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // Simulate submission
    console.log("Health System Details Submitted:", {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      officialName,
      hqAddress,
      contactPhone,
      contactEmail,
      corporateWebsite,
    });

    // Placeholder: In a real app, you'd call a server action here to save to Firestore
    // For now, simulate a delay and show success
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Health System Details Submitted",
      description: `Details for ${officialName} have been recorded (simulated).`,
    });
    // Redirect to a health system portal or dashboard (to be created)
    // For now, redirecting to home page after "submission"
    router.push('/');
    setIsSubmitting(false);
  };

  if (authLoading) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
     return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center">
            <Alert variant="destructive" className="max-w-md text-center">
                <UserCircle className="h-5 w-5 mx-auto mb-2" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                You must be logged in to access this page. Please proceed to account creation.
                </AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
                <Link href="/signup?type=healthsystem">Create Account for Health System Registration</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
             <Share2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Health System Detailed Registration</CardTitle>
          <CardDescription>
            Provide detailed information about your Health System. Your email: {currentUser.email}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="officialName" className="flex items-center">
                <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                Official Health System Name <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="officialName"
                value={officialName}
                onChange={(e) => setOfficialName(e.target.value)}
                placeholder="e.g., Acme Health Network"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="hqAddress" className="flex items-center">
                <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                Headquarters Address <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="hqAddress"
                value={hqAddress}
                onChange={(e) => setHqAddress(e.target.value)}
                placeholder="Street, City, State, ZIP Code"
                rows={3}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="contactPhone" className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                Contact Phone Number <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="contactEmail" className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                Contact Email Address <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@healthsystem.org"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="corporateWebsite" className="flex items-center">
                <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                Corporate Website URL <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="corporateWebsite"
                type="url"
                value={corporateWebsite}
                onChange={(e) => setCorporateWebsite(e.target.value)}
                placeholder="https://www.healthsystem.org"
                disabled={isSubmitting}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Submitting Details...' : 'Submit Health System Details'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
