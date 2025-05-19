
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added import
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Info, Loader2, AlertCircle, CalendarCheck2 } from 'lucide-react';
import { fetchChplProductsByDeveloperAction } from '@/actions/chpl-api-actions';
import type { ChplCertifiedProduct } from '@/types/chpl';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EhrVendorProductsTabProps {
  developerId: number;
}

export function EhrVendorProductsTab({ developerId }: EhrVendorProductsTabProps) {
  const [products, setProducts] = useState<ChplCertifiedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadProducts() {
      if (!developerId) {
        setError("Developer ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      const result = await fetchChplProductsByDeveloperAction(developerId);
      if (result.success && result.products) {
        setProducts(result.products.sort((a,b) => a.product.name.localeCompare(b.product.name) || a.version.version.localeCompare(b.version.version)));
      } else {
        setError(result.error || "Failed to load products for this vendor.");
        toast({
          title: "Error Loading Products",
          description: result.error || "Could not fetch products from CHPL.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
    loadProducts();
  }, [developerId, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading products from CHPL...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <Package className="mr-2 h-5 w-5 text-primary" />
          Active Certified Products & Versions
        </CardTitle>
        <CardDescription>
          List of active certified products and their versions for this developer, sourced from the ONC CHPL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-muted rounded-lg bg-muted/30">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Active Products Found</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              No active certified products are currently listed for this vendor in the CHPL database, or there was an issue fetching them.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-24rem)] border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>CHPL Product Number</TableHead>
                  <TableHead>Certification Body</TableHead>
                  <TableHead>Certification Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.product.name}</TableCell>
                    <TableCell>{product.version.version}</TableCell>
                    <TableCell>{product.chplProductNumber}</TableCell>
                    <TableCell>{product.certifyingBody.name}</TableCell>
                    <TableCell>
                      {product.certificationDate ? format(new Date(product.certificationDate), 'PP') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
