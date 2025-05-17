
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Network, Building, ChevronRight, Loader2, Hash, Mail, Phone } from 'lucide-react';
import { OHIO_HEALTH_SYSTEMS } from '@/lib/constants';
import { useAppContext } from '@/context/AppContext';
import type { EnrollmentData } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function HealthSystemProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { healthSystemValue } = params;
  const { enrollments, isLoading: isContextLoading } = useAppContext();

  const healthSystemDetails = useMemo(() => {
    if (typeof healthSystemValue !== 'string') return null;
    return OHIO_HEALTH_SYSTEMS.find(hs => hs.value === healthSystemValue);
  }, [healthSystemValue]);

  const linkedHcos = useMemo(() => {
    if (!healthSystemDetails) return [];
    return enrollments.filter(
      (enrollment: EnrollmentData) => enrollment.practiceInfo.healthSystem === healthSystemDetails.value
    );
  }, [enrollments, healthSystemDetails]);
  
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


  if (isContextLoading && !healthSystemDetails) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Health System profile...</p>
      </div>
    );
  }

  if (!healthSystemDetails) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Health System Not Found</h1>
        <p className="text-muted-foreground mb-6">The health system with ID "{healthSystemValue}" could not be found.</p>
        <Button asChild variant="outline" onClick={() => router.back()}>
          <Link href="/admin/health-systems"> {/* Fallback link */}
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Health Systems List
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <Network className="mr-3 h-7 w-7" />
            Health System: {healthSystemDetails.label}
          </h1>
          <div>{/* Placeholder for actions */}</div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Health System Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-md">{healthSystemDetails.label}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Identifier</Label>
              <p className="text-md">{healthSystemDetails.value}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Location</Label>
              <p className="text-md">{healthSystemDetails.location}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Address</Label>
              <p className="text-md italic text-muted-foreground">(Address details not yet available)</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Primary Contact</Label>
              <p className="text-md italic text-muted-foreground">(Contact info not yet available)</p>
            </div>
             <div>
              <Label className="text-sm font-medium text-muted-foreground">Total Affiliated HCOs</Label>
              <p className="text-md">{linkedHcos.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              Affiliated Health Care Organizations ({linkedHcos.length})
            </CardTitle>
            <CardDescription>
              List of HCOs associated with {healthSystemDetails.label}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isContextLoading && linkedHcos.length === 0 ? (
                 <div className="flex justify-center items-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading affiliated HCOs...</span>
                </div>
            ) : linkedHcos.length > 0 ? (
              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>HCO Name</TableHead>
                      <TableHead>NPI</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedHcos.map((hco) => (
                      <TableRow key={hco.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link href={`/provider-profile/${hco.id}`} className="text-primary hover:underline">
                            {hco.practiceInfo.name}
                          </Link>
                        </TableCell>
                        <TableCell>{hco.practiceInfo.organizationNPI || 'N/A'}</TableCell>
                        <TableCell>
                            <div className="text-sm">{hco.contactDetails.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                                <Mail className="mr-1 h-3 w-3"/> {hco.contactDetails.email}
                            </div>
                             {hco.contactDetails.phone && 
                                <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                                    <Phone className="mr-1 h-3 w-3"/> {hco.contactDetails.phone}
                                </div>
                             }
                        </TableCell>
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
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No Health Care Organizations are currently linked to this Health System.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
