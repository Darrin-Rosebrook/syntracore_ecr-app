
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { EnrollmentData } from '@/types';
import { EHR_VENDORS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, ChevronRight } from 'lucide-react'; // Added ChevronRight

interface EhrVendorsTabProps {
  enrollments: EnrollmentData[];
}

interface VendorStat {
  label: string;
  value: string;
  count: number;
}

export function EhrVendorsTab({ enrollments }: EhrVendorsTabProps) {
  const vendorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    enrollments.forEach(enrollment => {
      if (enrollment.ehrVendor) {
        counts[enrollment.ehrVendor] = (counts[enrollment.ehrVendor] || 0) + 1;
      }
    });

    const stats: VendorStat[] = EHR_VENDORS.map(vendorConst => ({
      label: vendorConst.label,
      value: vendorConst.value,
      count: counts[vendorConst.value] || 0,
    }));

    Object.keys(counts).forEach(dataVendorValue => {
      if (!stats.some(s => s.value === dataVendorValue)) {
        stats.push({
          label: dataVendorValue, 
          value: dataVendorValue,
          count: counts[dataVendorValue],
        });
      }
    });
    return stats
        .filter(stat => stat.count > 0)
        .sort((a, b) => {
            if (b.count === a.count) {
                return a.label.localeCompare(b.label);
            }
            return b.count - a.count;
        });

  }, [enrollments]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <ListTree className="mr-3 h-7 w-7 text-primary" />
            EHR/LIMS Vendor Distribution
          </CardTitle>
          <CardDescription>
            Overview of Electronic Health Record (EHR) and Laboratory Information Management System (LIMS) vendors used by enrolled providers. Click on a vendor name to view more details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendorStats.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[65%]">EHR/LIMS Vendor</TableHead>
                    <TableHead className="text-right w-[30%]">Providers Count</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorStats.map((stat) => (
                    <TableRow key={stat.value} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/admin/ehr-vendors/${stat.value}`} className="text-primary hover:underline">
                          {stat.label}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{stat.count}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/ehr-vendors/${stat.value}`}>
                          <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-primary" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No EHR/LIMS vendor data available from enrollments.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

