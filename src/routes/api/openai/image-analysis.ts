import { createFileRoute } from "@tanstack/react-router";

type RequestBody = {
  apiKey?: string;
  model?: string;
  imageBase64?: string;
  text?: string;
  systemPrompt?: string;
  mode?: "validation" | "analysis";
};

const OPENAI_API_BASE = "https://api.openai.com/v1";
const ALLOWED_MODELS = new Set(["gpt-4.1-mini", "gpt-4.1", "gpt-5.1"]);

function mapOpenAIError(status: number, body: string) {
  if (status === 401) return "OpenAI API 密钥无效，请在设置中重新配置";
  if (status === 429) return "OpenAI 请求频率过高，请稍后重试";
  if (status >= 500) return "OpenAI 服务暂时不可用，请稍后重试";

  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || `OpenAI API 返回错误 (${status})`;
  } catch {
    return body || `OpenAI API 返回错误 (${status})`;
  }
}

function extractResponseText(data: any) {
  if (typeof data?.output_text === "string") return data.output_text;

  const parts = data?.output
    ?.flatMap((item: any) => item?.content || [])
    ?.map((content: any) => content?.text)
    ?.filter((text: unknown) => typeof text === "string");

  return parts?.join("\n") || "";
}

export const Route = createFileRoute("/api/openai/image-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as RequestBody;
          const apiKey = body.apiKey?.trim();
          const model = body.model?.trim() || "gpt-4.1-mini";
          const imageBase64 = body.imageBase64?.trim();
          const text = body.text?.trim();
          const systemPrompt = body.systemPrompt?.trim();

          if (!apiKey) {
            return Response.json({ error: "缺少 OpenAI API 密钥" }, { status: 400 });
          }

          if (!ALLOWED_MODELS.has(model)) {
            return Response.json({ error: "不支持的 OpenAI 图像分析模型" }, { status: 400 });
          }

          if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
            return Response.json({ error: "缺少有效的图片数据" }, { status: 400 });
          }

          if (!text || !systemPrompt) {
            return Response.json({ error: "缺少分析提示词" }, { status: 400 });
          }

          const response = await fetch(`${OPENAI_API_BASE}/responses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              instructions: systemPrompt,
              input: [
                {
                  role: "user",
                  content: [
                    { type: "input_text", text },
                    { type: "input_image", image_url: imageBase64, detail: "high" },
                  ],
                },
              ],
              text: {
                format: { type: "json_object" },
              },
              temperature: 0.2,
              max_output_tokens: body.mode === "validation" ? 900 : 4200,
            }),
          });

          const raw = await response.text();

          if (!response.ok) {
            return Response.json({ error: mapOpenAIError(response.status, raw) }, { status: response.status });
          }

          let data: any;
          try {
            data = JSON.parse(raw);
          } catch {
            return Response.json({ error: "OpenAI 返回格式异常" }, { status: 502 });
          }

          const content = extractResponseText(data);
          return Response.json({ content, model });
        } catch (error) {
          console.error("OpenAI image analysis error:", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "OpenAI 图像分析请求失败" },
            { status: 500 },
          );
        }
      },
    },
  },
});
