"use client"

import { useState, useCallback, useRef } from "react"
import { generateHeadshot, HeadshotApiError } from "@/features/career/lib/headshot"
import { POSITIONS } from "@/features/career/lib/prompts"
import type { ImageAnalysisV2Result } from "@/features/career/types"

export type HeadshotPhaseState = "idle" | "generating" | "done" | "error"

/** 根据形象分析结果与岗位，拼出形象照图生图 prompt。 */
export function buildHeadshotPrompt(analysis: ImageAnalysisV2Result, position: string): string {
  const posLabel = POSITIONS.find((p) => p.value === position)?.label || "求职面试"
  const clothing =
    analysis.outfit_analysis.clothing_type || "深色西装、白色衬衫，男士可搭配深蓝或深灰领带，女士使用白衬衫无领带"

  return [
    `将用户上传照片处理成一张适合「${posLabel}」使用的中国标准二寸白底西装证件照。`,
    "严格保留用户本人真实身份特征：脸型、眉毛、眼睛、鼻子、嘴唇、耳朵、发际线、自然肤色、年龄感和五官比例都要可辨认为同一个人。",
    `服装替换为得体正式的面试正装：${clothing}。保持领口平整、肩部水平、双肩自然对称、人物居中。`,
    "画面要求：正面面对镜头，头部端正，眼睛平视镜头，嘴唇自然闭合，表情正式自然，不露齿，纯白背景，真实照相馆柔光，肤色自然，保留适量真实皮肤纹理，只做轻微证件照级别修饰。",
    "不要改变脸型，不要改变年龄，不要过度磨皮，不要美化成陌生人，不要生成网红脸，不要改变五官比例，不要添加夸张妆容，不要生成文字、边框、水印或 logo。",
    "最终效果应真实、自然、清晰，像标准白底西装证件照，而不是 AI 写真、商务海报或艺术照。",
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
