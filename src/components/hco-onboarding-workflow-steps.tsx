
'use client';

import React from 'react';
import type { EnrollmentData, OnboardingStageStatus } from '@/types';
import { ECR_ONBOARDING_STAGES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Keep Card for structure if needed, or remove if Accordion replaces it fully
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, CircleAlert, Circle, CircleX, RefreshCw, CircleHelp, CircleDashed, WorkflowIcon, CalendarDays, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface HcoOnboardingWorkflowStepsProps {
  enrollment: EnrollmentData;
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
      case 'Approved': return 'default'; // Typically green
      case 'Pending': return 'secondary'; // Typically yellow/orange
      case 'Changes Requested': return 'destructive'; // Typically orange/red
      case 'Denied': return 'destructive'; // Typically red
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

export function HcoOnboardingWorkflowSteps({ enrollment }: HcoOnboardingWorkflowStepsProps) {
  const submissionDate = enrollment.submissionDate && isValid(parseISO(enrollment.submissionDate))
    ? format(parseISO(enrollment.submissionDate), 'PPP p')
    : 'N/A';

  return (
    <Accordion type="single" collapsible className="w-full shadow-lg border rounded-md mb-6">
      <AccordionItem value="onboarding-status">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col text-left">
              <CardTitle className="flex items-center text-xl font-semibold">
                <WorkflowIcon className="mr-2 h-6 w-6 text-primary" /> 
                eCR Onboarding Status
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Current status of this HCO's eCR onboarding process. Click to expand/collapse.
              </CardDescription>
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
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-6 pb-4 pt-0 space-y-3">
            {ECR_ONBOARDING_STAGES.map((stage) => {
              const currentStatus = getStageStatus(stage.id, enrollment.status);
              const IconComponent = statusIcons[currentStatus];
              const colorClass = statusColors[currentStatus];

              return (
                <div 
                  key={stage.id} 
                  className="flex items-start space-x-3 p-4 border rounded-md shadow-sm bg-background hover:shadow-md transition-shadow"
                >
                  <IconComponent className={cn("h-7 w-7 mt-1 shrink-0", colorClass)} />
                  <div className="flex-grow">
                    <p className="font-semibold text-md">{stage.id}. {stage.name}
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
