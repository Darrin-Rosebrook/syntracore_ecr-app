
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, PlusCircle, Loader2, List, Edit3, Trash2 } from 'lucide-react';
import type { ResourceItem, ResourceItemType } from '@/types';
import { addResourceItemAction, getResourceItemsAction, updateResourceItemAction, deleteResourceItemAction } from '@/actions/resource-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger as AlertDialogTriggerComponent } from "@/components/ui/alert-dialog";
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const resourceItemTypes: { value: ResourceItemType; label: string }[] = [
  { value: 'link', label: 'Link (URL)' },
  { value: 'text', label: 'Text Content' },
  { value: 'document_placeholder', label: 'Document Placeholder' },
];

type ResourceFormData = Omit<ResourceItem, 'id' | 'createdAt' | 'lastUpdated'>;

export default function ManageResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    type: 'link',
    content: '',
    order: 0,
  });
  const { toast } = useToast();

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    const result = await getResourceItemsAction();
    if (result.success && result.items) {
      setResources(result.items);
    } else {
      toast({ title: 'Error Loading Resources', description: result.error || 'Could not load resource items.', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleOpenAddDialog = () => {
    setEditingResource(null);
    const maxOrder = resources.reduce((max, item) => Math.max(max, item.order), -1);
    setFormData({ title: '', type: 'link', content: '', order: maxOrder + 1 });
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (resource: ResourceItem) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      type: resource.type,
      content: resource.content,
      order: resource.order,
    });
    setIsFormDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
     if (name === "order") {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeChange = (value: ResourceItemType) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleSaveResource = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: 'Validation Error', description: 'Title and Content are required.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    let result;
    if (editingResource) {
      result = await updateResourceItemAction(editingResource.id, formData);
    } else {
      result = await addResourceItemAction(formData);
    }
    setIsSaving(false);

    if (result.success) {
      toast({
        title: editingResource ? 'Resource Updated' : 'Resource Created',
        description: `Resource item "${formData.title}" has been ${editingResource ? 'updated' : 'saved'}.`,
      });
      setIsFormDialogOpen(false);
      setEditingResource(null);
      await fetchResources();
    } else {
      toast({
        title: editingResource ? 'Error Updating Resource' : 'Error Saving Resource',
        description: result.error || 'Failed to save resource item.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteResource = async (resourceId: string, resourceTitle: string) => {
    setIsSaving(true);
    const result = await deleteResourceItemAction(resourceId);
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Resource Deleted', description: `Resource item "${resourceTitle}" has been deleted.` });
      await fetchResources();
    } else {
      toast({ title: 'Error Deleting Resource', description: result.error || 'Failed to delete resource item.', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <BookOpen className="mr-3 h-8 w-8 text-primary" />
          Manage Resources Drawer Content
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Console
          </Link>
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenAddDialog} className="mb-6 bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource Item
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource Item' : 'Add New Resource Item'}</DialogTitle>
            <DialogDescription>
              {editingResource ? `Modify "${editingResource.title}".` : 'Define a new item for the resources drawer.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="resourceTitle">Title</Label>
              <Input id="resourceTitle" name="title" value={formData.title} onChange={handleFormChange} disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="resourceType">Type</Label>
              <Select onValueChange={handleTypeChange} value={formData.type} disabled={isSaving}>
                <SelectTrigger id="resourceType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resourceItemTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resourceContent">Content (URL for 'Link', Text for 'Text')</Label>
              <Textarea id="resourceContent" name="content" value={formData.content} onChange={handleFormChange} rows={formData.type === 'text' ? 5 : 2} disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="resourceOrder">Order (lower numbers appear first)</Label>
              <Input id="resourceOrder" name="order" type="number" value={formData.order} onChange={handleFormChange} disabled={isSaving} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
            <Button onClick={handleSaveResource} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingResource ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <List className="mr-2 h-6 w-6 text-primary" />
            Existing Resource Items
          </CardTitle>
          <CardDescription>Manage and review current items for the resources drawer. Sorted by Order, then Title.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading resources...</span>
            </div>
          ) : resources.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No resource items defined yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.order}</TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{resourceItemTypes.find(rt => rt.value === item.type)?.label || item.type}</TableCell>
                      <TableCell className="max-w-xs truncate" title={item.content}>
                        {item.type === 'link' ? <a href={item.content.startsWith('http') ? item.content : `//${item.content}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.content}</a> : item.content}
                      </TableCell>
                      <TableCell>{item.lastUpdated ? format(parseISO(item.lastUpdated), 'PPp') : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" title="Edit Item" onClick={() => handleOpenEditDialog(item)} disabled={isSaving}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTriggerComponent asChild>
                            <Button variant="ghost" size="icon" title="Delete Item" disabled={isSaving}>
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </AlertDialogTriggerComponent>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete resource item "{item.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteResource(item.id, item.title)} disabled={isSaving} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
