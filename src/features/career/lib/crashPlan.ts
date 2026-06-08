"use client"

import { isMockAIEnabled } from "./config"
import { getMockCrashPlanResponse } from "./mock-ai"

export class CrashPlanApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "CrashPlanApiError"
    this.status = status
  }
}

/** 调用急训冲刺计划文本接口，返回原始 JSON 文本（由调用方解析）。 */
export async function callCrashPlan(
  systemPrompt: string,
  userText: string,
  daysUntil: number,
): Promise<string> {
  if (isMockAIEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return getMockCrashPlanResponse(daysUntil)
  }

  const response = await fetch("/api/openai/crash-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userText }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new CrashPlanApiError(response.status, data?.error || "急训计划生成失败，请稍后重试")
  }

  if (typeof data?.content !== "string" || !data.content.trim()) {
    throw new CrashPlanApiError(response.status, "急训计划返回内容为空，请重试")
  }

  return data.content
}
