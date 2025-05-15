
'use client';

import React from 'react';
import type { EnrollmentData, OnboardingStage, OnboardingStageStatus } from '@/types';
import { ECR_ONBOARDING_STAGES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, CircleAlert, Circle, CircleX, RefreshCw, CircleHelp, CircleDashed, WorkflowIcon } from 'lucide-react'; // Added WorkflowIcon
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
      return 'Not Started'; // Should not happen if status is valid
    case 4: // eCR Readiness Validation
      if (enrollmentStatus === 'Approved') return 'Not Started'; // Next step after PHA approval
      if (enrollmentStatus === 'Pending' || enrollmentStatus === 'Changes Requested' || enrollmentStatus === 'Denied') return 'Not Yet Applicable';
      return 'Not Yet Applicable';
    case 8: // Ongoing Monitoring & Support
      // This stage becomes 'Ongoing' only if stage 7 is complete.
      // For now, we don't have a way to track stage 7 completion directly from enrollment.status.
      // We will assume if PHA is Approved, stage 8 is "Not Yet Applicable" until further stages are implemented.
      // If we had a specific "ProductionLive" status for enrollment, we could make this 'Ongoing'.
      if (enrollmentStatus === 'Approved') {
          // This is a placeholder. Real logic would depend on Production Approval (Stage 7) being complete.
          // For now, if PHA has approved, this is the *next major conceptual phase* but not yet active.
          return 'Not Yet Applicable';
      }
      return 'Not Yet Applicable';
    default: // Stages 5, 6, 7
      if (enrollmentStatus === 'Approved') return 'Not Started'; // Placeholder for subsequent steps
      return 'Not Yet Applicable';
  }
};

export function HcoOnboardingWorkflowSteps({ enrollment }: HcoOnboardingWorkflowStepsProps) {
  return (
    <Card className="shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <WorkflowIcon className="mr-2 h-6 w-6 text-primary" /> {/* Using a generic workflow icon */}
          eCR Onboarding Progress
        </CardTitle>
        <CardDescription>
          Current status of the Health Care Organization's eCR onboarding process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ECR_ONBOARDING_STAGES.map((stage) => {
            const currentStatus = getStageStatus(stage.id, enrollment.status);
            const IconComponent = statusIcons[currentStatus];
            const colorClass = statusColors[currentStatus];

            return (
              <div key={stage.id} className="flex items-start space-x-3 p-3 border-b last:border-b-0">
                <IconComponent className={cn("h-6 w-6 mt-1 shrink-0", colorClass)} />
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
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
