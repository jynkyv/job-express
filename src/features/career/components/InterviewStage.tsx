"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { POSITIONS } from "@/features/career/lib/prompts"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { getSpeechConfig } from "@/features/career/lib/config"
import { speechToText } from "@/features/career/lib/asr"
import { validateInterviewAnswer } from "@/features/career/lib/interviewValidation"
import {
  ChevronRight,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Clock,
  Mic,
  Keyboard,
  Lightbulb,
  ListChecks,
  MessageCircle,
} from "lucide-react"
import type { InterviewQuestion, AnswerAnalysis, StandardAnswer } from "@/features/career/types"

interface InterviewStageProps {
  questions: InterviewQuestion[]
  currentQIndex: number
  position: string
  type: string
  isLoading: boolean
  loadingStage: "questions" | "analysis" | null
  streamText: string
  answer: string
  onAnswerChange: (v: string) => void
  answerError?: string
  onNext: () => void
  onRestart: () => void
  analysis: AnswerAnalysis | null
  standardAnswer: StandardAnswer | null
  onShowExpertAnswer: () => void
  avatarUrl: string | null
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

interface BrowserSpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: any) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

// 浏览器语音识别支持检测
function getSpeechRecognition(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  return Ctor || null
}

const SpeechRecognitionCtor = typeof window !== "undefined" ? getSpeechRecognition() : null
const recorderSupported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia
const voiceSupported = SpeechRecognitionCtor !== null || recorderSupported

export default function InterviewStage({
  questions,
  currentQIndex,
  position,
  type: _type,
  isLoading,
  loadingStage,
  streamText: _streamText,
  answer,
  onAnswerChange,
  answerError = "",
  onNext,
  onRestart,
  analysis,
  standardAnswer,
  onShowExpertAnswer,
  avatarUrl,
}: InterviewStageProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const answerValueRef = useRef(answer)
  const speechBaseAnswerRef = useRef("")
  const finalTranscriptRef = useRef("")
  const onAnswerChangeRef = useRef(onAnswerChange)
  answerValueRef.current = answer
  onAnswerChangeRef.current = onAnswerChange

  useEffect(() => {
    if (isPaused || isLoading) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, isLoading])

  useEffect(() => {
    setElapsed(0)
  }, [currentQIndex])

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return
    speechBaseAnswerRef.current = inputRef.current?.value || answerValueRef.current || ""
    finalTranscriptRef.current = ""

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = "zh-CN"
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onresult = (event: any) => {
      let finalTranscript = finalTranscriptRef.current
      let interimTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      finalTranscriptRef.current = finalTranscript

      const combined = [
        speechBaseAnswerRef.current.trim(),
        finalTranscript.trim(),
        interimTranscript.trim(),
      ].filter(Boolean).join("\n")

      onAnswerChangeRef.current(combined)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"
      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        if (audioChunksRef.current.length === 0) return

        setIsTranscribing(true)
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(String(reader.result).split(",")[1])
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          const text = await speechToText(base64)
          const current = inputRef.current?.value || ""
          const separator = current.trim() && !current.endsWith("\n") ? "\n" : ""
          onAnswerChangeRef.current(current ? `${current}${separator}${text}` : text)
        } catch (error) {
          alert(error instanceof Error ? error.message : "语音识别失败，请稍后重试")
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (error) {
      alert(error instanceof Error ? error.message : "无法访问麦克风，请检查浏览器权限")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
  }, [])

  const toggleVoice = useCallback(() => {
    if (getSpeechConfig().provider === "dashscope") {
      if (isRecording) stopRecording()
      else startRecording()
      return
    }

    if (isListening) stopListening()
    else startListening()
  }, [isListening, isRecording, startListening, startRecording, stopListening, stopRecording])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const currentQ = questions[currentQIndex]
  const isSelfIntro = currentQ?.kind === "selfIntro"
  const posLabel = POSITIONS.find(p => p.value === position)?.label || position
  const interviewerImage = avatarUrl || "/interviewers/interviewer-01-executive-male.png"
  const questionProgress = questions.length > 0 ? Math.round(((currentQIndex + 1) / questions.length) * 100) : 0
  const answerValidation = validateInterviewAnswer(currentQ, answer)
  const canSubmitAnswer = answerValidation.valid
  const answerGuardMessage = answerError || (!answer.trim() ? "请完成本题作答后再进入下一题。" : answerValidation.message)

  // ====== 加载：生成题目 ======
  if (isLoading && loadingStage === "questions") {
    return (
      <div className="flex-1 flex flex-col p-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        <div
          className="flex-1 rounded-3xl bg-cover flex items-center justify-center relative overflow-hidden"
          style={{ backgroundImage: `url(${interviewerImage})`, backgroundPosition: "center 20%" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="text-center space-y-4 relative z-10">
            <p className="text-base text-white font-semibold">AI 正在生成面试题...</p>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="size-2.5 rounded-full bg-white/80 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ====== 加载：分析回答 ======
  if (isLoading && loadingStage === "analysis") {
    return (
      <div className="flex-1 flex flex-col p-8">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-lg">
            {posLabel}
          </Badge>
          <span className="text-sm text-gray-400">
            {currentQIndex + 1} / {questions.length}
          </span>
          <span className="text-sm text-gray-400 ml-auto flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {formatTime(elapsed)}
          </span>
        </div>
        <div
          className="flex-1 rounded-3xl bg-cover flex items-center justify-center relative overflow-hidden"
          style={{ backgroundImage: `url(${interviewerImage})`, backgroundPosition: "center 20%" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="text-center space-y-5 relative z-10">
            <p className="text-base text-white font-semibold">AI 正在分析您的回答...</p>
            <div className="mx-auto size-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // ====== 正常面试状态 ======
  return (
    <div className="flex-1 flex flex-col min-h-0 p-5 lg:p-6 xl:p-8">
      <div className="mb-5 flex shrink-0 items-center gap-3">
        <Badge variant="secondary" className="rounded-full border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
          {posLabel}
        </Badge>
        <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
          {isSelfIntro ? "自我介绍" : `Q${currentQIndex} / ${Math.max(questions.length - 1, 0)}`}
        </span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
          <Clock className="size-3.5 text-blue-500" />
          {formatTime(elapsed)}
        </span>
      </div>

      <div className="grid flex-1 min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_410px] 2xl:grid-cols-[minmax(0,1fr)_450px]">
        <div
          className="relative min-h-[360px] overflow-hidden rounded-[32px] bg-slate-900 shadow-[0_22px_60px_rgba(15,23,42,0.14)]"
          style={{
            backgroundImage: `url(${interviewerImage})`,
            backgroundPosition: "center 20%",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10" />
          <div className="absolute left-6 top-6 flex items-center gap-2">
            <span className="rounded-full bg-white/92 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
              面试现场
            </span>
          </div>
          <div className="absolute bottom-6 left-6 max-w-[520px] rounded-3xl border border-white/15 bg-slate-950/72 px-6 py-5 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-100/90">
              <MessageCircle className="size-4" />
              面试官正在等待你的回答
            </div>
            <p className="mt-2 text-sm leading-6 text-white/78">
              保持结构清晰，先给结论，再补充背景、行动和结果。语音输入会持续追加，不会覆盖已经写好的内容。
            </p>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col rounded-[32px] border border-white/70 bg-white/82 p-7 shadow-[0_22px_55px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {isSelfIntro ? "固定开场" : "当前问题"}
              </span>
              <h2 className="mt-5 text-2xl font-black leading-snug tracking-tight text-slate-900">
                {currentQ?.question || "正在准备面试题..."}
              </h2>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-slate-400">计时</p>
              <p className="mt-1 text-base font-black text-slate-700">{formatTime(elapsed)}</p>
            </div>
          </div>

          <div className="mt-7 rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Lightbulb className="size-4.5 text-blue-600" />
              答题提示
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isSelfIntro
                ? "建议控制在 1-3 分钟：先说背景，再讲经历与岗位匹配，最后说明铁路行业认知和求职稳定性。"
                : "建议用 STAR 结构回答：先说明情境和任务，再讲你的行动，最后给出结果或复盘。"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-black text-blue-600">1+5</p>
                <p className="mt-1 text-xs font-medium text-slate-500">自我介绍 + 面试题</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-black text-emerald-600">{isSelfIntro ? "3分钟" : "STAR"}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{isSelfIntro ? "建议时长上限" : "推荐答题结构"}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <ListChecks className="size-4.5 text-blue-600" />
                当前进度
              </div>
              <span className="text-xs font-semibold text-slate-400">{questionProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                style={{ width: `${questionProgress}%` }}
              />
            </div>
          </div>

          <div className="mt-auto rounded-3xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-2xl ${
                isListening || isRecording ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"
              }`}>
                {isListening || isRecording ? <Mic className="size-5" /> : <Keyboard className="size-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isTranscribing ? "正在识别语音" : isListening || isRecording ? "正在接收语音" : "可文字或语音作答"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {isListening || isRecording ? "说完再次点击麦克风即可停止" : "Ctrl + Enter 可保存并进入下一题"}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-5 shrink-0 rounded-[30px] border border-white/60 bg-slate-900 p-3 shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
        {analysis && (
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-2.5">
            <p className="text-sm font-semibold text-emerald-700">回答已提交，评分完成</p>
            <Button
              size="sm"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-xs font-semibold text-white shadow-glow-sm hover:from-blue-700 hover:to-indigo-700"
              onClick={onShowExpertAnswer}
            >
              <Eye className="mr-1.5 size-3.5" />
              查看专业答案
            </Button>
          </div>
        )}

        {(isListening || isRecording || isTranscribing) && (
          <div className={`mb-3 flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold ${
            isTranscribing ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
          }`}>
            <span className={`size-2 rounded-full ${isTranscribing ? "animate-pulse bg-amber-400" : "animate-ping bg-red-500"}`} />
            {isTranscribing ? "AI 正在识别语音..." : isRecording ? "正在录音，说完点击麦克风停止" : "正在聆听，可继续补充回答"}
          </div>
        )}

        <div className="space-y-3">
          <Textarea
            ref={inputRef}
            placeholder="语音转写会持续追加，不会覆盖前文。也可以直接在这里输入回答..."
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="min-h-[96px] max-h-[150px] w-full resize-none rounded-[22px] border-white/10 bg-white px-5 py-4 text-sm text-slate-800 shadow-inner placeholder:text-slate-300 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) onNext()
            }}
          />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
              >
                {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
                <span className="ml-1.5 text-xs">{isPaused ? "继续" : "暂停"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestart}
                className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="size-4" />
                <span className="ml-1.5 text-xs">重新开始</span>
              </Button>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {voiceSupported && (
                <Button
                  variant="outline"
                  className={`h-[50px] rounded-2xl border-0 px-5 font-bold shadow-sm transition-all duration-200 ${
                    isListening || isRecording
                      ? "bg-red-50 text-red-500 hover:bg-red-100"
                      : "bg-white text-blue-600 hover:bg-blue-50"
                  }`}
                  title={isListening || isRecording ? "停止语音输入" : "语音输入"}
                  onClick={toggleVoice}
                  disabled={isTranscribing}
                >
                  <Mic className="mr-2 size-4.5" />
                  {isListening || isRecording ? "停止语音" : "语音输入"}
                </Button>
              )}

              <Button
                className="h-[50px] min-w-[168px] rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-6 font-bold text-white shadow-glow-sm transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40"
                onClick={onNext}
                title={canSubmitAnswer ? "保存本题并继续" : answerGuardMessage}
                disabled={!canSubmitAnswer}
              >
                <span>{currentQIndex === questions.length - 1 ? "提交并查看总结" : "保存并下一题"}</span>
                <ChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>

          <div className="px-1 text-xs font-medium">
            <span className={canSubmitAnswer ? "text-slate-400" : "text-amber-300"}>
              {canSubmitAnswer
                ? "当前回答会在进入下一题时保存，并在结束后统一评分。"
                : answerGuardMessage}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}


