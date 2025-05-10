
"use client";

import * as React from 'react';
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EHR_VENDORS } from "@/lib/constants";
import { FileUploader } from "@/components/file-uploader";
import { useToast } from "@/hooks/use-toast";
import type { EnrollmentFormData, FHIRValidationResult, CustomFieldDefinition, CustomFieldOption } from "@/types";
import { validateFHIR } from "@/services/fhir-validator"; 
import { summarizeValidationResults } from "@/ai/flows/summarize-validation-results";
import { FHIRValidationDisplay } from "./fhir-validation-display";
import { ClipboardList, User, Building, Settings2, FileText, ShieldCheck, Loader2, Info, CalendarDays, Hash } from "lucide-react"; // Added Hash
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const practiceInfoSchema = z.object({
  organizationNPI: z.string().length(10, "Organization NPI must be 10 digits").regex(/^[0-9]{10}$/, "Organization NPI must be a 10-digit number"),
  name: z.string().min(1, "Practice name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required").regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
});

const contactDetailsSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required").regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
});

// Base schema for additionalData, specific field validations will be added dynamically
const baseAdditionalDataSchema = z.record(z.any());

const enrollmentFormSchema = z.object({
  practiceInfo: practiceInfoSchema,
  contactDetails: contactDetailsSchema,
  ehrVendor: z.string().min(1, "EHR vendor selection is required"),
  consent: z.boolean().refine(val => val === true, "You must agree to the consent"),
  additionalData: baseAdditionalDataSchema.optional(),
});

type FormSchemaType = z.infer<typeof enrollmentFormSchema>;

interface ProviderEnrollmentFormProps {
  onSubmitEnrollment: (data: EnrollmentFormData, ccdDocumentContent: string | null, validationResult: FHIRValidationResult) => void;
  customFieldDefinitions: CustomFieldDefinition[];
}

export function ProviderEnrollmentForm({ onSubmitEnrollment, customFieldDefinitions }: ProviderEnrollmentFormProps) {
  const { toast } = useToast();
  const [ccdFile, setCcdFile] = React.useState<File | null>(null);
  const [ccdFileContent, setCcdFileContent] = React.useState<string | null>(null);
  const [validationResult, setValidationResult] = React.useState<FHIRValidationResult | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);

  // Dynamically create Zod schema for additionalData based on customFieldDefinitions
  const dynamicEnrollmentSchema = React.useMemo(() => {
    const additionalDataShape: Record<string, z.ZodTypeAny> = {};
    customFieldDefinitions.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'select':
        case 'radio-group':
        case 'date':
          fieldSchema = field.required ? z.string().min(1, `${field.label} is required.`) : z.string().optional().nullable();
          break;
        case 'checkbox': // Single checkbox
          fieldSchema = field.required ? z.boolean().refine(val => val === true, `${field.label} is required.`) : z.boolean().optional();
          break;
        case 'checkbox-group':
          fieldSchema = field.required ? z.array(z.string()).min(1, `At least one option for ${field.label} must be selected.`) : z.array(z.string()).optional();
          break;
        default:
          fieldSchema = z.any();
      }
      additionalDataShape[field.id] = fieldSchema;
    });
    return enrollmentFormSchema.extend({
      additionalData: z.object(additionalDataShape).optional(),
    });
  }, [customFieldDefinitions]);


  const form = useForm<FormSchemaType>({
    resolver: zodResolver(dynamicEnrollmentSchema),
    defaultValues: {
      practiceInfo: { organizationNPI: "", name: "", address: "", phone: "" },
      contactDetails: { name: "", email: "", phone: "" },
      ehrVendor: "",
      consent: false,
      additionalData: {},
    },
  });
  
  const watchedAdditionalData = useWatch({ control: form.control, name: "additionalData" });

  React.useEffect(() => {
    const defaultAdditionalData: Record<string, any> = {};
    const currentAdditionalData = form.getValues().additionalData || {};
    
    customFieldDefinitions.forEach(field => {
      if (currentAdditionalData[field.id] === undefined) {
        if (field.type === 'checkbox') { // single
          defaultAdditionalData[field.id] = false;
        } else if (field.type === 'checkbox-group') {
           defaultAdditionalData[field.id] = field.options?.filter(opt => opt.defaultChecked).map(opt => opt.value) || [];
        } else {
          defaultAdditionalData[field.id] = '';
        }
      } else {
         defaultAdditionalData[field.id] = currentAdditionalData[field.id];
      }
      form.register(`additionalData.${field.id}` as any);
    });
    
    Object.keys(currentAdditionalData).forEach(existingFieldId => {
        if (!customFieldDefinitions.some(cfd => cfd.id === existingFieldId)) {
            form.unregister(`additionalData.${existingFieldId}` as any);
            delete defaultAdditionalData[existingFieldId];
        }
    });

    form.setValue('additionalData', defaultAdditionalData, { shouldValidate: true, shouldDirty: Object.keys(defaultAdditionalData).length > 0 });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customFieldDefinitions, form.register, form.setValue, form.getValues]);


  const handleFileSelect = async (file: File | null, fileContent: string | null) => {
    setCcdFile(file);
    setCcdFileContent(fileContent);
    setValidationResult(undefined); 

    if (file && fileContent) {
      setIsProcessingFile(true);
      try {
        const rawValidationResult = await validateFHIR(fileContent); // Changed from validateFHIRMessage
        const aiSummaryResult = await summarizeValidationResults({ validationResults: rawValidationResult });
        setValidationResult({
          ...rawValidationResult,
          summary: aiSummaryResult.summary,
        });
      } catch (error) {
        console.error("Error during file validation:", error);
        toast({
          title: "File Processing Error",
          description: "Could not validate the uploaded file. Please try again.",
          variant: "destructive",
        });
        setValidationResult({ isValid: false, messages: ["Error processing file for validation."], summary: "File processing failed."});
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const onSubmit = async (data: FormSchemaType) => {
    setIsSubmitting(true);
    
    if (!ccdFile) {
      toast({
        title: "Missing Document",
        description: "Please upload a CCD/FHIR document.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!validationResult) {
        toast({
          title: "File Not Processed",
          description: "Please wait for the file to be processed or try re-uploading.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }
    
    // Manual validation re-trigger if needed, though Zod resolver should handle it.
    const isValid = await form.trigger();
    if (!isValid) {
         toast({
            title: "Validation Error",
            description: "Please check the form for errors.",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }


    const enrollmentData: EnrollmentFormData = {
      ...data,
      ccdDocumentName: ccdFile.name,
      additionalData: data.additionalData || {},
    };
    
    onSubmitEnrollment(enrollmentData, ccdFileContent, validationResult);
    
    const defaultResetValues: FormSchemaType = {
      practiceInfo: { organizationNPI: "", name: "", address: "", phone: "" },
      contactDetails: { name: "", email: "", phone: "" },
      ehrVendor: "",
      consent: false,
      additionalData: {},
    };
    customFieldDefinitions.forEach(field => {
      if (defaultResetValues.additionalData) {
         if (field.type === 'checkbox') defaultResetValues.additionalData[field.id] = false;
         else if (field.type === 'checkbox-group') defaultResetValues.additionalData[field.id] = field.options?.filter(o => o.defaultChecked).map(o => o.value) || [];
         else defaultResetValues.additionalData[field.id] = '';
      }
    });
    form.reset(defaultResetValues);

    setCcdFile(null);
    setCcdFileContent(null);
    setValidationResult(undefined);
    setIsSubmitting(false);
  };
  
  const sortedCustomFieldDefinitions = React.useMemo(() => {
    return [...customFieldDefinitions].sort((a, b) => a.order - b.order);
  }, [customFieldDefinitions]);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <ClipboardList className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl font-semibold">Provider Self-Enrollment</CardTitle>
        </div>
        <CardDescription className="text-foreground/80">
          Complete the form below to enroll your practice.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
          {/* Practice Info */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center"><Building className="mr-2 h-5 w-5 text-primary" />Practice Information</legend>
            <div>
              <Label htmlFor="organizationNPI" className="flex items-center"><Hash className="mr-2 h-4 w-4 text-muted-foreground" />Organization NPI</Label>
              <Input id="organizationNPI" {...form.register("practiceInfo.organizationNPI")} placeholder="Enter 10-digit NPI"/>
              {form.formState.errors.practiceInfo?.organizationNPI && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.organizationNPI.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="practiceName">Practice Name</Label>
              <Input id="practiceName" {...form.register("practiceInfo.name")} />
              {form.formState.errors.practiceInfo?.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="practiceAddress">Full Address</Label>
              <Textarea id="practiceAddress" {...form.register("practiceInfo.address")} />
              {form.formState.errors.practiceInfo?.address && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.address.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="practicePhone">Practice Phone</Label>
              <Input id="practicePhone" type="tel" {...form.register("practiceInfo.phone")} />
              {form.formState.errors.practiceInfo?.phone && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.phone.message}</p>
              )}
            </div>
          </fieldset>

          {/* Contact Details */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center"><User className="mr-2 h-5 w-5 text-primary" />Contact Details</legend>
            <div>
              <Label htmlFor="contactName">Contact Person Name</Label>
              <Input id="contactName" {...form.register("contactDetails.name")} />
              {form.formState.errors.contactDetails?.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" {...form.register("contactDetails.email")} />
              {form.formState.errors.contactDetails?.email && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" type="tel" {...form.register("contactDetails.phone")} />
              {form.formState.errors.contactDetails?.phone && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.phone.message}</p>
              )}
            </div>
          </fieldset>

          {/* EHR Vendor and Document Upload */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary" />EHR & Documentation</legend>
            <div>
              <Label htmlFor="ehrVendor">EHR Vendor</Label>
              <Controller
                name="ehrVendor"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                    <SelectTrigger id="ehrVendor">
                      <SelectValue placeholder="Select EHR Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {EHR_VENDORS.map(vendor => (
                        <SelectItem key={vendor.value} value={vendor.value}>{vendor.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.ehrVendor && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.ehrVendor.message}</p>
              )}
            </div>
            <div>
                <Label htmlFor="ccdDocument" className="flex items-center"><FileText className="mr-2 h-4 w-4" />CCD/FHIR Document Sample</Label>
                <FileUploader onFileSelect={handleFileSelect} acceptedFileTypes=".xml,.json" label="Upload your CCDA or FHIR document" />
                 {isProcessingFile && (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing file...
                    </div>
                 )}
            </div>
            <FHIRValidationDisplay result={validationResult} />
          </fieldset>

          {/* Custom Fields Section - now rendered directly in the form flow */}
          {sortedCustomFieldDefinitions.length > 0 && (
            sortedCustomFieldDefinitions.map(field => (
              <fieldset key={field.id} className="space-y-2 p-4 border rounded-md">
                <legend className="text-md font-medium px-1 flex items-center">
                  <Info className="mr-2 h-5 w-5 text-primary opacity-70" />
                  {field.label}{field.required && <span className="text-destructive ml-1">*</span>}
                </legend>
                 
                {field.type === 'text' && (
                  <Input 
                    id={`additionalData.${field.id}`} 
                    {...form.register(`additionalData.${field.id}` as any)} 
                    placeholder={field.placeholder}
                  />
                )}
                {field.type === 'textarea' && (
                  <Textarea 
                    id={`additionalData.${field.id}`} 
                    {...form.register(`additionalData.${field.id}` as any)} 
                    placeholder={field.placeholder}
                  />
                )}
                {field.type === 'select' && field.options && (
                  <Controller
                    name={`additionalData.${field.id}` as any}
                    control={form.control}
                    defaultValue=""
                    render={({ field: controllerField }) => {
                      let currentOptions = field.options || [];
                      if (field.parentFieldId && field.dependentOptionsJson && watchedAdditionalData) {
                          const parentValue = watchedAdditionalData[field.parentFieldId];
                          if (parentValue) {
                              try {
                                  const dependentOptionsMap = JSON.parse(field.dependentOptionsJson);
                                  currentOptions = dependentOptionsMap[parentValue] || [];
                                  // Reset child if parent changes and current value is not in new options
                                  if (controllerField.value && !currentOptions.some(opt => opt.value === controllerField.value)) {
                                      setTimeout(() => controllerField.onChange(''), 0); // Allow state to settle
                                  }
                              } catch (e) { console.error("Error parsing dependentOptionsJson", e); }
                          } else {
                            currentOptions = []; // No parent value, no options
                             if (controllerField.value) setTimeout(() => controllerField.onChange(''), 0);
                          }
                      }

                      return (
                        <Select 
                          onValueChange={controllerField.onChange} 
                          value={controllerField.value || ''}
                          disabled={field.parentFieldId && (!watchedAdditionalData || !watchedAdditionalData[field.parentFieldId]) && currentOptions.length === 0}
                        >
                          <SelectTrigger id={`additionalData.${field.id}`}>
                            <SelectValue placeholder={field.placeholder || "Select an option"} />
                          </SelectTrigger>
                          <SelectContent>
                            {currentOptions.map((option: CustomFieldOption) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                            {currentOptions.length === 0 && field.parentFieldId && watchedAdditionalData && watchedAdditionalData[field.parentFieldId] && (
                                <SelectItem value="" disabled>No options available for selected parent</SelectItem>
                            )}
                             {currentOptions.length === 0 && field.parentFieldId && (!watchedAdditionalData || !watchedAdditionalData[field.parentFieldId]) && (
                                <SelectItem value="" disabled>Select parent field first</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                )}
                {field.type === 'checkbox' && ( // Single Checkbox
                   <div className="flex items-center space-x-2 pt-1">
                    <Controller
                      name={`additionalData.${field.id}` as any}
                      control={form.control}
                      defaultValue={false}
                      render={({ field: controllerField }) => (
                        <Checkbox
                          id={`additionalData.${field.id}`}
                          checked={!!controllerField.value} 
                          onCheckedChange={controllerField.onChange}
                        />
                      )}
                    />
                     <Label htmlFor={`additionalData.${field.id}`} className="font-normal">{field.placeholder || field.label}</Label>
                   </div>
                )}
                {field.type === 'checkbox-group' && field.options && (
                  <Controller
                    name={`additionalData.${field.id}` as any}
                    control={form.control}
                    defaultValue={field.options.filter(o => o.defaultChecked).map(o => o.value) || []}
                    render={({ field: controllerField }) => (
                      <div className="space-y-2 pt-1">
                        {field.options?.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`additionalData.${field.id}.${option.value}`}
                              checked={Array.isArray(controllerField.value) && controllerField.value.includes(option.value)}
                              onCheckedChange={(checked) => {
                                const currentValues = Array.isArray(controllerField.value) ? controllerField.value : [];
                                if (checked) {
                                  controllerField.onChange([...currentValues, option.value]);
                                } else {
                                  controllerField.onChange(currentValues.filter(v => v !== option.value));
                                }
                              }}
                            />
                            <Label htmlFor={`additionalData.${field.id}.${option.value}`} className="font-normal">{option.label}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                )}
                {field.type === 'radio-group' && field.options && (
                  <Controller
                    name={`additionalData.${field.id}` as any}
                    control={form.control}
                    defaultValue=""
                    render={({ field: controllerField }) => (
                      <RadioGroup
                        onValueChange={controllerField.onChange}
                        value={controllerField.value || ''}
                        className="space-y-1 pt-1"
                      >
                        {field.options?.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`additionalData.${field.id}.${option.value}`} />
                            <Label htmlFor={`additionalData.${field.id}.${option.value}`} className="font-normal">{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                )}
                {field.type === 'date' && (
                   <Controller
                      name={`additionalData.${field.id}` as any}
                      control={form.control}
                      defaultValue=""
                      render={({ field: controllerField }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={`w-full justify-start text-left font-normal ${!controllerField.value && "text-muted-foreground"}`}
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {controllerField.value ? format(new Date(controllerField.value), "PPP") : <span>{field.placeholder || "Pick a date"}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={controllerField.value ? new Date(controllerField.value) : undefined}
                              onSelect={(date) => controllerField.onChange(date ? date.toISOString() : '')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                )}
                {form.formState.errors.additionalData?.[field.id] && (
                  <p className="text-sm text-destructive mt-1">{(form.formState.errors.additionalData as Record<string, {message?: string}>)[field.id]?.message}</p>
                )}
              </fieldset>
            ))
          )}

          {/* Consent */}
          <fieldset className="p-4 border rounded-md">
             <legend className="text-lg font-medium px-1 flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary" />Consent Agreement</legend>
            <div className="items-top flex space-x-2 mt-2">
              <Controller
                name="consent"
                control={form.control}
                render={({ field }) => (
                    <Checkbox 
                        id="consent" 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the terms and conditions for data submission and processing.
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you consent to the secure handling of your submitted data.
                </p>
              </div>
            </div>
            {form.formState.errors.consent && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.consent.message}</p>
            )}
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting || isProcessingFile}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Enrollment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

