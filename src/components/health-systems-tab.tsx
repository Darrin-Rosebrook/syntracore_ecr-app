
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Network, ChevronRight, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import type { EnrollmentData, HealthSystemEntry } from '@/types';
import { Button } from '@/components/ui/button'; // Ensure Button is imported

interface HealthSystemDisplayInfo extends HealthSystemEntry {
  hcoCount: number;
}

export function HealthSystemsTab() {
  const { enrollments, healthSystems, isLoading: isContextLoading } = useAppContext();

  const healthSystemsWithCounts = useMemo((): HealthSystemDisplayInfo[] => {
    if (isContextLoading || !healthSystems) return [];
    return healthSystems.map(system => {
      const count = enrollments.filter(
        (enrollment: EnrollmentData) => enrollment.practiceInfo.healthSystem === system.id
      ).length;
      return { ...system, hcoCount: count };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [enrollments, healthSystems, isContextLoading]);

    // ✅ Add the useEffect here
    React.useEffect(() => {
      console.log('[HealthSystemsTab] Component mounted');
    }, []);
    
  if (isContextLoading && healthSystems.length === 0) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Health Systems...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Network className="mr-3 h-7 w-7 text-primary" />
            Registered Health Systems
          </CardTitle>
          <CardDescription>
            List of registered health systems. Click on a system name to view more details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthSystemsWithCounts.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50%]">Health System Name</TableHead>
                    <TableHead className="w-[25%]">Primary Contact Email</TableHead>
                    <TableHead className="text-right w-[20%]">Affiliated HCO Count</TableHead>
                    <TableHead className="text-right w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthSystemsWithCounts.map((system: HealthSystemDisplayInfo) => {
                    console.log(`[HealthSystemsTab] Creating link for system: ${system.name}, ID: ${system.id}`); // Added console.log
                    return (
                      <TableRow key={system.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link href={`/admin/health-systems/${system.id}`} className="text-primary hover:underline">
                            {system.name}
                          </Link>
                        </TableCell>
                        <TableCell>{system.contactEmail || 'N/A'}</TableCell>
                        <TableCell className="text-right">{system.hcoCount}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/health-systems/${system.id}`} title="View Health System Details">
                            <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-primary inline-block" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No health systems registered yet. Health Systems can register via the main landing page.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

