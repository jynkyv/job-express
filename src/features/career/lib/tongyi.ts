/**
 * 通义千问VL API 模块
 * 兼容 OpenAI Chat Completions 格式
 * 支持多模态输入（文本 + 图片 base64）
 * Endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
 */

import { getQwenConfig, isMockAIEnabled } from "./config"
import { getMockTongyiResponse, streamMockText } from "./mock-ai"

// ---- 类型定义 ----

export interface TongyiTextPart {
  type: "text"
  text: string
}

export interface TongyiImagePart {
  type: "image_url"
  image_url: { url: string } // data:image/webp;base64,...
}

export type TongyiContentPart = TongyiTextPart | TongyiImagePart

export interface TongyiMessage {
  role: "system" | "user" | "assistant"
  content: string | TongyiContentPart[]
}

// ---- 错误类型 ----

export class TongyiNotConfiguredError extends Error {
  constructor() {
    super("通义千问 API 未配置，请在设置中填写 API 密钥")
    this.name = "TongyiNotConfiguredError"
  }
}

export class TongyiNetworkError extends Error {
  constructor(cause?: string) {
    super(`网络连接失败${cause ? `：${cause}` : "，请检查网络"}`
    )
    this.name = "TongyiNetworkError"
  }
}

export class TongyiApiError extends Error {
  status: number
  constructor(status: number, body: string) {
    const msg = status === 401 ? "API 密钥无效，请在设置中重新配置"
      : status === 402 ? "账户余额不足，请充值"
      : status === 429 ? "请求频率过高，请稍后重试"
      : status >= 500 ? "AI 服务暂时不可用，请稍后重试"
      : `API 返回错误 (${status})`
    super(msg)
    this.name = "TongyiApiError"
    this.status = status
  }
}

export class TongyiTimeoutError extends Error {
  constructor(ms: number) {
    super(`请求超时 (${ms / 1000}s)，请检查网络后重试`)
    this.name = "TongyiTimeoutError"
  }
}

// ---- 核心调用 ----

const TIMEOUT_MS = 60000 // 60s

/**
 * 调用通义千问VL API（OpenAI 兼容格式）
 * @param messages 消息数组，支持文本/多模态
 * @param onChunk 可选，流式回调
 * @returns 完整响应文本
 */
export async function callTongyi(
  messages: TongyiMessage[],
  onChunk?: (text: string) => void,
  modelOverride?: string
): Promise<string> {
  if (isMockAIEnabled()) {
    return streamMockText(getMockTongyiResponse(messages), onChunk)
  }

  const { apiKey, baseURL, model } = getQwenConfig()

  if (!apiKey) {
    throw new TongyiNotConfiguredError()
  }

  // 使用 AbortController 实现超时
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelOverride || model,
        messages,
        stream: !!onChunk,
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      throw new TongyiApiError(response.status, errorBody)
    }

    // 流式输出
    if (onChunk && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            const text = parsed.choices?.[0]?.delta?.content || ""
            if (text) {
              fullContent += text
              onChunk(text)
            }
          } catch {
            // ignore partial chunks
          }
        }
      }

      return fullContent
    }

    // 非流式
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ""
  } catch (e) {
    clearTimeout(timeoutId)
    if (e instanceof TongyiApiError || e instanceof TongyiNotConfiguredError) {
      throw e
    }
    if ((e as Error)?.name === "AbortError") {
      throw new TongyiTimeoutError(TIMEOUT_MS)
    }
    if (e instanceof TypeError && (e as Error).message?.includes("fetch")) {
      throw new TongyiNetworkError("无法连接到服务器")
    }
    throw new TongyiNetworkError((e as Error)?.message)
  }
}

/**
 * 快速调用：单图 + 文本
 * @param imageBase64 data:image/webp;base64,... 格式
 * @param text 文本提示
 * @param systemPrompt 可选的 system prompt
 * @param onChunk 流式回调
 */
export async function callTongyiWithImage(
  imageBase64: string,
  text: string,
  systemPrompt?: string,
  onChunk?: (text: string) => void,
  modelOverride?: string
): Promise<string> {
  const messages: TongyiMessage[] = []

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt })
  }

  messages.push({
    role: "user",
    content: [
      { type: "image_url", image_url: { url: imageBase64 } },
      { type: "text", text },
    ],
  })

  return callTongyi(messages, onChunk, modelOverride)
}
