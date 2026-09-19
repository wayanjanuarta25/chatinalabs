import { createOpenAI } from '@ai-sdk/openai';

// Server-only OpenAI client instance
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key',
});
