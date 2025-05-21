
"use client";

import * as React from 'react';
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EHR_VENDORS, OHIO_HEALTH_SYSTEMS } from "@/lib/constants";
import { FileUploader } from "@/components/file-uploader";
import { useToast } from "@/hooks/use-toast";
import type { EnrollmentFormData, FHIRValidationResult, CustomFieldDefinition, CustomFieldOption, ProviderData, CliaData } from "@/types";
import { validateFHIR } from "@/services/fhir-validator";
import { fetchNpiDataAction } from '@/actions/workflow-actions';
import { fetchCliaDataAction } from '@/actions/clia-actions';
import { summarizeValidationResults } from "@/ai/flows/summarize-validation-results";
import { FHIRValidationDisplay } from "./fhir-validation-display";
import { ClipboardList, User, Building, Settings2, FileText, ShieldCheck, Loader2, Info, CalendarDays, Hash, Search as SearchIcon, ArrowRight, FilePenLine, Beaker } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { addEnrollmentToFirestore } from '@/lib/firestore-add-enrollment';
import { useAppContext } from '@/context/AppContext';


const practiceInfoSchema = z.object({
  organizationNPI: z
    .string()
    .length(10, "Organization NPI must be 10 digits")
    .regex(/^[0-9]{10}$/, "Organization NPI must be a 10-digit number")
    .optional().or(z.literal('')),
  name: z.string().min(1, "HCO/Lab name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  healthSystem: z.string().optional(),
  isLabOrPerformsLabServices: z.enum(['yes', 'no'], { required_error: "Please select if this is a lab or performs lab services." }),
  cliaNumber: z.string().optional(),
  cliaLabName: z.string().optional(), // Populated from lookup or manual entry
  cliaLabType: z.string().optional(), // Populated from lookup or manual entry
}).refine(data => {
    if (data.isLabOrPerformsLabServices === 'yes' && (!data.cliaNumber || data.cliaNumber.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: "CLIA number is required if registering a lab or HCO performing lab services.",
    path: ["cliaNumber"],
  }).refine(data => {
    if (data.isLabOrPerformsLabServices === 'yes' && (!data.organizationNPI?.trim() && !data.cliaNumber?.trim())) {
      return false;
    }
    if (data.isLabOrPerformsLabServices === 'no' && !data.organizationNPI?.trim()) {
        return false;
    }
    return true;
  }, {
    message: "Either Organization NPI or CLIA Number (if applicable) is required.",
    path: ["organizationNPI"], 
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
  consent: z.boolean().refine((val) => val === true, "You must agree to the consent for data submission."),
  additionalData: baseAdditionalDataSchema.optional(),
});

type FormSchemaType = z.infer<typeof enrollmentFormSchema>;

interface ProviderEnrollmentFormProps {
  customFieldDefinitions: CustomFieldDefinition[];
}

export function ProviderEnrollmentForm({
  customFieldDefinitions
}: ProviderEnrollmentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { fetchInitialData } = useAppContext();

  const [ccdFile, setCcdFile] = React.useState<File | null>(null);
  const [ccdFileContent, setCcdFileContent] = React.useState<string | null>(null);
  const [validationResult, setValidationResult] = React.useState<FHIRValidationResult | undefined>(undefined);
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);

  const [npiLookupLoading, setNpiLookupLoading] = React.useState(false);
  const [npiLookupError, setNpiLookupError] = React.useState<string | null>(null);
  const [fetchedNpiData, setFetchedNpiData] = React.useState<ProviderData | null>(null);

  const [cliaLookupLoading, setCliaLookupLoading] = React.useState(false);
  const [cliaLookupError, setCliaLookupError] = React.useState<string | null>(null);
  const [fetchedCliaData, setFetchedCliaData] = React.useState<CliaData | null>(null);


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
      practiceInfo: {
        organizationNPI: "",
        name: "",
        address: "",
        phone: "",
        healthSystem: "",
        isLabOrPerformsLabServices: undefined,
        cliaNumber: "",
        cliaLabName: "",
        cliaLabType: ""
      },
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
  const watchedIsLab = form.watch('practiceInfo.isLabOrPerformsLabServices');
  const watchedOrganizationNPI = form.watch('practiceInfo.organizationNPI');
  const watchedCliaNumber = form.watch('practiceInfo.cliaNumber');

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
  
   React.useEffect(() => {
    if (!authLoading && !currentUser) {
      toast({title: "Please Log In", description: "You must be logged in to submit an HCO registration.", variant: "destructive"});
      router.push('/signup?type=hco');
    } else if (currentUser && !form.getValues('contactDetails.name') && currentUser.displayName) {
      form.setValue('contactDetails.name', currentUser.displayName);
    }
    if (currentUser && !form.getValues('contactDetails.email') && currentUser.email) {
      form.setValue('contactDetails.email', currentUser.email);
    }
  }, [currentUser, authLoading, router, toast, form]);


  const handleFileSelect = async (file: File | null, fileContent: string | null) => {
    setCcdFile(file);
    setCcdFileContent(fileContent);
    setValidationResult(undefined);
    console.log("[ProviderEnrollmentForm] File selected:", file ? file.name : "No file");

    if (file && fileContent) {
      setIsProcessingFile(true);
      let parsedContent: any;

      try {
        // Attempt to parse as JSON, if it fails, assume it's XML or other text
        try {
          parsedContent = JSON.parse(fileContent);
          console.log("[ProviderEnrollmentForm] File content parsed as JSON successfully.");
        } catch (jsonError) {
          console.warn("[ProviderEnrollmentForm] File content is not valid JSON. Proceeding with raw content for validation (e.g., XML).", jsonError);
          parsedContent = fileContent; // Use raw content if JSON.parse fails
        }
        
        const rawValidationResult = await validateFHIR(parsedContent);
        console.log("[ProviderEnrollmentForm] Raw FHIR validation result:", rawValidationResult);
        const aiSummaryResult = await summarizeValidationResults({ validationResults: rawValidationResult });
        console.log("[ProviderEnrollmentForm] AI summary result:", aiSummaryResult);
        setValidationResult({
          ...rawValidationResult,
          summary: aiSummaryResult.summary,
        });
      } catch (validationError) {
        console.error("[ProviderEnrollmentForm] Error during FHIR validation or AI summarization:", validationError);
        toast({
          title: "Processing Error",
          description: "An error occurred while validating the file or generating a summary.",
          variant: "destructive",
        });
        setValidationResult({
            isValid: false,
            messages: ["Error during validation or AI summarization.", (validationError as Error).message],
            summary: "File processing failed during validation or summarization."
        });
      } finally {
        setIsProcessingFile(false);
      }
    } else {
      setValidationResult(undefined);
      setIsProcessingFile(false);
    }
  };

  const handleNpiLookup = async () => {
    const npiToLookup = form.getValues('practiceInfo.organizationNPI');
    console.log("[ProviderEnrollmentForm] Initiating NPI Lookup for:", npiToLookup);
    if (!npiToLookup || !/^\d{10}$/.test(npiToLookup)) {
      toast({ title: "Invalid NPI", description: "Please enter a valid 10-digit NPI to look up.", variant: "destructive" });
      return;
    }
    setNpiLookupLoading(true);
    setNpiLookupError(null);
    setFetchedNpiData(null);
    try {
      const result = await fetchNpiDataAction(npiToLookup);
      console.log("[ProviderEnrollmentForm] NPI Lookup Result:", result);
      if (result.success && result.data) {
        setFetchedNpiData(result.data);
        const provider = result.data;
        
        form.setValue('practiceInfo.name', provider.orgName || provider.name || '', { shouldValidate: true });
        
        let formattedAddress = '';
        if (provider.address) {
          formattedAddress = [provider.address.address_1, provider.address.address_2, provider.address.city, provider.address.state, provider.address.postal_code].filter(Boolean).join(', ').replace(/ ,/g, ',');
        }
        form.setValue('practiceInfo.address', formattedAddress, { shouldValidate: true });
        form.setValue('practiceInfo.phone', provider.address?.telephone_number || '', { shouldValidate: true });

        toast({ title: "NPI Data Fetched", description: `Data for ${provider.name || provider.orgName} loaded. Please review and complete the form.` });
      } else {
        setNpiLookupError(result.error || "NPI not found or no exact match.");
        toast({ title: 'NPI Lookup Failed', description: result.error || "NPI not found.", variant: 'destructive' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve NPI data.";
      console.error("[ProviderEnrollmentForm] NPI Lookup Exception:", error);
      setNpiLookupError(errorMessage);
      toast({ title: 'NPI Lookup Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setNpiLookupLoading(false);
    }
  };

  const handleClearNpiData = () => {
    setFetchedNpiData(null);
    setNpiLookupError(null);
    form.setValue('practiceInfo.organizationNPI', ''); // Also clear the NPI field
    // form.setValue('practiceInfo.name', ''); // Keep these commented or uncomment if full reset is desired
    // form.setValue('practiceInfo.address', '');
    // form.setValue('practiceInfo.phone', '');
    toast({ title: 'NPI Data Cleared', description: 'NPI lookup information has been cleared.' });
  };

  const handleCliaLookup = async () => {
    const cliaToLookup = form.getValues('practiceInfo.cliaNumber');
    console.log("[ProviderEnrollmentForm] Initiating CLIA Lookup for:", cliaToLookup);
    if (!cliaToLookup || cliaToLookup.trim().length === 0) { // Keep this check for empty string
      toast({ title: "Invalid CLIA", description: "Please enter a CLIA number to look up.", variant: "destructive" });
      return;
    }
    setCliaLookupLoading(true);
    setCliaLookupError(null);
    setFetchedCliaData(null);
    try {
      const result = await fetchCliaDataAction(cliaToLookup);
      console.log("[ProviderEnrollmentForm] CLIA Lookup Result:", result);
      if (result.success && result.data) {
        setFetchedCliaData(result.data);
        const labData = result.data;
        
        // Only pre-fill if the corresponding form field is currently empty
        if (!form.getValues('practiceInfo.name') && labData.facilityName) {
            form.setValue('practiceInfo.name', labData.facilityName, { shouldValidate: true });
        }
        if (!form.getValues('practiceInfo.address') && labData.address) {
            form.setValue('practiceInfo.address', labData.address, { shouldValidate: true });
        }
         if (!form.getValues('practiceInfo.phone') && labData.phone) {
            form.setValue('practiceInfo.phone', labData.phone, { shouldValidate: true });
        }
        // Always set these specific CLIA fields
        form.setValue('practiceInfo.cliaLabName', labData.facilityName || '', { shouldValidate: true });
        form.setValue('practiceInfo.cliaLabType', labData.labType || '', { shouldValidate: true });

        toast({ title: "CLIA Data Fetched", description: `Data for ${labData.facilityName || 'lab'} loaded. Please review.` });
      } else {
        setCliaLookupError(result.error || `CLIA number ${cliaToLookup} not found.`);
        toast({ title: 'CLIA Lookup Failed', description: result.error || "CLIA number not found.", variant: 'destructive' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve CLIA data.";
      console.error("[ProviderEnrollmentForm] CLIA Lookup Exception:", error);
      setCliaLookupError(errorMessage);
      toast({ title: 'CLIA Lookup Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setCliaLookupLoading(false);
    }
  };

  const handleClearCliaData = () => {
    setFetchedCliaData(null);
    setCliaLookupError(null);
    form.setValue('practiceInfo.cliaNumber', ''); // Also clear CLIA number field
    // form.setValue('practiceInfo.cliaLabName', '');
    // form.setValue('practiceInfo.cliaLabType', '');
    toast({ title: 'CLIA Data Cleared', description: 'CLIA lookup information has been cleared.' });
  };


  const onSubmitRegistration = async (data: FormSchemaType) => {
    setIsSubmittingForm(true);
    console.log("[ProviderEnrollmentForm] Form is submitting...");
    console.log("[ProviderEnrollmentForm] Raw Form Data:", JSON.stringify(data, null, 2));
    console.log("[ProviderEnrollmentForm] Current CCD File:", ccdFile ? ccdFile.name : "No file selected/processed");
    console.log("[ProviderEnrollmentForm] Current Validation Result:", JSON.stringify(validationResult, null, 2));


    if (!currentUser || !currentUser.uid || !currentUser.email) {
        toast({ title: "Authentication Error", description: "You must be logged in to submit.", variant: "destructive" });
        setIsSubmittingForm(false);
        return;
    }
    if (!ccdFile) {
      toast({ title: "Missing Document", description: "Please upload a CCD/FHIR document.", variant: "destructive" });
      setIsSubmittingForm(false);
      return;
    }
    if (!validationResult) {
      toast({ title: "File Not Processed or Invalid", description: "Please ensure the file is correctly processed and valid or re-upload if an error occurred.", variant: "destructive" });
      setIsSubmittingForm(false);
      return;
    }

    try {
      const enrollmentDataToSubmit: EnrollmentFormData = {
        ...data,
        practiceInfo: {
            ...data.practiceInfo,
            cliaNumber: data.practiceInfo.isLabOrPerformsLabServices === 'yes' ? data.practiceInfo.cliaNumber : undefined,
            cliaLabName: data.practiceInfo.isLabOrPerformsLabServices === 'yes' ? data.practiceInfo.cliaLabName : undefined,
            cliaLabType: data.practiceInfo.isLabOrPerformsLabServices === 'yes' ? data.practiceInfo.cliaLabType : undefined,
        },
        ccdDocumentName: ccdFile.name,
        additionalData: data.additionalData || {},
      };
      
      console.log("[ProviderEnrollmentForm] Data being sent to addEnrollmentToFirestore:", JSON.stringify(enrollmentDataToSubmit, null, 2));

      const submissionResult = await addEnrollmentToFirestore(
        enrollmentDataToSubmit,
        ccdFileContent,
        validationResult,
        currentUser.uid,
        currentUser.email
      );

      console.log("[ProviderEnrollmentForm] Result from addEnrollmentToFirestore server action:", submissionResult);

      if (submissionResult.success && submissionResult.id) {
        toast({
          title: "Enrollment Submitted Successfully",
          description: `Practice "${data.practiceInfo.name}" enrollment complete. ID: ${submissionResult.id.slice(0,8)}...`,
          className: "bg-green-500 text-white",
        });
        await fetchInitialData(); // Refresh context data
        router.push('/provider-portal');
      } else {
        toast({
          title: "Enrollment Submission Failed",
          description: submissionResult.error || "Could not submit enrollment. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[ProviderEnrollmentForm] Error submitting enrollment data:", error);
      toast({ title: "Error During Submission", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const sortedCustomFieldDefinitions = [...customFieldDefinitions].sort((a,b) => a.order - b.order);
  console.log("[ProviderEnrollmentForm] Rendering. Fetched NPI Data state:", fetchedNpiData);
  console.log("[ProviderEnrollmentForm] Rendering. Fetched CLIA Data state:", fetchedCliaData);


  if (authLoading) {
     return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2">Loading form...</p></div>;
  }
  if (!currentUser && !authLoading) {
     return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><p>Redirecting to login/signup...</p></div>;
  }


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FilePenLine className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl font-semibold">HCO & Lab Registration</CardTitle>
        </div>
        <CardDescription className="text-foreground/80">
          Complete the form below to register your Health Care Organization or Laboratory.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmitRegistration)}>
        <CardContent className="space-y-8">
          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              Organization Information
            </legend>

            <div>
              <Label htmlFor="isLabOrPerformsLabServices" className="flex items-center mb-1">
                Are you registering a Laboratory or an HCO which performs lab services?
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Controller
                name="practiceInfo.isLabOrPerformsLabServices"
                control={form.control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4" disabled={isSubmittingForm}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="isLabYes" />
                      <Label htmlFor="isLabYes" className="font-normal">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="isLabNo" />
                      <Label htmlFor="isLabNo" className="font-normal">No</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {form.formState.errors.practiceInfo?.isLabOrPerformsLabServices && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.isLabOrPerformsLabServices.message}</p>}
            </div>

            {watchedIsLab === 'yes' && (
              <div className="space-y-3 p-3 border-l-4 border-primary bg-primary/5 rounded-md">
                <Label htmlFor="cliaNumber" className="flex items-center">
                  <Beaker className="mr-2 h-4 w-4 text-muted-foreground" />
                  CLIA Number (10 characters) <span className="text-destructive ml-1">*</span>
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                    <Controller
                        name="practiceInfo.cliaNumber"
                        control={form.control}
                        render={({ field, fieldState }) => (
                        <Input
                            id="cliaNumber"
                            {...field}
                            placeholder="Enter CLIA Number"
                            maxLength={10}
                            className={fieldState.error ? "border-destructive" : ""}
                            disabled={isSubmittingForm}
                            value={field.value || ''}
                        />
                        )}
                    />
                </div>
                {form.formState.errors.practiceInfo?.cliaNumber && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.cliaNumber.message}</p>}
                {cliaLookupError && <p className="text-sm text-destructive mt-1">{cliaLookupError}</p>}

                {/* Manual entry for CLIA Lab Name and Type */}
                <div>
                    <Label htmlFor="cliaLabName" className="text-xs">CLIA Lab Name</Label>
                    <Input id="cliaLabName" {...form.register("practiceInfo.cliaLabName")} placeholder="Enter Lab Name as per CLIA" disabled={isSubmittingForm} />
                </div>
                <div>
                    <Label htmlFor="cliaLabType" className="text-xs">CLIA Lab Type</Label>
                    <Input id="cliaLabType" {...form.register("practiceInfo.cliaLabType")} placeholder="e.g., Hospital, Independent" disabled={isSubmittingForm} />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="organizationNPI" className="flex items-center">
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                Organization NPI (10 digits) {watchedIsLab !== 'yes' && <span className="text-destructive ml-1">*</span>}
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
                      disabled={npiLookupLoading || isSubmittingForm}
                      value={field.value || ''}
                    />
                  )}
                />
                <Button type="button" onClick={handleNpiLookup} disabled={npiLookupLoading || isSubmittingForm || !watchedOrganizationNPI || watchedOrganizationNPI.length !== 10} size="sm">
                  {npiLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">Lookup NPI</span>
                </Button>
                {fetchedNpiData && (
                   <Button type="button" variant="ghost" onClick={handleClearNpiData} disabled={npiLookupLoading || isSubmittingForm} size="sm">Clear</Button>
                )}
              </div>
              {form.formState.errors.practiceInfo?.organizationNPI && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.organizationNPI.message}</p>}
              {npiLookupError && <p className="text-sm text-destructive mt-1">{npiLookupError}</p>}
            </div>

            {fetchedNpiData && (
              <Card className="mt-2 bg-muted/30">
                <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm">Fetched NPI Data:</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-0.5 pb-3">
                  <p><strong>Name:</strong> {fetchedNpiData.name}</p>
                  {fetchedNpiData.orgName && fetchedNpiData.orgName !== fetchedNpiData.name && <p><strong>Organization:</strong> {fetchedNpiData.orgName}</p>}
                  {fetchedNpiData.address && ( <p><strong>Address:</strong> {[fetchedNpiData.address.address_1, fetchedNpiData.address.address_2, fetchedNpiData.address.city, fetchedNpiData.address.state, fetchedNpiData.address.postal_code].filter(Boolean).join(', ').replace(/ ,/g, ',')} </p> )}
                   {fetchedNpiData.address?.telephone_number && <p><strong>Phone:</strong> {fetchedNpiData.address.telephone_number}</p>}
                   {fetchedNpiData.taxonomy && <p><strong>Taxonomy:</strong> {fetchedNpiData.taxonomy}</p>}
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="practiceName">HCO/Lab Name <span className="text-destructive ml-1">*</span></Label>
              <Input id="practiceName" {...form.register("practiceInfo.name")} placeholder="Official HCO/Lab name" className={form.formState.errors.practiceInfo?.name ? "border-destructive" : ""} disabled={isSubmittingForm} />
              {form.formState.errors.practiceInfo?.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="practiceAddress">Full Address <span className="text-destructive ml-1">*</span></Label>
              <Textarea id="practiceAddress" {...form.register("practiceInfo.address")} placeholder="Street, City, State, ZIP" className={form.formState.errors.practiceInfo?.address ? "border-destructive" : ""} disabled={isSubmittingForm}/>
              {form.formState.errors.practiceInfo?.address && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.address.message}</p>}
            </div>
            <div>
              <Label htmlFor="practicePhone">HCO/Lab Phone <span className="text-destructive ml-1">*</span></Label>
              <Input id="practicePhone" type="tel" {...form.register("practiceInfo.phone")} placeholder="(XXX) XXX-XXXX" className={form.formState.errors.practiceInfo?.phone ? "border-destructive" : ""} disabled={isSubmittingForm}/>
              {form.formState.errors.practiceInfo?.phone && <p className="text-sm text-destructive mt-1">{form.formState.errors.practiceInfo.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="healthSystem" className="flex items-center">Health System (Optional)</Label>
              <Controller
                name="practiceInfo.healthSystem"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmittingForm}>
                    <SelectTrigger id="healthSystem">
                      <SelectValue placeholder="Select Health System if applicable" />
                    </SelectTrigger>
                    <SelectContent>
                      
                      {OHIO_HEALTH_SYSTEMS.map(system => (
                        <SelectItem key={system.value} value={system.value}>{system.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center"> <User className="mr-2 h-5 w-5 text-primary" /> Primary Contact Details </legend>
            <div> <Label htmlFor="contactName">Contact Full Name <span className="text-destructive ml-1">*</span></Label> <Input id="contactName" {...form.register("contactDetails.name")} className={form.formState.errors.contactDetails?.name ? "border-destructive" : ""} disabled={isSubmittingForm} /> {form.formState.errors.contactDetails?.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.name.message}</p>} </div>
            <div> <Label htmlFor="contactEmail">Email <span className="text-destructive ml-1">*</span></Label> <Input id="contactEmail" type="email" {...form.register("contactDetails.email")} className={form.formState.errors.contactDetails?.email ? "border-destructive" : ""} disabled={isSubmittingForm}/> {form.formState.errors.contactDetails?.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.email.message}</p>} </div>
            <div> <Label htmlFor="contactPhone">Phone <span className="text-destructive ml-1">*</span></Label> <Input id="contactPhone" type="tel" {...form.register("contactDetails.phone")} className={form.formState.errors.contactDetails?.phone ? "border-destructive" : ""} disabled={isSubmittingForm}/> {form.formState.errors.contactDetails?.phone && <p className="text-sm text-destructive mt-1">{form.formState.errors.contactDetails.phone.message}</p>} </div>
          </fieldset>

          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center"> <Settings2 className="mr-2 h-5 w-5 text-primary" /> EHR/LIMS Vendor <span className="text-destructive ml-1">*</span> </legend>
            <Controller name="ehrVendor" control={form.control} render={({ field, fieldState }) => ( <> <Select value={field.value} onValueChange={field.onChange} disabled={isSubmittingForm}> <SelectTrigger className={fieldState.error ? "border-destructive" : ""}> <SelectValue placeholder="Select EHR/LIMS Vendor" /> </SelectTrigger> <SelectContent> {EHR_VENDORS.map((vendor) => ( <SelectItem key={vendor.value} value={vendor.value}> {vendor.label} ({vendor.type}) </SelectItem> ))} </SelectContent> </Select> {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>} </> )}/>
          </fieldset>

          {sortedCustomFieldDefinitions.length > 0 && (
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-lg font-medium px-1 flex items-center"> <Info className="mr-2 h-5 w-5 text-primary" /> Additional Information </legend>
              {sortedCustomFieldDefinitions.map((fieldDef) => {
                const fieldName = `additionalData.${fieldDef.id}` as const;
                const error = form.formState.errors.additionalData?.[fieldDef.id];
                return (
                  <div key={fieldDef.id}>
                    <Label htmlFor={fieldName} className="flex items-center"> {fieldDef.label} {fieldDef.required && <span className="text-destructive ml-1">*</span>} </Label>
                    {fieldDef.type === 'text' && ( <Controller name={fieldName} control={form.control} defaultValue={form.getValues(fieldName) || ''} render={({ field }) => <Input id={fieldName} {...field} placeholder={fieldDef.placeholder} className={error ? "border-destructive" : ""} disabled={isSubmittingForm}/>} /> )}
                    {fieldDef.type === 'textarea' && ( <Controller name={fieldName} control={form.control} defaultValue={form.getValues(fieldName) || ''} render={({ field }) => <Textarea id={fieldName} {...field} placeholder={fieldDef.placeholder} className={error ? "border-destructive" : ""} disabled={isSubmittingForm} />} /> )}
                    {fieldDef.type === 'select' && ( <Controller name={fieldName} control={form.control} defaultValue={form.getValues(fieldName) || ''} render={({ field }) => { let currentOptions = fieldDef.options || []; if (fieldDef.parentFieldId && fieldDef.dependentOptionsJson && watchedAdditionalData) { const parentValue = watchedAdditionalData[fieldDef.parentFieldId]; if (parentValue) { try { const dependentOptionsMap = JSON.parse(fieldDef.dependentOptionsJson); currentOptions = dependentOptionsMap[parentValue] || []; } catch (e) { console.error("Error parsing dependentOptionsJson", e); } } else { currentOptions = []; } } return ( <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingForm || (fieldDef.parentFieldId && watchedAdditionalData && !watchedAdditionalData[fieldDef.parentFieldId] && currentOptions.length === 0)}> <SelectTrigger id={fieldName} className={error ? "border-destructive" : ""}> <SelectValue placeholder={fieldDef.placeholder || "Select an option"} /> </SelectTrigger> <SelectContent> {currentOptions.filter(opt => opt.value && opt.value.trim() !== '').map((option: CustomFieldOption) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))} {currentOptions.length === 0 && fieldDef.parentFieldId && watchedAdditionalData && watchedAdditionalData[fieldDef.parentFieldId] && ( <SelectItem value="NO_OPTIONS_TEMP_VALUE_PLACEHOLDER" disabled>No options for selected parent</SelectItem> )} {currentOptions.length === 0 && fieldDef.parentFieldId && (!watchedAdditionalData || !watchedAdditionalData[fieldDef.parentFieldId]) && ( <SelectItem value="SELECT_PARENT_TEMP_VALUE_PLACEHOLDER" disabled>Select parent field first</SelectItem> )} </SelectContent> </Select> ); }} /> )}
                    {fieldDef.type === 'checkbox' && ( <Controller name={fieldName} control={form.control} defaultValue={form.getValues(fieldName) || false} render={({ field }) => ( <div className="flex items-center space-x-2 mt-1"> <Checkbox id={fieldName} checked={!!field.value} onCheckedChange={field.onChange} disabled={isSubmittingForm}/> <Label htmlFor={fieldName} className="font-normal">{fieldDef.placeholder || fieldDef.label}</Label> </div> )}/> )}
                    {fieldDef.type === 'checkbox-group' && fieldDef.options && ( <Controller name={fieldName} control={form.control} defaultValue={form.getValues(fieldName) || []} render={({ field }) => ( <div className="space-y-2 mt-1"> {fieldDef.options!.map(option => ( <div key={option.value} className="flex items-center space-x-2"> <Checkbox id={`${fieldName}-${option.value}`} checked={Array.isArray(field.value) && field.value.includes(option.value)} onCheckedChange={(checked) => { const newValue = checked ? [...(Array.isArray(field.value) ? field.value : []), option.value] : (Array.isArray(field.value) ? field.value : []).filter((v: string) => v !== option.value); field.onChange(newValue); }} disabled={isSubmittingForm} /> <Label htmlFor={`${fieldName}-${option.value}`} className="font-normal">{option.label}</Label> </div> ))} </div> )}/> )}
                    {fieldDef.type === 'radio-group' && fieldDef.options && ( <Controller name={fieldName} control={form.control} defaultValue={form.getValues(fieldName) || ''} render={({ field }) => ( <RadioGroup onValueChange={field.onChange} value={field.value} className="mt-1 space-y-1" disabled={isSubmittingForm}> {fieldDef.options!.map(option => ( <div key={option.value} className="flex items-center space-x-2"> <RadioGroupItem value={option.value} id={`${fieldName}-${option.value}`} /> <Label htmlFor={`${fieldName}-${option.value}`} className="font-normal">{option.label}</Label> </div> ))} </RadioGroup> )}/> )}
                    {fieldDef.type === 'date' && ( <Controller name={fieldName} control={form.control} defaultValue={form.getValues(fieldName) || ''} render={({ field }) => ( <Popover> <PopoverTrigger asChild> <Button variant={"outline"} className={`w-full justify-start text-left font-normal mt-1 ${!field.value && "text-muted-foreground"} ${error ? "border-destructive" : ""}`} disabled={isSubmittingForm} > <CalendarDays className="mr-2 h-4 w-4" /> {field.value && isValid(parseISO(field.value)) ? format(parseISO(field.value), "PPP") : <span>{fieldDef.placeholder || "Pick a date"}</span>} </Button> </PopoverTrigger> <PopoverContent className="w-auto p-0"> <Calendar mode="single" selected={field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? date.toISOString() : '')} initialFocus disabled={isSubmittingForm} /> </PopoverContent> </Popover> )}/> )}
                    {error && <p className="text-sm text-destructive mt-1">{(error as any).message || "Invalid input"}</p>}
                  </div>
                );
              })}
            </fieldset>
          )}

          <fieldset className="space-y-4 p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center"> <FileText className="mr-2 h-5 w-5 text-primary" /> CCD/FHIR Document </legend>
            <FileUploader onFileSelect={handleFileSelect} acceptedFileTypes=".xml,.json" label="Upload Document (JSON or XML)" />
            {isProcessingFile && ( <div className="text-muted-foreground text-sm flex items-center mt-2"> <Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing file... </div> )}
            <FHIRValidationDisplay result={validationResult} />
          </fieldset>

          <fieldset className="p-4 border rounded-md">
            <legend className="text-lg font-medium px-1 flex items-center"> <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Consent Agreement <span className="text-destructive ml-1">*</span> </legend>
            <div className="flex items-start space-x-2 mt-2">
              <Controller name="consent" control={form.control} render={({ field, fieldState }) => ( <> <Checkbox id="consent" checked={field.value} onCheckedChange={field.onChange} className={fieldState.error ? "border-destructive" : ""} disabled={isSubmittingForm}/> <div className="grid gap-1.5 leading-none"> <Label htmlFor="consent" className={`text-sm font-medium ${fieldState.error ? "text-destructive" : ""}`}> I agree to the terms and conditions for data submission and processing. </Label> <p className="text-xs text-muted-foreground"> By checking this box, you consent to the secure handling of your submitted data. </p> {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>} </div> </> )}/>
            </div>
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmittingForm || isProcessingFile || npiLookupLoading || cliaLookupLoading } >
            {isSubmittingForm ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Registration... </> ) : ( <> Submit Registration <ArrowRight className="ml-2 h-4 w-4" /> </> )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

