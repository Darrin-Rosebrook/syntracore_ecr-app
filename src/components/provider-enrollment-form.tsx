
// ✅ FULL FILE CONTENT BEGINNING

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
import type { EnrollmentFormData, FHIRValidationResult, CustomFieldDefinition, CustomFieldOption, ProviderData } from "@/types";
import { validateFHIR } from "@/services/fhir-validator";
import { fetchNpiDataAction } from '@/actions/workflow-actions';
import { summarizeValidationResults } from "@/ai/flows/summarize-validation-results";
import { FHIRValidationDisplay } from "./fhir-validation-display";
import { ClipboardList, User, Building, Settings2, FileText, ShieldCheck, Loader2, Info, CalendarDays, Hash, Search as SearchIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const practiceInfoSchema = z.object({
  organizationNPI: z
    .string()
    .length(10, "Organization NPI must be 10 digits")
    .regex(/^[0-9]{10}$/, "Organization NPI must be a 10-digit number"),
  name: z.string().min(1, "Practice name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
});

const contactDetailsSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
});

const baseAdditionalDataSchema = z.record(z.any());

const enrollmentFormSchema = z.object({
  practiceInfo: practiceInfoSchema,
  contactDetails: contactDetailsSchema,
  ehrVendor: z.string().min(1, "EHR vendor selection is required"),
  consent: z.boolean().refine((val) => val === true, "You must agree to the consent"),
  additionalData: baseAdditionalDataSchema.optional(),
});

type FormSchemaType = z.infer<typeof enrollmentFormSchema>;

interface ProviderEnrollmentFormProps {
  onSubmitEnrollment: (
    data: EnrollmentFormData,
    ccdDocumentContent: string | null,
    validationResult: FHIRValidationResult
  ) => Promise<boolean>; 
  customFieldDefinitions: CustomFieldDefinition[];
}

export function ProviderEnrollmentForm({
  onSubmitEnrollment,
  customFieldDefinitions,
}: ProviderEnrollmentFormProps) {
  const { toast } = useToast();
  const [ccdFile, setCcdFile] = React.useState<File | null>(null);
  const [ccdFileContent, setCcdFileContent] = React.useState<string | null>(null);
  const [validationResult, setValidationResult] = React.useState<FHIRValidationResult | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);

  const [npiLookupLoading, setNpiLookupLoading] = React.useState(false);
  const [npiLookupError, setNpiLookupError] = React.useState<string | null>(null);
  const [fetchedNpiData, setFetchedNpiData] = React.useState<ProviderData | null>(null);

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
          fieldSchema = field.required
            ? z.string().min(1, `${field.label} is required.`)
            : z.string().optional().nullable();
          break;
        case 'checkbox':
          fieldSchema = field.required
            ? z.boolean().refine(val => val === true, `${field.label} is required.`)
            : z.boolean().optional();
          break;
        case 'checkbox-group':
          fieldSchema = field.required
            ? z.array(z.string()).min(1, `At least one option for ${field.label} must be selected.`)
            : z.array(z.string()).optional();
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

  const watchedAdditionalData = useWatch({
    control: form.control,
    name: "additionalData",
  });

  const watchedOrganizationNPI = form.watch('practiceInfo.organizationNPI');


  React.useEffect(() => {
    const defaultAdditionalData: Record<string, any> = {};
    const current = form.getValues().additionalData || {};

    customFieldDefinitions.forEach(field => {
      const existing = current[field.id];
      if (existing === undefined) {
        if (field.type === 'checkbox') defaultAdditionalData[field.id] = false;
        else if (field.type === 'checkbox-group')
          defaultAdditionalData[field.id] = field.options?.filter(o => o.defaultChecked).map(o => o.value) || [];
        else defaultAdditionalData[field.id] = '';
      } else {
        defaultAdditionalData[field.id] = existing;
      }
      form.register(`additionalData.${field.id}` as any);
    });

    Object.keys(current).forEach(id => {
      if (!customFieldDefinitions.some(cfd => cfd.id === id)) {
        form.unregister(`additionalData.${id}` as any);
        delete defaultAdditionalData[id];
      }
    });

    form.setValue('additionalData', defaultAdditionalData, {
      shouldValidate: true,
      shouldDirty: Object.keys(defaultAdditionalData).length > 0,
    });
  }, [customFieldDefinitions, form]);

  const handleFileSelect = async (file: File | null, fileContent: string | null) => {
    setCcdFile(file);
    setCcdFileContent(fileContent);
    setValidationResult(undefined);

    if (file && fileContent) {
      setIsProcessingFile(true);
      try {
        const rawValidationResult = await validateFHIR(fileContent); 
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
        setValidationResult({
          isValid: false,
          messages: ["Error processing file for validation."],
          summary: "File processing failed.",
        });
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleNpiLookup = async () => {
    const npiToLookup = form.getValues('practiceInfo.organizationNPI');
    if (!npiToLookup || !/^\d{10}$/.test(npiToLookup)) {
      toast({
        title: "Invalid NPI",
        description: "Please enter a valid 10-digit NPI to look up.",
        variant: "destructive",
      });
      return;
    }

    setNpiLookupLoading(true);
    setNpiLookupError(null);
    setFetchedNpiData(null);

    try {
      const result = await fetchNpiDataAction(npiToLookup);
      if (result.success && result.data) {
        setFetchedNpiData(result.data);
        const provider = result.data;

        form.setValue('practiceInfo.name', provider.orgName || provider.name || '', { shouldValidate: true });
        
        let formattedAddress = '';
        if (provider.address) {
          formattedAddress = [
            provider.address.address_1,
            provider.address.address_2,
            provider.address.city,
            provider.address.state,
            provider.address.postal_code,
          ].filter(Boolean).join(', ').replace(/ ,/g, ',');
        }
        form.setValue('practiceInfo.address', formattedAddress, { shouldValidate: true });
        form.setValue('practiceInfo.phone', provider.address?.telephone_number || '', { shouldValidate: true });

        toast({
          title: "NPI Data Fetched",
          description: `Data for ${provider.name} loaded. Please review and complete the form.`,
        });
      } else {
        setNpiLookupError(result.error || "NPI not found or no exact match.");
        toast({ title: 'NPI Lookup Failed', description: result.error || "NPI not found.", variant: 'destructive' });
      }
    } catch (error) {
      console.error("NPI Lookup failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve NPI data.";
      setNpiLookupError(errorMessage);
      toast({ title: 'NPI Lookup Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setNpiLookupLoading(false);
    }
  };

  const handleClearNpiData = () => {
    setFetchedNpiData(null);
    setNpiLookupError(null);
    toast({ title: 'NPI Data Cleared', description: 'Lookup information has been cleared.' });
  };


  const onSubmit = async (data: FormSchemaType) => {
    console.log("Form onSubmit triggered"); 
    setIsSubmitting(true); 

    if (!ccdFile) {
      console.log("onSubmit: Missing CCD file"); 
      toast({
        title: "Missing Document",
        description: "Please upload a CCD/FHIR document.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!validationResult) {
      console.log("onSubmit: Missing validation result"); 
      toast({
        title: "File Not Processed",
        description: "Please wait for the file to be processed or re-upload if an error occurred.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    console.log("onSubmit: Proceeding with submission. Data:", data); 

    try {
      const enrollmentData: EnrollmentFormData = {
        ...data,
        ccdDocumentName: ccdFile.name,
        additionalData: data.additionalData || {},
      };
      console.log("onSubmit: Calling onSubmitEnrollment (addEnrollment)"); 
      const submissionSuccessful = await onSubmitEnrollment(enrollmentData, ccdFileContent, validationResult);
      console.log("onSubmit: onSubmitEnrollment returned:", submissionSuccessful); 

      if (submissionSuccessful) {
        console.log("onSubmit: Submission successful, resetting form.");
        form.reset({
          practiceInfo: { organizationNPI: "", name: "", address: "", phone: "" },
          contactDetails: { name: "", email: "", phone: "" },
          ehrVendor: "",
          consent: false,
          additionalData: {},
        });
        setCcdFile(null);
        setCcdFileContent(null);
        setFetchedNpiData(null);
        setValidationResult(undefined);
        setNpiLookupError(null);
      } else {
        console.log("onSubmit: Submission was not successful (as per addEnrollment return).");
      }
    } catch (error) {
      console.error("Critical error during enrollment form submission process:", error); 
      toast({
        title: "Submission Failed",
        description: "An critical unexpected error occurred. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      console.log("onSubmit: Finally block, setting isSubmitting to false."); 
      setIsSubmitting(false); 
    }
  };

  const sortedCustomFieldDefinitions = [...customFieldDefinitions].sort((a,b) => a.order - b.order);

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
            <legend className="text-lg font-medium px-1 flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              Practice Information
            </legend>

            <div>
              <Label htmlFor="organizationNPI" className="flex items-center">
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                Organization NPI (10 digits)
              </Label>
              <div className="flex items-center space-x-2 mt-1">
                <Controller
                  name="practiceInfo.organizationNPI"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Input
                      id="organizationNPI"
                      {...field}
                      placeholder="Enter NPI"
                      maxLength={10}
                      className={fieldState.error ? "border-destructive" : ""}
                      disabled={npiLookupLoading}
                    />
                  )}
                />
                <Button type="button" onClick={handleNpiLookup} disabled={npiLookupLoading || !watchedOrganizationNPI || watchedOrganizationNPI.length !== 10} size="sm">
                  {npiLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">Lookup</span>
                </Button>
                {fetchedNpiData && (
                   <Button type="button" variant="ghost" onClick={handleClearNpiData} disabled={npiLookupLoading} size="sm">Clear</Button>
                )}
              </div>
              {form.formState.errors.practiceInfo?.organizationNPI && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.organizationNPI.message}</p>}
              {npiLookupError && <p className="text-sm text-destructive mt-1">{npiLookupError}</p>}
            </div>

            {fetchedNpiData && (
              <Card className="mt-2 bg-muted/30">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-md">Fetched NPI Data:</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-0.5 pb-3">
                  <p><strong>Name:</strong> {fetchedNpiData.name}</p>
                  {fetchedNpiData.orgName && fetchedNpiData.orgName !== fetchedNpiData.name && <p><strong>Organization:</strong> {fetchedNpiData.orgName}</p>}
                  {fetchedNpiData.address && (
                    <p><strong>Address:</strong> {[
                        fetchedNpiData.address.address_1,
                        fetchedNpiData.address.address_2,
                        fetchedNpiData.address.city,
                        fetchedNpiData.address.state,
                        fetchedNpiData.address.postal_code
                    ].filter(Boolean).join(', ').replace(/ ,/g, ',')}
                    </p>
                  )}
                   {fetchedNpiData.address?.telephone_number && <p><strong>Phone:</strong> {fetchedNpiData.address.telephone_number}</p>}
                   {fetchedNpiData.taxonomy && <p><strong>Taxonomy:</strong> {fetchedNpiData.taxonomy}</p>}
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="practiceName">Practice Name</Label>
              <Input id="practiceName" {...form.register("practiceInfo.name")} placeholder="Official practice name" className={form.formState.errors.practiceInfo?.name ? "border-destructive" : ""} />
              {form.formState.errors.practiceInfo?.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="practiceAddress">Full Address</Label>
              <Textarea id="practiceAddress" {...form.register("practiceInfo.address")} placeholder="Street, City, State, ZIP" className={form.formState.errors.practiceInfo?.address ? "border-destructive" : ""} />
              {form.formState.errors.practiceInfo?.address && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.address.message}</p>}
            </div>
            <div>
              <Label htmlFor="practicePhone">Practice Phone</Label>
              <Input id="practicePhone" type="tel" {...form.register("practiceInfo.phone")} placeholder="(XXX) XXX-XXXX" className={form.formState.errors.practiceInfo?.phone ? "border-destructive" : ""} />
              {form.formState.errors.practiceInfo?.phone && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.phone.message}</p>}
            </div>
          </fieldset>

          {/* Contact Details */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Contact Details
            </legend>
            <div>
              <Label htmlFor="contactName">Contact Full Name</Label>
              <Input id="contactName" {...form.register("contactDetails.name")} className={form.formState.errors.contactDetails?.name ? "border-destructive" : ""} />
              {form.formState.errors.contactDetails?.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" type="email" {...form.register("contactDetails.email")} className={form.formState.errors.contactDetails?.email ? "border-destructive" : ""} />
              {form.formState.errors.contactDetails?.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="contactPhone">Phone</Label>
              <Input id="contactPhone" type="tel" {...form.register("contactDetails.phone")} className={form.formState.errors.contactDetails?.phone ? "border-destructive" : ""} />
              {form.formState.errors.contactDetails?.phone && <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.phone.message}</p>}
            </div>
          </fieldset>

          {/* EHR Vendor */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center">
              <Settings2 className="mr-2 h-5 w-5 text-primary" />
              EHR Vendor
            </legend>
            <Controller
              name="ehrVendor"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select EHR Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {EHR_VENDORS.map((vendor) => (
                        <SelectItem key={vendor.value} value={vendor.value}>
                          {vendor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                </>
              )}
            />
          </fieldset>

          {/* Additional Information - Custom Fields */}
          {sortedCustomFieldDefinitions.length > 0 && (
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-medium px-1 flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                Additional Information
              </legend>
              {sortedCustomFieldDefinitions.map((fieldDef) => {
                const fieldName = `additionalData.${fieldDef.id}` as const;
                const error = form.formState.errors.additionalData?.[fieldDef.id];

                return (
                  <div key={fieldDef.id}>
                    <Label htmlFor={fieldName} className="flex items-center">
                      {fieldDef.label}
                      {fieldDef.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {fieldDef.type === 'text' && (
                      <Controller
                        name={fieldName}
                        control={form.control}
                        defaultValue={form.getValues(fieldName) || ''}
                        render={({ field }) => <Input id={fieldName} {...field} placeholder={fieldDef.placeholder} className={error ? "border-destructive" : ""} />}
                      />
                    )}
                    {fieldDef.type === 'textarea' && (
                      <Controller
                        name={fieldName}
                        control={form.control}
                        defaultValue={form.getValues(fieldName) || ''}
                        render={({ field }) => <Textarea id={fieldName} {...field} placeholder={fieldDef.placeholder} className={error ? "border-destructive" : ""} />}
                      />
                    )}
                    {fieldDef.type === 'select' && (
                        <Controller
                        name={fieldName}
                        control={form.control}
                        defaultValue={form.getValues(fieldName) || ''}
                        render={({ field }) => {
                            let currentOptions = fieldDef.options || [];
                            if (fieldDef.parentFieldId && fieldDef.dependentOptionsJson && watchedAdditionalData) {
                                const parentValue = watchedAdditionalData[fieldDef.parentFieldId];
                                if (parentValue) {
                                    try {
                                        const dependentOptionsMap = JSON.parse(fieldDef.dependentOptionsJson);
                                        currentOptions = dependentOptionsMap[parentValue] || [];
                                    } catch (e) { console.error("Error parsing dependentOptionsJson", e); }
                                } else {
                                  currentOptions = []; 
                                }
                            }
                            return (
                                <Select onValueChange={field.onChange} value={field.value} disabled={fieldDef.parentFieldId && watchedAdditionalData && !watchedAdditionalData[fieldDef.parentFieldId] && currentOptions.length === 0}>
                                    <SelectTrigger id={fieldName} className={error ? "border-destructive" : ""}>
                                        <SelectValue placeholder={fieldDef.placeholder || "Select an option"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentOptions.map((option: CustomFieldOption) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                                        {currentOptions.length === 0 && fieldDef.parentFieldId && watchedAdditionalData && watchedAdditionalData[fieldDef.parentFieldId] && (
                                            <SelectItem value="" disabled>No options for selected parent</SelectItem>
                                        )}
                                        {currentOptions.length === 0 && fieldDef.parentFieldId && (!watchedAdditionalData || !watchedAdditionalData[fieldDef.parentFieldId]) && (
                                            <SelectItem value="" disabled>Select parent field first</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            );
                        }}
                        />
                    )}
                    {fieldDef.type === 'checkbox' && (
                      <Controller
                        name={fieldName}
                        control={form.control}
                        defaultValue={form.getValues(fieldName) || false}
                        render={({ field }) => (
                          <div className="flex items-center space-x-2 mt-1">
                            <Checkbox id={fieldName} checked={!!field.value} onCheckedChange={field.onChange} />
                            <Label htmlFor={fieldName} className="font-normal">{fieldDef.placeholder || fieldDef.label}</Label>
                          </div>
                        )}
                      />
                    )}
                    {fieldDef.type === 'checkbox-group' && fieldDef.options && (
                        <Controller
                            name={fieldName}
                            control={form.control}
                            defaultValue={form.getValues(fieldName) || []}
                            render={({ field }) => (
                            <div className="space-y-2 mt-1">
                                {fieldDef.options!.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                    id={`${fieldName}-${option.value}`}
                                    checked={field.value?.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                        const newValue = checked
                                        ? [...(field.value || []), option.value]
                                        : (field.value || []).filter((v: string) => v !== option.value);
                                        field.onChange(newValue);
                                    }}
                                    />
                                    <Label htmlFor={`${fieldName}-${option.value}`} className="font-normal">{option.label}</Label>
                                </div>
                                ))}
                            </div>
                            )}
                        />
                    )}
                    {fieldDef.type === 'radio-group' && fieldDef.options && (
                        <Controller
                            name={fieldName}
                            control={form.control}
                            defaultValue={form.getValues(fieldName) || ''}
                            render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="mt-1 space-y-1">
                                {fieldDef.options!.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`${fieldName}-${option.value}`} />
                                    <Label htmlFor={`${fieldName}-${option.value}`} className="font-normal">{option.label}</Label>
                                </div>
                                ))}
                            </RadioGroup>
                            )}
                        />
                    )}
                    {fieldDef.type === 'date' && (
                         <Controller
                            name={fieldName}
                            control={form.control}
                            defaultValue={form.getValues(fieldName) || ''}
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal mt-1 ${!field.value && "text-muted-foreground"} ${error ? "border-destructive" : ""}`}
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {field.value && isValid(parseISO(field.value)) ? format(parseISO(field.value), "PPP") : <span>{fieldDef.placeholder || "Pick a date"}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date ? date.toISOString() : '')}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                    )}
                    {error && <p className="text-sm text-destructive mt-1">{(error as any).message || "Invalid input"}</p>}
                  </div>
                );
              })}
            </fieldset>
          )}


          {/* File Upload */}
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              CCD/FHIR Document
            </legend>
            <FileUploader onFileSelect={handleFileSelect} acceptedFileTypes=".xml,.json" label="Upload Document" />
            {isProcessingFile && (
              <div className="text-muted-foreground text-sm flex items-center mt-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing file...
              </div>
            )}
            <FHIRValidationDisplay result={validationResult} />
          </fieldset>

          {/* Consent */}
          <fieldset className="p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
              Consent Agreement
            </legend>
            <div className="flex items-start space-x-2 mt-2">
              <Controller
                name="consent"
                control={form.control}
                render={({ field, fieldState }) => (
                    <>
                    <Checkbox id="consent" checked={field.value} onCheckedChange={field.onChange} className={fieldState.error ? "border-destructive" : ""} />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="consent" className={`text-sm font-medium ${fieldState.error ? "text-destructive" : ""}`}>
                        I agree to the terms and conditions for data submission and processing.
                        </Label>
                        <p className="text-xs text-muted-foreground">
                        By checking this box, you consent to the secure handling of your submitted data.
                        </p>
                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                  </>
                )}
              />
            </div>
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={isSubmitting || isProcessingFile || npiLookupLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Enrollment"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

