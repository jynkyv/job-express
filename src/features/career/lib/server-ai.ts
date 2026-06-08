export type ServerAIMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export function readEnv(name: string) {
  return process.env[name]?.trim() || ""
}

export function normalizeBaseURL(baseURL: string) {
  return baseURL.replace(/\/+$/, "")
}

export function getTextAIConfig() {
  const apiKey = readEnv("AI_API_KEY") || readEnv("IMAGE_ANALYSIS_API_KEY") || readEnv("YUNWU_API_KEY")
  const baseURL = normalizeBaseURL(
    readEnv("AI_API_BASE_URL") || readEnv("IMAGE_ANALYSIS_API_BASE_URL") || readEnv("YUNWU_API_BASE_URL"),
  )
  const model = readEnv("AI_TEXT_MODEL") || readEnv("IMAGE_ANALYSIS_MODEL") || "gemini-3.1-flash-lite"

  return { apiKey, baseURL, model }
}

export function mapAIError(status: number, body: string) {
  if (status === 401) return "AI API 密钥无效，请检查服务器环境变量"
  if (status === 429) return "AI 请求频率过高，请稍后重试"
  if (status >= 500) return "AI 服务暂时不可用，请稍后重试"

  try {
    const parsed = JSON.parse(body)
    return parsed?.error?.message || `AI API 返回错误 (${status})`
  } catch {
    return body || `AI API 返回错误 (${status})`
  }
}

export async function callServerChatCompletion({
  messages,
  stream = false,
  responseFormat,
  temperature = 0.3,
  maxTokens = 4096,
}: {
  messages: ServerAIMessage[]
  stream?: boolean
  responseFormat?: { type: "json_object" }
  temperature?: number
  maxTokens?: number
}) {
  const { apiKey, baseURL, model } = getTextAIConfig()

  if (!apiKey) {
    throw new Error("缺少 AI_API_KEY 环境变量")
  }

  if (!baseURL) {
    throw new Error("缺少 AI_API_BASE_URL 环境变量")
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  })

  if (!response.ok) {
    const raw = await response.text()
    throw new Error(mapAIError(response.status, raw))
  }

  return response
}
