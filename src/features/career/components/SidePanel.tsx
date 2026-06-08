"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import StarCard from "@/features/career/components/StarCard"
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Target,
  Brain,
  MessageSquare,
  Layers,
  Star,
  FileText,
  Clock,
  BarChart3,
  ListChecks,
} from "lucide-react"
import type { AnswerAnalysis, StandardAnswer, InterviewSummaryReport } from "@/features/career/types"
import type { SidebarPanel } from "@/features/career/components/InterviewSidebar"

interface SidePanelProps {
  panelType: SidebarPanel
  analysis: AnswerAnalysis | null
  standardAnswer: StandardAnswer | null
  showExpertAnswer: boolean
  onToggleExpert: () => void
  history: { question: string; answer: string; questionKind?: "selfIntro" | "interview"; analysis?: AnswerAnalysis; standardAnswer?: StandardAnswer }[]
  overallStats: {
    totalQuestions: number
    avgScore: number
    avgAccuracy: number
    avgLogic: number
    avgProfessionalism: number
    avgCompleteness: number
  } | null
  summaryReport?: InterviewSummaryReport | null
  summaryLoading?: boolean
}

function scoreToStars(score: number) {
  return Math.round(score / 20)
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score || 0)))
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-500"
}

function buildRadarRing(scale: number, count: number, size = 220) {
  const center = size / 2
  const radius = size * 0.34 * scale
  return Array.from({ length: count }).map((_, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / count
    return `${(center + Math.cos(angle) * radius).toFixed(1)},${(center + Math.sin(angle) * radius).toFixed(1)}`
  }).join(" ")
}

function buildRadarPoints(values: number[], size = 220) {
  const center = size / 2
  const radius = size * 0.34
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / values.length
    const distance = radius * (clampScore(value) / 100)
    return `${(center + Math.cos(angle) * distance).toFixed(1)},${(center + Math.sin(angle) * distance).toFixed(1)}`
  }).join(" ")
}

function buildTrendPath(scores: number[], width = 320, height = 130) {
  if (scores.length === 0) return ""
  const xGap = scores.length > 1 ? width / (scores.length - 1) : 0
  return scores.map((score, index) => {
    const x = index * xGap
    const y = height - (clampScore(score) / 100) * (height - 30) - 15
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(" ")
}

function SummaryVisualPanel({
  history,
  overallStats,
  summaryReport,
  summaryLoading,
}: Pick<SidePanelProps, "history" | "overallStats" | "summaryReport" | "summaryLoading">) {
  const allWeaknesses = collectWeaknesses(history)
  const report = summaryReport
  const selfIntro = history.find((item) => item.questionKind === "selfIntro")
  const interviewItems = history.filter((item) => item.questionKind !== "selfIntro")
  const score = report ? report.overallScore : overallStats?.avgScore || 0
  const dimensions = report?.dimensionScores?.length ? report.dimensionScores : [
    { name: "situation", label: "情境", score: overallStats?.avgAccuracy || 0 },
    { name: "task", label: "任务", score: overallStats?.avgLogic || 0 },
    { name: "action", label: "行动", score: overallStats?.avgProfessionalism || 0 },
    { name: "result", label: "结果", score: overallStats?.avgCompleteness || 0 },
  ]
  const radarLabels = [...dimensions.map((item) => item.label.replace(/\s*\(.+\)/, "").slice(0, 2)), "自介"]
  const radarValues = [...dimensions.map((item) => item.score), selfIntro?.analysis?.score || score]
  const trendScores = interviewItems.map((item) => item.analysis?.score || 0)
  const weakItems = report?.weaknesses?.length
    ? report.weaknesses
    : allWeaknesses.map((title) => ({ title, description: "建议下轮重点训练", detail: "" }))
  const selfIntroTitle = report?.selfIntroduction?.title || "自我介绍表现"
  const selfIntroDescription = report?.selfIntroduction?.description || selfIntro?.analysis?.suggestion || "自我介绍会单独评估表达结构、岗位动机和铁路认知。"

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-slate-50">
      <div className="shrink-0 border-b border-gray-100 px-6 py-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
          <BarChart3 className="size-5 text-blue-500" />
          能力仪表盘
        </h3>
        <p className="mt-0.5 text-sm text-gray-400">图形化辅助，不重复正文报告</p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {summaryLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4 size-16">
              <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <div className="absolute inset-3 flex items-center justify-center rounded-full bg-blue-50">
                <Sparkles className="size-5 text-blue-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">正在生成能力仪表盘...</p>
            <p className="mt-1 text-xs text-gray-300">包含自我介绍和五题表现</p>
          </div>
        )}

        {!summaryLoading && overallStats && history.length > 0 ? (
          <>
            <div className="rounded-3xl border border-white bg-white p-5 shadow-soft">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700">综合评分</p>
                  <p className="mt-1 text-xs text-gray-400">完整解释保留在中间报告</p>
                </div>
                <div className={`text-5xl font-black leading-none ${scoreTone(score)}`}>{score}</div>
              </div>
              <Progress value={score} className="mt-4 h-2.5 progress-gradient" />
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>自我介绍 + {interviewItems.length} 道面试题</span>
                <span>{report?.overallGrade || "生成中"}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
              <h4 className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                <BarChart3 className="size-4 text-blue-500" />
                能力雷达
              </h4>
              <div className="mt-3 flex justify-center">
                <svg width="220" height="220" viewBox="0 0 220 220">
                  {[0.35, 0.65, 1].map((scale) => (
                    <polygon key={scale} points={buildRadarRing(scale, radarValues.length)} fill="none" stroke="#dbe7f5" strokeWidth="1" />
                  ))}
                  <polygon points={buildRadarPoints(radarValues)} fill="rgba(37,99,235,0.20)" stroke="#2563eb" strokeWidth="3" />
                  {radarLabels.map((label, index) => {
                    const angle = -Math.PI / 2 + index * 2 * Math.PI / radarLabels.length
                    return (
                      <text
                        key={`${label}-${index}`}
                        x={110 + Math.cos(angle) * 92}
                        y={110 + Math.sin(angle) * 92}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-500 text-[11px] font-bold"
                      >
                        {label}
                      </text>
                    )
                  })}
                </svg>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft">
              <h4 className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                <Clock className="size-4 text-indigo-500" />
                五题得分趋势
              </h4>
              {trendScores.length > 0 ? (
                <>
                  <svg width="100%" height="130" viewBox="0 0 320 130" className="mt-2 overflow-visible">
                    <path d={buildTrendPath(trendScores)} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
                    {trendScores.map((item, index) => {
                      const xGap = trendScores.length > 1 ? 320 / (trendScores.length - 1) : 0
                      const x = index * xGap
                      const y = 130 - (clampScore(item) / 100) * 100 - 15
                      return <circle key={index} cx={x} cy={y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="3" />
                    })}
                  </svg>
                  <div className="flex justify-between text-[11px] font-semibold text-gray-400">
                    {trendScores.map((item, index) => <span key={index}>Q{index + 1} {item}</span>)}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs text-gray-400">暂无普通题得分</p>
              )}
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-800">{selfIntroTitle}</h4>
                {selfIntro?.analysis && <span className="text-lg font-black text-emerald-600">{selfIntro.analysis.score}</span>}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-700/80">{selfIntroDescription}</p>
            </div>

            <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-soft">
              <h4 className="flex items-center gap-1.5 text-sm font-bold text-red-500">
                <AlertCircle className="size-4" />
                短板 Top 3
              </h4>
              <div className="mt-4 space-y-3">
                {weakItems.slice(0, 3).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="flex items-start gap-3 rounded-2xl bg-red-50/70 px-3 py-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-red-500">{index + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-red-700">{item.title}</p>
                      {item.description && <p className="mt-1 text-xs leading-relaxed text-red-700/65">{item.description}</p>}
                    </div>
                  </div>
                ))}
                {weakItems.length === 0 && <p className="py-3 text-center text-xs text-gray-400">暂无明显短板</p>}
              </div>
            </div>
          </>
        ) : !summaryLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gray-100">
              <BarChart3 className="size-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">暂无统计数据</p>
            <p className="mt-1 text-xs text-gray-300">完成答题后自动生成能力仪表盘</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** 从 history 汇总所有亮点 */
function collectStrengths(history: { analysis?: AnswerAnalysis }[]): string[] {
  const set = new Set<string>()
  for (const h of history) {
    if (h.analysis) {
      for (const s of h.analysis.strengths) set.add(s)
    }
  }
  return Array.from(set).slice(0, 6)
}

/** 从 history 汇总所有待改进项 */
function collectWeaknesses(history: { analysis?: AnswerAnalysis }[]): string[] {
  const set = new Set<string>()
  for (const h of history) {
    if (h.analysis) {
      for (const w of h.analysis.weaknesses) set.add(w)
    }
  }
  return Array.from(set).slice(0, 6)
}

/** 从 history 汇总改进建议 */
function collectSuggestions(history: { analysis?: AnswerAnalysis }[]): string[] {
  const suggestions: string[] = []
  for (const h of history) {
    if (h.analysis?.suggestion && h.analysis.suggestion.length > 10) {
      suggestions.push(h.analysis.suggestion)
    }
  }
  return suggestions.slice(0, 3)
}

export default function SidePanel({
  panelType,
  analysis,
  standardAnswer,
  showExpertAnswer,
  onToggleExpert,
  history,
  overallStats,
  summaryReport,
  summaryLoading,
}: SidePanelProps) {
  // ====== 面试总结面板（2x 大屏版 + AI 丰富内容） ======
  if (panelType === "summary") {
    return (
      <SummaryVisualPanel
        history={history}
        overallStats={overallStats}
        summaryReport={summaryReport}
        summaryLoading={summaryLoading}
      />
    )

    if (!overallStats) return null
    const visualStats = overallStats!
    const allStrengths = collectStrengths(history)
    const allWeaknesses = collectWeaknesses(history)
    const allSuggestions = collectSuggestions(history)
    const report = summaryReport || {
      overallScore: visualStats.avgScore,
      overallGrade: visualStats.avgScore >= 90 ? "优秀" : visualStats.avgScore >= 80 ? "良好" : visualStats.avgScore >= 60 ? "中等" : "需加强",
      summaryAssessment: "",
      dimensionScores: [],
      strengths: [],
      weaknesses: [],
      improvementPlan: [],
      nextSteps: [],
    }

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-5 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <FileText className="size-5 text-emerald-500" />
            面试总结报告
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">综合评估与改进方向</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* AI 生成中 */}
          {summaryLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative size-16 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Sparkles className="size-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">AI 正在生成分析报告...</p>
              <p className="text-xs text-gray-300 mt-1">综合分析您的各题表现</p>
            </div>
          )}

          {!summaryLoading && overallStats && history.length > 0 ? (
            <div className="space-y-6">
              {/* ====== 综合评分 + 星级 ====== */}
              <div className="text-center py-4">
                <div className={`text-7xl font-black tracking-tight ${
                  report ? (report.overallScore >= 80 ? "text-emerald-600" : report.overallScore >= 60 ? "text-amber-600" : "text-red-500")
                  : visualStats.avgScore >= 80 ? "text-emerald-600"
                  : visualStats.avgScore >= 60 ? "text-amber-600"
                  : "text-red-500"
                }`}>
                  {report ? report.overallScore : visualStats.avgScore}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  综合评分（共 {visualStats.totalQuestions} 题）
                </p>
                <Progress value={report ? report.overallScore : visualStats.avgScore} className="h-3 mt-3 progress-gradient" />
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`size-6 ${
                        i <= Math.round((report ? report.overallScore : visualStats.avgScore) / 20)
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                  <Sparkles className="size-3.5 text-blue-500" />
                  <span className="text-sm font-bold text-gray-600">
                    等级：{report ? report.overallGrade : (
                      visualStats.avgScore >= 90 ? "优秀" : visualStats.avgScore >= 80 ? "良好" : visualStats.avgScore >= 60 ? "中等" : "需加强"
                    )}
                  </span>
                </div>
                {/* AI 评语摘要 */}
                {report?.summaryAssessment && (
                  <p className="text-xs text-gray-500 mt-4 leading-relaxed bg-blue-50/80 rounded-xl px-4 py-3 text-left">
                    {report.summaryAssessment}
                  </p>
                )}
              </div>

              {/* ====== 各维度评分 ====== */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <BarChart3 className="size-4 text-blue-500" />
                  各维度表现
                </h4>
                <div className="space-y-3.5">
                  {(report ? report.dimensionScores : [
                    { name: "situation" as const, label: "情境理解 (S)", score: visualStats.avgAccuracy, comment: "", evidence: "" },
                    { name: "task" as const, label: "任务识别 (T)", score: visualStats.avgLogic, comment: "", evidence: "" },
                    { name: "action" as const, label: "行动方案 (A)", score: visualStats.avgProfessionalism, comment: "", evidence: "" },
                    { name: "result" as const, label: "结果完整 (R)", score: visualStats.avgCompleteness, comment: "", evidence: "" },
                  ]).map((item) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">{item.label}</span>
                        <span className="text-gray-800 font-bold">{item.score}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            item.name === "situation" ? "from-blue-500 to-indigo-500"
                            : item.name === "task" ? "from-blue-500 to-cyan-500"
                            : item.name === "action" ? "from-emerald-500 to-teal-500"
                            : "from-amber-500 to-orange-500"
                          } transition-all duration-700 ease-out`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      {item.comment && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ====== 每题回顾 ====== */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Clock className="size-4 text-indigo-500" />
                  每题回顾
                </h4>
                <div className="space-y-2.5">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-gray-100 p-4 bg-gray-50/60 hover:bg-white hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-500">Q{idx + 1}</span>
                        {item.analysis && (
                          <Badge
                            className={`text-xs font-semibold rounded-lg px-2.5 py-0.5 ${
                              item.analysis.score >= 80
                                ? "bg-emerald-100 text-emerald-700"
                                : item.analysis.score >= 60
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.analysis.score}分
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 font-medium">
                        {item.question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ====== AI 核心优势 ====== */}
              {report && report.strengths.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 mb-3">
                    <CheckCircle2 className="size-4" />
                    核心优势
                  </h4>
                  <div className="space-y-2.5">
                    {report.strengths.map((s, i) => (
                      <div key={i} className="rounded-xl bg-emerald-50/80 border border-emerald-100/60 p-4">
                        <p className="text-sm font-bold text-emerald-800 mb-1">{s.title}</p>
                        <p className="text-xs text-emerald-700/70 leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ====== AI 待改进项（无 AI 时用本地汇总兜底） ====== */}
              <div>
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-red-500 mb-3">
                  <AlertCircle className="size-4" />
                  待改进
                </h4>
                <div className="space-y-2.5">
                  {(report ? report.weaknesses : allWeaknesses.map(w => ({ title: w, description: "", detail: "" }))).map((w, i) => (
                    <div key={i} className="rounded-xl bg-red-50/80 border border-red-100/60 p-4">
                      <p className="text-sm font-bold text-red-700 mb-1">{w.title}</p>
                      <p className="text-xs text-red-700/70 leading-relaxed">{w.description}</p>
                      {w.detail && (
                        <div className="mt-2 px-3 py-2 bg-white/70 rounded-lg border border-red-100">
                          <p className="text-xs text-red-500">💡 {w.detail}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {!report && allWeaknesses.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">暂无明显的待改进项</p>
                  )}
                </div>
              </div>

              {/* ====== 改进方向（AI 提升路线图或本地兜底） ====== */}
              {report && report.improvementPlan.length > 0 ? (
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60 p-5">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-blue-700 mb-3">
                    <ListChecks className="size-4" />
                    提升路线图
                  </h4>
                  <div className="space-y-3">
                    {report.improvementPlan.map((step, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="size-6 rounded-full bg-blue-200 text-blue-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-blue-700/80 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : allSuggestions.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-2">
                    <Lightbulb className="size-3.5" />
                    改进方向
                  </h4>
                  <div className="space-y-2">
                    {allSuggestions.map((s, i) => (
                      <p key={i} className="text-xs text-blue-700/70 leading-relaxed">• {s}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* ====== 空状态 ====== */}
              {history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="size-7 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">暂无总结数据</p>
                  <p className="text-xs text-gray-300 mt-1">完成面试后自动生成总结报告</p>
                </div>
              )}
            </div>
          ) : !summaryLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <BarChart3 className="size-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">暂无统计数据</p>
              <p className="text-xs text-gray-300 mt-1">完成答题后自动生成总结报告</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ====== STAR 点评面板（默认 stage 模式） ======
  const scoreColor =
    analysis && analysis.score >= 80
      ? "text-emerald-600"
      : analysis && analysis.score >= 60
        ? "text-amber-600"
        : "text-red-500"

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h3 className="text-sm font-bold text-gray-800">STAR 法则点评</h3>
        <p className="text-xs text-gray-400 mt-0.5">AI 对您回答的结构化分析</p>
      </div>
      {/* 引导线 — 与中间面板波形桥对齐 */}
      <div className="px-5 shrink-0">
        <div className="h-px bg-gradient-to-r from-blue-300/40 via-blue-400/30 to-transparent" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {analysis ? (
          <div className="space-y-5">
            {/* 综合评分 */}
            <div className="text-center py-3">
              <div className={`text-6xl font-black ${scoreColor}`}>
                {analysis.score}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">综合评分</p>
              <Progress value={analysis.score} className="h-2 mt-2.5 progress-gradient" />
            </div>

            {/* STAR 卡片 */}
            <div className="space-y-3">
              <StarCard
                letter="S"
                label="情境理解"
                feedback={analysis.weaknesses[0] || "建议结合具体场景展开描述，让回答更有针对性"}
                rating={scoreToStars(analysis.accuracy)}
                color="blue"
              />
              <StarCard
                letter="T"
                label="任务识别"
                feedback={analysis.strengths[0] || "能够清晰识别核心任务，逻辑表述较好"}
                rating={scoreToStars(analysis.logic)}
                color="blue"
              />
              <StarCard
                letter="A"
                label="行动方案"
                feedback={analysis.suggestion?.slice(0, 60) + "..." || "建议更具体的行动描述，体现专业深度"}
                rating={scoreToStars(analysis.professionalism)}
                color="emerald"
              />
              <StarCard
                letter="R"
                label="结果完整度"
                feedback={analysis.strengths[1] || "回答覆盖了关键要点，可以补充量化结果"}
                rating={scoreToStars(analysis.completeness)}
                color="amber"
              />
            </div>

            {/* 分项评分 */}
            <div className="space-y-2.5">
              {[
                { label: "准确性", value: analysis.accuracy, icon: Target, color: "bg-blue-500" },
                { label: "逻辑性", value: analysis.logic, icon: Brain, color: "bg-blue-500" },
                { label: "专业性", value: analysis.professionalism, icon: MessageSquare, color: "bg-emerald-500" },
                { label: "完整度", value: analysis.completeness, icon: Layers, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-xs">
                  <item.icon className="size-3.5 text-gray-400" />
                  <span className="text-gray-500 w-14 font-medium">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`} style={{ width: `${item.value}%` }} />
                  </div>
                  <span className="text-gray-600 font-bold w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>

            {/* 亮点 */}
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-2">
                <CheckCircle2 className="size-3.5" />
                回答亮点
              </h4>
              <div className="space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-emerald-50/60 rounded-xl px-3 py-2">
                    <span className="text-emerald-400 mt-0.5 font-bold">•</span>
                    <span className="leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 待改进 */}
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-red-500 mb-2">
                <AlertCircle className="size-3.5" />
                待改进
              </h4>
              <div className="space-y-1.5">
                {analysis.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-red-50/60 rounded-xl px-3 py-2">
                    <span className="text-red-400 mt-0.5 font-bold">•</span>
                    <span className="leading-relaxed">{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 改进建议 */}
            {analysis.suggestion && (
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-2">
                  <Lightbulb className="size-3.5" />
                  改进建议
                </h4>
                <p className="text-xs text-blue-700/70 leading-relaxed">{analysis.suggestion}</p>
              </div>
            )}

            {/* 专业答案开关 */}
            <div>
              <button
                onClick={onToggleExpert}
                className="w-full flex items-center justify-between rounded-2xl bg-gray-50 hover:bg-blue-50 px-4 py-3.5 transition-all duration-200 text-left hover:shadow-soft group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Sparkles className="size-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition-colors">专业答案</span>
                </div>
                <ChevronRight className={`size-4 text-gray-400 transition-transform duration-200 ${showExpertAnswer ? "rotate-90" : ""}`} />
              </button>

              {showExpertAnswer && standardAnswer && (
                <div className="mt-2.5 rounded-2xl border border-gray-200 bg-white p-4 space-y-3 animate-fade-in-up">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {standardAnswer.content}
                  </p>
                  {standardAnswer.keyPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">核心要点</p>
                      <div className="flex flex-wrap gap-1.5">
                        {standardAnswer.keyPoints.map((kp, i) => (
                          <Badge key={i} className="text-xs bg-blue-50 text-blue-700 rounded-lg font-medium">
                            {kp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {standardAnswer.technique && (
                    <p className="text-xs text-gray-400 italic">💡 {standardAnswer.technique}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Sparkles className="size-7 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">等待回答分析</p>
            <p className="text-xs text-gray-300 mt-1">
              完成回答后，AI 将对您的表现
              <br />
              进行 STAR 结构化评估
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

