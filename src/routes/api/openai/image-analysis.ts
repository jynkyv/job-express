import { createFileRoute } from "@tanstack/react-router";

type RequestBody = {
  imageBase64?: string;
  text?: string;
  systemPrompt?: string;
  mode?: "validation" | "analysis";
};

const DEFAULT_IMAGE_ANALYSIS_MODEL = "gemini-3.1-flash-lite";

function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function normalizeBaseURL(baseURL: string) {
  return baseURL.replace(/\/+$/, "");
}

function mapVisionError(status: number, body: string) {
  if (status === 401) return "视觉分析 API 密钥无效，请检查服务器环境变量";
  if (status === 429) return "视觉分析请求频率过高，请稍后重试";
  if (status >= 500) return "视觉分析服务暂时不可用，请稍后重试";

  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || `视觉分析 API 返回错误 (${status})`;
  } catch {
    return body || `视觉分析 API 返回错误 (${status})`;
  }
}

function extractCompletionText(data: any) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => part?.text)
      .filter((text) => typeof text === "string")
      .join("\n");
  }
  return "";
}

export const Route = createFileRoute("/api/openai/image-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as RequestBody;
          const apiKey = readEnv("IMAGE_ANALYSIS_API_KEY") || readEnv("OPENAI_API_KEY");
          const baseURL = normalizeBaseURL(
            readEnv("IMAGE_ANALYSIS_API_BASE_URL") || readEnv("OPENAI_API_BASE_URL"),
          );
          const model = readEnv("IMAGE_ANALYSIS_MODEL") || DEFAULT_IMAGE_ANALYSIS_MODEL;
          const imageBase64 = body.imageBase64?.trim();
          const text = body.text?.trim();
          const systemPrompt = body.systemPrompt?.trim();

          if (!apiKey) {
            return Response.json({ error: "缺少 IMAGE_ANALYSIS_API_KEY 环境变量" }, { status: 500 });
          }

          if (!baseURL) {
            return Response.json({ error: "缺少 IMAGE_ANALYSIS_API_BASE_URL 环境变量" }, { status: 500 });
          }

          if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
            return Response.json({ error: "缺少有效的图片数据" }, { status: 400 });
          }

          if (!text || !systemPrompt) {
            return Response.json({ error: "缺少分析提示词" }, { status: 400 });
          }

          const response = await fetch(`${baseURL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: [
                    { type: "text", text },
                    { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
                  ],
                },
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
              max_tokens: body.mode === "validation" ? 900 : 4200,
            }),
          });

          const raw = await response.text();

          if (!response.ok) {
            return Response.json({ error: mapVisionError(response.status, raw) }, { status: response.status });
          }

          let data: any;
          try {
            data = JSON.parse(raw);
          } catch {
            return Response.json({ error: "视觉分析 API 返回格式异常" }, { status: 502 });
          }

          const content = extractCompletionText(data);
          return Response.json({ content, model });
        } catch (error) {
          console.error("Vision image analysis error:", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "视觉分析请求失败" },
            { status: 500 },
          );
        }
      },
    },
  },
});
