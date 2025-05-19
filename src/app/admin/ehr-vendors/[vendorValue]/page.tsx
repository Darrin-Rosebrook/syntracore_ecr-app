
'use client';

import React, { useEffect, useState } from 'react';
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
import { EhrVendorProductsTab } from '@/components/ehr-vendor-products-tab';
import { fetchChplDevelopersAction } from '@/actions/chpl-api-actions';
import type { ChplDeveloper } from '@/types/chpl';
import { useAppContext } from '@/context/AppContext';
import type { EnrollmentData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function EhrVendorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { enrollments, isLoading: isContextLoading } = useAppContext();

  const [developer, setDeveloper] = useState<ChplDeveloper | null>(null);
  const [isLoadingDeveloper, setIsLoadingDeveloper] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hcosUsingThisDeveloper, setHcosUsingThisDeveloper] = useState<EnrollmentData[]>([]);

  // Debugging: Log params and vendorValue
  console.log("[EhrVendorProfilePage] Raw params from useParams:", params);
  const vendorValue = params?.vendorValue as string | undefined; // Explicitly type vendorValue
  console.log("[EhrVendorProfilePage] Extracted vendorValue:", vendorValue);

  const developerId = Number(vendorValue);
  console.log("[EhrVendorProfilePage] Parsed developerId (Number(vendorValue)):", developerId);
  console.log("[EhrVendorProfilePage] isNaN(developerId):", isNaN(developerId));


  useEffect(() => {
    async function loadDeveloperDetails() {
      console.log("[EhrVendorProfilePage] Inside loadDeveloperDetails. developerId:", developerId);
      if (!vendorValue || isNaN(developerId)) { // Check vendorValue directly as well
        setError("Invalid Developer ID in URL.");
        console.error("[EhrVendorProfilePage] Error: Invalid Developer ID. vendorValue:", vendorValue, "developerId:", developerId);
        setIsLoadingDeveloper(false);
        return;
      }
      setIsLoadingDeveloper(true);
      setError(null);
      
      const result = await fetchChplDevelopersAction();
      if (result.success && result.developers) {
        const foundDev = result.developers.find(d => d.developerId === developerId);
        if (foundDev) {
          setDeveloper(foundDev);
        } else {
          setError(`Developer with ID ${developerId} not found.`);
          console.warn(`[EhrVendorProfilePage] Developer with ID ${developerId} not found in fetched list.`);
        }
      } else {
        setError(result.error || `Failed to load developer details for ID ${developerId}.`);
        console.error(`[EhrVendorProfilePage] Failed to load developer details. Error: ${result.error}`);
      }
      setIsLoadingDeveloper(false);
    }

    loadDeveloperDetails();
  }, [developerId, vendorValue]); // Add vendorValue to dependency array

  useEffect(() => {
    if (developer && enrollments.length > 0) {
      // For demonstration, if `enrollment.ehrVendor` was the CHPL developer NAME:
      // const filteredHcos = enrollments.filter(e => e.ehrVendor === developer.name);
      // setHcosUsingThisDeveloper(filteredHcos);
      // For now, keeping it simple as linking is complex without proper ID mapping in enrollments
      setHcosUsingThisDeveloper([]);
    }
  }, [developer, enrollments]);

  if (isLoadingDeveloper) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading EHR/LIMS Vendor profile...</p>
      </div>
    );
  }

  if (error && !developer) {
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
  
  if (!developer) {
    // This state can occur if there was an error but developer wasn't set, or if still loading initially.
    // The error state above should catch most issues, but this is a fallback.
    return (
        <div className="container mx-auto py-8 text-center">
             <p className="text-lg text-muted-foreground">Developer profile could not be loaded.</p>
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
            EHR/LIMS Vendor: {developer.name}
          </h1>
          <div>{/* Placeholder for global profile actions */}</div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5 h-auto sm:h-12 mb-6 shadow-md">
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
            <TabsTrigger value="products" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
              <Package className="mr-2 h-5 w-5" /> Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <EhrVendorProfileDetailsTab vendorValue={developerId.toString()} vendorLabel={developer.name} />
          </TabsContent>
          <TabsContent value="hcos">
            <EhrVendorHcosTab hcos={hcosUsingThisDeveloper} isLoading={isContextLoading} />
          </TabsContent>
          <TabsContent value="documents">
            <EhrVendorDocumentsTab vendorValue={developerId.toString()} />
          </TabsContent>
          <TabsContent value="contacts">
            <EhrVendorContactsTab vendorValue={developerId.toString()} />
          </TabsContent>
          <TabsContent value="products">
            <EhrVendorProductsTab developerId={developerId} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
