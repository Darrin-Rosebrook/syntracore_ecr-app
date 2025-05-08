"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export function FirebaseIntegration() {
  const [projectId, setProjectId] = useState("SyntraCore");
  const [displayedProjectId, setDisplayedProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading or initial display if needed
    if (projectId) {
        setDisplayedProjectId(projectId);
    }
  }, []);


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setDisplayedProjectId(projectId);
    // In a real app, you'd do something with this projectId
    console.log("Firebase Project ID Submitted:", projectId);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center space-x-2 pb-2">
        <Database className="h-6 w-6 text-primary" />
        <CardTitle className="text-2xl font-semibold">Firebase Project Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 text-foreground/80">
          Enter your Firebase project ID to integrate with SyntraHub.
          Currently, this will display the project ID you've entered.
        </CardDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firebaseProjectId" className="text-sm font-medium">Firebase Project ID</Label>
            <Input
              id="firebaseProjectId"
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., syntracore-app"
              className="mt-1"
            />
          </div>
          <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Set Project ID
          </Button>
        </form>
        {displayedProjectId && (
          <div className="mt-4 p-3 bg-secondary rounded-md">
            <p className="text-sm text-secondary-foreground">
              <span className="font-medium">Current Project ID:</span> {displayedProjectId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
