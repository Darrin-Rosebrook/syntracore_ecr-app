
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTree } from 'lucide-react';

interface EhrVendorProfileDetailsTabProps {
  vendorValue: string;
  vendorLabel: string | null;
}

export function EhrVendorProfileDetailsTab({ vendorValue, vendorLabel }: EhrVendorProfileDetailsTabProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <ListTree className="mr-2 h-5 w-5 text-primary" />
          Vendor Profile: {vendorLabel || 'N/A'}
        </CardTitle>
        <CardDescription>
          General information about this EHR Vendor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Vendor Name</p>
          <p className="text-md">{vendorLabel || 'Not Available'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Vendor ID (Value)</p>
          <p className="text-md">{vendorValue}</p>
        </div>
        {/* Placeholder for more vendor-specific details */}
        <div className="pt-4">
          <p className="text-muted-foreground text-sm">
            More details such as website, support contacts, and specific integration notes can be added here in the future.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
