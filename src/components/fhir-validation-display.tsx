import React from 'react';
import type { FHIRValidationResult } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ListChecks, MessageSquareQuote } from "lucide-react";

interface FHIRValidationDisplayProps {
  result?: FHIRValidationResult;
}

export function FHIRValidationDisplay({ result }: FHIRValidationDisplayProps) {
  if (!result) {
    return null;
  }

  const getBadgeVariant = (isValid: boolean) => {
    return isValid ? "default" : "destructive";
  };
  
  const getBadgeClass = (isValid: boolean) => {
    return isValid ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600";
  }


  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          {result.isValid ? (
            <CheckCircle2 className="h-6 w-6 mr-2 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 mr-2 text-red-600" />
          )}
          FHIR Validation Status
          <Badge variant={getBadgeVariant(result.isValid)} className={`ml-auto ${getBadgeClass(result.isValid)} text-white`}>
            {result.isValid ? "Valid" : "Invalid"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.summary && (
          <div>
            <h4 className="font-semibold text-md mb-1 flex items-center">
              <MessageSquareQuote className="h-5 w-5 mr-2 text-primary" />
              AI Summary:
            </h4>
            <p className="text-sm text-foreground/80 bg-secondary p-3 rounded-md">{result.summary}</p>
          </div>
        )}
        <div>
          <h4 className="font-semibold text-md mb-1 flex items-center">
            <ListChecks className="h-5 w-5 mr-2 text-primary" />
            Detailed Messages:
          </h4>
          {result.messages.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm max-h-60 overflow-y-auto bg-muted/30 p-3 rounded-md">
              {result.messages.map((msg, index) => (
                <li key={index} className={`p-1 rounded ${msg.toLowerCase().includes('error') ? 'text-destructive' : msg.toLowerCase().includes('warning') ? 'text-yellow-600' : 'text-foreground/70'}`}>
                  {msg}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No detailed messages.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
