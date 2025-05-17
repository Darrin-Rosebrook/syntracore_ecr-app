
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { getPhaUsersAction } from '@/actions/user-actions';
import { getVendorsAction } from '@/actions/vendor-actions';
import { EHR_VENDORS, OHIO_HEALTH_SYSTEMS } from '@/lib/constants';
import type { EnrollmentData, PhaUser, VendorProfileData } from '@/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, SearchIcon, Building, User, ListTree, Network, ChevronRight, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SearchResultItem {
  id: string;
  name: string;
  description?: string;
  type: 'HCO' | 'PHA User' | 'EHR/LIMS Vendor Profile' | 'EHR/LIMS Vendor (Constant)' | 'Health System';
  link: string;
  data?: any; // Original data object for potential display
}

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { enrollments, isLoading: isLoadingEnrollments } = useAppContext();
  const [phaUsers, setPhaUsers] = useState<PhaUser[]>([]);
  const [vendorProfiles, setVendorProfiles] = useState<VendorProfileData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (query) { // Only fetch if there's a query, or adjust if you want to show all on empty query
        setIsLoadingUsers(true);
        const usersResult = await getPhaUsersAction();
        if (usersResult.success && usersResult.users) {
          setPhaUsers(usersResult.users);
        }
        setIsLoadingUsers(false);

        setIsLoadingVendors(true);
        const vendorsResult = await getVendorsAction();
        if (vendorsResult.success && vendorsResult.vendors) {
          setVendorProfiles(vendorsResult.vendors);
        }
        setIsLoadingVendors(false);
      } else {
        // Clear data if query is empty
        setPhaUsers([]);
        setVendorProfiles([]);
      }
    }
    fetchData();
  }, [query]);

  const searchResults = useMemo((): SearchResultItem[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    const queryWithoutSpaces = lowerQuery.replace(/\s+/g, '');
    let results: SearchResultItem[] = [];

    // Search HCOs (Enrollments)
    enrollments.forEach(e => {
      if (
        e.practiceInfo.name.toLowerCase().includes(lowerQuery) ||
        (e.practiceInfo.organizationNPI && e.practiceInfo.organizationNPI.includes(lowerQuery)) ||
        e.contactDetails.name.toLowerCase().includes(lowerQuery) ||
        e.contactDetails.email.toLowerCase().includes(lowerQuery) ||
        (e.additionalContacts && e.additionalContacts.some(c => c.name.toLowerCase().includes(lowerQuery) || c.email.toLowerCase().includes(lowerQuery)))
      ) {
        results.push({
          id: e.id,
          name: e.practiceInfo.name,
          description: `NPI: ${e.practiceInfo.organizationNPI || 'N/A'}, Contact: ${e.contactDetails.name}`,
          type: 'HCO',
          link: `/provider-profile/${e.id}`,
          data: e,
        });
      }
    });

    // Search PHA Users
    phaUsers.forEach(u => {
      if (
        u.name.toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery) ||
        (u.username && u.username.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          id: u.id,
          name: u.name,
          description: `Email: ${u.email}, Role: ${u.role}`,
          type: 'PHA User',
          link: `/admin/manage-users#user-${u.id}`, // Link to user section or profile if exists
          data: u
        });
      }
    });

    // Search Vendor Profiles (from Firestore)
    vendorProfiles.forEach(v => {
      if (
        v.vendorName.toLowerCase().includes(lowerQuery) ||
        v.contactName.toLowerCase().includes(lowerQuery) ||
        v.email.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: v.userId, // Using userId as ID for these profile entries
          name: v.vendorName,
          description: `Contact: ${v.contactName}, System: ${v.representedEhrSystemValue}`,
          type: 'EHR/LIMS Vendor Profile',
          link: `/vendor-portal`, // or a specific vendor profile page if created: `/admin/ehr-vendors/${v.representedEhrSystemValue}?profileId=${v.userId}`
          data: v,
        });
      }
    });
    
    // Search EHR/LIMS Vendors (Constants)
    EHR_VENDORS.forEach(v => {
      if (v.label.toLowerCase().includes(lowerQuery)) {
        // Avoid duplicating if already found via Vendor Profiles with same representedEhrSystemValue
        if (!results.some(r => r.type === 'EHR/LIMS Vendor Profile' && r.data?.representedEhrSystemValue === v.value)) {
             results.push({
                id: v.value,
                name: v.label,
                description: `Type: ${v.type}`,
                type: 'EHR/LIMS Vendor (Constant)',
                link: `/admin/ehr-vendors/${v.value}`,
                data: v,
            });
        }
      }
    });

    // Search Health Systems (Constants)
    OHIO_HEALTH_SYSTEMS.forEach(hs => {
      const labelWithoutSpaces = hs.label.toLowerCase().replace(/\s+/g, '');
      if (
        hs.label.toLowerCase().includes(lowerQuery) || // Original check
        labelWithoutSpaces.includes(queryWithoutSpaces)   // New check without spaces
      ) {
        results.push({
          id: hs.value,
          name: hs.label,
          description: `Location: ${hs.location}`,
          type: 'Health System',
          link: `/admin/health-systems/${hs.value}`,
          data: hs,
        });
      }
    });


    return results;
  }, [query, enrollments, phaUsers, vendorProfiles]);

  const categorizedResults = useMemo(() => {
    const categories: Record<SearchResultItem['type'], SearchResultItem[]> = {
      'HCO': [],
      'PHA User': [],
      'EHR/LIMS Vendor Profile': [],
      'EHR/LIMS Vendor (Constant)': [],
      'Health System': [],
    };
    searchResults.forEach(result => {
      if (categories[result.type]) {
        categories[result.type].push(result);
      }
    });
    return categories;
  }, [searchResults]);

  const isLoading = isLoadingEnrollments || isLoadingUsers || isLoadingVendors;

  if (isLoading && query) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Searching...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center">
            <SearchIcon className="mr-3 h-8 w-8 text-primary" />
            Search Results
          </h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>

        {query ? (
          <p className="text-muted-foreground">
            Showing results for: <span className="font-semibold text-foreground">{query}</span>
          </p>
        ) : (
          <p className="text-muted-foreground text-center py-10">
            Please enter a search term in the header to find HCOs, users, vendors, and more.
          </p>
        )}

        {query && searchResults.length === 0 && !isLoading && (
          <Card className="shadow-md">
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-semibold">No Results Found</p>
              <p className="text-muted-foreground">Try a different search term.</p>
            </CardContent>
          </Card>
        )}

        {Object.entries(categorizedResults).map(([category, items]) => {
          if (items.length === 0) return null;
          let IconComponent = Building;
          if (category === 'PHA User') IconComponent = User;
          if (category === 'EHR/LIMS Vendor Profile' || category === 'EHR/LIMS Vendor (Constant)') IconComponent = ListTree;
          if (category === 'Health System') IconComponent = Network;

          return (
            <Card key={category} className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <IconComponent className="mr-2 h-5 w-5 text-primary" />
                  {category} ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                      <Link href={item.link} className="flex items-center justify-between group">
                        <div>
                          <h3 className="font-semibold text-primary group-hover:underline">{item.name}</h3>
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

