
"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { EnrollmentData } from '@/types';
import { EHR_VENDORS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, ChevronRight, Trash2 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface EhrVendorsTabProps {
  enrollments: EnrollmentData[];
}

interface VendorStat {
  label: string;
  value: string;
  type: string;
  count: number;
}

export function EhrVendorsTab({ enrollments }: EhrVendorsTabProps) {
  const [displayedVendors, setDisplayedVendors] = useState(EHR_VENDORS);
  const { toast } = useToast();

  const vendorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    enrollments.forEach(enrollment => {
      if (enrollment.ehrVendor) {
        counts[enrollment.ehrVendor] = (counts[enrollment.ehrVendor] || 0) + 1;
      }
    });

    const stats: VendorStat[] = displayedVendors.map(vendorConst => ({ // Use displayedVendors
      label: vendorConst.label,
      value: vendorConst.value,
      type: vendorConst.type,
      count: counts[vendorConst.value] || 0,
    }));

    // This part handles vendors found in enrollment data but not in the (potentially filtered) displayedVendors constant list
    // For instance, if a vendor was present in enrollments but somehow not in the initial EHR_VENDORS or a filtered list.
    // This is less likely if displayedVendors starts as EHR_VENDORS and is only filtered down.
    Object.keys(counts).forEach(dataVendorValue => {
      if (!stats.some(s => s.value === dataVendorValue)) {
        const originalVendorConstant = EHR_VENDORS.find(v => v.value === dataVendorValue);
        stats.push({
          label: originalVendorConstant ? originalVendorConstant.label : dataVendorValue, 
          value: dataVendorValue,
          type: originalVendorConstant ? originalVendorConstant.type : "Unknown",
          count: counts[dataVendorValue],
        });
      }
    });
    
    return stats
        .sort((a, b) => {
            if (b.count === a.count) {
                return a.label.localeCompare(b.label);
            }
            return b.count - a.count;
        });

  }, [enrollments, displayedVendors]);

  const handleRemoveVendor = (vendorValueToRemove: string) => {
    const vendorToRemove = displayedVendors.find(v => v.value === vendorValueToRemove);
    setDisplayedVendors(prevVendors =>
      prevVendors.filter(vendor => vendor.value !== vendorValueToRemove)
    );
    toast({ 
      title: "Vendor Removed", 
      description: `Vendor "${vendorToRemove?.label || vendorValueToRemove}" has been removed from the list for the current session.` 
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <ListTree className="mr-3 h-7 w-7 text-primary" />
            EHR/LIMS Vendor Distribution
          </CardTitle>
          <CardDescription>
            Overview of Electronic Health Record (EHR) and Laboratory Information Management System (LIMS) vendors. Click on a vendor name to view more details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendorStats.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[45%]">EHR/LIMS Vendor</TableHead>
                    <TableHead className="w-[20%]">Vendor Type</TableHead>
                    <TableHead className="text-right w-[20%]">Providers Count</TableHead>
                    <TableHead className="text-right w-[15%]">Actions</TableHead>
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
                      <TableCell>{stat.type}</TableCell>
                      <TableCell className="text-right">{stat.count}</TableCell>
                      <TableCell className="text-right flex justify-end items-center space-x-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={stat.count > 0}
                              title={stat.count > 0 ? "Cannot remove: Vendor is linked to HCOs" : "Remove vendor"}
                            >
                              <Trash2 className={`h-4 w-4 ${stat.count > 0 ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 'text-destructive hover:text-destructive/80'}`} />
                            </Button>
                          </AlertDialogTrigger>
                          {stat.count === 0 && (
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will remove "{stat.label}" from the list on this page. This vendor is not linked to any HCOs. This change is for the current session only and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveVendor(stat.value)}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                        <Link href={`/admin/ehr-vendors/${stat.value}`} passHref legacyBehavior>
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
              No EHR/LIMS vendor data available or all vendors have been removed from view.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

