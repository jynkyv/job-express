"use client"

import { useHeadshot, buildHeadshotPrompt } from "@/features/career/hooks/useHeadshot"
import type { ImageAnalysisV2Result } from "@/features/career/types"
import { Camera, Loader2, Download, RefreshCw, AlertCircle, Wand2, ArrowRight } from "lucide-react"

interface Props {
  photo?: string
  analysis: ImageAnalysisV2Result
  position: string
}

export default function HeadshotCard({ photo, analysis, position }: Props) {
  const { phase, image, error, generate, reset } = useHeadshot()
  const isGenerating = phase === "generating"

  const handleGenerate = () => {
    if (!photo) return
    generate(photo, buildHeadshotPrompt(analysis, position))
  }

  const handleDownload = () => {
    if (!image) return
    const a = document.createElement("a")
    a.href = image
    a.download = "面试形象照.png"
    a.click()
  }

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
          <Camera className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-black text-slate-900">生成面试形象照</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            用你本人的照片，一键改成得体正装、干净背景的面试形象照，保留本人样貌。
          </p>
        </div>
      </div>

      {/* 对照区 */}
      <div className="mt-5 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Frame label="原照" src={photo} />
        <ArrowRight className="size-5 shrink-0 text-slate-300" />
        <Frame
          label="形象照"
          src={image || undefined}
          loading={isGenerating}
          placeholder="生成后显示"
        />
      </div>

      {phase === "error" && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {image ? (
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <Download className="size-4" />
              下载形象照
            </button>
            <button
              onClick={() => { reset(); handleGenerate() }}
              disabled={isGenerating}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-black text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
            >
              <RefreshCw className="size-4" />
              重生成
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !photo}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {isGenerating ? "正在生成形象照…" : "生成形象照"}
          </button>
        )}
        <p className="text-[11px] font-semibold leading-4 text-slate-400">
          照片会发送到已配置的图像服务用于本次生成，结果不写入简历，仅在当前页面展示。生成效果受模型能力影响，仅供参考。
        </p>
      </div>
    </div>
  )
}

function Frame({
  label,
  src,
  loading,
  placeholder,
}: {
  label: string
  src?: string
  loading?: boolean
  placeholder?: string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="bg-slate-50 px-3 py-1.5 text-center text-[11px] font-black text-slate-500">{label}</div>
      <div className="relative aspect-[4/5] bg-slate-100">
        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="size-6 animate-spin" />
            <span className="text-[11px] font-bold">生成中…</span>
          </div>
        ) : src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-bold text-slate-400">
            {placeholder || "暂无图片"}
          </div>
        )}
      </div>
    </div>
  )
}
