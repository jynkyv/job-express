"use client"

import { useState, useCallback, useRef } from "react"
import { callCrashPlan, CrashPlanApiError } from "@/features/career/lib/crashPlan"
import { SYSTEM_PROMPTS, POSITIONS } from "@/features/career/lib/prompts"
import type { CrashPlanResult, ImageAnalysisV2Result } from "@/features/career/types"

export type CrashPlanPhaseState = "idle" | "generating" | "done" | "error"

function extractJson(text: string): any {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) return JSON.parse(match[0])
  throw new Error("急训计划返回格式异常，请重试")
}

/** 把形象分析结果压成一段简洁文本，作为急训计划的上下文。 */
function buildAnalysisSummary(result: ImageAnalysisV2Result, position: string): string {
  const posLabel = POSITIONS.find((p) => p.value === position)?.label || "通用岗位"
  const lines = [
    `目标岗位：${posLabel}。`,
    `综合评分：${result.overall_score}；穿搭评分：${result.outfit_analysis.outfit_score}；岗位匹配：${result.job_match.overall_match}。`,
    `着装：${result.outfit_analysis.clothing_type}，正式度${result.outfit_analysis.formal_level}/5。${result.outfit_analysis.outfit_advice}`,
    `发型/仪容：${result.face_hair.hair_advice} ${result.face_hair.makeup_advice}`,
    `岗位需调整：${result.job_match.key_adjustments.join("、") || "无明显项"}。`,
    `可立即改进：${result.summary_advice.quick_wins.join("、") || "无"}。`,
  ]
  if (result.health_guide) {
    lines.push(
      `作息：${result.health_guide.sleep_routine}`,
      `皮肤：${result.health_guide.skin_care}`,
      `面试当天饮食：${result.health_guide.diet_advice.interview_day}`,
    )
  }
  if (result.fitness_guide) {
    lines.push(
      `体态训练：${result.fitness_guide.posture_training.slice(0, 3).join("、")}。`,
      `当天晨间：${result.fitness_guide.interview_morning}`,
    )
  }
  return lines.join("\n")
}

export function useCrashPlan() {
  const [phase, setPhase] = useState<CrashPlanPhaseState>("idle")
  const [result, setResult] = useState<CrashPlanResult | null>(null)
  const [error, setError] = useState("")
  const abortRef = useRef(false)

  const generate = useCallback(
    async (analysis: ImageAnalysisV2Result, daysUntil: number, position: string) => {
      abortRef.current = false
      setPhase("generating")
      setError("")
      setResult(null)

      const summary = buildAnalysisSummary(analysis, position)
      const userText = [
        `距离面试还有 ${daysUntil} 天。`,
        "以下是该求职者的形象分析结果：",
        summary,
        "请基于以上信息和剩余天数，按要求的 JSON 格式输出形象急训冲刺计划。",
      ].join("\n")

      try {
        const content = await callCrashPlan(SYSTEM_PROMPTS.crashPlan, userText, daysUntil)
        if (abortRef.current) return
        const parsed = extractJson(content) as CrashPlanResult
        setResult({ ...parsed, days_until: daysUntil })
        setPhase("done")
      } catch (e) {
        if (abortRef.current) return
        const message =
          e instanceof CrashPlanApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "急训计划生成失败，请重试"
        setError(message)
        setPhase("error")
      }
    },
    [],
  )

  const reset = useCallback(() => {
    abortRef.current = true
    setPhase("idle")
    setResult(null)
    setError("")
  }, [])

  return { phase, result, error, generate, reset }
}
