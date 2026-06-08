import { createFileRoute } from "@tanstack/react-router"
import { callServerChatCompletion } from "@/features/career/lib/server-ai"

type RequestBody = {
  systemPrompt?: string
  userText?: string
}

function extractCompletionText(data: any) {
  const content = data?.choices?.[0]?.message?.content
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((part) => part?.text)
      .filter((text) => typeof text === "string")
      .join("\n")
  }
  return ""
}

export const Route = createFileRoute("/api/openai/crash-plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as RequestBody
          const systemPrompt = body.systemPrompt?.trim()
          const userText = body.userText?.trim()

          if (!systemPrompt || !userText) {
            return Response.json({ error: "缺少急训计划提示词" }, { status: 400 })
          }

          const response = await callServerChatCompletion({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userText },
            ],
            responseFormat: { type: "json_object" },
            temperature: 0.4,
            maxTokens: 2200,
          })

          const raw = await response.text()
          let data: any
          try {
            data = JSON.parse(raw)
          } catch {
            return Response.json({ error: "急训计划 API 返回格式异常" }, { status: 502 })
          }

          const content = extractCompletionText(data)
          if (!content.trim()) {
            return Response.json({ error: "急训计划返回内容为空，请重试" }, { status: 502 })
          }

          return Response.json({ content })
        } catch (error) {
          console.error("Crash plan generation error:", error)
          return Response.json(
            { error: error instanceof Error ? error.message : "急训计划请求失败" },
            { status: 500 },
          )
        }
      },
    },
  },
})
