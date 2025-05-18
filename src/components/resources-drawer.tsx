
"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, BookOpen, Link as LinkIcon, FileText as FileTextIcon } from 'lucide-react';
import type { ResourceItem } from '@/types';
import { getResourceItemsAction } from '@/actions/resource-actions';
import { useToast } from '@/hooks/use-toast';

interface ResourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResourcesDrawer({ isOpen, onClose }: ResourcesDrawerProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchResources = async () => {
        setIsLoading(true);
        setError(null);
        const result = await getResourceItemsAction();
        if (result.success && result.items) {
          // Sort items by the order field, then by title
          const sortedItems = result.items.sort((a, b) => {
            if (a.order === b.order) {
              return a.title.localeCompare(b.title);
            }
            return a.order - b.order;
          });
          setResources(sortedItems);
        } else {
          setError(result.error || 'Failed to load resources.');
          toast({
            title: 'Error Loading Resources',
            description: result.error || 'Could not fetch resources for the drawer.',
            variant: 'destructive',
          });
        }
        setIsLoading(false);
      };
      fetchResources();
    }
  }, [isOpen, toast]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-6 pb-2 border-b">
          <SheetTitle className="flex items-center text-xl">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Resources
          </SheetTitle>
          <SheetDescription>
            Helpful links, documents, and information.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow p-6 pt-4">
          {isLoading && (
            <div className="flex flex-col justify-center items-center h-full text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <AlertCircle className="h-8 w-8 text-destructive mb-3" />
              <p className="font-semibold text-lg">Error Loading Resources</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {!isLoading && !error && resources.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="font-semibold text-lg">No Resources Available</p>
              <p className="text-sm text-muted-foreground">
                Resources will appear here once added by an administrator.
              </p>
            </div>
          )}
          {!isLoading && !error && resources.length > 0 && (
            <div className="space-y-4">
              {resources.map((item) => (
                <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow duration-150">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base font-semibold flex items-center">
                      {item.type === 'link' && <LinkIcon className="mr-2 h-4 w-4 text-primary shrink-0" />}
                      {(item.type === 'text' || item.type === 'document_placeholder') && <FileTextIcon className="mr-2 h-4 w-4 text-primary shrink-0" />}
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    {item.type === 'link' ? (
                      <a
                        href={item.content.startsWith('http') ? item.content : `//${item.content}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {item.content}
                      </a>
                    ) : item.type === 'text' ? (
                      <p className="whitespace-pre-wrap text-muted-foreground">{item.content}</p>
                    ) : (
                      <p className="italic text-muted-foreground">{item.content}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-6 border-t mt-auto">
          <SheetClose asChild>
            <Button type="button" variant="outline" className="w-full">Close</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
