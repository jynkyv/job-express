/**
 * Shared AI configuration for resume editing, mock interviews, and image analysis.
 * The canonical values live in the Zustand store and are persisted in localStorage.
 */
import { useAIConfigStore } from "@/store/useAIConfigStore"

export interface DeepSeekConfig {
  apiKey: string
  baseURL: string
  model: string
}

export interface QwenConfig {
  apiKey: string
  baseURL: string
  model: string
}

export interface OpenAIConfig {
  apiKey: string
  baseURL: string
  imageModel: string
}

export interface SpeechConfig {
  provider: "browser" | "dashscope"
}

export interface GlobalAPIConfig {
  deepseek: DeepSeekConfig
  qwen: QwenConfig
  openai: OpenAIConfig
  speech: SpeechConfig
  mockAIEnabled: boolean
}

const DEFAULT_DEEPSEEK: DeepSeekConfig = {
  apiKey: "",
  baseURL: "https://api.deepseek.com/v1",
  model: "deepseek-v4-flash",
}

const DEFAULT_QWEN: QwenConfig = {
  apiKey: "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "qwen3.6-plus",
}

const DEFAULT_OPENAI: OpenAIConfig = {
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  imageModel: "gpt-4.1-mini",
}

const DEFAULT_SPEECH: SpeechConfig = {
  provider: "browser",
}

export function getDefaultConfig(): GlobalAPIConfig {
  return {
    deepseek: { ...DEFAULT_DEEPSEEK },
    qwen: { ...DEFAULT_QWEN },
    openai: { ...DEFAULT_OPENAI },
    speech: { ...DEFAULT_SPEECH },
    mockAIEnabled: false,
  }
}

export function loadConfig(): GlobalAPIConfig {
  const state = useAIConfigStore.getState()
  return {
    deepseek: {
      ...DEFAULT_DEEPSEEK,
      apiKey: state.deepseekApiKey,
      model: state.deepseekModelId,
    },
    qwen: {
      ...DEFAULT_QWEN,
      apiKey: state.qwenApiKey,
      baseURL: state.qwenApiEndpoint,
      model: state.qwenModelId,
    },
    openai: {
      ...DEFAULT_OPENAI,
      apiKey: state.openaiApiKey,
      imageModel: state.openaiImageModelId,
    },
    speech: {
      provider: state.speechProvider,
    },
    mockAIEnabled: state.mockAIEnabled,
  }
}

export function saveConfig(config: GlobalAPIConfig): void {
  const state = useAIConfigStore.getState()
  state.setDeepseekApiKey(config.deepseek.apiKey)
  state.setDeepseekModelId(config.deepseek.model)
  state.setQwenApiKey(config.qwen.apiKey)
  state.setQwenModelId(config.qwen.model)
  state.setOpenAIApiKey(config.openai.apiKey)
  state.setOpenAIImageModelId(config.openai.imageModel)
  state.setSpeechProvider(config.speech.provider)
  state.setMockAIEnabled(config.mockAIEnabled)
}

export function resetConfig(): GlobalAPIConfig {
  const defaults = getDefaultConfig()
  saveConfig(defaults)
  return defaults
}

export function getDeepSeekConfig(): DeepSeekConfig {
  return loadConfig().deepseek
}

export function getSpeechConfig(): SpeechConfig {
  return loadConfig().speech
}

export function isMockAIEnabled(): boolean {
  return useAIConfigStore.getState().mockAIEnabled
}

export function isDeepSeekConfigured(): boolean {
  if (isMockAIEnabled()) return true
  const cfg = loadConfig().deepseek
  return !!cfg.apiKey && !!cfg.baseURL && !!cfg.model
}

export function getQwenConfig(): QwenConfig {
  return loadConfig().qwen
}

export function isQwenConfigured(): boolean {
  if (isMockAIEnabled()) return true
  const cfg = loadConfig().qwen
  return !!cfg.apiKey && !!cfg.baseURL && !!cfg.model
}

export function getOpenAIConfig(): OpenAIConfig {
  return loadConfig().openai
}

export function isOpenAIConfigured(): boolean {
  if (isMockAIEnabled()) return true
  const cfg = loadConfig().openai
  return !!cfg.apiKey && !!cfg.baseURL && !!cfg.imageModel
}
