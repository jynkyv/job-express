"use client"

import { useState, useCallback } from "react"
import { callTongyiWithImage } from "@/features/career/lib/tongyi"
import { SYSTEM_PROMPTS } from "@/features/career/lib/prompts"
import type { PhotoValidationResult } from "@/features/career/types"

export interface PhotoValidationState {
  validation: PhotoValidationResult | null
  isValidating: boolean
  validatePhoto: (base64: string) => Promise<PhotoValidationResult | undefined>
  clearValidation: () => void
}

export function usePhotoValidation(): PhotoValidationState {
  const [validation, setValidation] = useState<PhotoValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validatePhoto = useCallback(async (base64: string) => {
    if (!base64) return
    setIsValidating(true)
    setValidation(null)

    try {
      const text = await callTongyiWithImage(
        base64,
        "请评估这张照片是否适合用于职业形象分析。",
        SYSTEM_PROMPTS.photoValidation,
      )
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0]) as PhotoValidationResult
        setValidation(parsed)
        return parsed
      }
    } catch (e) {
      console.error("照片质量校验失败:", e)
      // 校验失败不做阻塞，让用户自行决定
    } finally {
      setIsValidating(false)
    }
  }, [])

  const clearValidation = useCallback(() => {
    setValidation(null)
  }, [])

  return { validation, isValidating, validatePhoto, clearValidation }
}
