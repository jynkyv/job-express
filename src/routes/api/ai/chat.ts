import { createFileRoute } from "@tanstack/react-router"
import { callServerChatCompletion, type ServerAIMessage } from "@/features/career/lib/server-ai"

type RequestBody = {
  messages?: ServerAIMessage[]
  stream?: boolean
  temperature?: number
  maxTokens?: number
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as RequestBody
          const messages = body.messages || []

          if (!Array.isArray(messages) || messages.length === 0) {
            return Response.json({ error: "缺少 AI 消息内容" }, { status: 400 })
          }

          const response = await callServerChatCompletion({
            messages,
            stream: !!body.stream,
            temperature: body.temperature ?? 0.3,
            maxTokens: body.maxTokens ?? (body.stream ? 3072 : 4096),
          })

          if (body.stream) {
            return new Response(response.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            })
          }

          const data = await response.json()
          return Response.json(data)
        } catch (error) {
          console.error("AI chat error:", error)
          return Response.json(
            { error: error instanceof Error ? error.message : "AI 请求失败" },
            { status: 500 },
          )
        }
      },
    },
  },
})
