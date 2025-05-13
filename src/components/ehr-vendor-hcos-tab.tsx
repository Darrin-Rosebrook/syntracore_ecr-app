
'use client';

import React from 'react';
import Link from 'next/link';
import type { EnrollmentData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface EhrVendorHcosTabProps {
  hcos: EnrollmentData[];
  isLoading: boolean;
}

export function EhrVendorHcosTab({ hcos, isLoading }: EhrVendorHcosTabProps) {
  
  const getStatusBadgeVariant = (status: EnrollmentData['status']) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Changes Requested': return 'destructive';
      case 'Denied': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusBadgeClass = (status: EnrollmentData['status']) => {
     switch (status) {
      case 'Approved': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'Pending': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'Changes Requested': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'Denied': return 'bg-red-700 hover:bg-red-800 text-white';
      default: return '';
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading HCOs...</span>
      </div>
    );
  }

  if (hcos.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <Building className="mr-2 h-5 w-5 text-primary" />
            Health Care Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No Health Care Organizations are currently using this EHR vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <Building className="mr-2 h-5 w-5 text-primary" />
          Health Care Organizations ({hcos.length})
        </CardTitle>
        <CardDescription>
          List of Health Care Organizations (HCOs) using this EHR vendor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-24rem)] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>HCO Name</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hcos.map((hco) => (
                <TableRow key={hco.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link href={`/provider-profile/${hco.id}`} className="text-primary hover:underline">
                      {hco.practiceInfo.name}
                    </Link>
                  </TableCell>
                  <TableCell>{hco.practiceInfo.organizationNPI || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(hco.status)} className={getStatusBadgeClass(hco.status)}>
                      {hco.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{hco.submissionDate ? format(parseISO(hco.submissionDate), 'PP') : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/provider-profile/${hco.id}`}>
                        <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
