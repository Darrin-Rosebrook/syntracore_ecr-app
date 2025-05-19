
'use client';

import React from 'react';
import type { EnrollmentData, OnboardingStageStatus } from '@/types';
import { ECR_ONBOARDING_STAGES } from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, CircleAlert, Circle, CircleX, RefreshCw, CircleHelp, CircleDashed, WorkflowIcon, CalendarDays, Info, Lock } from 'lucide-react'; // Added Lock icon
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface HcoOnboardingWorkflowStepsProps {
  enrollment: EnrollmentData;
  isVendorView?: boolean; // New prop for vendor context
}

const statusIcons: Record<OnboardingStageStatus, React.ElementType> = {
  'Not Started': Circle,
  'In Progress': CircleAlert,
  'Complete': CheckCircle2,
  'Failed': CircleX,
  'Action Required': CircleHelp,
  'Ongoing': RefreshCw,
  'Not Yet Applicable': CircleDashed,
};

const statusColors: Record<OnboardingStageStatus, string> = {
  'Not Started': 'text-blue-500',
  'In Progress': 'text-yellow-500 animate-pulse',
  'Complete': 'text-green-500',
  'Failed': 'text-red-500',
  'Action Required': 'text-orange-500',
  'Ongoing': 'text-indigo-500',
  'Not Yet Applicable': 'text-gray-400',
};

const getEnrollmentStatusBadgeVariant = (status: EnrollmentData['status']) => {
    switch (status) {
      case 'Approved': return 'default'; 
      case 'Pending': return 'secondary'; 
      case 'Changes Requested': return 'destructive'; 
      case 'Denied': return 'destructive'; 
      default: return 'outline';
    }
};
  
const getEnrollmentStatusBadgeClass = (status: EnrollmentData['status']) => {
     switch (status) {
      case 'Approved': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'Pending': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'Changes Requested': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'Denied': return 'bg-red-700 hover:bg-red-800 text-white';
      default: return '';
    }
};

const getStageStatus = (stageId: number, enrollmentStatus: EnrollmentData['status']): OnboardingStageStatus => {
  switch (stageId) {
    case 1: // Intent to Register
    case 2: // Provider Enrollment
      return 'Complete'; 
    case 3: // PHA Review
      if (enrollmentStatus === 'Pending') return 'In Progress';
      if (enrollmentStatus === 'Approved') return 'Complete';
      if (enrollmentStatus === 'Changes Requested') return 'Action Required';
      if (enrollmentStatus === 'Denied') return 'Failed';
      return 'Not Started'; 
    case 4: // eCR Readiness Validation
      if (enrollmentStatus === 'Approved') return 'Not Started'; 
      if (enrollmentStatus === 'Pending' || enrollmentStatus === 'Changes Requested' || enrollmentStatus === 'Denied') return 'Not Yet Applicable';
      return 'Not Yet Applicable';
    case 8: // Ongoing Monitoring & Support
      if (enrollmentStatus === 'Approved') {
          return 'Not Yet Applicable'; 
      }
      return 'Not Yet Applicable';
    default: // Stages 5 (EHR/LIMS Confirmation), 6 (Data Exchange Testing), 7 (Production Approval)
      if (enrollmentStatus === 'Approved') return 'Not Started'; 
      return 'Not Yet Applicable';
  }
};

const getCurrentPhaseName = (enrollmentStatus: EnrollmentData['status']): string => {
  switch (enrollmentStatus) {
    case 'Pending':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 3)?.name || 'PHA Review';
    case 'Changes Requested':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 3)?.name || 'PHA Review';
    case 'Approved':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 4)?.name || 'eCR Readiness Validation'; 
    case 'Denied':
      return ECR_ONBOARDING_STAGES.find(s => s.id === 3)?.name || 'PHA Review';
    default:
      const initialStage = ECR_ONBOARDING_STAGES.find(s => s.id === 1);
      return initialStage?.name || 'Initial Stage';
  }
};


export function HcoOnboardingWorkflowSteps({ enrollment, isVendorView = false }: HcoOnboardingWorkflowStepsProps) {
  const submissionDate = enrollment.submissionDate && isValid(parseISO(enrollment.submissionDate))
    ? format(parseISO(enrollment.submissionDate), 'PPP p')
    : 'N/A';
  
  const currentPhaseName = getCurrentPhaseName(enrollment.status);

  return (
    <Accordion type="single" collapsible className="w-full shadow-lg border rounded-md mb-6" defaultValue="onboarding-status-item">
      <AccordionItem value="onboarding-status-item">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col text-left">
              <h2 className="flex items-center text-xl font-semibold"> {/* Changed from CardTitle to h2 */}
                <WorkflowIcon className="mr-2 h-6 w-6 text-primary" /> 
                eCR Onboarding Status
              </h2>
              <p className="text-sm text-muted-foreground mt-1"> {/* Changed from CardDescription to p */}
                Current status of this HCO's eCR onboarding process. Click to expand/collapse.
              </p>
            </div>
            <div className="text-right text-sm space-y-1 ml-4 shrink-0">
              <div className="flex items-center justify-end">
                 <CalendarDays className="mr-1.5 h-4 w-4 text-muted-foreground" />
                 <span className="font-medium text-muted-foreground">Submitted:</span>
                 <span className="ml-1">{submissionDate}</span>
              </div>
              <div className="flex items-center justify-end">
                <Info className="mr-1.5 h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Overall Status:</span>
                <Badge variant={getEnrollmentStatusBadgeVariant(enrollment.status)} className={`ml-1 ${getEnrollmentStatusBadgeClass(enrollment.status)}`}>
                    {enrollment.status}
                </Badge>
              </div>
              <div className="flex items-center justify-end">
                <WorkflowIcon className="mr-1.5 h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Current Phase:</span>
                <span className="ml-1 font-semibold">{currentPhaseName}</span>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-6 pb-4 pt-0 space-y-3">
            {ECR_ONBOARDING_STAGES.map((stage) => {
              const currentStatus = getStageStatus(stage.id, enrollment.status);
              const IconComponent = statusIcons[currentStatus];
              const colorClass = statusColors[currentStatus];
              const showLock = isVendorView && (stage.id === 1 || stage.id === 2);

              return (
                <div 
                  key={stage.id} 
                  className="flex items-start space-x-3 p-4 border rounded-md shadow-sm bg-background hover:shadow-md transition-shadow"
                >
                  <IconComponent className={cn("h-7 w-7 mt-1 shrink-0", colorClass)} />
                  <div className="flex-grow">
                    <p className="font-semibold text-md flex items-center">
                      {stage.id}. {stage.name}
                      {showLock && <Lock className="ml-2 h-4 w-4 text-muted-foreground" titleAccess="Locked for vendor view" />}
                      <span className={cn("ml-2 text-xs font-normal px-2 py-0.5 rounded-full", 
                          currentStatus === 'Complete' ? 'bg-green-100 text-green-700' :
                          currentStatus === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                          currentStatus === 'Action Required' ? 'bg-orange-100 text-orange-700' :
                          currentStatus === 'Failed' ? 'bg-red-100 text-red-700' :
                          currentStatus === 'Not Started' ? 'bg-blue-100 text-blue-700' :
                          currentStatus === 'Ongoing' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-700'
                      )}>
                          {currentStatus}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
