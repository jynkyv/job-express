"use client"

import { useState, useCallback, useRef } from "react"
import { generateHeadshot, HeadshotApiError } from "@/features/career/lib/headshot"
import { POSITIONS } from "@/features/career/lib/prompts"
import type { ImageAnalysisV2Result } from "@/features/career/types"

export type HeadshotPhaseState = "idle" | "generating" | "done" | "error"

/** 根据形象分析结果与岗位，拼出形象照图生图 prompt。 */
export function buildHeadshotPrompt(analysis: ImageAnalysisV2Result, position: string): string {
  const posLabel = POSITIONS.find((p) => p.value === position)?.label || "求职面试"
  return [
    `把这张照片处理成一张专业的${posLabel}面试形象照。`,
    "严格保留人物本人的五官特征、脸型、肤色、发际线、年龄和性别，不要改变长相，只优化形象呈现。",
    `着装换成得体合身的面试正装：${analysis.outfit_analysis.clothing_type || "深色西装或商务衬衫"}，领口平整、肩线合适。`,
    "整理发型与仪容，使其干净利落、清爽专业。",
    "背景替换为纯净的浅灰或浅蓝职业背景，柔和均匀的专业打光，正面端正构图，神态自信而亲和。",
    "成片风格类似高质量职业证件照/LinkedIn 头像。",
  ].join("")
}

export function useHeadshot() {
  const [phase, setPhase] = useState<HeadshotPhaseState>("idle")
  const [image, setImage] = useState<string | null>(null)
  const [error, setError] = useState("")
  const abortRef = useRef(false)

  const generate = useCallback(async (photo: string, prompt: string) => {
    abortRef.current = false
    setPhase("generating")
    setError("")
    setImage(null)

    try {
      const result = await generateHeadshot(photo, prompt)
      if (abortRef.current) return
      setImage(result)
      setPhase("done")
    } catch (e) {
      if (abortRef.current) return
      const message =
        e instanceof HeadshotApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "形象照生成失败，请重试"
      setError(message)
      setPhase("error")
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    setPhase("idle")
    setImage(null)
    setError("")
  }, [])

  return { phase, image, error, generate, reset }
}
