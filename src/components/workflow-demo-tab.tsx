'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Mail, CheckCircle2, AlertCircle, Waypoints } from 'lucide-react'; // Changed icons
import { 
  fetchNpiDataAction, 
  sendWelcomeEmailAction, 
  simulateFhirValidationAction // Using the new simpler validation action
} from '@/actions/workflow-actions';
import type { ProviderData } from '@/types/npi';
import type { FHIRValidationResult } from '@/services/fhir-validator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext'; // Using app's AuthContext

export function WorkflowDemoTab() {
  const { currentUser } = useAuth();
  const [npi, setNpi] = useState('');
  const [isLoadingNpi, setIsLoadingNpi] = useState(false);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false); // Combined loading for enroll
  
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [fhirValidationResult, setFhirValidationResult] = useState<FHIRValidationResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'success' | 'error' | null>(null);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!npi.trim() || npi.length !== 10) {
      toast({ title: 'Error', description: 'Please enter a valid 10-digit NPI.', variant: 'destructive' });
      return;
    }
    setIsLoadingNpi(true);
    setProviderData(null);
    setFhirValidationResult(null);
    setStatusMessage("Looking up NPI...");
    setEnrollmentStatus(null);

    const result = await fetchNpiDataAction(npi);
    setIsLoadingNpi(false);

    if (result.success && result.data) {
      setProviderData(result.data);
      setStatusMessage(`Provider info loaded for ${result.data.name}.`);
      toast({ title: 'NPI Data Fetched', description: `Found: ${result.data.name}` });
    } else {
      setStatusMessage(`Error: ${result.error || 'Could not fetch NPI data.'}`);
      toast({ title: 'NPI Fetch Error', description: result.error || 'Could not fetch NPI data.', variant: 'destructive' });
    }
  };

  const handleEnroll = async () => {
    if (!providerData) {
      toast({ title: 'Error', description: 'No provider data loaded. Please lookup NPI first.', variant: 'destructive' });
      return;
    }
    if (!currentUser || !currentUser.email) {
      toast({ title: 'Error', description: 'You must be logged in to enroll.', variant: 'destructive' });
      return;
    }

    setIsLoadingWorkflow(true);
    setStatusMessage("Processing enrollment...");
    setEnrollmentStatus(null);
    setFhirValidationResult(null);

    try {
      // 1. Send Welcome Email
      const emailResult = await sendWelcomeEmailAction(providerData, currentUser.email);
      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send welcome email.");
      }
      setStatusMessage("Welcome email sent...");
      toast({ title: "Email Sent", description: "Welcome email dispatched successfully."});

      // 2. Simulate FHIR Validation
      // For demonstration, using a simple mock resource. In a real app, this would be the uploaded CCDA.
      const mockFhirResource = { resourceType: "Patient", name: [{ family: providerData.lastName || "Test", given: [providerData.firstName || "User"] }] };
      const validationResult = await simulateFhirValidationAction(mockFhirResource);
      
      if (!validationResult.success || !validationResult.data) {
        throw new Error(validationResult.error || "FHIR validation failed.");
      }
      setFhirValidationResult(validationResult.data);
      setStatusMessage("FHIR resource validated...");
      toast({ title: "FHIR Validated", description: validationResult.data.messages.join(" ")});
      

      if (emailResult.success && validationResult.data.isValid) {
        setStatusMessage("Enrollment successful!");
        setEnrollmentStatus('success');
        toast({ title: "Enrollment Complete", description: "Provider enrollment process finished successfully!", className: "bg-green-500 text-white" });
      } else {
        let combinedError = "";
        if(!emailResult.success) combinedError += `Email Error: ${emailResult.error}. `;
        if(!validationResult.data.isValid) combinedError += `Validation Error: ${validationResult.data.messages.join(' ')}.`;
        throw new Error(combinedError || "Enrollment process had issues.");
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during enrollment.";
      setStatusMessage(`Enrollment failed: ${errorMessage}`);
      setEnrollmentStatus('error');
      toast({ title: 'Enrollment Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoadingWorkflow(false);
    }
  };
  
  const renderProviderDetails = () => {
    if (!providerData) return null;
    return (
      <Card className="mt-4 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">{providerData.name}</CardTitle>
           {providerData.orgName && providerData.orgName !== providerData.name && <CardDescription>Organization: {providerData.orgName}</CardDescription>}
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Taxonomy:</strong> {providerData.taxonomy || 'N/A'}</p>
          {providerData.address && (
            <div>
              <strong>Address:</strong>
              <address className="pl-2 not-italic">
                {providerData.address.address_1}
                {providerData.address.address_2 && `, ${providerData.address.address_2}`}
                <br />
                {providerData.address.city}, {providerData.address.state} {providerData.address.postal_code}
                {providerData.address.telephone_number && <><br />Phone: {providerData.address.telephone_number}</>}
              </address>
            </div>
          )}
        </CardContent>
        <CardFooter>
           <Button onClick={handleEnroll} disabled={isLoadingNpi || isLoadingWorkflow || !currentUser} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoadingWorkflow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Complete Enrollment
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderWorkflowStatus = () => {
    if(!statusMessage && !fhirValidationResult) return null;

    return (
      <div className="mt-4 space-y-2">
        {statusMessage && (
          <Alert variant={enrollmentStatus === 'error' ? 'destructive' : enrollmentStatus === 'success' ? 'default' : 'default'} 
                 className={enrollmentStatus === 'success' ? 'border-green-500' : enrollmentStatus === 'error' ? '' : 'border-blue-500'}>
            {enrollmentStatus === 'success' ? <CheckCircle2 className="h-4 w-4" /> : enrollmentStatus === 'error' ? <AlertCircle className="h-4 w-4" /> : <Waypoints className="h-4 w-4" />}
            <AlertTitle>
              {enrollmentStatus === 'success' ? 'Success' : enrollmentStatus === 'error' ? 'Error' : 'Status'}
            </AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}
        {fhirValidationResult && (
           <Alert variant={fhirValidationResult.isValid ? 'default' : 'destructive'} className={fhirValidationResult.isValid ? "border-green-500" : ""}>
            {fhirValidationResult.isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>FHIR Validation</AlertTitle>
            <AlertDescription>{fhirValidationResult.messages.join('; ')}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }


  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Waypoints className="mr-2 h-6 w-6 text-primary" />
            Enrollment Workflow Demo
          </CardTitle>
          <CardDescription>
            Test NPI lookup, SendGrid email, and simulated FHIR validation. Ensure you are logged in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentUser && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please log in to use the enrollment workflow.
              </AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="npi-input-workflow">Enter NPI (10 digits)</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="npi-input-workflow"
                type="text"
                value={npi}
                onChange={(e) => setNpi(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g., 1234567890"
                maxLength={10}
                disabled={isLoadingNpi || isLoadingWorkflow || !currentUser}
              />
              <Button onClick={handleLookup} disabled={isLoadingNpi || isLoadingWorkflow || npi.length !== 10 || !currentUser}>
                {isLoadingNpi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Lookup NPI
              </Button>
            </div>
          </div>
          {renderProviderDetails()}
          {renderWorkflowStatus()}
        </CardContent>
      </Card>
    </div>
  );
}
