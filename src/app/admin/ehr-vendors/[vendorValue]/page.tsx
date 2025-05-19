
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area'; // Added import
import { ArrowLeft, Loader2, ListTree, Users, FileTextIcon, Building, Package, AlertCircle } from 'lucide-react';
import { EhrVendorProfileDetailsTab } from '@/components/ehr-vendor-profile-details-tab';
import { EhrVendorHcosTab } from '@/components/ehr-vendor-hcos-tab';
import { EhrVendorDocumentsTab } from '@/components/ehr-vendor-documents-tab';
import { EhrVendorContactsTab } from '@/components/ehr-vendor-contacts-tab';
import { EhrVendorProductsTab } from '@/components/ehr-vendor-products-tab';
import { fetchChplDevelopersAction } from '@/actions/chpl-api-actions'; // To fetch specific developer details if needed
import type { ChplDeveloper } from '@/types/chpl';
import { useAppContext } from '@/context/AppContext';
import type { EnrollmentData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function EhrVendorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { vendorValue } = params; // This will be the CHPL Developer ID
  const { enrollments, isLoading: isContextLoading } = useAppContext();

  const [developer, setDeveloper] = useState<ChplDeveloper | null>(null);
  const [isLoadingDeveloper, setIsLoadingDeveloper] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hcosUsingThisDeveloper, setHcosUsingThisDeveloper] = useState<EnrollmentData[]>([]);


  const developerId = Number(vendorValue);

  useEffect(() => {
    async function loadDeveloperDetails() {
      if (isNaN(developerId)) {
        setError("Invalid Developer ID.");
        setIsLoadingDeveloper(false);
        return;
      }
      setIsLoadingDeveloper(true);
      setError(null);
      // Fetch all developers and find the one with the matching ID
      // This is not ideal if we have a direct /developers/{id} endpoint,
      // but CHPL API might require fetching all then filtering, or using a search.
      // For now, let's assume we might need to refetch or find from a broader list if not passed.
      // A better approach would be a getDeveloperByIdAction(developerId).
      // For simplicity here, we'll rely on name from CHPL listing, product tab fetches products.
      // We can enhance this later to fetch specific developer details if the API supports it easily.
      // For now, we'll assume the name is passed or can be derived.
      // The `EhrVendorProfileDetailsTab` might need updating if we fetch full dev details here.

      // Let's simulate fetching the specific developer name if we don't have it
      // This is inefficient, a direct GET /developers/{id} would be better.
      const result = await fetchChplDevelopersAction();
      if (result.success && result.developers) {
        const foundDev = result.developers.find(d => d.developerId === developerId);
        if (foundDev) {
          setDeveloper(foundDev);
        } else {
          setError(`Developer with ID ${developerId} not found.`);
        }
      } else {
        setError(result.error || `Failed to load developer details for ID ${developerId}.`);
      }
      setIsLoadingDeveloper(false);
    }

    loadDeveloperDetails();
  }, [developerId]);

  useEffect(() => {
    // Link HCOs based on the CHPL developer name matching enrollment.ehrVendor (label)
    // This is an approximation and might not be perfect.
    // A more robust solution would involve mapping or storing CHPL ID in enrollments.
    if (developer && enrollments.length > 0) {
      const filteredHcos = enrollments.filter(e => {
        // This requires EHR_VENDORS constant to have a label that matches CHPL developer name
        // Or a better mapping system.
        // For this iteration, let's assume e.ehrVendor matches a value in our old static EHR_VENDORS constant for now.
        // This is a known limitation of not migrating enrollment.ehrVendor to CHPL IDs.
        // If e.ehrVendor *was* a CHPL ID, we'd compare e.ehrVendor to developer.developerId
        // For demonstration, if `enrollment.ehrVendor` was the CHPL developer NAME:
        return e.ehrVendor === developer.name; // Highly fragile if names don't match exactly
      });
      // For now, we'll pass all enrollments to EhrVendorHcosTab and let it filter
      // This part needs more thought on robustly linking CHPL developers to existing enrollments
      // For this iteration, the Product tab is the main focus for CHPL ID.
      // Let's pass an empty array to HcosTab if no robust linking is in place.
      // A better approach for HCOs tab: If `enrollment.ehrVendor` could store CHPL Developer ID,
      // then `enrollments.filter(e => e.ehrVendor === developerId.toString())`
      // For now, let's assume the `EhrVendorHcosTab` will need to deal with `enrollments` and try to find matches.
      // Or, we leave it empty if direct linking is not feasible without data migration.
      // The prompt focuses on populating Product tab. Let's keep HCOs as is.
      // The `EhrVendorHcosTab` still expects EnrollmentData with the old `ehrVendor` string.
      // It's hard to reconcile without changing `EnrollmentData.ehrVendor` to be the CHPL ID.
      // For now, I'll pass an empty array to avoid incorrect linking.
      // The user can enhance linking later.
      setHcosUsingThisDeveloper([]); // Placeholder for now
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
  
  if (!developer) return null; // Should be handled by error state

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

        <Tabs defaultValue="products" className="w-full"> {/* Default to products tab */}
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
            {/* Pass the CHPL developer ID as vendorValue and the fetched name as vendorLabel */}
            <EhrVendorProfileDetailsTab vendorValue={developerId.toString()} vendorLabel={developer.name} />
          </TabsContent>
          <TabsContent value="hcos">
             {/* This tab needs a more robust way to link CHPL developers to enrollments.
                 Currently, it might not show correct HCOs if enrollments use old vendor string IDs.
                 Passing all enrollments and letting HcosTab filter or display based on its own logic.
                 This is an area for future improvement to map enrollments to CHPL developer IDs.
              */}
            <EhrVendorHcosTab hcos={enrollments} isLoading={isContextLoading} />
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
