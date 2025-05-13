
"use client";

import React, { useMemo } from 'react';
import type { EnrollmentData } from '@/types';
import { EHR_VENDORS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, ServerCog } from 'lucide-react'; // Using ListTree as primary icon

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

    // Add any vendors found in data but not in constants (e.g., "other" if it was free text, though current form is select)
    Object.keys(counts).forEach(dataVendorValue => {
      if (!stats.some(s => s.value === dataVendorValue)) {
        stats.push({
          label: dataVendorValue, // Display the value itself if no specific label
          value: dataVendorValue,
          count: counts[dataVendorValue],
        });
      }
    });
    // Filter out vendors with 0 count and sort by count descending, then by label
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
            EHR Vendor Distribution
          </CardTitle>
          <CardDescription>
            Overview of Electronic Health Record (EHR) vendors used by enrolled providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendorStats.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] border rounded-md"> {/* Adjusted height */}
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[70%]">EHR Vendor</TableHead>
                    <TableHead className="text-right w-[30%]">Providers Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorStats.map((stat) => (
                    <TableRow key={stat.value}>
                      <TableCell className="font-medium">{stat.label}</TableCell>
                      <TableCell className="text-right">{stat.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No EHR vendor data available from enrollments.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
