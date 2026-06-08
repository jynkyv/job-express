export type AIModelType = "deepseek";

export interface AIValidationContext {
  deepseekApiKey?: string;
  deepseekModelId?: string;
}

export interface AIModelConfig {
  url: (endpoint?: string) => string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
  validate: (context: AIValidationContext) => boolean;
}

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  deepseek: {
    url: () => "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: true,
    defaultModel: "deepseek-v4-flash",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) => !!(context.deepseekApiKey && context.deepseekModelId),
  },
};
