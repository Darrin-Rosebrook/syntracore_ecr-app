"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PROJECT_DESCRIPTION } from "@/lib/constants";
import { suggestNewFeatures, type SuggestNewFeaturesOutput } from "@/ai/flows/suggest-new-features";
import { Lightbulb, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AISuggestions() {
  const [description, setDescription] = useState(PROJECT_DESCRIPTION);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const result: SuggestNewFeaturesOutput = await suggestNewFeatures({ projectDescription: description });
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center space-x-2 pb-2">
        <Lightbulb className="h-6 w-6 text-primary" />
        <CardTitle className="text-2xl font-semibold">AI-Powered Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 text-foreground/80">
          Use the project description to get AI-powered suggestions for new features or improvements.
        </CardDescription>
        <div className="space-y-4">
          <div>
            <Label htmlFor="projectDescription" className="text-sm font-medium">Project Description</Label>
            <Textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isLoading}
            className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Suggestions"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestions.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-medium mb-2 text-primary">Suggested Features:</h4>
            <ul className="list-disc list-inside space-y-1 pl-2 text-foreground/90">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="bg-muted/50 p-2 rounded-md shadow-sm">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
