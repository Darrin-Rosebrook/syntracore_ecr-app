
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileTextIcon, Info } from 'lucide-react';

interface EhrVendorDocumentsTabProps {
  vendorValue: string;
}

export function EhrVendorDocumentsTab({ vendorValue }: EhrVendorDocumentsTabProps) {
  // In a real application, you would fetch documents related to this vendorValue
  // For now, this is a placeholder.

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <FileTextIcon className="mr-2 h-5 w-5 text-primary" />
          Vendor Documents
        </CardTitle>
        <CardDescription>
          Manage and view documents associated with this EHR Vendor (e.g., integration guides, contracts).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-muted rounded-lg bg-muted/30">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Document Management Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This section will allow uploading, viewing, and managing documents specific to this EHR vendor.
            Currently, no documents are linked. Functionality to add and manage vendor-specific documents will be implemented in a future update.
          </p>
        </div>
        {/* Placeholder for document list and upload functionality */}
        {/* 
        Example:
        <Button variant="outline"><UploadCloud className="mr-2" /> Upload Document</Button>
        <Table>...</Table>
        */}
      </CardContent>
    </Card>
  );
}
