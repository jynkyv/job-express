import { isMockAIEnabled } from "./config"
import { getMockDeepSeekResponse, streamMockText } from "./mock-ai"

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export class DeepSeekNotConfiguredError extends Error {
  constructor() {
    super("AI API 未配置，请检查服务器环境变量")
    this.name = "DeepSeekNotConfiguredError"
  }
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  if (isMockAIEnabled()) {
    return streamMockText(getMockDeepSeekResponse(messages), onChunk)
  }

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      stream: !!onChunk,
      temperature: 0.3,
      maxTokens: onChunk ? 3072 : 4096,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    if (response.status === 500 && data?.error?.includes("环境变量")) {
      throw new DeepSeekNotConfiguredError()
    }
    throw new Error(data?.error || `API error: ${response.status} ${response.statusText}`)
  }

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
          // ignore parse errors for incomplete chunks
        }
      }
    }

    return fullContent
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}
