import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AI_MODEL_CONFIGS, AIModelType } from "@/config/ai";

const normalizeDeepseekModel = (modelId?: string) =>
  ["deepseek-v4-flash", "deepseek-v4-pro"].includes(modelId || "")
    ? modelId!
    : "deepseek-v4-flash";

const normalizeQwenModel = (modelId?: string) =>
  ["qwen3.6-plus", "qwen3.6-flash"].includes(modelId || "")
    ? modelId!
    : "qwen3.6-plus";

const normalizeOpenAIImageModel = (modelId?: string) =>
  ["gpt-4.1-mini", "gpt-4.1", "gpt-5.1"].includes(modelId || "")
    ? modelId!
    : "gpt-4.1-mini";

interface AIConfigState {
  selectedModel: AIModelType;
  deepseekApiKey: string;
  deepseekModelId: string;
  qwenApiKey: string;
  qwenModelId: string;
  qwenApiEndpoint: string;
  openaiApiKey: string;
  openaiImageModelId: string;
  speechProvider: "browser" | "dashscope";
  mockAIEnabled: boolean;
  setDeepseekApiKey: (apiKey: string) => void;
  setDeepseekModelId: (modelId: string) => void;
  setQwenApiKey: (apiKey: string) => void;
  setQwenModelId: (modelId: string) => void;
  setOpenAIApiKey: (apiKey: string) => void;
  setOpenAIImageModelId: (modelId: string) => void;
  setSpeechProvider: (provider: "browser" | "dashscope") => void;
  setMockAIEnabled: (enabled: boolean) => void;
  isConfigured: () => boolean;
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set, get) => ({
      selectedModel: "deepseek",
      deepseekApiKey: "",
      deepseekModelId: "deepseek-v4-flash",
      qwenApiKey: "",
      qwenModelId: "qwen3.6-plus",
      qwenApiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      openaiApiKey: "",
      openaiImageModelId: "gpt-4.1-mini",
      speechProvider: "browser",
      mockAIEnabled: false,
      setDeepseekApiKey: (apiKey: string) => set({ deepseekApiKey: apiKey }),
      setDeepseekModelId: (modelId: string) => set({ deepseekModelId: modelId }),
      setQwenApiKey: (apiKey: string) => set({ qwenApiKey: apiKey }),
      setQwenModelId: (modelId: string) => set({ qwenModelId: modelId }),
      setOpenAIApiKey: (apiKey: string) => set({ openaiApiKey: apiKey }),
      setOpenAIImageModelId: (modelId: string) => set({ openaiImageModelId: modelId }),
      setSpeechProvider: (provider: "browser" | "dashscope") => set({ speechProvider: provider }),
      setMockAIEnabled: (enabled: boolean) => set({ mockAIEnabled: enabled }),
      isConfigured: () => {
        const state = get();
        if (state.mockAIEnabled) return true;
        const config = AI_MODEL_CONFIGS[state.selectedModel];
        return config.validate(state);
      }
    }),
    {
      name: "ai-config-storage",
      version: 2,
      migrate: (persistedState: any) => ({
        selectedModel: "deepseek",
        deepseekApiKey: persistedState?.deepseekApiKey || "",
        deepseekModelId: normalizeDeepseekModel(persistedState?.deepseekModelId),
        qwenApiKey: persistedState?.qwenApiKey || "",
        qwenModelId: normalizeQwenModel(persistedState?.qwenModelId),
        qwenApiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        openaiApiKey: persistedState?.openaiApiKey || "",
        openaiImageModelId: normalizeOpenAIImageModel(persistedState?.openaiImageModelId),
        speechProvider: persistedState?.speechProvider || "browser",
        mockAIEnabled: Boolean(persistedState?.mockAIEnabled),
      }),
      merge: (persistedState: any, currentState) => {
        const state = { ...currentState, ...persistedState };

        try {
          const legacy = JSON.parse(localStorage.getItem("interview-coach-api-config") || "{}");
          state.deepseekApiKey ||= legacy.deepseek?.apiKey || "";
          state.deepseekModelId = normalizeDeepseekModel(persistedState?.deepseekModelId || legacy.deepseek?.model);
          state.qwenApiKey ||= legacy.qwen?.apiKey || "";
          state.qwenModelId = normalizeQwenModel(persistedState?.qwenModelId || legacy.qwen?.model);
          state.openaiApiKey ||= legacy.openai?.apiKey || "";
          state.openaiImageModelId = normalizeOpenAIImageModel(persistedState?.openaiImageModelId || legacy.openai?.imageModel);
          state.speechProvider = persistedState?.speechProvider || legacy.speech?.provider || "browser";
          state.mockAIEnabled = Boolean(persistedState?.mockAIEnabled);
        } catch {
          // Ignore malformed legacy values and keep the canonical defaults.
        }

        return state;
      }
    }
  )
);
