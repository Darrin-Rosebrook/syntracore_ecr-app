
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Network, ChevronRight } from 'lucide-react';
import { OHIO_HEALTH_SYSTEMS } from '@/lib/constants'; // Import the new constant

interface HealthSystem {
  label: string;
  value: string;
  location: string;
  hcoCount: number; // Placeholder for now
}

export function HealthSystemsTab() {
  const healthSystems: HealthSystem[] = OHIO_HEALTH_SYSTEMS;

  // In a real application, hcoCount would be derived from actual HCO affiliations.
  // For now, it's part of the constant or defaulted to 0.

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Network className="mr-3 h-7 w-7 text-primary" />
            Health Systems (Parent Organizations) - Ohio
          </CardTitle>
          <CardDescription>
            List of major health systems in Ohio. Click on a system name to view more details (future functionality).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthSystems.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-20rem)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50%]">Health System Name</TableHead>
                    <TableHead className="w-[25%]">Location</TableHead>
                    <TableHead className="text-right w-[20%]">Affiliated HCO Count</TableHead>
                    <TableHead className="text-right w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthSystems.map((system) => (
                    <TableRow key={system.value} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {/* Placeholder link, actual profile pages would need to be created */}
                        <Link href={`/admin/health-systems/${system.value}`} className="text-primary hover:underline">
                          {system.label}
                        </Link>
                      </TableCell>
                      <TableCell>{system.location}</TableCell>
                      <TableCell className="text-right">{system.hcoCount}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/health-systems/${system.value}`} passHref legacyBehavior>
                            <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No health systems data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
