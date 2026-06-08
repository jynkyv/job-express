"use client"

import { useState, useCallback, useRef } from "react"
import { callOpenAIWithImage, OpenAINotConfiguredError } from "@/features/career/lib/openai-image"
import { SYSTEM_PROMPTS, POSITIONS } from "@/features/career/lib/prompts"
import type { BmiData, ImageAnalysisV2Result } from "@/features/career/types"

export type AnalysisPhase =
  | "idle"
  | "validating"
  | "analyzing"
  | "parsing"
  | "complete"
  | "error"

export interface AnalysisStep {
  phase: AnalysisPhase
  message: string
  progress: number // 0-100
}

export interface ImageAnalysisState {
  phase: AnalysisPhase
  step: AnalysisStep
  error: string
  result: ImageAnalysisV2Result | null
  isRetrying: boolean
  retryCount: number
}

const ANALYSIS_STEPS: Record<AnalysisPhase, { message: string; progress: number }> = {
  idle:           { message: "", progress: 0 },
  validating:     { message: "正在校验照片质量...", progress: 10 },
  analyzing:      { message: "视觉模型正在分析照片...", progress: 30 },
  parsing:        { message: "正在整理分析结果...", progress: 80 },
  complete:       { message: "分析完成", progress: 100 },
  error:          { message: "分析失败", progress: 0 },
}

const MAX_RETRIES = 2

function extractJson(text: string): any {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) return JSON.parse(match[0])
  throw new Error("AI 返回格式异常，请重试")
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useImageAnalysis() {
  const [phase, setPhase] = useState<AnalysisPhase>("idle")
  const [result, setResult] = useState<ImageAnalysisV2Result | null>(null)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const abortRef = useRef(false)

  const step: AnalysisStep = {
    phase,
    message: ANALYSIS_STEPS[phase].message,
    progress: ANALYSIS_STEPS[phase].progress,
  }

  const analyze = useCallback(async (
    bmi: BmiData | null,
    age: string,
    gender: string,
    position: string,
    processedPhotos: string[],
    onChunk?: (text: string) => void,
  ) => {
    abortRef.current = false
    setPhase("analyzing")
    setError("")
    setResult(null)
    setRetryCount(0)

    const posLabel = POSITIONS.find((p) => p.value === position)?.label || "未填写"
    const photosUsed = processedPhotos[0]
    if (!photosUsed) { setError("请先上传照片"); setPhase("error"); return }

    const genderLabel = gender === "male" ? "男" : gender === "female" ? "女" : "未填写"
    const bodyInfo = bmi
      ? `年龄${age || "未填写"}岁，性别${genderLabel}，身高${bmi.height}cm，体重${bmi.weight}kg，BMI ${bmi.bmi}（${bmi.categoryLabel}）。`
      : `年龄${age || "未填写"}，性别${genderLabel}，身高体重未填写。`
    const analysisText = [
      `身体数据：${bodyInfo}`,
      `目标岗位：${posLabel}。`,
      "请按照要求的 JSON 格式输出完整的职业形象分析。",
    ].join("")

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortRef.current) return

      if (attempt > 0) {
        setRetryCount(attempt)
        setError(`网络波动，正在重试 (${attempt}/${MAX_RETRIES})...`)
        await delay(1000 * attempt) // 递增等待
      }

      try {
        const fullText = await callOpenAIWithImage(
          photosUsed,
          analysisText,
          SYSTEM_PROMPTS.imageAnalysisV2,
          "analysis",
          onChunk,
        )

        if (abortRef.current) return

        setPhase("parsing")
        const parsed = extractJson(fullText) as ImageAnalysisV2Result
        setResult({ ...parsed, analyzed_at: new Date().toISOString(), model_used: "gemini-3.1-flash-lite" })
        setPhase("complete")
        setError("")
        return
      } catch (e) {
        lastError = e instanceof Error ? e : new Error("未知错误")

        // 配置错误不重试
        if (e instanceof OpenAINotConfiguredError) {
          setError(e.message)
          setPhase("error")
          return
        }

        // 格式错误不重试
        if (e instanceof SyntaxError || lastError.message.includes("格式异常")) {
          setError("AI 返回数据格式异常，请重试")
          setPhase("error")
          return
        }

        // 只有网络/服务器错误才继续重试
        if (lastError.message.includes("fetch") || lastError.message.includes("网络") || lastError.message.includes("timeout") || lastError.message.includes("500")) {
          continue
        }
      }
    }

    // 所有重试都失败
    setError(`分析失败：${lastError?.message || "请检查网络后重试"}`)
    setPhase("error")
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    setPhase("idle")
    setResult(null)
    setError("")
    setRetryCount(0)
  }, [])

  return { phase, step, result, error, retryCount, analyze, reset }
}
