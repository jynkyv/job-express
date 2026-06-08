"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { processImage } from "@/features/career/lib/imageProcessor"

export interface PhotoUploadState {
  photos: string[]           // 预览用 data URL
  processedPhotos: string[]  // 压缩后 base64
  isDragging: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  dropRef: React.RefObject<HTMLDivElement>
  handleFiles: (files: FileList | File[]) => Promise<void>
  removePhoto: (index: number) => void
  clearPhotos: () => void
  setIsDragging: (v: boolean) => void
}

export function usePhotoUpload(maxPhotos = 2): PhotoUploadState {
  const [photos, setPhotos] = useState<string[]>([])
  const [processedPhotos, setProcessedPhotos] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (fileArr.length === 0) return
    const remaining = maxPhotos - photos.length
    const toAdd = fileArr.slice(0, remaining)
    if (toAdd.length === 0) return

    const previews = await Promise.all(
      toAdd.map((f) => new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(f)
      }))
    )
    setPhotos((prev) => [...prev, ...previews].slice(0, maxPhotos))

    const compressed = await Promise.all(
      toAdd.map(async (f) => {
        const r = await processImage(f)
        return r.success ? r.base64 : null
      })
    )
    setProcessedPhotos((prev) => [...prev, ...compressed.filter(Boolean) as string[]].slice(0, maxPhotos))
  }, [photos.length, maxPhotos])

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setProcessedPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearPhotos = useCallback(() => {
    setPhotos([])
    setProcessedPhotos([])
  }, [])

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false) }
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); setIsDragging(false)
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
    }
    el.addEventListener("dragover", onDragOver)
    el.addEventListener("dragleave", onDragLeave)
    el.addEventListener("drop", onDrop)
    return () => {
      el.removeEventListener("dragover", onDragOver)
      el.removeEventListener("dragleave", onDragLeave)
      el.removeEventListener("drop", onDrop)
    }
  }, [handleFiles])

  return {
    photos, processedPhotos, isDragging, fileInputRef, dropRef,
    handleFiles, removePhoto, clearPhotos, setIsDragging,
  }
}
