"use client";

import React, { useState, useEffect } from 'react';
import type { CustomFieldDefinition, CustomFieldOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, PlusCircle, ListChecks, GripVertical, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Keep for local form validation errors if needed

interface AdminConsoleTabProps {
  customFieldDefinitions: CustomFieldDefinition[];
  onAddCustomField: (field: CustomFieldDefinition) => void;
  onRemoveCustomField: (fieldId: string) => void;
}

const initialFieldState: Omit<CustomFieldDefinition, 'options'> & { tempOptions: CustomFieldOption[], required: boolean, dependentOptionsJson: string } = {
  id: '',
  label: '',
  type: 'text',
  placeholder: '',
  tempOptions: [],
  required: false,
  order: 0,
  parentFieldId: '',
  dependentOptionsJson: '',
};

export function AdminConsoleTab({ customFieldDefinitions, onAddCustomField, onRemoveCustomField }: AdminConsoleTabProps) {
  const [newField, setNewField] = useState(initialFieldState);
  const { toast } = useToast(); // Keep for form-specific feedback not handled by context

  useEffect(() => {
    const maxOrder = customFieldDefinitions.reduce((max, field) => Math.max(max, field.order), -1);
    setNewField(prev => ({ ...prev, order: maxOrder + 1 }));
  }, [customFieldDefinitions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "order") {
      setNewField(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value, 10) || 0 }));
    } else {
      setNewField(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeChange = (value: CustomFieldDefinition['type']) => {
    setNewField(prev => ({ 
      ...prev, 
      type: value, 
      tempOptions: (value === 'select' || value === 'checkbox-group' || value === 'radio-group') ? prev.tempOptions : [],
      parentFieldId: value === 'select' ? prev.parentFieldId : '',
      dependentOptionsJson: value === 'select' ? prev.dependentOptionsJson : ''
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setNewField(prev => ({ ...prev, required: checked }));
  };

  const handleAddOption = () => {
    setNewField(prev => ({
      ...prev,
      tempOptions: [...prev.tempOptions, { label: '', value: '' }]
    }));
  };

  const handleOptionChange = (index: number, field: keyof CustomFieldOption, value: string) => {
    setNewField(prev => ({
      ...prev,
      tempOptions: prev.tempOptions.map((opt, i) => i === index ? { ...opt, [field]: value } : opt)
    }));
  };

  const handleRemoveOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      tempOptions: prev.tempOptions.filter((_, i) => i !== index)
    }));
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
    // Duplicate check is handled by onAddCustomField in context, but good to have client-side too
    if (customFieldDefinitions.some(f => f.id === newField.id.trim())) {
      toast({ title: 'Error', description: 'Field ID already exists.', variant: 'destructive' });
      return;
    }

    if ((newField.type === 'select' || newField.type === 'checkbox-group' || newField.type === 'radio-group') && newField.tempOptions.some(opt => !opt.label.trim() || !opt.value.trim())) {
      toast({ title: 'Error', description: 'All options must have a label and a value.', variant: 'destructive' });
      return;
    }
    
    if (newField.type === 'select' && newField.parentFieldId && newField.dependentOptionsJson) {
      try {
        JSON.parse(newField.dependentOptionsJson);
      } catch (err) {
        toast({ title: 'Error', description: 'Dependent Options JSON is not valid JSON.', variant: 'destructive' });
        return;
      }
    }

    const fieldToAdd: CustomFieldDefinition = {
      id: newField.id.trim(),
      label: newField.label.trim(),
      type: newField.type,
      placeholder: newField.placeholder?.trim(),
      required: newField.required,
      order: newField.order,
      options: (newField.type === 'select' || newField.type === 'checkbox-group' || newField.type === 'radio-group') ? newField.tempOptions.filter(opt => opt.label && opt.value) : undefined,
      parentFieldId: newField.type === 'select' ? newField.parentFieldId : undefined,
      dependentOptionsJson: newField.type === 'select' && newField.parentFieldId ? newField.dependentOptionsJson : undefined,
    };
    onAddCustomField(fieldToAdd); // This will now call the context function
    
    const maxOrder = Math.max(...customFieldDefinitions.map(f => f.order), fieldToAdd.order);
    setNewField({...initialFieldState, order: maxOrder + 1}); // Reset form
    // Toast for success/failure will be handled by the context function
  };
  
  const parentCandidateFields = customFieldDefinitions.filter(f => f.type === 'select' || f.type === 'radio-group');

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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fieldIdAdmin">Field ID (unique, no spaces/special chars)</Label> {/* Changed id to avoid conflict */}
                <Input id="fieldIdAdmin" name="id" value={newField.id} onChange={handleInputChange} placeholder="e.g., practice_specialty" />
              </div>
              <div>
                <Label htmlFor="fieldLabelAdmin">Field Label</Label> {/* Changed id to avoid conflict */}
                <Input id="fieldLabelAdmin" name="label" value={newField.label} onChange={handleInputChange} placeholder="e.g., Practice Specialty" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fieldTypeAdmin">Field Type</Label> {/* Changed id to avoid conflict */}
                <Select onValueChange={handleTypeChange} value={newField.type}>
                  <SelectTrigger id="fieldTypeAdmin">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Select (Dropdown)</SelectItem>
                    <SelectItem value="checkbox">Checkbox (Single)</SelectItem>
                    <SelectItem value="checkbox-group">Checkbox Group (Multiple)</SelectItem>
                    <SelectItem value="radio-group">Radio Group</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fieldPlaceholderAdmin">Placeholder (optional)</Label> {/* Changed id to avoid conflict */}
                <Input id="fieldPlaceholderAdmin" name="placeholder" value={newField.placeholder || ''} onChange={handleInputChange} />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="fieldOrderAdmin">Order</Label> {/* Changed id to avoid conflict */}
                    <Input id="fieldOrderAdmin" name="order" type="number" value={newField.order} onChange={handleInputChange} />
                </div>
                <div className="flex items-end space-x-2 pb-1">
                    <Checkbox id="fieldRequiredAdmin" checked={newField.required} onCheckedChange={handleCheckboxChange} /> {/* Changed id */}
                    <Label htmlFor="fieldRequiredAdmin" className="font-normal">Required Field</Label> {/* Changed id */}
                </div>
            </div>

            {(newField.type === 'select' || newField.type === 'checkbox-group' || newField.type === 'radio-group') && (
              <div className="space-y-3 p-3 border rounded-md">
                <Label className="font-medium">Options</Label>
                {newField.tempOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input placeholder="Label" value={option.label} onChange={(e) => handleOptionChange(index, 'label', e.target.value)} />
                    <Input placeholder="Value" value={option.value} onChange={(e) => handleOptionChange(index, 'value', e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption}><PlusCircle className="mr-2 h-4 w-4" />Add Option</Button>
              </div>
            )}

            {newField.type === 'select' && (
              <div className="space-y-3 p-3 border rounded-md mt-4">
                <Label className="font-medium">Dependent Dropdown Configuration (Optional)</Label>
                <div>
                  <Label htmlFor="parentFieldIdAdmin">Depends on Field (Parent)</Label> {/* Changed id */}
                  <Select onValueChange={(value) => setNewField(prev => ({ ...prev, parentFieldId: value }))} value={newField.parentFieldId}>
                    <SelectTrigger id="parentFieldIdAdmin"> {/* Changed id */}
                      <SelectValue placeholder="Select parent field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {parentCandidateFields.filter(f => f.id !== newField.id).map(field => (
                        <SelectItem key={field.id} value={field.id}>{field.label} (ID: {field.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newField.parentFieldId && (
                  <div>
                    <Label htmlFor="dependentOptionsJsonAdmin">Dependent Options JSON</Label> {/* Changed id */}
                    <Textarea 
                      id="dependentOptionsJsonAdmin" /* Changed id */
                      name="dependentOptionsJson" 
                      value={newField.dependentOptionsJson} 
                      onChange={handleInputChange} 
                      rows={5}
                      placeholder={'Example: {"parentVal1": [{"label": "ChildOpt A", "value": "child_a"}], "parentVal2": [...] }'} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JSON format: Keys are parent field values, values are arrays of child options (<code>{`{label: string, value: string}`}</code>).
                    </p>
                  </div>
                )}
              </div>
            )}

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
          <CardDescription>List of currently active custom fields in the enrollment form. Sorted by Order.</CardDescription>
        </CardHeader>
        <CardContent>
          {customFieldDefinitions.length === 0 ? (
            <p className="text-muted-foreground">No custom fields defined yet.</p>
          ) : (
            <ul className="space-y-3">
              {[...customFieldDefinitions].sort((a, b) => a.order - b.order).map(field => (
                <li key={field.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm">
                  <div className="flex items-center">
                     <GripVertical className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                        <span className="font-medium">{field.label}</span> <span className="text-sm text-muted-foreground">
                            (ID: {field.id}, Type: {field.type}, Order: {field.order}{field.required ? ", Required" : ""})
                        </span>
                        {(field.type === 'select' || field.type === 'checkbox-group' || field.type === 'radio-group') && field.options && field.options.length > 0 && (
                        <p className="text-xs text-muted-foreground">Options: {field.options.map(o => `${o.label} (${o.value})`).join(', ')}</p>
                        )}
                        {field.type === 'select' && field.parentFieldId && (
                            <p className="text-xs text-muted-foreground">Depends on: {field.parentFieldId}. Mappings: {field.dependentOptionsJson ? 'Defined' : 'Not Defined'}</p>
                        )}
                    </div>
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