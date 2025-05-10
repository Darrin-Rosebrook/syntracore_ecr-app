'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Mail, CheckCircle, XCircle, Waypoints } from 'lucide-react';
import { fetchNpiDataAction, sendWelcomeEmailAction, simulateAimsValidationAction } from '@/actions/workflow-actions';
import type { ProviderData } from '@/types/npi';
import type { AIMSValidationResult } from '@/services/aims-validator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function WorkflowDemoTab() {
  const [npi, setNpi] = useState('');
  const [isLoadingNpi, setIsLoadingNpi] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingAims, setIsLoadingAims] = useState(false);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [aimsResult, setAimsResult] = useState<AIMSValidationResult | null>(null);
  const { toast } = useToast();

  const handleFetchNpi = async () => {
    if (!npi.trim()) {
      toast({ title: 'Error', description: 'Please enter an NPI.', variant: 'destructive' });
      return;
    }
    setIsLoadingNpi(true);
    setProviderData(null);
    setAimsResult(null);
    const result = await fetchNpiDataAction(npi);
    setIsLoadingNpi(false);
    if (result.success && result.data) {
      setProviderData(result.data);
      toast({ title: 'NPI Data Fetched', description: `Found data for ${result.data.name}.` });
    } else {
      toast({ title: 'NPI Fetch Error', description: result.error || 'Could not fetch NPI data.', variant: 'destructive' });
    }
  };

  const handleSendEmail = async () => {
    if (!providerData) return;
    setIsLoadingEmail(true);
    const result = await sendWelcomeEmailAction(providerData);
    setIsLoadingEmail(false);
    if (result.success) {
      toast({ title: 'Email Sent', description: result.message, className: 'bg-green-100' });
    } else {
      toast({ title: 'Email Error', description: `${result.error} ${result.message ? `Details: ${result.message}` : ''}` , variant: 'destructive' });
    }
  };

  const handleSimulateAims = async () => {
    if (!providerData) return;
    setIsLoadingAims(true);
    setAimsResult(null);
    const result = await simulateAimsValidationAction(providerData);
    setIsLoadingAims(false);
    if (result.success && result.data) {
      setAimsResult(result.data);
      toast({ title: 'AIMS Simulation Complete', description: result.data.message });
    } else {
      toast({ title: 'AIMS Simulation Error', description: result.error || 'Could not simulate AIMS validation.', variant: 'destructive' });
    }
  };
  
  const renderProviderData = () => {
    if (!providerData) return null;
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xl">{providerData.name}</CardTitle>
          {providerData.orgName && providerData.orgName !== providerData.name && <CardDescription>Organization: {providerData.orgName}</CardDescription>}
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Taxonomy:</strong> {providerData.taxonomy || 'N/A'}</p>
          {providerData.address && (
            <div>
              <strong>Address:</strong>
              <p className="pl-2">
                {providerData.address.address_1}
                {providerData.address.address_2 && `, ${providerData.address.address_2}`}
                <br />
                {providerData.address.city}, {providerData.address.state} {providerData.address.postal_code}
                <br />
                {providerData.address.telephone_number && `Phone: ${providerData.address.telephone_number}`}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSendEmail} disabled={isLoadingEmail || isLoadingNpi || isLoadingAims} className="w-full sm:w-auto">
              {isLoadingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Welcome Email
            </Button>
            <Button onClick={handleSimulateAims} disabled={isLoadingAims || isLoadingNpi || isLoadingEmail} className="w-full sm:w-auto">
              {isLoadingAims ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waypoints className="mr-2 h-4 w-4" />}
              Simulate AIMS Validation
            </Button>
        </CardFooter>
      </Card>
    );
  };
  
  const renderAimsResult = () => {
    if (!aimsResult) return null;
    return (
        <Alert variant={aimsResult.isValid ? "default" : "destructive"} className="mt-4">
            {aimsResult.isValid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{aimsResult.isValid ? "AIMS Validation Passed" : "AIMS Validation Failed"}</AlertTitle>
            <AlertDescription>
              {aimsResult.message}
              {aimsResult.details && (
                <pre className="mt-2 text-xs bg-muted p-2 rounded-md overflow-x-auto">
                  {JSON.stringify(aimsResult.details, null, 2)}
                </pre>
              )}
            </AlertDescription>
        </Alert>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Waypoints className="mr-2 h-6 w-6 text-primary" />
            API Workflow Demo
          </CardTitle>
          <CardDescription>
            Test NPI lookup, SendGrid email, and simulated AIMS validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="npi-input">Enter NPI (10 digits)</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="npi-input"
                type="text"
                value={npi}
                onChange={(e) => setNpi(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g., 1234567890"
                maxLength={10}
                disabled={isLoadingNpi || isLoadingEmail || isLoadingAims}
              />
              <Button onClick={handleFetchNpi} disabled={isLoadingNpi || isLoadingEmail || isLoadingAims || npi.length !== 10}>
                {isLoadingNpi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Fetch NPI
              </Button>
            </div>
          </div>
          {renderProviderData()}
          {renderAimsResult()}
        </CardContent>
      </Card>
    </div>
  );
}
