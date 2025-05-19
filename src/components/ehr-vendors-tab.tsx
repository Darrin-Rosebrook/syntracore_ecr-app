"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { fetchChplDevelopersAction } from '@/actions/chpl-api-actions';
import type { ChplDeveloper } from '@/types/chpl';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function EhrVendorsTab() {
  const [developers, setDevelopers] = useState<ChplDeveloper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadDevelopers() {
      setIsLoading(true);
      setError(null);
      const result = await fetchChplDevelopersAction();
      if (result.success && result.developers) {
        // Filter for developers with "Active" status
        const activeDevelopers = result.developers.filter(dev => dev.status?.name.toLowerCase() === 'active');
        setDevelopers(activeDevelopers.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setError(result.error || "Failed to load EHR/LIMS vendors.");
        toast({
          title: "Error Loading Vendors",
          description: result.error || "Could not fetch vendors from CHPL.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
    loadDevelopers();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading EHR/LIMS Vendors from CHPL...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl m-4 md:m-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center text-destructive">
            <AlertCircle className="mr-3 h-7 w-7" />
            Error Loading Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-muted-foreground mt-2">Please ensure the CHPL API key is correctly configured in your .env file and the CHPL API service is available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <ListTree className="mr-3 h-7 w-7 text-primary" />
            EHR/LIMS Vendor (Companies) from CHPL
          </CardTitle>
          <CardDescription>
            List of active Health IT developers sourced from the ONC CHPL. Click on a vendor name to view more details and their certified products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {developers.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[70%]">Developer Name</TableHead>
                    <TableHead className="w-[20%]">CHPL ID</TableHead>
                    <TableHead className="text-right w-[10%]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {developers.map((dev) => (
                    <TableRow key={dev.developerId} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/admin/ehr-vendors/${dev.developerId}`} className="text-primary hover:underline">
                          {dev.name}
                        </Link>
                        {dev.status && dev.status.name.toLowerCase() !== 'active' && (
                            <Badge variant="outline" className="ml-2 text-xs">{dev.status.name}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{dev.developerCode} ({dev.developerId})</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/ehr-vendors/${dev.developerId}`} passHref legacyBehavior>
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
              No active EHR/LIMS vendors found from CHPL or failed to load data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}