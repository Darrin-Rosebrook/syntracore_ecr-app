
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, ListTree, Users, FileTextIcon, Building, Package, AlertCircle } from 'lucide-react';
import { EhrVendorProfileDetailsTab } from '@/components/ehr-vendor-profile-details-tab';
import { EhrVendorHcosTab } from '@/components/ehr-vendor-hcos-tab';
import { EhrVendorDocumentsTab } from '@/components/ehr-vendor-documents-tab';
import { EhrVendorContactsTab } from '@/components/ehr-vendor-contacts-tab';
// Removed EhrVendorProductsTab import as it's being removed
import { EHR_VENDORS } from '@/lib/constants'; // Import local constants
import type { EnrollmentData } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface VendorDetails {
  value: string;
  label: string;
  type: "EHR" | "LIMS";
}

export default function EhrVendorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { enrollments, isLoading: isContextLoading } = useAppContext();

  const [currentVendor, setCurrentVendor] = useState<VendorDetails | null>(null);
  const [isLoadingVendor, setIsLoadingVendor] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hcosUsingThisVendor, setHcosUsingThisVendor] = useState<EnrollmentData[]>([]);

  const vendorValue = params?.vendorValue as string | undefined;

  useEffect(() => {
    if (!vendorValue) {
      setError("Vendor identifier missing in URL.");
      setIsLoadingVendor(false);
      return;
    }
    setIsLoadingVendor(true);
    setError(null);
    
    const foundVendor = EHR_VENDORS.find(v => v.value === vendorValue);
    
    if (foundVendor) {
      setCurrentVendor(foundVendor);
    } else {
      setError(`Vendor with identifier "${vendorValue}" not found.`);
    }
    setIsLoadingVendor(false);
  }, [vendorValue]);

  useEffect(() => {
    if (currentVendor && enrollments.length > 0) {
      const filteredHcos = enrollments.filter(e => e.ehrVendor === currentVendor.value);
      setHcosUsingThisVendor(filteredHcos);
    } else {
      setHcosUsingThisVendor([]);
    }
  }, [currentVendor, enrollments]);

  if (isLoadingVendor || (isContextLoading && !currentVendor) ) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading EHR/LIMS Vendor profile...</p>
      </div>
    );
  }

  if (error && !currentVendor) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="shadow-xl m-4 md:m-6">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center text-destructive justify-center">
              <AlertCircle className="mr-3 h-7 w-7" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/admin/ehr-vendors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to EHR/LIMS Vendors List
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!currentVendor) {
    return (
        <div className="container mx-auto py-8 text-center">
             <p className="text-lg text-muted-foreground">Vendor profile could not be loaded.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/admin/ehr-vendors">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to EHR/LIMS Vendors List
                </Link>
              </Button>
        </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <ListTree className="mr-3 h-7 w-7" />
            EHR/LIMS Vendor: {currentVendor.label}
          </h1>
          <div>{/* Placeholder for global profile actions */}</div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto sm:h-12 mb-6 shadow-md"> {/* Adjusted grid-cols */}
            <TabsTrigger value="profile" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <ListTree className="mr-2 h-5 w-5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="hcos" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <Building className="mr-2 h-5 w-5" /> HCOs
            </TabsTrigger>
            <TabsTrigger value="documents" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <FileTextIcon className="mr-2 h-5 w-5" /> Documents
            </TabsTrigger>
            <TabsTrigger value="contacts" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <Users className="mr-2 h-5 w-5" /> Contacts
            </TabsTrigger>
            {/* Products Tab Removed */}
          </TabsList>

          <TabsContent value="profile">
            <EhrVendorProfileDetailsTab vendorValue={currentVendor.value} vendorLabel={currentVendor.label} />
          </TabsContent>
          <TabsContent value="hcos">
            <EhrVendorHcosTab hcos={hcosUsingThisVendor} isLoading={isContextLoading} />
          </TabsContent>
          <TabsContent value="documents">
            <EhrVendorDocumentsTab vendorValue={currentVendor.value} />
          </TabsContent>
          <TabsContent value="contacts">
            <EhrVendorContactsTab vendorValue={currentVendor.value} />
          </TabsContent>
          {/* Products Tab Content Removed */}
        </Tabs>
      </div>
    </ScrollArea>
  );
}
