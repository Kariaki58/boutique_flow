'use server';
/**
 * @fileOverview A Genkit flow for generating engaging social media post captions for products.
 *
 * - generateSocialMediaPost - A function that handles the social media post generation process.
 * - GenerateSocialMediaPostInput - The input type for the generateSocialMediaPost function.
 * - GenerateSocialMediaPostOutput - The return type for the generateSocialMediaPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaPostInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A brief description of the product.'),
  targetPlatform: z
    .enum(['Instagram', 'WhatsApp', 'Facebook', 'Telegram'])
    .describe('The target social media platform for the post.'),
  price: z.number().optional().describe('The price of the product.'),
  category: z.string().optional().describe('The category of the product.'),
});
export type GenerateSocialMediaPostInput = z.infer<
  typeof GenerateSocialMediaPostInputSchema
>;

const GenerateSocialMediaPostOutputSchema = z.object({
  caption: z.string().describe('The generated social media caption.'),
  hashtags: z.array(z.string()).describe('A list of relevant hashtags.'),
});
export type GenerateSocialMediaPostOutput = z.infer<
  typeof GenerateSocialMediaPostOutputSchema
>;

export async function generateSocialMediaPost(
  input: GenerateSocialMediaPostInput
): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow(input);
}

const socialMediaPostPrompt = ai.definePrompt({
  name: 'socialMediaPostPrompt',
  input: {schema: GenerateSocialMediaPostInputSchema},
  output: {schema: GenerateSocialMediaPostOutputSchema},
  prompt: `You are an expert social media marketer for a fashion boutique.
Your task is to create an engaging social media post caption for a product, tailored to the specified platform.
Focus on appealing to potential customers and encouraging interaction or purchase.
Include relevant emojis and call-to-actions.
Generate a list of relevant hashtags.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
{{#if price}}Price: {{{price}}}{{/if}}
{{#if category}}Category: {{{category}}}{{/if}}
Target Platform: {{{targetPlatform}}}

Craft the perfect caption and provide suitable hashtags.`,
});

const generateSocialMediaPostFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async input => {
    const {output} = await socialMediaPostPrompt(input);
    return output!;
  }
);
