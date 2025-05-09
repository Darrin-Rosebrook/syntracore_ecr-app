
"use client";

import * as React from 'react';
import { useState } from "react";
import Link from 'next/link';
import type { EnrollmentData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit3, Eye, ChevronDown, ChevronUp, Loader2, Search, Info } from "lucide-react";
import { FHIRValidationDisplay } from "./fhir-validation-display";
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface PHAReviewerDashboardProps {
  enrollments: EnrollmentData[];
  updateEnrollmentStatus: (id: string, status: EnrollmentData['status'], comments?: string) => Promise<void>;
  isLoadingContext: boolean; // From AppContext
}

export function PHAReviewerDashboard({ enrollments, updateEnrollmentStatus, isLoadingContext }: PHAReviewerDashboardProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false); // Local loading for specific actions
  const { toast } = useToast();

  const [requestChangesModalOpen, setRequestChangesModalOpen] = useState(false);
  const [currentEnrollmentForModal, setCurrentEnrollmentForModal] = useState<EnrollmentData | null>(null);
  const [changeRequestComments, setChangeRequestComments] = useState("");

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.practiceInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.contactDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    setIsProcessingAction(true);
    await updateEnrollmentStatus(id, "Approved");
    setIsProcessingAction(false);
    toast({ title: "Enrollment Approved", description: `Enrollment ID ${id.slice(0,6)}... has been approved.`});
  };
  
  const openRequestChangesModal = (enrollment: EnrollmentData) => {
    setCurrentEnrollmentForModal(enrollment);
    setChangeRequestComments("");
    setRequestChangesModalOpen(true);
  };

  const handleRequestChanges = async () => {
    if (!currentEnrollmentForModal || !changeRequestComments.trim()) {
      toast({ title: "Missing Information", description: "Please provide comments for the change request.", variant: "destructive"});
      return;
    }
    setIsProcessingAction(true);
    await updateEnrollmentStatus(currentEnrollmentForModal.id, "Changes Requested", changeRequestComments);
    setIsProcessingAction(false);
    setRequestChangesModalOpen(false);
    toast({ title: "Changes Requested", description: `Change request sent for enrollment ID ${currentEnrollmentForModal.id.slice(0,6)}...`});
  };

  const getStatusBadgeVariant = (status: EnrollmentData['status']) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Changes Requested': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusBadgeClass = (status: EnrollmentData['status']) => {
     switch (status) {
      case 'Approved': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'Pending': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'Changes Requested': return 'bg-orange-500 hover:bg-orange-600 text-white';
      default: return '';
    }
  }

  const renderAdditionalData = (additionalData?: Record<string, any>) => {
    if (!additionalData || Object.keys(additionalData).length === 0) {
      return null;
    }
    return (
      <div className="space-y-2 mt-3 p-3 border rounded-md bg-secondary/30">
        <h5 className="font-semibold text-md flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Additional Information:</h5>
        {Object.entries(additionalData).map(([key, value]) => {
          let displayValue = value;
          if (typeof value === 'boolean') {
            displayValue = value ? "Yes" : "No";
          } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)) {
            try {
              displayValue = format(parseISO(value), "PPP");
            } catch (e) { /* Do nothing, use original string */ }
          } else if (Array.isArray(value)) {
            displayValue = value.join(', ');
          }
          return (
            <p key={key} className="text-sm">
              <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(displayValue)}
            </p>
          );
        })}
      </div>
    );
  };

  const totalLoading = isLoadingContext || isProcessingAction;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">PHA Reviewer Dashboard</CardTitle>
          <CardDescription>Manage and review provider enrollments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center">
            <Search className="absolute ml-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search enrollments (name, contact, status)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-1/2 lg:w-1/3"
              disabled={isLoadingContext && enrollments.length === 0}
            />
          </div>
          {isLoadingContext && enrollments.length === 0 && (
            <div className="flex justify-center items-center p-4 h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading enrollments...</span>
            </div>
          )}
          {totalLoading && enrollments.length > 0 && ( // Show spinner on top of table if actions are processing
             <div className="absolute inset-0 bg-background/50 flex justify-center items-center z-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}
          {(!isLoadingContext || enrollments.length > 0) && (
            <ScrollArea className="h-[calc(100vh-22rem)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Practice Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.length > 0 ? filteredEnrollments.map((enrollment) => (
                    <React.Fragment key={enrollment.id}>
                      <TableRow className={totalLoading ? 'opacity-50 pointer-events-none' : ''}>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => toggleRow(enrollment.id)} aria-label={expandedRow === enrollment.id ? "Collapse row" : "Expand row"} disabled={totalLoading}>
                            {expandedRow === enrollment.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/provider-profile/${enrollment.id}`} className={`text-primary hover:underline ${totalLoading ? 'pointer-events-none' : ''}`}>
                            {enrollment.practiceInfo.name}
                          </Link>
                        </TableCell>
                        <TableCell>{enrollment.contactDetails.name}</TableCell>
                        <TableCell>{enrollment.submissionDate ? format(parseISO(enrollment.submissionDate), 'P') : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(enrollment.status)} className={getStatusBadgeClass(enrollment.status)}>
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={totalLoading}>
                                {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Actions"}
                                {!isProcessingAction && <ChevronDown className="ml-1 h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleRow(enrollment.id)} disabled={totalLoading}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild disabled={totalLoading}>
                                 <Link href={`/provider-profile/${enrollment.id}`} className="flex items-center w-full cursor-pointer">
                                  <Edit3 className="mr-2 h-4 w-4" /> View/Edit Profile
                                </Link>
                              </DropdownMenuItem>
                              {enrollment.status === 'Pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(enrollment.id)} disabled={totalLoading}>
                                    <Check className="mr-2 h-4 w-4" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openRequestChangesModal(enrollment)} disabled={totalLoading}>
                                    <Edit3 className="mr-2 h-4 w-4" /> Request Changes
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedRow === enrollment.id && (
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableCell colSpan={6}>
                            <div className="p-4 space-y-3">
                              <h4 className="font-semibold">Enrollment Details:</h4>
                              <p><strong>Practice Phone:</strong> {enrollment.practiceInfo.phone}</p>
                              <p><strong>Practice Address:</strong> {enrollment.practiceInfo.address}</p>
                              <p><strong>Contact Email:</strong> {enrollment.contactDetails.email}</p>
                              <p><strong>Contact Phone:</strong> {enrollment.contactDetails.phone}</p>
                              <p><strong>EHR Vendor:</strong> {enrollment.ehrVendor}</p>
                              {enrollment.ccdDocumentName && <p><strong>Document:</strong> {enrollment.ccdDocumentName}</p>}
                              
                              {renderAdditionalData(enrollment.additionalData)}

                              {enrollment.validationResult && (
                                  <FHIRValidationDisplay result={enrollment.validationResult} />
                              )}
                              {enrollment.status === "Changes Requested" && enrollment.validationResult?.messages.find(msg => msg.startsWith("PHA Comments:")) && (
                                  <Card className="mt-2">
                                      <CardHeader><CardTitle className="text-md">PHA Reviewer Comments</CardTitle></CardHeader>
                                      <CardContent>
                                          <p className="text-sm">{enrollment.validationResult.messages.find(msg => msg.startsWith("PHA Comments:"))?.replace("PHA Comments: ", "")}</p>
                                      </CardContent>
                                  </Card>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No enrollments found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={requestChangesModalOpen} onOpenChange={setRequestChangesModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide comments for the provider regarding changes needed for enrollment ID {currentEnrollmentForModal?.id.slice(0,6)}...
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Enter comments here..."
              value={changeRequestComments}
              onChange={(e) => setChangeRequestComments(e.target.value)}
              rows={4}
              disabled={isProcessingAction}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isProcessingAction}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleRequestChanges} disabled={isProcessingAction || !changeRequestComments.trim()}>
              {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
