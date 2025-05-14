
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Globe, Save, ArrowLeft, Loader2, Palette, ListChecks, FileSignature, Landmark, ShieldCheck, Workflow, BookOpen, Phone, MessageSquare, MapPin, Users } from 'lucide-react';
import { US_STATES } from '@/lib/constants';
import { savePhaJurisdictionAction, getPhaJurisdictionAction } from '@/actions/pha-config-actions';
import type { PhaJurisdictionConfig } from '@/types';

const initialConfigState: PhaJurisdictionConfig = {
  state: '',
  phaName: '',
  logoUrl: '',
  lastUpdated: '',
  stateRegulationsUrl: '',
  requiredReportingFieldsInfo: '',
  phaContactName: '',
  phaContactEmail: '',
  phaContactPhone: '',
  reportableConditionsUrl: '',
  dataStandardsInfo: '',
  autoPopulateCounties: false,
  autoPopulateHealthSystems: false,
  stateSealUrl: '',
  legalDisclaimers: '',
  customWelcomeMessage: '',
  emailSignature: '',
  immunizationRegistryUrl: '',
  hieConnectionInfo: '',
};

export default function ConfigureJurisdictionPage() {
  const [config, setConfig] = useState<PhaJurisdictionConfig>(initialConfigState);
  const [initialConfig, setInitialConfig] = useState<PhaJurisdictionConfig>(initialConfigState);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchJurisdiction() {
      setIsLoading(true);
      const result = await getPhaJurisdictionAction();
      if (result.success && result.data) {
        // Ensure all fields from initialConfigState are present, even if undefined in result.data
        const loadedConfig = { ...initialConfigState, ...result.data };
        setConfig(loadedConfig);
        setInitialConfig(loadedConfig);
      } else if (result.error) {
        toast({
          title: 'Error Loading Configuration',
          description: result.error,
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }
    fetchJurisdiction();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: keyof PhaJurisdictionConfig, checked: boolean | "indeterminate") => {
    setConfig(prev => ({ ...prev, [name]: !!checked }));
  };
  
  const handleSelectChange = (name: keyof PhaJurisdictionConfig, value: string) => {
    setConfig(prev => ({ ...prev, [name]: value }));
  };


  const handleSaveConfiguration = async () => {
    if (!config.state) {
      toast({
        title: 'No State Selected',
        description: 'Please select a state for your PHA jurisdiction.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    const { lastUpdated, ...configToSave } = config; // Exclude lastUpdated from save payload
    const result = await savePhaJurisdictionAction(configToSave);
    setIsSaving(false);

    if (result.success) {
      const newSavedConfig = { ...config, lastUpdated: new Date().toISOString() };
      setConfig(newSavedConfig);
      setInitialConfig(newSavedConfig);
      toast({
        title: 'Configuration Saved',
        description: `PHA jurisdiction configuration has been updated.`,
      });
    } else {
      toast({
        title: 'Error Saving Configuration',
        description: result.error || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
  };
  
  const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Globe className="mr-3 h-8 w-8 text-primary" />
          Configure PHA Jurisdiction
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Console
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Set Your Core Jurisdiction</CardTitle>
          <CardDescription>
            Select the state your Public Health Agency represents. This will tailor the application experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading current configuration...</span>
            </div>
          ) : (
            <div>
              <Label htmlFor="stateSelect">Select State *</Label>
              <Select value={config.state} onValueChange={(value) => handleSelectChange('state', value)} disabled={isSaving}>
                <SelectTrigger id="stateSelect" className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select your state..." />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label} ({state.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        
        <CardHeader className="pt-2 border-t mt-4">
          <CardTitle className="text-xl font-semibold">Jurisdiction Specific Settings</CardTitle>
          <CardDescription>
            Configure various settings tailored to your jurisdiction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Branding */}
          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" />Branding</h3>
            <div>
              <Label htmlFor="phaName">PHA Name</Label>
              <Input id="phaName" name="phaName" value={config.phaName || ''} onChange={handleInputChange} placeholder="e.g., Ohio Department of Health" disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="logoUrl">PHA Logo URL</Label>
              <Input id="logoUrl" name="logoUrl" value={config.logoUrl || ''} onChange={handleInputChange} placeholder="https://example.com/logo.png" disabled={isSaving || isLoading} />
            </div>
             <div>
              <Label htmlFor="stateSealUrl">State Seal URL</Label>
              <Input id="stateSealUrl" name="stateSealUrl" value={config.stateSealUrl || ''} onChange={handleInputChange} placeholder="https://example.com/state_seal.png" disabled={isSaving || isLoading} />
            </div>
          </div>

          {/* PHA Contact Information */}
          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />PHA Contact Information</h3>
            <div>
              <Label htmlFor="phaContactName">PHA Contact Name</Label>
              <Input id="phaContactName" name="phaContactName" value={config.phaContactName || ''} onChange={handleInputChange} placeholder="e.g., Jane Doe, Reporting Lead" disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="phaContactEmail">PHA Contact Email</Label>
              <Input id="phaContactEmail" name="phaContactEmail" type="email" value={config.phaContactEmail || ''} onChange={handleInputChange} placeholder="contact@pha.state.gov" disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="phaContactPhone">PHA Contact Phone</Label>
              <Input id="phaContactPhone" name="phaContactPhone" type="tel" value={config.phaContactPhone || ''} onChange={handleInputChange} placeholder="(XXX) XXX-XXXX" disabled={isSaving || isLoading} />
            </div>
          </div>

          {/* Data Auto-Population & Program Specifics */}
          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Data & Program Settings</h3>
            <div className="flex items-center space-x-2">
              <Checkbox id="autoPopulateHealthSystems" checked={!!config.autoPopulateHealthSystems} onCheckedChange={(checked) => handleCheckboxChange('autoPopulateHealthSystems', checked)} disabled={isSaving || isLoading} />
              <Label htmlFor="autoPopulateHealthSystems" className="font-normal">Auto-populate Health Systems List for {config.state || "selected state"}</Label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox id="autoPopulateCounties" checked={!!config.autoPopulateCounties} onCheckedChange={(checked) => handleCheckboxChange('autoPopulateCounties', checked)} disabled={isSaving || isLoading} />
              <Label htmlFor="autoPopulateCounties" className="font-normal">Auto-populate County Lists for {config.state || "selected state"}</Label>
            </div>
            <div>
              <Label htmlFor="reportableConditionsUrl">Reportable Conditions URL</Label>
              <Input id="reportableConditionsUrl" name="reportableConditionsUrl" value={config.reportableConditionsUrl || ''} onChange={handleInputChange} placeholder="https://pha.state.gov/reportable-conditions" disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="dataStandardsInfo">Data Standards Information</Label>
              <Textarea id="dataStandardsInfo" name="dataStandardsInfo" value={config.dataStandardsInfo || ''} onChange={handleInputChange} rows={3} placeholder="e.g., Required FHIR Profile: US Core R4..." disabled={isSaving || isLoading} />
            </div>
          </div>
          
          {/* Regulatory Information */}
          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" />Regulatory Information</h3>
            <div>
              <Label htmlFor="stateRegulationsUrl">State Regulations URL</Label>
              <Input id="stateRegulationsUrl" name="stateRegulationsUrl" value={config.stateRegulationsUrl || ''} onChange={handleInputChange} placeholder="https://pha.state.gov/regulations" disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="requiredReportingFieldsInfo">Required Reporting Fields Information</Label>
              <Textarea id="requiredReportingFieldsInfo" name="requiredReportingFieldsInfo" value={config.requiredReportingFieldsInfo || ''} onChange={handleInputChange} rows={3} placeholder="List or describe state-mandated reporting fields..." disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="legalDisclaimers">Legal Disclaimers</Label>
              <Textarea id="legalDisclaimers" name="legalDisclaimers" value={config.legalDisclaimers || ''} onChange={handleInputChange} rows={3} placeholder="State-specific legal disclaimers..." disabled={isSaving || isLoading} />
            </div>
          </div>

          {/* Communication Settings */}
          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary" />Communication Settings</h3>
            <div>
              <Label htmlFor="customWelcomeMessage">Custom Welcome Message Snippet</Label>
              <Textarea id="customWelcomeMessage" name="customWelcomeMessage" value={config.customWelcomeMessage || ''} onChange={handleInputChange} rows={3} placeholder="Welcome to the [State Name] eCR Onboarding Portal..." disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="emailSignature">Email Messaging Signature Block</Label>
              <Textarea id="emailSignature" name="emailSignature" value={config.emailSignature || ''} onChange={handleInputChange} placeholder="e.g., Sincerely,&#10;The [Your PHA Name] Team" rows={3} disabled={isSaving || isLoading} />
            </div>
          </div>

          {/* Third-Party Integrations */}
           <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><Workflow className="mr-2 h-5 w-5 text-primary" />Third-Party Integrations</h3>
            <div>
              <Label htmlFor="immunizationRegistryUrl">Immunization Registry URL/Info</Label>
              <Input id="immunizationRegistryUrl" name="immunizationRegistryUrl" value={config.immunizationRegistryUrl || ''} onChange={handleInputChange} placeholder="e.g., https://state.iis.gov or connection details" disabled={isSaving || isLoading} />
            </div>
            <div>
              <Label htmlFor="hieConnectionInfo">State HIE Connection Information</Label>
              <Textarea id="hieConnectionInfo" name="hieConnectionInfo" value={config.hieConnectionInfo || ''} onChange={handleInputChange} rows={3} placeholder="Details about connecting to the state HIE..." disabled={isSaving || isLoading} />
            </div>
          </div>

        </CardContent>

        <CardFooter>
          <Button 
            onClick={handleSaveConfiguration} 
            disabled={isSaving || isLoading || !hasChanges || !config.state}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

