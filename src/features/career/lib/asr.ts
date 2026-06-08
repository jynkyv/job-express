import { getQwenConfig, isMockAIEnabled } from "./config"

export class AsrNotConfiguredError extends Error {
  constructor() {
    super("语音识别未配置，请先在设置中填写通义千问 API 密钥")
    this.name = "AsrNotConfiguredError"
  }
}

export async function speechToText(audioBase64: string): Promise<string> {
  if (isMockAIEnabled()) {
    return "我会先确认现场安全和任务优先级，再按流程汇报、协同处理，并在事后复盘改进。"
  }

  const { apiKey } = getQwenConfig()

  if (!apiKey) {
    throw new AsrNotConfiguredError()
  }

  const response = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/asr-result",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "fun-asr",
        input: { audio: audioBase64 },
        parameters: {
          format: "opus",
          sample_rate: 16000,
          language_hints: ["zh"],
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`语音识别失败 (${response.status})`)
  }

  const data = await response.json()
  return data?.output?.sentence?.text || data?.text || data?.transcript || ""
}
