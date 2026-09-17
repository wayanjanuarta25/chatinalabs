import { createOpenAI } from '@ai-sdk/openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

// Server-only OpenAI client instance
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
