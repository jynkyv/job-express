import { createFileRoute } from "@tanstack/react-router"

type RequestBody = {
  imageBase64?: string
  prompt?: string
  size?: string
  quality?: string
}

function readEnv(name: string) {
  return process.env[name]?.trim() || ""
}

function normalizeBaseURL(baseURL: string) {
  return baseURL.replace(/\/+$/, "")
}

/** 清掉环境变量里常见的脏字符：包裹引号、误带的 "Bearer " 前缀、首尾空白。 */
function sanitizeKey(key: string) {
  return key
    .replace(/^bearer\s+/i, "")
    .replace(/^["']+|["']+$/g, "")
    .trim()
}

function mapImageEditError(status: number, body: string) {
  let upstream = ""
  try {
    upstream = JSON.parse(body)?.error?.message || ""
  } catch {
    upstream = ""
  }

  // 把云雾返回的真实原因透出来，便于区分「密钥无效 / 无图片权限 / 模型不存在 / 不支持 edits」
  if (status === 401) {
    return upstream
      ? `图像服务返回 401：${upstream}`
      : "图像服务返回 401：密钥无效，或该密钥没有图片生成权限。请检查服务器的 YUNWU_IMAGE_API_KEY / AI_API_KEY，以及该密钥是否开通了图片模型。"
  }
  if (status === 429) return "形象照生成请求过于频繁，请稍后重试"
  if (status >= 500) return upstream || "形象照生成服务暂时不可用，请稍后重试"
  return upstream || body || `形象照 API 返回错误 (${status})`
}

/** 解析 data URL，返回 { mime, buffer }；非法输入返回 null。 */
function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") }
}

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
}

export const Route = createFileRoute("/api/yunwu/image-edit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as RequestBody
          const apiKey = sanitizeKey(
            readEnv("YUNWU_IMAGE_API_KEY") || readEnv("YUNWU_API_KEY") || readEnv("AI_API_KEY"),
          )
          const baseURL = normalizeBaseURL(
            readEnv("YUNWU_IMAGE_API_BASE_URL") || readEnv("YUNWU_API_BASE_URL") || readEnv("AI_API_BASE_URL"),
          )
          const model = readEnv("YUNWU_IMAGE_MODEL") || "gpt-image-2"
          const prompt = body.imageBase64 && body.prompt?.trim()

          if (!apiKey) {
            return Response.json({ error: "缺少图像服务密钥（YUNWU_IMAGE_API_KEY 或 AI_API_KEY）" }, { status: 500 })
          }
          if (!baseURL) {
            return Response.json({ error: "缺少图像服务地址（YUNWU_IMAGE_API_BASE_URL 或 AI_API_BASE_URL）" }, { status: 500 })
          }
          if (!body.imageBase64 || !prompt) {
            return Response.json({ error: "缺少照片或形象照提示词" }, { status: 400 })
          }

          const parsed = parseDataUrl(body.imageBase64)
          if (!parsed) {
            return Response.json({ error: "照片数据格式无效" }, { status: 400 })
          }

          // 证件照默认竖版 2:3，输出 jpeg（对齐云雾 gpt-image-2 edits 文档示例）
          const ext = MIME_EXT[parsed.mime] || "png"
          const outFormat = "jpeg"
          const form = new FormData()
          form.append("model", model)
          form.append("prompt", prompt)
          form.append("size", body.size || "1024x1536")
          form.append("n", "1")
          form.append("quality", body.quality || "auto")
          form.append("format", outFormat)
          form.append("background", "auto")
          form.append("moderation", "auto")
          form.append(
            "image",
            new Blob([new Uint8Array(parsed.buffer)], { type: parsed.mime }),
            `source.${ext}`,
          )

          const response = await fetch(`${baseURL}/images/edits`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
          })

          const raw = await response.text()
          if (!response.ok) {
            return Response.json(
              { error: mapImageEditError(response.status, raw) },
              { status: response.status },
            )
          }

          let data: any
          try {
            data = JSON.parse(raw)
          } catch {
            return Response.json({ error: "形象照 API 返回格式异常" }, { status: 502 })
          }

          const first = data?.data?.[0]
          const image =
            typeof first?.b64_json === "string" && first.b64_json
              ? `data:image/jpeg;base64,${first.b64_json}`
              : typeof first?.url === "string"
                ? first.url
                : ""

          if (!image) {
            return Response.json({ error: "形象照生成结果为空，请重试" }, { status: 502 })
          }

          return Response.json({ image })
        } catch (error) {
          console.error("Yunwu image edit error:", error)
          return Response.json(
            { error: error instanceof Error ? error.message : "形象照生成请求失败" },
            { status: 500 },
          )
        }
      },
    },
  },
})
