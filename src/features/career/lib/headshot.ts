"use client"

import { isMockAIEnabled } from "./config"

export class HeadshotApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "HeadshotApiError"
    this.status = status
  }
}

/** 调用形象照图生图（edit）接口，返回结果图片的 data URL 或远程 URL。 */
export async function generateHeadshot(imageBase64: string, prompt: string): Promise<string> {
  if (isMockAIEnabled()) {
    // Mock 模式无法真正改图，延迟后原样返回，保证 UI 流程可走通。
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return imageBase64
  }

  const response = await fetch("/api/yunwu/image-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, prompt }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new HeadshotApiError(response.status, data?.error || "形象照生成失败，请稍后重试")
  }

  if (typeof data?.image !== "string" || !data.image) {
    throw new HeadshotApiError(response.status, "形象照生成结果为空，请重试")
  }

  return data.image
}
