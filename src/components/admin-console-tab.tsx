
"use client";

import React, { useState } from 'react';
import type { CustomFieldDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, PlusCircle, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminConsoleTabProps {
  customFieldDefinitions: CustomFieldDefinition[];
  onAddCustomField: (field: CustomFieldDefinition) => void;
  onRemoveCustomField: (fieldId: string) => void;
}

const initialFieldState: Omit<CustomFieldDefinition, 'options' | 'required'> & { optionsString: string, required: boolean } = {
  id: '',
  label: '',
  type: 'text',
  placeholder: '',
  optionsString: '',
  required: false,
};

export function AdminConsoleTab({ customFieldDefinitions, onAddCustomField, onRemoveCustomField }: AdminConsoleTabProps) {
  const [newField, setNewField] = useState(initialFieldState);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewField(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: CustomFieldDefinition['type']) => {
    setNewField(prev => ({ ...prev, type: value, optionsString: value !== 'select' ? '' : prev.optionsString }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setNewField(prev => ({ ...prev, required: checked }));
  };

  const handleAddCfdField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.id.trim() || !newField.label.trim()) {
      toast({ title: 'Error', description: 'Field ID and Label are required.', variant: 'destructive' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newField.id.trim())) {
        toast({ title: 'Error', description: 'Field ID can only contain letters, numbers, and underscores.', variant: 'destructive' });
        return;
    }
    if (customFieldDefinitions.some(f => f.id === newField.id.trim())) {
      toast({ title: 'Error', description: 'Field ID already exists.', variant: 'destructive' });
      return;
    }

    const fieldToAdd: CustomFieldDefinition = {
      id: newField.id.trim(),
      label: newField.label.trim(),
      type: newField.type,
      placeholder: newField.placeholder?.trim(),
      required: newField.required,
      ...(newField.type === 'select' && { options: newField.optionsString.split(',').map(opt => opt.trim()).filter(opt => opt) }),
    };
    onAddCustomField(fieldToAdd);
    setNewField(initialFieldState); // Reset form
    toast({ title: 'Success', description: `Field "${fieldToAdd.label}" added.` });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <PlusCircle className="mr-2 h-6 w-6 text-primary" />
            Add New Custom Field
          </CardTitle>
          <CardDescription>Define additional fields for the Provider Enrollment form.</CardDescription>
        </CardHeader>
        <form onSubmit={handleAddCfdField}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fieldId">Field ID (unique, no spaces/special chars)</Label>
                <Input id="fieldId" name="id" value={newField.id} onChange={handleInputChange} placeholder="e.g., practice_specialty" />
              </div>
              <div>
                <Label htmlFor="fieldLabel">Field Label</Label>
                <Input id="fieldLabel" name="label" value={newField.label} onChange={handleInputChange} placeholder="e.g., Practice Specialty" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fieldType">Field Type</Label>
                <Select onValueChange={handleTypeChange} value={newField.type}>
                  <SelectTrigger id="fieldType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fieldPlaceholder">Placeholder (optional)</Label>
                <Input id="fieldPlaceholder" name="placeholder" value={newField.placeholder || ''} onChange={handleInputChange} />
              </div>
            </div>
            {newField.type === 'select' && (
              <div>
                <Label htmlFor="fieldOptions">Options (comma-separated for Select type)</Label>
                <Textarea id="fieldOptions" name="optionsString" value={newField.optionsString} onChange={handleInputChange} placeholder="e.g., Option 1,Option 2,Option 3" />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox id="fieldRequired" checked={newField.required} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="fieldRequired" className="font-normal">Required Field</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Field Definition
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            Current Custom Fields
          </CardTitle>
          <CardDescription>List of currently active custom fields in the enrollment form.</CardDescription>
        </CardHeader>
        <CardContent>
          {customFieldDefinitions.length === 0 ? (
            <p className="text-muted-foreground">No custom fields defined yet.</p>
          ) : (
            <ul className="space-y-3">
              {customFieldDefinitions.map(field => (
                <li key={field.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm">
                  <div>
                    <span className="font-medium">{field.label}</span> <span className="text-sm text-muted-foreground">(ID: {field.id}, Type: {field.type}{field.required ? ", Required" : ""})</span>
                    {field.type === 'select' && field.options && (
                       <p className="text-xs text-muted-foreground">Options: {field.options.join(', ')}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveCustomField(field.id)} aria-label="Remove field">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
