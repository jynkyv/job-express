"use client"

import { useState } from "react"
import { useCrashPlan } from "@/features/career/hooks/useCrashPlan"
import type { ImageAnalysisV2Result } from "@/features/career/types"
import { Zap, Loader2, RefreshCw, Target, XCircle, AlertCircle, ChevronRight } from "lucide-react"

interface Props {
  analysis: ImageAnalysisV2Result
  position: string
}

const DAY_PRESETS: { label: string; days: number }[] = [
  { label: "今天", days: 0 },
  { label: "明天", days: 1 },
  { label: "3 天", days: 3 },
  { label: "1 周", days: 7 },
  { label: "2 周+", days: 14 },
]

const CATEGORY_STYLE: Record<string, string> = {
  仪容: "bg-blue-50 text-blue-600",
  着装: "bg-indigo-50 text-indigo-600",
  体态: "bg-emerald-50 text-emerald-600",
  状态: "bg-amber-50 text-amber-600",
  其他: "bg-slate-100 text-slate-500",
}

export default function CrashPlanCard({ analysis, position }: Props) {
  const [days, setDays] = useState(3)
  const [custom, setCustom] = useState("")
  const { phase, result, error, generate, reset } = useCrashPlan()

  const isGenerating = phase === "generating"
  const effectiveDays = custom.trim() ? Math.min(60, Math.max(0, parseInt(custom, 10) || 0)) : days

  const handleGenerate = () => generate(analysis, effectiveDays, position)

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-amber-100 bg-gradient-to-b from-amber-50/70 to-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
          <Zap className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-black text-slate-900">面试急训冲刺</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            填写距离面试还有几天，AI 结合你的形象分析排一份倒计时冲刺清单。
          </p>
        </div>
      </div>

      {/* 天数选择 */}
      <div className="mt-5">
        <p className="text-xs font-bold text-slate-400">距离面试还有</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_PRESETS.map((preset) => {
            const active = !custom.trim() && days === preset.days
            return (
              <button
                key={preset.label}
                onClick={() => { setDays(preset.days); setCustom("") }}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-amber-200"
                }`}
              >
                {preset.label}
              </button>
            )
          })}
          <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 transition ${
            custom.trim() ? "bg-amber-500 text-white ring-amber-500" : "bg-white text-slate-500 ring-slate-200"
          }`}>
            <input
              type="text"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
              placeholder="自定义"
              className="w-[4.5ch] bg-transparent text-center text-sm font-black outline-none placeholder:text-slate-400 placeholder:font-bold"
            />
            <span className="text-xs font-bold">天</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
      >
        {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
        {isGenerating ? "正在排冲刺计划…" : result ? "重新生成冲刺计划" : "生成急训计划"}
      </button>

      {phase === "error" && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="mt-5 min-h-0 flex-1 space-y-4">
          <div className="rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-sm font-black leading-6">{result.headline}</p>
            <div className="mt-2 flex items-start gap-1.5 text-xs font-semibold leading-5 text-amber-200">
              <Target className="mt-0.5 size-3.5 shrink-0" />
              <span>{result.focus}</span>
            </div>
          </div>

          <div className="space-y-3">
            {result.phases.map((stage, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-sm font-black text-slate-900">{stage.title}</p>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-600">{stage.window}</span>
                </div>
                <div className="space-y-2">
                  {stage.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      <p className="flex-1 text-xs font-semibold leading-5 text-slate-600">{item.text}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${CATEGORY_STYLE[item.category] || CATEGORY_STYLE["其他"]}`}>
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {result.avoid.length > 0 && (
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-xs font-black text-rose-700">面试前尽量避免</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.avoid.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-rose-600">
                    <XCircle className="size-3" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-amber-600"
          >
            <RefreshCw className="size-3.5" />
            重新选择天数
          </button>
        </div>
      )}
    </div>
  )
}
