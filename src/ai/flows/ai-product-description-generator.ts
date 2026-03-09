'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating compelling product descriptions.
 *
 * - generateProductDescription - A function that generates a product description based on provided product details.
 * - AiProductDescriptionGeneratorInput - The input type for the generateProductDescription function.
 * - AiProductDescriptionGeneratorOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiProductDescriptionGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product (e.g., dresses, shoes, bags).'),
  attributes: z
    .string()
    .describe(
      'Key attributes and features of the product (e.g., "silk fabric, hand-stitched, elegant design").'
    ),
  targetAudience: z
    .string()
    .optional()
    .describe('Optional: The target audience for the product (e.g., "young professionals, eco-conscious buyers").'),
  tone: z
    .string()
    .optional()
    .describe('Optional: The desired tone for the description (e.g., "elegant, playful, sophisticated").'),
});
export type AiProductDescriptionGeneratorInput = z.infer<
  typeof AiProductDescriptionGeneratorInputSchema
>;

const AiProductDescriptionGeneratorOutputSchema = z.object({
  description: z.string().describe('A compelling and descriptive product description.'),
});
export type AiProductDescriptionGeneratorOutput = z.infer<
  typeof AiProductDescriptionGeneratorOutputSchema
>;

export async function generateProductDescription(
  input: AiProductDescriptionGeneratorInput
): Promise<AiProductDescriptionGeneratorOutput> {
  return aiProductDescriptionGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProductDescriptionGeneratorPrompt',
  input: {schema: AiProductDescriptionGeneratorInputSchema},
  output: {schema: AiProductDescriptionGeneratorOutputSchema},
  prompt: `You are an expert marketing copywriter for a high-end fashion boutique. Your goal is to create compelling, descriptive, and SEO-friendly product descriptions that entice customers.

Generate a product description based on the following details:

Product Name: {{{productName}}}
Category: {{{category}}}
Key Attributes/Features: {{{attributes}}}
{{#if targetAudience}}Target Audience: {{{targetAudience}}}{{/if}}
{{#if tone}}Tone: {{{tone}}}{{/if}}

Focus on highlighting the unique selling points, craftsmanship, and how the product will make the customer feel. Keep the description concise but rich in detail, suitable for an online catalog and social media.
`,
});

const aiProductDescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'aiProductDescriptionGeneratorFlow',
    inputSchema: AiProductDescriptionGeneratorInputSchema,
    outputSchema: AiProductDescriptionGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
