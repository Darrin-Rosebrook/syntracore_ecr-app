'use server';

/**
 * @fileOverview Summarizes FHIR validation results using AI to highlight key issues and pass/fail status.
 *
 * - summarizeValidationResults - A function that summarizes validation results.
 * - SummarizeValidationResultsInput - The input type for the summarizeValidationResults function.
 * - SummarizeValidationResultsOutput - The return type for the summarizeValidationResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeValidationResultsInputSchema = z.object({
  validationResults: z.object({
    isValid: z.boolean().describe('Indicates whether the FHIR message is valid.'),
    messages: z.array(z.string()).describe('A list of validation messages.'),
  }).describe('The validation results to summarize.'),
});

export type SummarizeValidationResultsInput = z.infer<typeof SummarizeValidationResultsInputSchema>;

const SummarizeValidationResultsOutputSchema = z.object({
  summary: z.string().describe('A summary of the validation results, highlighting key issues and pass/fail status.'),
});

export type SummarizeValidationResultsOutput = z.infer<typeof SummarizeValidationResultsOutputSchema>;

export async function summarizeValidationResults(input: SummarizeValidationResultsInput): Promise<SummarizeValidationResultsOutput> {
  return summarizeValidationResultsFlow(input);
}

const summarizeValidationResultsPrompt = ai.definePrompt({
  name: 'summarizeValidationResultsPrompt',
  input: {schema: SummarizeValidationResultsInputSchema},
  output: {schema: SummarizeValidationResultsOutputSchema},
  prompt: `You are an AI assistant helping public health admins quickly assess submitted enrollments.
  You will receive FHIR validation results and should provide a concise summary highlighting key issues and a final pass/fail status.

  Validation Results:
  Is Valid: {{validationResults.isValid}}
  Messages: {{#each validationResults.messages}}{{{this}}}\n{{/each}}

  Summary:`, // The summary should be a concise and actionable summary of the validation results.
});

const summarizeValidationResultsFlow = ai.defineFlow(
  {
    name: 'summarizeValidationResultsFlow',
    inputSchema: SummarizeValidationResultsInputSchema,
    outputSchema: SummarizeValidationResultsOutputSchema,
  },
  async input => {
    const {output} = await summarizeValidationResultsPrompt(input);
    return output!;
  }
);
