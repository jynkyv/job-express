"use client"

import { useState, useRef } from "react"
import LandingPage from "@/features/career/components/LandingPage"
import InterviewSidebar, { type SidebarPanel } from "@/features/career/components/InterviewSidebar"
import InterviewStage from "@/features/career/components/InterviewStage"
import SidePanel from "@/features/career/components/SidePanel"
import { callDeepSeek, DeepSeekNotConfiguredError } from "@/features/career/lib/deepseek"
import { SYSTEM_PROMPTS, INTERVIEW_TYPES, POSITIONS } from "@/features/career/lib/prompts"
import { validateInterviewAnswer } from "@/features/career/lib/interviewValidation"
import { allQuestions, POSITION_CONFIGS, categoryNames } from "@/features/career/data/questionBank"
import { INTERVIEWER_PROFILES, pickInterviewImage } from "@/features/career/data/interviewers"
import type { InterviewQuestion, AnswerAnalysis, StandardAnswer, QuestionMode, InterviewSummaryReport } from "@/features/career/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, FileText, RotateCcw, Home, CheckCircle, CheckCircle2, Sparkles, BarChart3, Target, Lightbulb, AlertCircle } from "lucide-react"

type Step = "config" | "questioning" | "answering" | "analysis" | "summary"

type LoadingStage = "questions" | "analysis" | null

interface MockInterviewProps {
  onOpenSettings: () => void
}

type InterviewHistoryItem = {
  question: string
  answer: string
  questionKind?: "selfIntro" | "interview"
  analysis?: AnswerAnalysis
  standardAnswer?: StandardAnswer
}

const SELF_INTRO_QUESTION: InterviewQuestion = {
  id: "self-introduction",
  question: "请做一个1-3分钟的自我介绍，并说明你为什么适合目标岗位。",
  category: "resume",
  difficulty: "basic",
  kind: "selfIntro",
  referenceAnswer: "建议结构：姓名/学校/专业 → 关键经历或技能 → 对铁路行业和目标岗位的理解 → 求职动机与稳定性 → 一句话收尾。",
  keyPoints: ["结构清晰", "经历与岗位匹配", "体现铁路行业认知", "表达自然稳重", "控制在1-3分钟"],
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function uniqueById(questions: QuizBankQuestion[]) {
  return Array.from(new Map(questions.map((question) => [question.id, question])).values())
}

function inferDifficulty(question: QuizBankQuestion): InterviewQuestion["difficulty"] {
  const text = `${question.categoryName}${question.subCategory}${question.question}`
  if (/应急|故障|保护|规章|安全|综合|情景|处理/.test(text)) return "advanced"
  if (/基础|定义|组成|分类|简述/.test(text)) return "basic"
  return "intermediate"
}

function pickQuestions(source: QuizBankQuestion[], count: number, usedIds: Set<string>) {
  const picked: QuizBankQuestion[] = []
  for (const question of shuffle(uniqueById(source))) {
    if (picked.length >= count) break
    if (usedIds.has(question.id) || question.id === "Q1") continue
    picked.push(question)
    usedIds.add(question.id)
  }
  return picked
}

/** 从题库按岗位抽题：2岗位专业 + 1铁路通用 + 1结构化 + 1通用/补位 */
function sampleFromBank(positionValue: string, count = 5): QuizBankQuestion[] {
  const config = POSITION_CONFIGS.find(p => p.value === positionValue)
  if (!config) return []

  const getByIndices = (indices: number[]) =>
    indices.flatMap(ci => allQuestions.filter(q => q.categoryName === categoryNames[ci]))

  const usedIds = new Set<string>()
  const railwayCommon = getByIndices([1])
  const structured = getByIndices([9])
  const general = getByIndices(config.generalIndices).filter((question) => question.id !== "Q1")
  const specialty = getByIndices(config.specialtyIndices)

  if (positionValue === "general") {
    return [
      ...pickQuestions(railwayCommon, 2, usedIds),
      ...pickQuestions(structured, 2, usedIds),
      ...pickQuestions(general, 1, usedIds),
    ].slice(0, count)
  }

  const picked = [
    ...pickQuestions(specialty, 2, usedIds),
    ...pickQuestions(railwayCommon, 1, usedIds),
    ...pickQuestions(structured, 1, usedIds),
    ...pickQuestions(general, 1, usedIds),
  ]

  if (picked.length < count) {
    picked.push(...pickQuestions([...specialty, ...general, ...railwayCommon, ...structured], count - picked.length, usedIds))
  }

  return picked.slice(0, count)
}

// 给从题库取出的题加上 InterviewQuestion 所需的字段
import type { QuizQuestion as QuizBankQuestion } from "@/features/career/data/questionBank"

function toInterviewQuestions(bankQs: QuizBankQuestion[]): InterviewQuestion[] {
  return bankQs.map((q) => ({
    id: q.id,
    question: q.question,
    category: q.categoryName.includes("结构化") ? "situational" as const : "technical" as const,
    difficulty: inferDifficulty(q),
    kind: "interview" as const,
    referenceAnswer: q.referenceAnswer,
    keyPoints: q.keyPoints,
  }))
}

export default function MockInterview({ onOpenSettings }: MockInterviewProps) {
  const [step, setStep] = useState<Step>("config")
  const [mode, setMode] = useState<QuestionMode>("ai")
  const [positionValue, setPositionValue] = useState("general")
  const [aiPosition, setAiPosition] = useState("")
  const [type, setType] = useState("comprehensive")
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null)
  const [analysis, setAnalysis] = useState<AnswerAnalysis | null>(null)
  const [standardAnswer, setStandardAnswer] = useState<StandardAnswer | null>(null)
  const [streamText, setStreamText] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [history, setHistory] = useState<InterviewHistoryItem[]>([])
  const [showExpertAnswer, setShowExpertAnswer] = useState(false)
  const [activePanel, setActivePanel] = useState<SidebarPanel>("stage")
  const [summaryReport, setSummaryReport] = useState<InterviewSummaryReport | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [interviewerAvatarUrl, setInterviewerAvatarUrl] = useState(INTERVIEWER_PROFILES[0].image)
  const [answerError, setAnswerError] = useState("")
  const answerRef = useRef<HTMLTextAreaElement>(null)

  const position = mode === "ai" ? aiPosition.trim() : positionValue
  const hasResult = history.length > 0

  // ====== Interview Logic ======
  const startInterview = async () => {
    setInterviewerAvatarUrl((current) => pickInterviewImage(current))
    setIsLoading(true)
    setErrorMsg("")
    setStep("questioning")
    setQuestions([])
    setCurrentQIndex(0)
    setAnswer("")
    setHistory([])
    setAnalysis(null)
    setStandardAnswer(null)
    setShowExpertAnswer(false)
    setAnswerError("")
    setActivePanel("stage")
    setSummaryReport(null)

    if (mode === "quiz") {
      // ██████ 题库模式：从本地题库抽题（毫秒级） ██████
      const bankQs = sampleFromBank(positionValue)
      setQuestions([SELF_INTRO_QUESTION, ...toInterviewQuestions(bankQs)])
      setIsLoading(false)
      setLoadingStage(null)
      setStep("answering")
      return
    }

    const targetPosition = aiPosition.trim()
    if (!targetPosition) {
      setErrorMsg("请先填写 AI 出题的目标岗位。")
      setIsLoading(false)
      setLoadingStage(null)
      setStep("config")
      return
    }

    // ██████ AI 模式：调用 API ██████
    setLoadingStage("questions")
    try {
      const typeLabel = INTERVIEW_TYPES.find((t) => t.value === type)?.label
      const positionPrompt = `${SYSTEM_PROMPTS.questionGeneration}

目标岗位：${targetPosition}
请围绕该岗位的核心职责、常见业务场景、专业能力和沟通协作要求出题。`
      const res = await callDeepSeek(
        [
          {
            role: "system",
            content: `${positionPrompt}\n\n面试类型：${typeLabel}`,
          },
          {
            role: "user",
            content: `请为「${targetPosition}」生成5道${typeLabel}面试题。`,
          },
        ],
        (chunk) => setStreamText((prev) => prev + chunk)
      )

      const cleaned = res.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const parsed = JSON.parse(cleaned)
      const generatedQuestions = (parsed.questions || parsed).slice(0, 5).map((question: InterviewQuestion, index: number) => ({
        ...question,
        id: question.id || `ai-q${index + 1}`,
        kind: "interview" as const,
      }))
      setQuestions([SELF_INTRO_QUESTION, ...generatedQuestions])
      setStep("answering")
    } catch (e) {
      if (e instanceof DeepSeekNotConfiguredError) {
        setErrorMsg(e.message)
      } else {
        console.error("Failed to generate questions:", e)
        setErrorMsg("生成面试题失败，请检查 API 配置或网络连接")
      }
      setStep("config")
    } finally {
      setIsLoading(false)
      setLoadingStage(null)
      setStreamText("")
    }
  }

  const submitAnswer = () => {
    const currentQuestion = questions[currentQIndex]
    const validation = validateInterviewAnswer(currentQuestion, answer)
    if (!currentQuestion || !validation.valid) {
      setAnswerError(validation.message)
      return false
    }

    setAnswerError("")
    const updatedHistory = [
      ...history,
      { question: currentQuestion.question, answer, questionKind: currentQuestion.kind || "interview" },
    ]
    setHistory(updatedHistory)

    if (currentQIndex < questions.length - 1) {
      advanceQuestion()
    } else {
      batchAnalyzeAll(updatedHistory)
    }
    return true
  }

  const advanceQuestion = () => {
    setCurrentQIndex((i) => i + 1)
    setAnswer("")
    setAnalysis(null)
    setStandardAnswer(null)
    setShowExpertAnswer(false)
    setAnswerError("")
    setStep("answering")
    setActivePanel("stage")
  }

  const nextQuestion = () => {
    submitAnswer()
  }

  const analyzeSingleAnswer = async (item: InterviewHistoryItem): Promise<InterviewHistoryItem> => {
    try {
      const fullRes = await callDeepSeek([
        { role: "system", content: SYSTEM_PROMPTS.answerAnalysis },
        { role: "user", content: `题目类型：${item.questionKind === "selfIntro" ? "自我介绍" : "普通面试题"}\n题目：${item.question}\n\n面试者回答：${item.answer}` },
      ])
      const cleaned = fullRes.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { ...item, analysis: parsed.analysis, standardAnswer: parsed.standardAnswer }
      }
    } catch (error) {
      if (error instanceof DeepSeekNotConfiguredError) {
        setErrorMsg(error.message)
      } else {
        console.error("Analysis failed:", error)
      }
    }
    return item
  }

  const batchAnalyzeAll = async (answers: InterviewHistoryItem[]) => {
    if (answers.length === 0) return

    setIsLoading(true)
    setLoadingStage("analysis")
    setStep("analysis")
    setActivePanel("stage")
    setStreamText("")

    let analyzedHistory: InterviewHistoryItem[] = []

    try {
      setStreamText("正在一次性分析自我介绍和 5 道面试题...")
      const payload = answers.map((item, index) => ({
        index,
        type: item.questionKind === "selfIntro" ? "selfIntroduction" : "interviewQuestion",
        question: item.question,
        answer: item.answer,
      }))
      const fullRes = await callDeepSeek([
        { role: "system", content: SYSTEM_PROMPTS.answerBatchAnalysis },
        { role: "user", content: JSON.stringify({ answers: payload }, null, 2) },
      ])
      const cleaned = fullRes.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      const items = Array.isArray(parsed?.items) ? parsed.items : []

      if (items.length >= answers.length) {
        analyzedHistory = answers.map((item, index) => {
          const result = items.find((entry: any) => Number(entry.index) === index) || items[index]
          return {
            ...item,
            analysis: result?.analysis,
            standardAnswer: result?.standardAnswer,
          }
        })
      }
    } catch (error) {
      if (error instanceof DeepSeekNotConfiguredError) {
        setErrorMsg(error.message)
      } else {
        console.error("Batch analysis failed:", error)
      }
    }

    if (analyzedHistory.length === 0 || analyzedHistory.some((item) => !item.analysis)) {
      analyzedHistory = []
      for (let index = 0; index < answers.length; index++) {
        setStreamText(`正在分析第 ${index + 1}/${answers.length} 题...`)
        analyzedHistory.push(await analyzeSingleAnswer(answers[index]))
      }
    }

    setIsLoading(false)
    setLoadingStage(null)
    setStreamText("")
    setHistory(analyzedHistory)
    setStep("summary")
    setActivePanel("summary")
    generateSummaryReport(analyzedHistory)
  }

  const handleClose = () => {
    setAnswer("")
    setAnalysis(null)
    setStandardAnswer(null)
    setShowExpertAnswer(false)
    setAnswerError("")
    setStep("config")
  }

  const handleRestart = () => {
    startInterview()
  }

  const handleBackToHome = () => {
    setStep("config")
    setActivePanel("stage")
  }

  /** 调用 AI 生成面试总结报告 */
  const generateSummaryReport = async (
    answers = history
  ) => {
    if (answers.length === 0 || summaryReport) return
    setSummaryLoading(true)
    try {
      const historyText = answers.map((h, i) =>
        `【${h.questionKind === "selfIntro" ? "自我介绍" : `题${i}`}】\n题目：${h.question}\n回答：${h.answer}\n分析评分：${h.analysis?.score}分\n分析：${JSON.stringify(h.analysis, null, 2)}`
      ).join('\n\n---\n\n')

      const res = await callDeepSeek(
        [
          { role: "system", content: SYSTEM_PROMPTS.interviewSummary },
          { role: "user", content: `以下是一次模拟面试的全部记录（1道自我介绍 + ${Math.max(answers.length - 1, 0)}道普通面试题），请生成总结报告：\n\n${historyText}` },
        ],
        (chunk) => {} // 不需要流式
      )

      const cleaned = res.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as InterviewSummaryReport
        setSummaryReport(parsed)
      }
    } catch (e) {
      if (e instanceof DeepSeekNotConfiguredError) {
        setErrorMsg(e.message)
      } else {
        console.error("Failed to generate summary report:", e)
      }
    } finally {
      setSummaryLoading(false)
    }
  }

  const overallStats = history.length > 0 ? {
    totalQuestions: history.length,
    avgScore: Math.round(history.reduce((sum, h) => sum + (h.analysis?.score || 0), 0) / history.length),
    avgAccuracy: Math.round(history.reduce((sum, h) => sum + (h.analysis?.accuracy || 0), 0) / history.length),
    avgLogic: Math.round(history.reduce((sum, h) => sum + (h.analysis?.logic || 0), 0) / history.length),
    avgProfessionalism: Math.round(history.reduce((sum, h) => sum + (h.analysis?.professionalism || 0), 0) / history.length),
    avgCompleteness: Math.round(history.reduce((sum, h) => sum + (h.analysis?.completeness || 0), 0) / history.length),
  } : null

  // ====== Config Step → Landing Page ======
  if (step === "config") {
    return (
      <LandingPage
        mode={mode}
        onModeChange={setMode}
        positionValue={positionValue}
        onPositionChange={setPositionValue}
        aiPosition={aiPosition}
        onAiPositionChange={setAiPosition}
        type={type}
        onTypeChange={setType}
        onStart={startInterview}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onOpenSettings={onOpenSettings}
      />
    )
  }

  // ====== Immersive Interview Room ======
  const showSidePanel = activePanel !== "stage" || analysis !== null || step === "summary"

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F3FA] flex">
      {/* 背景光晕 */}
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      {/* 左侧任务栏 */}
      <InterviewSidebar
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onClose={handleClose}
        hasResult={hasResult}
      />

      {/* 中间主舞台 */}
      <div className="flex-1 min-w-0 flex relative z-10">
        {step === "summary" ? (
          <InterviewSummary
            overallStats={overallStats}
            history={history}
            summaryReport={summaryReport}
            summaryLoading={summaryLoading}
            onRestart={handleRestart}
            onBackToHome={handleBackToHome}
          />
        ) : (
          <InterviewStage
            questions={questions}
            currentQIndex={currentQIndex}
            position={position}
            type={type}
            isLoading={isLoading}
            loadingStage={loadingStage}
            streamText={streamText}
            answer={answer}
            onAnswerChange={(value) => {
              setAnswer(value)
              if (answerError) setAnswerError("")
            }}
            answerError={answerError}
            onNext={nextQuestion}
            onRestart={startInterview}
            analysis={analysis}
            standardAnswer={standardAnswer}
            onShowExpertAnswer={() => setShowExpertAnswer(true)}
            avatarUrl={interviewerAvatarUrl}
          />
        )}
      </div>

      {/* 右侧面板（按需滑出） */}
      {showSidePanel && (
        <div className="w-[440px] shrink-0 overflow-hidden border-l border-white/40 relative z-10 h-full">
          <SidePanel
            panelType={activePanel}
            analysis={analysis}
            standardAnswer={standardAnswer}
            showExpertAnswer={showExpertAnswer}
            onToggleExpert={() => setShowExpertAnswer((v) => !v)}
            history={history}
            overallStats={overallStats}
            summaryReport={summaryReport}
            summaryLoading={summaryLoading}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================
// 面试总结主舞台组件（2x 大屏版 + AI 丰富内容）
// ============================================================
function InterviewSummary({
  overallStats,
  history,
  summaryReport,
  summaryLoading,
  onRestart,
  onBackToHome,
}: {
  overallStats: {
    totalQuestions: number
    avgScore: number
    avgAccuracy: number
    avgLogic: number
    avgProfessionalism: number
    avgCompleteness: number
  } | null
  history: InterviewHistoryItem[]
  summaryReport: InterviewSummaryReport | null
  summaryLoading: boolean
  onRestart: () => void
  onBackToHome: () => void
}) {
  const stats = overallStats
  const report = summaryReport
  const selfIntro = history.find((item) => item.questionKind === "selfIntro")

  const levelText = !stats ? "暂无数据"
    : stats.avgScore >= 90 ? "优秀"
    : stats.avgScore >= 80 ? "良好"
    : stats.avgScore >= 60 ? "中等"
    : "需加强"

  const scoreColor = !stats ? "text-gray-400"
    : stats.avgScore >= 80 ? "text-emerald-600"
    : stats.avgScore >= 60 ? "text-amber-600"
    : "text-red-500"

  // AI 正在生成总结 → 显示优雅的加载动画
  if (summaryLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="text-center space-y-6">
          {/* 旋转发光环 */}
          <div className="relative mx-auto size-28">
            <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
              <FileText className="size-10 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-700">AI 正在生成面试总结报告</p>
            <p className="text-sm text-gray-400 mt-2">综合分析自我介绍和 5 道面试题，生成个性化评估...</p>
          </div>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-3 rounded-full bg-emerald-400/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-10 md:p-14 min-h-0 overflow-y-auto">
      {stats ? (
        <div className="max-w-4xl mx-auto w-full space-y-10">
          {/* ========== 头部 ========== */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2.5 bg-emerald-100 text-emerald-700 text-sm font-semibold px-5 py-2 rounded-full mb-5 shadow-sm">
              <CheckCircle className="size-4" />
              面试完成 · 共 {stats.totalQuestions} 题
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">面试总结报告</h2>
            <p className="text-base text-gray-400 mt-2">AI 综合评估 · 多维度深度分析 · 个性化改进路线</p>
          </div>

          {/* ========== 综合评分卡片 ========== */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 md:p-14 text-center">
            <div className={`text-8xl md:text-9xl font-black tracking-tight leading-none ${scoreColor}`}>
              {report ? report.overallScore : stats.avgScore}
            </div>
            <p className="text-base text-gray-400 mt-2 font-medium">综合评分</p>
            <div className="max-w-md mx-auto mt-4">
              <Progress value={report ? report.overallScore : stats.avgScore} className="h-4 progress-gradient" />
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`size-9 md:size-10 ${
                    i <= Math.round((report ? report.overallScore : stats.avgScore) / 20)
                      ? "fill-amber-400 text-amber-400 drop-shadow-md"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="inline-flex items-center gap-2 mt-5 px-5 py-2 bg-gray-50 rounded-full border border-gray-100">
              <Sparkles className="size-4 text-blue-500" />
              <span className="text-base font-bold text-gray-600">
                等级：{report ? report.overallGrade : levelText}
              </span>
            </div>

            {/* AI 综合评语 */}
            {report?.summaryAssessment && (
              <div className="mt-8 max-w-2xl mx-auto px-6 py-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100/50">
                <p className="text-base text-gray-700 leading-relaxed">{report.summaryAssessment}</p>
              </div>
            )}
          </div>

          {(report?.selfIntroduction || selfIntro?.analysis) && (
            <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2.5">
                <Sparkles className="size-5 text-emerald-500" />
                自我介绍单独评价
              </h3>
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 px-6 py-5">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-base font-bold text-emerald-800">
                      {report?.selfIntroduction?.title || "开场表达表现"}
                    </p>
                    <p className="text-sm text-emerald-700/80 leading-relaxed mt-2">
                      {report?.selfIntroduction?.description || selfIntro?.analysis?.suggestion}
                    </p>
                    {(report?.selfIntroduction?.detail || selfIntro?.analysis?.weaknesses?.[0]) && (
                      <p className="text-xs text-emerald-700/65 leading-relaxed mt-3 bg-white/70 rounded-xl px-4 py-3 border border-emerald-100">
                        {report?.selfIntroduction?.detail || selfIntro?.analysis?.weaknesses?.[0]}
                      </p>
                    )}
                  </div>
                  {selfIntro?.analysis && (
                    <div className="shrink-0 text-right">
                      <div className="text-5xl font-black text-emerald-600">{selfIntro.analysis.score}</div>
                      <p className="text-xs text-emerald-600/70 mt-1">自我介绍评分</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== STAR 四维度评估（AI 丰富版） ========== */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2.5">
              <BarChart3 className="size-5 text-blue-500" />
              各维度深度评估
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(report ? report.dimensionScores : [
                { name: "situation", label: "情境理解 (S)", score: stats.avgAccuracy, comment: "", evidence: "" },
                { name: "task", label: "任务识别 (T)", score: stats.avgLogic, comment: "", evidence: "" },
                { name: "action", label: "行动方案 (A)", score: stats.avgProfessionalism, comment: "", evidence: "" },
                { name: "result", label: "结果完整 (R)", score: stats.avgCompleteness, comment: "", evidence: "" },
              ]).map((dim) => (
                <div
                  key={dim.name}
                  className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 hover:shadow-md hover:bg-white transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold text-gray-700">{dim.label}</span>
                    <span className={`text-lg font-black ${
                      dim.score >= 80 ? "text-emerald-600" : dim.score >= 60 ? "text-amber-600" : "text-red-500"
                    }`}>
                      {dim.score}
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        dim.name === "situation" ? "from-blue-500 to-indigo-500"
                        : dim.name === "task" ? "from-blue-500 to-cyan-500"
                        : dim.name === "action" ? "from-emerald-500 to-teal-500"
                        : "from-amber-500 to-orange-500"
                      } transition-all duration-700 ease-out`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  {dim.comment && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{dim.comment}</p>
                  )}
                  {dim.evidence && (
                    <p className="text-xs text-gray-400 mt-2 italic bg-white/60 rounded-lg px-3 py-2 border border-gray-100">
                      💡 {dim.evidence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ========== 核心优势（AI 丰富版） ========== */}
          {report && report.strengths.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-500" />
                核心优势
              </h3>
              <div className="space-y-4">
                {report.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/60 p-6"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-emerald-600">{i + 1}</span>
                      </div>
                      <h4 className="text-base font-bold text-emerald-800">{s.title}</h4>
                    </div>
                    <p className="text-sm text-emerald-700/80 leading-relaxed ml-11">{s.description}</p>
                    {s.detail && (
                      <p className="text-xs text-emerald-600/60 mt-2 ml-11 italic">📌 {s.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== 待改进（AI 丰富版） ========== */}
          {report && report.weaknesses.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2.5">
                <AlertCircle className="size-5 text-red-500" />
                待改进
              </h3>
              <div className="space-y-4">
                {report.weaknesses.map((w, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100/60 p-6"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-red-500">{i + 1}</span>
                      </div>
                      <h4 className="text-base font-bold text-red-700">{w.title}</h4>
                    </div>
                    <p className="text-sm text-red-700/80 leading-relaxed ml-11">{w.description}</p>
                    {w.detail && (
                      <div className="ml-11 mt-3 px-4 py-2.5 bg-white/70 rounded-xl border border-red-100">
                        <p className="text-xs font-semibold text-red-500 mb-1">💡 改进建议</p>
                        <p className="text-sm text-red-700/70 leading-relaxed">{w.detail}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== 提升路线图 ========== */}
          {report && report.improvementPlan.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2.5">
                <Target className="size-5 text-indigo-500" />
                提升路线图
              </h3>
              <div className="space-y-0">
                {report.improvementPlan.map((step, i) => (
                  <div key={i} className="flex gap-5">
                    {/* 左侧时间线 */}
                    <div className="flex flex-col items-center">
                      <div className={`size-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        i === 0 ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-600"
                      }`}>
                        {i + 1}
                      </div>
                      {i < report.improvementPlan.length - 1 && (
                        <div className="w-0.5 flex-1 bg-indigo-100 my-1" />
                      )}
                    </div>
                    {/* 右侧内容 */}
                    <div className={`pb-8 flex-1 ${i === report.improvementPlan.length - 1 ? "pb-0" : ""}`}>
                      <p className="text-base text-gray-700 leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== 下一步行动 ========== */}
          {report && report.nextSteps.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60 p-8 md:p-10">
              <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2.5">
                <Lightbulb className="size-5 text-blue-500" />
                下一步行动计划
              </h3>
              <div className="space-y-3">
                {report.nextSteps.map((ns, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/60 rounded-2xl px-5 py-4 border border-blue-100/50">
                    <span className="size-7 rounded-full bg-blue-100 text-blue-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-blue-800/80 leading-relaxed">{ns}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== 每题得分概览 ========== */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2.5">
              <FileText className="size-5 text-indigo-500" />
              每题得分概览
            </h3>
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-4 px-5 rounded-2xl bg-gray-50/80 hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-base text-gray-700 font-medium truncate mr-6">
                    {item.questionKind === "selfIntro" ? "自我介绍" : `Q${idx}`}. {item.question.length > 50 ? item.question.slice(0, 50) + "..." : item.question}
                  </span>
                  {item.analysis && (
                    <span className={`text-base font-bold shrink-0 ${
                      item.analysis.score >= 80 ? "text-emerald-600"
                      : item.analysis.score >= 60 ? "text-amber-600"
                      : "text-red-500"
                    }`}>
                      {item.analysis.score}分
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ========== 操作按钮 ========== */}
          <div className="flex items-center gap-4 justify-center pb-6">
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl px-8 py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={onRestart}
            >
              <RotateCcw className="size-5 mr-2.5" />
              再来一轮面试
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl px-8 py-6 text-base font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              onClick={onBackToHome}
            >
              <Home className="size-5 mr-2.5" />
              返回首页
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="size-24 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <FileText className="size-12 text-gray-300" />
            </div>
            <p className="text-lg text-gray-400 font-medium">暂无面试数据</p>
          </div>
        </div>
      )}
    </div>
  )
}
