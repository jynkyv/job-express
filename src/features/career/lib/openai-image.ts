"use client"

import { isMockAIEnabled } from "./config"
import { getMockImageAnalysisResponse, getMockPhotoValidationResponse, streamMockText } from "./mock-ai"

export type OpenAIImageMode = "validation" | "analysis"

export class OpenAINotConfiguredError extends Error {
  constructor() {
    super("视觉分析 API 未配置，请检查服务器环境变量")
    this.name = "OpenAINotConfiguredError"
  }
}

export class OpenAIImageApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "OpenAIImageApiError"
    this.status = status
  }
}

export async function callOpenAIWithImage(
  imageBase64: string,
  text: string,
  systemPrompt: string,
  mode: OpenAIImageMode,
  onChunk?: (text: string) => void,
): Promise<string> {
  if (isMockAIEnabled()) {
    return streamMockText(
      mode === "validation" ? getMockPhotoValidationResponse() : getMockImageAnalysisResponse(),
      onChunk,
    )
  }

  const response = await fetch("/api/openai/image-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      text,
      systemPrompt,
      mode,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new OpenAIImageApiError(
      response.status,
      data?.error || "视觉分析请求失败，请稍后重试",
    )
  }

  if (typeof data?.content !== "string" || !data.content.trim()) {
    throw new OpenAIImageApiError(response.status, "视觉分析返回内容为空，请重试")
  }

  return data.content
}
