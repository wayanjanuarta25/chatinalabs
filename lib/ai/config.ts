export const AI_CONFIG = {
  defaultModel: "gpt-5.6-sol",
  maxOutputTokens: 2048,
  temperature: 0.7,
}

export function getModelConfig(modelId: string = AI_CONFIG.defaultModel) {
  // Check if model is a reasoning model (o1, o3, etc.) which don't support temperature
  const isReasoningModel = modelId.startsWith('o1') || modelId.startsWith('o3');
  
  if (isReasoningModel) {
    return {
      maxOutputTokens: AI_CONFIG.maxOutputTokens
    }
  }

  return {
    temperature: AI_CONFIG.temperature,
    maxOutputTokens: AI_CONFIG.maxOutputTokens
  }
}
