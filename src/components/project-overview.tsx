import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_NAME, PROJECT_DESCRIPTION } from "@/lib/constants";
import { Info } from "lucide-react";

export function ProjectOverview() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center space-x-2 pb-2">
        <Info className="h-6 w-6 text-primary" />
        <CardTitle className="text-2xl font-semibold">Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-xl font-medium text-primary">{PROJECT_NAME}</h3>
        <CardDescription className="mt-1 text-foreground/80">
          {PROJECT_DESCRIPTION}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
