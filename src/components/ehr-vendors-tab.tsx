
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { EHR_VENDORS } from '@/lib/constants'; // Import the local constants
import { useAppContext } from '@/context/AppContext'; // To get enrollments for HCO count
import type { EnrollmentData } from '@/types';
import { Badge } from '@/components/ui/badge';

interface DisplayVendor {
  value: string;
  label: string;
  type: "EHR" | "LIMS";
  hcoCount: number;
}

export function EhrVendorsTab() {
  const { enrollments, isLoading: isLoadingEnrollments } = useAppContext();
  const [displayVendors, setDisplayVendors] = useState<DisplayVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoadingEnrollments) {
      const vendorsWithCounts = EHR_VENDORS.map(vendor => {
        const count = enrollments.filter(
          (enrollment: EnrollmentData) => enrollment.ehrVendor === vendor.value
        ).length;
        return { ...vendor, hcoCount: count };
      }).sort((a,b) => a.label.localeCompare(b.label)); // Sort alphabetically by label
      setDisplayVendors(vendorsWithCounts);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [enrollments, isLoadingEnrollments]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading EHR/LIMS Vendors...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <ListTree className="mr-3 h-7 w-7 text-primary" />
            EHR/LIMS Vendors
          </CardTitle>
          <CardDescription>
            List of EHR/LIMS vendors. Click on a vendor name to view more details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayVendors.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[40%]">Vendor Name</TableHead>
                    <TableHead className="w-[25%]">Vendor Type</TableHead>
                    <TableHead className="w-[25%]">Associated HCO Count</TableHead>
                    <TableHead className="text-right w-[10%]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayVendors.map((vendor) => (
                    <TableRow key={vendor.value} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/admin/ehr-vendors/${vendor.value}`} className="text-primary hover:underline">
                          {vendor.label}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vendor.type}</Badge>
                      </TableCell>
                      <TableCell>{vendor.hcoCount}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/ehr-vendors/${vendor.value}`} passHref legacyBehavior>
                          <Button variant="ghost" size="icon" title="View Vendor Details" asChild>
                            <a><ChevronRight className="h-5 w-5 text-muted-foreground hover:text-primary" /></a>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No EHR/LIMS vendors found or enrollments data is still loading.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
