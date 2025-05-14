
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { EmailTemplate, EmailEventTrigger, EmailAttachmentInfo } from '@/types';
import { EMAIL_EVENT_TRIGGERS } from '@/types'; // Import the constant
import { PlusCircle, Trash2, Loader2, Info, Paperclip, Mail } from 'lucide-react'; // Changed MailCog to Mail
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';


// Define Zod schema for the form
const emailTemplateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required.'),
  eventTrigger: z.string().min(1, 'Event trigger is required.') as z.ZodType<EmailEventTrigger>,
  subject: z.string().min(1, 'Subject is required.'),
  htmlBody: z.string().min(1, 'Email body is required.'),
  attachments: z.array(z.object({
    id: z.string().optional(), // Keep id if editing, new attachments won't have it initially
    fileName: z.string().min(1, 'File name is required.'),
    description: z.string().optional(),
  })).optional(),
  // Placeholders are typically derived from the eventTrigger, not directly editable in this form,
  // but shown for informational purposes.
});

type EmailTemplateFormData = z.infer<typeof emailTemplateFormSchema>;

interface EmailTemplateFormProps {
  template?: EmailTemplate | null; // For editing existing template
  onSave: (data: EmailTemplateFormData, templateId?: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const ALL_AVAILABLE_PLACEHOLDERS = [
  '{{hcoName}}', '{{contactName}}', '{{contactEmail}}', '{{submissionDate}}', 
  '{{userName}}', '{{userEmail}}', '{{resetLink}}', '{{phaName}}', '{{phaContactEmail}}'
];


export function EmailTemplateForm({ template, onSave, onCancel, isSaving }: EmailTemplateFormProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: template ? {
      name: template.name,
      eventTrigger: template.eventTrigger,
      subject: template.subject,
      htmlBody: template.htmlBody,
      attachments: template.attachments?.map(att => ({ id: att.id, fileName: att.fileName, description: att.description || '' })) || [],
    } : {
      name: '',
      eventTrigger: undefined,
      subject: '',
      htmlBody: '',
      attachments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachments",
  });

  const watchedEventTrigger = watch("eventTrigger");
  const [currentPlaceholders, setCurrentPlaceholders] = useState<string[]>([]);

  useEffect(() => {
    // Simulate deriving placeholders based on event trigger
    // In a real app, this mapping would be more robust.
    if (watchedEventTrigger) {
      switch (watchedEventTrigger) {
        case 'provider_enrollment_submission':
        case 'enrollment_status_approved':
        case 'enrollment_status_changes_requested':
        case 'enrollment_status_denied':
          setCurrentPlaceholders(['{{hcoName}}', '{{contactName}}', '{{submissionDate}}', '{{phaName}}']);
          break;
        case 'new_user_account_invite':
        case 'password_reset_request':
          setCurrentPlaceholders(['{{userName}}', '{{userEmail}}', '{{resetLink}}', '{{phaName}}']);
          break;
        default:
          setCurrentPlaceholders(ALL_AVAILABLE_PLACEHOLDERS);
      }
    } else {
      setCurrentPlaceholders(ALL_AVAILABLE_PLACEHOLDERS);
    }
  }, [watchedEventTrigger]);

  const onSubmit: SubmitHandler<EmailTemplateFormData> = async (data) => {
    await onSave(data, template?.id);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} placeholder="e.g., Welcome Email for New Providers" disabled={isSaving}/>} />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="eventTrigger">Event Trigger</Label>
        <Controller
          name="eventTrigger"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
              <SelectTrigger id="eventTrigger"><SelectValue placeholder="Select event trigger" /></SelectTrigger>
              <SelectContent>
                {EMAIL_EVENT_TRIGGERS.map(trigger => (
                  <SelectItem key={trigger.value} value={trigger.value}>{trigger.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.eventTrigger && <p className="text-sm text-destructive mt-1">{errors.eventTrigger.message}</p>}
      </div>

      <div>
        <Label htmlFor="subject">Subject Line</Label>
        <Controller name="subject" control={control} render={({ field }) => <Input id="subject" {...field} placeholder="Email Subject" disabled={isSaving}/>} />
        {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>}
      </div>
      
      <div>
        <Label htmlFor="htmlBody">Email Body (HTML)</Label>
        <Controller name="htmlBody" control={control} render={({ field }) => <Textarea id="htmlBody" {...field} rows={10} placeholder="Enter HTML content for the email..." disabled={isSaving}/>} />
        {errors.htmlBody && <p className="text-sm text-destructive mt-1">{errors.htmlBody.message}</p>}
        <div className="mt-2 p-3 border rounded-md bg-muted/50">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center"><Info className="mr-1 h-3 w-3"/>Available Placeholders for current trigger:</h4>
            {currentPlaceholders.length > 0 ? (
                 <ScrollArea className="h-20">
                    <div className="flex flex-wrap gap-1">
                        {currentPlaceholders.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                    </div>
                 </ScrollArea>
            ) : (
                <p className="text-xs text-muted-foreground">Select an event trigger to see available placeholders.</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Tip: Copy and paste placeholders into the Subject or Body.</p>
        </div>
      </div>

      <div className="space-y-3 p-3 border rounded-md">
        <Label className="font-medium flex items-center"><Paperclip className="mr-2 h-4 w-4"/>Attachments (Informational)</Label>
        <p className="text-xs text-muted-foreground">Specify names/descriptions of files to be attached. Actual file upload and storage is not part of this basic setup.</p>
        {fields.map((item, index) => (
          <div key={item.id} className="flex items-start gap-2 p-2 border rounded bg-muted/30">
            <div className="flex-grow space-y-2">
              <Controller
                name={`attachments.${index}.fileName`}
                control={control}
                render={({ field }) => <Input {...field} placeholder="File Name (e.g., welcome_guide.pdf)" disabled={isSaving} />}
              />
              {errors.attachments?.[index]?.fileName && <p className="text-sm text-destructive">{errors.attachments[index]?.fileName?.message}</p>}
              <Controller
                name={`attachments.${index}.description`}
                control={control}
                render={({ field }) => <Textarea {...field} placeholder="Optional description" rows={1} disabled={isSaving} />}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSaving} className="mt-1">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ fileName: '', description: '' })} disabled={isSaving}>
          <PlusCircle className="mr-2 h-4 w-4" />Add Attachment Reference
        </Button>
      </div>


      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button type="submit" disabled={isSaving} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          {template ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
