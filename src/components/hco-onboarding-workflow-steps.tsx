
'use client';

import React from 'react';
import type { EnrollmentData, OnboardingStageStatus } from '@/types';
import { ECR_ONBOARDING_STAGES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, CircleAlert, Circle, CircleX, RefreshCw, CircleHelp, CircleDashed, WorkflowIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const getStageStatus = (stageId: number, enrollmentStatus: EnrollmentData['status']): OnboardingStageStatus => {
  switch (stageId) {
    case 1: // Intent to Register
    case 2: // Provider Enrollment
      return 'Complete'; // Assuming enrollment record means these are done
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
          // This would ideally depend on Stage 7 (Production Approval) being 'Complete'.
          // For now, if PHA approved (Stage 3 done), this is 'Not Yet Applicable' until next stages are tracked.
          return 'Not Yet Applicable';
      }
      return 'Not Yet Applicable';
    default: // Stages 5 (EHR/LIMS Confirmation), 6 (Data Exchange Testing), 7 (Production Approval)
      if (enrollmentStatus === 'Approved') return 'Not Started'; 
      return 'Not Yet Applicable';
  }
};

export function HcoOnboardingWorkflowSteps({ enrollment }: HcoOnboardingWorkflowStepsProps) {
  return (
    <Card className="shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <WorkflowIcon className="mr-2 h-6 w-6 text-primary" /> 
          eCR Onboarding Status
        </CardTitle>
        <CardDescription>
          Current status of your Health Care Organization's eCR onboarding process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3"> {/* Added space-y-3 for consistent spacing */}
          {ECR_ONBOARDING_STAGES.map((stage) => {
            const currentStatus = getStageStatus(stage.id, enrollment.status);
            const IconComponent = statusIcons[currentStatus];
            const colorClass = statusColors[currentStatus];

            return (
              <div 
                key={stage.id} 
                className="flex items-start space-x-3 p-4 border rounded-md shadow-sm bg-background hover:shadow-md transition-shadow" // Added border, rounded, shadow, padding, and margin
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
      </CardContent>
    </Card>
  );
}
