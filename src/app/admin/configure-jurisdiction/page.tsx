
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
import { Globe, Save, ArrowLeft, Loader2, Palette, ListChecks, FileSignature } from 'lucide-react'; // Changed MailSignature to FileSignature
import { US_STATES } from '@/lib/constants';
import { savePhaJurisdictionAction, getPhaJurisdictionAction } from '@/actions/pha-config-actions';
import type { PhaJurisdictionConfig } from '@/types';

export default function ConfigureJurisdictionPage() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [initialState, setInitialState] = useState<string>('');
  const [phaName, setPhaName] = useState('');
  const [initialPhaName, setInitialPhaName] = useState('');
  const [autoPopulateSystems, setAutoPopulateSystems] = useState(false);
  const [initialAutoPopulateSystems, setInitialAutoPopulateSystems] = useState(false);
  // emailSignature state not needed as it's a future feature and disabled

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchJurisdiction() {
      setIsLoading(true);
      const result = await getPhaJurisdictionAction();
      if (result.success && result.data) {
        setSelectedState(result.data.state || '');
        setInitialState(result.data.state || '');
        setPhaName(result.data.phaName || '');
        setInitialPhaName(result.data.phaName || '');
        // Assuming autoPopulateSystems and emailSignature might be part of config in future
        // setAutoPopulateSystems(result.data.autoPopulateSystems || false); 
        // setInitialAutoPopulateSystems(result.data.autoPopulateSystems || false);
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

  const handleSaveConfiguration = async () => {
    if (!selectedState) {
      toast({
        title: 'No State Selected',
        description: 'Please select a state for your PHA jurisdiction.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    // Currently, savePhaJurisdictionAction only saves the state.
    // To save other fields, the action and PhaJurisdictionConfig type would need to be updated.
    const result = await savePhaJurisdictionAction(selectedState); 
    setIsSaving(false);

    if (result.success) {
      setInitialState(selectedState);
      setInitialPhaName(phaName);
      setInitialAutoPopulateSystems(autoPopulateSystems);
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
  
  const hasChanges = selectedState !== initialState || phaName !== initialPhaName || autoPopulateSystems !== initialAutoPopulateSystems;


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
              <Select value={selectedState} onValueChange={setSelectedState} disabled={isSaving}>
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
            Configure branding, data auto-population, and communication settings for your jurisdiction.
            These settings are illustrative for now and may not be fully functional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" />Branding</h3>
            <div>
              <Label htmlFor="phaName">PHA Name (Optional)</Label>
              <Input 
                id="phaName" 
                value={phaName} 
                onChange={(e) => setPhaName(e.target.value)} 
                placeholder="e.g., Ohio Department of Health" 
                disabled={isSaving || isLoading} 
              />
              <p className="text-xs text-muted-foreground mt-1">This name may be used in communications and reports (feature to be implemented).</p>
            </div>
            <div>
              <Label htmlFor="phaLogo">PHA Logo (Future)</Label>
              <Input id="phaLogo" type="file" disabled className="cursor-not-allowed opacity-50" />
              <p className="text-xs text-muted-foreground mt-1">Upload your PHA's logo for application branding (feature to be implemented).</p>
            </div>
          </div>

          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Data Auto-Population</h3>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="autoPopulateHealthSystems" 
                checked={autoPopulateSystems} 
                onCheckedChange={(checked) => setAutoPopulateSystems(!!checked)} 
                disabled={isSaving || isLoading} 
              />
              <Label htmlFor="autoPopulateHealthSystems" className="font-normal">Auto-populate Health Systems List</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              If enabled, the "Health Systems (Parent)" list will attempt to show systems relevant to your selected state. (Currently defaults to Ohio systems, dynamic population to be implemented).
            </p>
          </div>

          <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
            <h3 className="font-medium text-md flex items-center"><FileSignature className="mr-2 h-5 w-5 text-primary" />Communication Settings</h3>
            <div>
              <Label htmlFor="emailSignature">Email Messaging Signature Block (Future)</Label>
              <Textarea id="emailSignature" placeholder="e.g., Sincerely,&#10;The [Your PHA Name] Team" rows={3} disabled className="cursor-not-allowed opacity-50" />
              <p className="text-xs text-muted-foreground mt-1">This signature will be appended to automated emails sent from the system (feature to be implemented).</p>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            onClick={handleSaveConfiguration} 
            disabled={isSaving || isLoading || !hasChanges || !selectedState}
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
