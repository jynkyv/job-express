import { createFileRoute } from "@tanstack/react-router";
import { callServerChatCompletion } from "@/features/career/lib/server-ai";

export const Route = createFileRoute("/api/polish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { content, customInstructions } = body as {
            content: string;
            customInstructions?: string;
          };

          let systemPrompt = `你是一个专业的简历优化助手。请帮助优化以下 Markdown 格式的文本，使其更加专业和有吸引力。

              优化原则：
              1. 使用更专业的词汇和表达方式
              2. 突出关键成就和技能
              3. 保持简洁清晰
              4. 使用主动语气
              5. 保持原有信息的完整性
              6. 严格保留原有的 Markdown 格式结构（列表项保持为列表项，加粗保持加粗等）

              请直接返回优化后的 Markdown 文本，不要包含任何解释或其他内容。`;

          if (customInstructions?.trim()) {
            systemPrompt += `\n\n用户额外要求：\n${customInstructions.trim()}`;
          }

          const response = await callServerChatCompletion({
            stream: true,
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content
              }
            ],
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              if (!response.body) {
                controller.close();
                return;
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    controller.close();
                    break;
                  }

                  const chunk = decoder.decode(value);
                  const lines = chunk.split("\n").filter((line) => line.trim() !== "");

                  for (const line of lines) {
                    if (line.includes("[DONE]")) continue;
                    if (!line.startsWith("data:")) continue;

                    try {
                      const data = JSON.parse(line.slice(5));
                      const deltaContent = data.choices[0]?.delta?.content;
                      if (deltaContent) {
                        controller.enqueue(encoder.encode(deltaContent));
                      }
                    } catch (e) {
                      console.error("Error parsing JSON:", e);
                    }
                  }
                }
              } catch (error) {
                console.error("Stream reading error:", error);
                controller.error(error);
              }
            }
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive"
            }
          });
        } catch (error) {
          console.error("Polish error:", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "AI service request failed" },
            { status: 500 }
          );
        }
      }
    }
  }
});
