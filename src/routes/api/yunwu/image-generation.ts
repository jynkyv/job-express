import { createFileRoute } from "@tanstack/react-router";

type RequestBody = {
  prompt?: string;
  size?: string;
  n?: number;
  quality?: string;
  format?: string;
  background?: string;
  moderation?: string;
};

function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function normalizeBaseURL(baseURL: string) {
  return baseURL.replace(/\/+$/, "");
}

function mapImageGenerationError(status: number, body: string) {
  if (status === 401) return "图片生成 API 密钥无效，请检查服务器环境变量";
  if (status === 429) return "图片生成请求频率过高，请稍后重试";
  if (status >= 500) return "图片生成服务暂时不可用，请稍后重试";

  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || `图片生成 API 返回错误 (${status})`;
  } catch {
    return body || `图片生成 API 返回错误 (${status})`;
  }
}

export const Route = createFileRoute("/api/yunwu/image-generation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as RequestBody;
          const apiKey = readEnv("YUNWU_IMAGE_API_KEY") || readEnv("YUNWU_API_KEY");
          const baseURL = normalizeBaseURL(
            readEnv("YUNWU_IMAGE_API_BASE_URL") || readEnv("YUNWU_API_BASE_URL"),
          );
          const model = readEnv("YUNWU_IMAGE_MODEL") || "gpt-image-2";
          const prompt = body.prompt?.trim();

          if (!apiKey) {
            return Response.json({ error: "缺少 YUNWU_IMAGE_API_KEY 环境变量" }, { status: 500 });
          }

          if (!baseURL) {
            return Response.json({ error: "缺少 YUNWU_IMAGE_API_BASE_URL 环境变量" }, { status: 500 });
          }

          if (!prompt) {
            return Response.json({ error: "缺少图片生成提示词" }, { status: 400 });
          }

          const response = await fetch(`${baseURL}/images/generations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              prompt,
              size: body.size || "1024x1024",
              n: body.n || 1,
              quality: body.quality || "low",
              format: body.format || "jpeg",
              ...(body.background ? { background: body.background } : {}),
              ...(body.moderation ? { moderation: body.moderation } : {}),
            }),
          });

          const raw = await response.text();

          if (!response.ok) {
            return Response.json(
              { error: mapImageGenerationError(response.status, raw) },
              { status: response.status },
            );
          }

          const data = JSON.parse(raw);
          return Response.json(data);
        } catch (error) {
          console.error("Yunwu image generation error:", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "图片生成请求失败" },
            { status: 500 },
          );
        }
      },
    },
  },
});
