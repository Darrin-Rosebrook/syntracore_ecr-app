
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Globe, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { US_STATES } from '@/lib/constants';
import { savePhaJurisdictionAction, getPhaJurisdictionAction } from '@/actions/pha-config-actions';
import type { PhaJurisdictionConfig } from '@/types';

export default function ConfigureJurisdictionPage() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [initialState, setInitialState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchJurisdiction() {
      setIsLoading(true);
      const result = await getPhaJurisdictionAction();
      if (result.success && result.data?.state) {
        setSelectedState(result.data.state);
        setInitialState(result.data.state);
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

  const handleSaveJurisdiction = async () => {
    if (!selectedState) {
      toast({
        title: 'No State Selected',
        description: 'Please select a state for your PHA jurisdiction.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    const result = await savePhaJurisdictionAction(selectedState);
    setIsSaving(false);

    if (result.success) {
      setInitialState(selectedState);
      toast({
        title: 'Jurisdiction Saved',
        description: `PHA jurisdiction has been set to ${US_STATES.find(s => s.value === selectedState)?.label || selectedState}.`,
      });
    } else {
      toast({
        title: 'Error Saving Jurisdiction',
        description: result.error || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
  };

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
          <CardTitle className="text-2xl font-semibold">Set Your Jurisdiction</CardTitle>
          <CardDescription>
            Select the state your Public Health Agency represents. This will tailor the application experience for your specific jurisdiction in future updates (e.g., branding, auto-populating state-specific information).
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
              <Label htmlFor="stateSelect">Select State</Label>
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
          {/* Placeholder for future branding/auto-population settings */}
          {/* 
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-medium">Branding (Future)</h3>
            <p className="text-sm text-muted-foreground mb-2">Customize the look and feel for your jurisdiction.</p>
            <div>
              <Label htmlFor="phaName">PHA Name</Label>
              <Input id="phaName" placeholder="e.g., Ohio Department of Health" disabled />
            </div>
          </div>
           */}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveJurisdiction} 
            disabled={isSaving || isLoading || selectedState === initialState}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Jurisdiction'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
