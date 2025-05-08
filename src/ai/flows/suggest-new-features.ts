'use server';

/**
 * @fileOverview An AI agent for suggesting new features or improvements to a project based on its description.
 *
 * - suggestNewFeatures - A function that handles the suggestion generation process.
 * - SuggestNewFeaturesInput - The input type for the suggestNewFeatures function.
 * - SuggestNewFeaturesOutput - The return type for the suggestNewFeatures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNewFeaturesInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('The description of the project for which to suggest new features.'),
});
export type SuggestNewFeaturesInput = z.infer<typeof SuggestNewFeaturesInputSchema>;

const SuggestNewFeaturesOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested new features or improvements for the project.'),
});
export type SuggestNewFeaturesOutput = z.infer<typeof SuggestNewFeaturesOutputSchema>;

export async function suggestNewFeatures(input: SuggestNewFeaturesInput): Promise<SuggestNewFeaturesOutput> {
  return suggestNewFeaturesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNewFeaturesPrompt',
  input: {schema: SuggestNewFeaturesInputSchema},
  output: {schema: SuggestNewFeaturesOutputSchema},
  prompt: `You are an AI assistant tasked with suggesting new features or improvements for a given project.

  Based on the project description provided, generate a list of potential enhancements that would add value to the project.
  Project Description: {{{projectDescription}}}

  Suggestions should be concise and actionable.
  Format the output as a JSON array of strings.
  `,
});

const suggestNewFeaturesFlow = ai.defineFlow(
  {
    name: 'suggestNewFeaturesFlow',
    inputSchema: SuggestNewFeaturesInputSchema,
    outputSchema: SuggestNewFeaturesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
