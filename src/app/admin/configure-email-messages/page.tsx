
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MailCog, PlusCircle, Loader2, List, Edit3, Trash2, Eye } from 'lucide-react';
import type { EmailTemplate } from '@/types';
import { saveEmailTemplateAction, getEmailTemplatesAction, deleteEmailTemplateAction, updateEmailTemplateAction } from '@/actions/email-template-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { EmailTemplateForm } from '@/components/email-template-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';

type EmailTemplateFormData = Omit<EmailTemplate, 'id' | 'lastUpdated' | 'createdAt' | 'placeholders'> & { attachments?: Array<{id?: string; fileName: string; description?: string}> };


export default function ConfigureEmailMessagesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    const result = await getEmailTemplatesAction();
    if (result.success && result.templates) {
      setTemplates(result.templates);
    } else {
      toast({ title: 'Error Loading Templates', description: result.error || 'Could not load email templates.', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenAddDialog = () => {
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = async (data: EmailTemplateFormData, templateId?: string) => {
    setIsSaving(true);
    const templatePayload = {
      name: data.name,
      eventTrigger: data.eventTrigger,
      subject: data.subject,
      htmlBody: data.htmlBody,
      // Ensure attachments structure matches EmailAttachmentInfo, filter out empty ones
      attachments: data.attachments?.filter(att => att.fileName.trim() !== '').map(att => ({
        id: att.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // Generate ID if new
        fileName: att.fileName,
        description: att.description,
      })) || [],
       // Placeholders are derived, not saved directly from form, but could be set if needed
    };

    let result;
    if (templateId) { // Editing existing template
      result = await updateEmailTemplateAction(templateId, templatePayload);
    } else { // Creating new template
      result = await saveEmailTemplateAction(templatePayload);
    }
    setIsSaving(false);

    if (result.success) {
      toast({
        title: templateId ? 'Template Updated' : 'Template Created',
        description: `Email template "${data.name}" has been ${templateId ? 'updated' : 'saved'}.`,
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      await fetchTemplates(); // Refresh list
    } else {
      toast({
        title: templateId ? 'Error Updating Template' : 'Error Saving Template',
        description: result.error || 'Failed to save template.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    setIsSaving(true); // Use isSaving to disable buttons during delete
    const result = await deleteEmailTemplateAction(templateId);
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Template Deleted', description: `Email template "${templateName}" has been deleted.` });
      await fetchTemplates(); // Refresh list
    } else {
      toast({ title: 'Error Deleting Template', description: result.error || 'Failed to delete template.', variant: 'destructive' });
    }
  };
  
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);


  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <MailCog className="mr-3 h-8 w-8 text-primary" />
          Configure Email Messages
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Console
          </Link>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenAddDialog} className="mb-6 bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Email Template
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Email Template' : 'Add New Email Template'}</DialogTitle>
                <DialogDescription>
                {editingTemplate ? `Modify the details for "${editingTemplate.name}".` : 'Define a new email template for automated system communications.'}
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-6 -mr-6"> {/* Added ScrollArea */}
                <EmailTemplateForm
                    template={editingTemplate}
                    onSave={handleSaveTemplate}
                    onCancel={() => { setIsDialogOpen(false); setEditingTemplate(null); }}
                    isSaving={isSaving}
                />
            </ScrollArea>
        </DialogContent>
      </Dialog>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <List className="mr-2 h-6 w-6 text-primary" />
            Existing Email Templates
          </CardTitle>
          <CardDescription>Manage and review current email templates.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No email templates defined yet. Click "Add New Email Template" to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Event Trigger</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                           {EMAIL_EVENT_TRIGGERS.find(t => t.value === template.eventTrigger)?.label || template.eventTrigger}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={template.subject}>{template.subject}</TableCell>
                      <TableCell>{format(parseISO(template.lastUpdated), 'PPp')}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" title="Preview Template" onClick={() => setPreviewTemplate(template)} disabled={isSaving}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit Template" onClick={() => handleOpenEditDialog(template)} disabled={isSaving}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete Template" disabled={isSaving}>
                              {isSaving && editingTemplate?.id === template.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the template "{template.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTemplate(template.id, template.name)} disabled={isSaving} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
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
      
      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Preview: {previewTemplate.name}</DialogTitle>
                    <DialogDescription>Subject: {previewTemplate.subject}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow border rounded-md mt-2">
                    <div className="p-4">
                         <iframe 
                            srcDoc={`<html><head><style>body{font-family:sans-serif;margin:0;padding:10px;}</style></head><body>${previewTemplate.htmlBody}</body></html>`}
                            className="w-full h-[60vh] border-0"
                            title="Email Preview"
                         />
                    </div>
                </ScrollArea>
                 {previewTemplate.attachments && previewTemplate.attachments.length > 0 && (
                    <div className="mt-4 pt-2 border-t">
                        <h4 className="font-semibold text-sm mb-1">Attachment References:</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {previewTemplate.attachments.map(att => (
                                <li key={att.id}>{att.fileName} {att.description && `(${att.description})`}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
