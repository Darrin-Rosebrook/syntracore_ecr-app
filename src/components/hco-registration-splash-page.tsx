
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePenLine, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export function HcoRegistrationSplashPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 min-h-[calc(100vh-18rem)]">
      <Card className="w-full max-w-2xl shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto mb-6">
            <Image 
              src="/images/OnboardeCR.png" // Using the project logo
              alt="Onboard eCR Logo" 
              width={200} 
              height={67} // Adjusted height maintaining aspect ratio for 200 width
              priority 
              data-ai-hint="logo health"
            />
          </div>
          <CardTitle className="text-3xl font-bold flex items-center justify-center">
            <FilePenLine className="mr-3 h-8 w-8 text-primary" />
            Register Intent for eCR
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80 mt-2">
            Welcome, Health Care Organization!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-md leading-relaxed">
            This portal facilitates the process for Health Care Organizations (HCOs) to register their intent to participate in Electronic Case Reporting (eCR) with their Public Health Agency (PHA). 
            Registering your intent is the first step towards streamlined, automated public health reporting.
          </p>
          <p className="text-md leading-relaxed">
            By clicking "Continue", you will be guided through the HCO registration form where you can provide your organization's details and technical information.
          </p>
          <Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/hco-registration">
              Continue to HCO Registration <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
       <p className="mt-8 text-sm text-muted-foreground max-w-xl text-center">
        Electronic Case Reporting (eCR) is the automated, real-time exchange of case report information between electronic health records (EHRs) and public health agencies. It is a critical component of modern public health surveillance.
      </p>
    </div>
  );
}

