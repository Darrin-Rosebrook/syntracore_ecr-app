import { ProjectOverview } from "@/components/project-overview";
import { FirebaseIntegration } from "@/components/firebase-integration";
import { AISuggestions } from "@/components/ai-suggestions";

export function DashboardTab() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <ProjectOverview />
      <FirebaseIntegration />
      <AISuggestions />
    </div>
  );
}
