
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { EHR_VENDORS } from '@/lib/constants';
import type { EnrollmentData } from '@/types';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, ListTree, Users, FileTextIcon, Building } from 'lucide-react';

import { EhrVendorProfileDetailsTab } from '@/components/ehr-vendor-profile-details-tab';
import { EhrVendorHcosTab } from '@/components/ehr-vendor-hcos-tab';
import { EhrVendorDocumentsTab } from '@/components/ehr-vendor-documents-tab';
import { EhrVendorContactsTab } from '@/components/ehr-vendor-contacts-tab';

export default function EhrVendorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { vendorValue } = params;
  const { enrollments, isLoading: isContextLoading } = useAppContext();

  const [vendorLabel, setVendorLabel] = useState<string | null>(null);
  const [hcosUsingVendor, setHcosUsingVendor] = useState<EnrollmentData[]>([]);

  useEffect(() => {
    if (typeof vendorValue === 'string') {
      const foundVendor = EHR_VENDORS.find(v => v.value === vendorValue);
      setVendorLabel(foundVendor ? foundVendor.label : vendorValue); // Fallback to value if not found

      if (enrollments.length > 0) {
        const filteredHcos = enrollments.filter(e => e.ehrVendor === vendorValue);
        setHcosUsingVendor(filteredHcos);
      }
    }
  }, [vendorValue, enrollments]);

  if (isContextLoading && !vendorLabel) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading EHR Vendor profile...</p>
      </div>
    );
  }

  if (!vendorLabel && !isContextLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">EHR Vendor Not Found</h1>
        <p className="text-muted-foreground mb-6">The vendor with ID "{vendorValue}" could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/admin/ehr-vendors"> {/* Assuming the list is at /admin/ehr-vendors or similar. Update if needed */}
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to EHR Vendors List
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!vendorLabel) return null; // Should be caught by above

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
            EHR Vendor: {vendorLabel}
          </h1>
          <div>{/* Placeholder for global profile actions */}</div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto sm:h-12 mb-6 shadow-md">
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
          </TabsList>

          <TabsContent value="profile">
            <EhrVendorProfileDetailsTab vendorValue={typeof vendorValue === 'string' ? vendorValue : ''} vendorLabel={vendorLabel} />
          </TabsContent>
          <TabsContent value="hcos">
            <EhrVendorHcosTab hcos={hcosUsingVendor} isLoading={isContextLoading} />
          </TabsContent>
          <TabsContent value="documents">
            <EhrVendorDocumentsTab vendorValue={typeof vendorValue === 'string' ? vendorValue : ''} />
          </TabsContent>
          <TabsContent value="contacts">
            <EhrVendorContactsTab vendorValue={typeof vendorValue === 'string' ? vendorValue : ''} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
