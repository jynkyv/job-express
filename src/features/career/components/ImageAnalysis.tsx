"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { POSITIONS } from "@/features/career/lib/prompts"
import { usePhotoUpload } from "@/features/career/hooks/usePhotoUpload"
import { usePhotoValidation } from "@/features/career/hooks/usePhotoValidation"
import { useImageAnalysis } from "@/features/career/hooks/useImageAnalysis"
import { OutfitTab, FaceHairTab, ComprehensiveTab, HealthGuideTab, FitnessGuideTab, ReferenceTab } from "./ImageAnalysisTabs"
import type { BmiData, ImageAnalysisV2Result } from "@/features/career/types"
import type { SharedImageResult } from "@/features/career/context/AppContext"
import {
  Upload,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  User,
  Lightbulb,
  BookOpen,
  Apple,
  Dumbbell,
  Shirt,
  Scissors,
  Glasses,
  Utensils,
  Moon,
  Activity,
  Ruler,
  CalendarDays,
  Check,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

type AnalysisTab = "outfit" | "facehair" | "comprehensive" | "health" | "fitness" | "reference"

function calcBmi(h: number, w: number): BmiData {
  const hm = h / 100
  const bmi = Math.round((w / (hm * hm)) * 10) / 10
  let category: BmiData["category"], label: string
  if (bmi < 18.5) { category = "underweight"; label = "偏瘦" }
  else if (bmi < 24) { category = "normal"; label = "标准" }
  else if (bmi < 28) { category = "overweight"; label = "偏胖" }
  else { category = "obese"; label = "肥胖" }
  return { height: h, weight: w, bmi, category, categoryLabel: label }
}

const TABS: { key: AnalysisTab; label: string; icon: typeof Shirt }[] = [
  { key: "outfit", label: "着装分析", icon: Shirt },
  { key: "facehair", label: "面部/发型", icon: User },
  { key: "comprehensive", label: "综合建议", icon: Lightbulb },
  { key: "health", label: "健康指南", icon: Apple },
  { key: "fitness", label: "运动指南", icon: Dumbbell },
  { key: "reference", label: "参考形象", icon: BookOpen },
]

const PHOTO_GUIDE = [
  ["五官清晰可见", "避免墨镜、口罩、强滤镜和过暗环境。"],
  ["背景干净统一", "白色、浅灰、浅蓝背景更适合职业形象。"],
  ["保留肩颈与上装", "便于判断着装职业感和整体比例。"],
  ["光线均匀自然", "避免逆光、阴影和明显色偏。"],
]

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function asScore(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback
}

function normalizeImageAnalysisResult(raw: ImageAnalysisV2Result): ImageAnalysisV2Result {
  const source = raw as any
  const faceHair = source.face_hair || {}
  const outfit = source.outfit_analysis || {}
  const jobMatch = source.job_match || {}
  const summary = source.summary_advice || {}
  const health = source.health_guide
  const diet = health?.diet_advice || {}
  const fitness = source.fitness_guide

  return {
    analyzed_at: asString(source.analyzed_at, new Date().toISOString()),
    model_used: asString(source.model_used, ""),
    overall_score: asScore(source.overall_score, 0),
    face_hair: {
      face_shape: asString(faceHair.face_shape, "待补充"),
      skin_status: asString(faceHair.skin_status, "待补充"),
      hair_style: asString(faceHair.hair_style, "待补充"),
      hair_advice: asString(faceHair.hair_advice, "保持发型清爽，面试前整理碎发和鬓角。"),
      makeup_advice: asString(faceHair.makeup_advice, "保持面部干净自然，避免过度修饰。"),
    },
    outfit_analysis: {
      clothing_type: asString(outfit.clothing_type, "职业装/商务休闲"),
      color_match: asString(outfit.color_match, "良"),
      fit_appropriateness: asScore(outfit.fit_appropriateness, 75),
      outfit_score: asScore(outfit.outfit_score, 75),
      outfit_advice: asString(outfit.outfit_advice, "建议选择干净、合身、低饱和度的面试着装。"),
      formal_level: Math.min(Math.max(asScore(outfit.formal_level, 3), 1), 5),
      color_palette: asArray<string>(outfit.color_palette).length
        ? asArray<string>(outfit.color_palette)
        : ["#1E3A8A", "#FFFFFF", "#334155", "#CBD5E1"],
      accessory_advice: asString(outfit.accessory_advice, "配饰保持简洁，避免抢镜。"),
    },
    style_tags: asArray(source.style_tags).length
      ? asArray(source.style_tags).map((tag: any) => ({
          tag: asString(tag?.tag, "职业稳重"),
          description: asString(tag?.description, "整体风格适合正式面试场景。"),
        }))
      : [{ tag: "职业稳重", description: "整体风格适合正式面试场景。" }],
    job_match: {
      overall_match: asScore(jobMatch.overall_match, 75),
      match_reason: asString(jobMatch.match_reason, "当前形象基本适合面试场景。"),
      key_adjustments: asArray<string>(jobMatch.key_adjustments),
    },
    summary_advice: {
      quick_wins: asArray<string>(summary.quick_wins),
      medium_term: asArray<string>(summary.medium_term),
      long_term: asArray<string>(summary.long_term),
    },
    health_guide: health ? {
      bmi_assessment: asString(health.bmi_assessment, "根据当前身体数据，建议以稳定精神状态和规律作息为主。"),
      daily_calories: asScore(health.daily_calories, 2000),
      diet_advice: {
        summary: asString(diet.summary, "面试前饮食以清淡、稳定、不过量为主。"),
        recommendations: asArray(diet.recommendations).map((item: any) => ({
          meal: asString(item?.meal, "餐次"),
          items: asArray<string>(item?.items),
          note: asString(item?.note, ""),
        })),
        interview_day: asString(diet.interview_day, "面试当天正常吃早餐，避免油腻、辛辣和产气食物。"),
      },
      sleep_routine: asString(health.sleep_routine, "面试前一晚尽量保证 7-8 小时睡眠。"),
      skin_care: asString(health.skin_care, "面试前做好清洁和保湿，避免临时尝试刺激性护肤品。"),
    } : undefined,
    fitness_guide: fitness ? {
      summary: asString(fitness.summary, "以改善体态和保持精神状态为主。"),
      weekly_plan: asArray(fitness.weekly_plan).map((item: any) => ({
        day: asString(item?.day, "某天"),
        workout: asString(item?.workout, "轻量有氧与拉伸"),
        duration: asString(item?.duration, "20分钟"),
      })),
      posture_training: asArray<string>(fitness.posture_training),
      quick_tips: asArray<string>(fitness.quick_tips),
      interview_morning: asString(fitness.interview_morning, "面试当天做简单拉伸和深呼吸，保持肩颈放松。"),
    } : undefined,
  }
}

interface Props {
  onResultChange: (result: SharedImageResult | null) => void
}

export default function ImageAnalysis({ onResultChange }: Props) {
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [position, setPosition] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<AnalysisTab>("outfit")
  const [showPrivacy, setShowPrivacy] = useState(false)
  const reportRef = useRef<HTMLElement | null>(null)

  const {
    photos, processedPhotos, isDragging, fileInputRef, dropRef,
    handleFiles, clearPhotos,
  } = usePhotoUpload(2)

  const { validation, isValidating: isValidatingPhoto, validatePhoto, clearValidation } = usePhotoValidation()
  const { phase, result: analysisResult, error: analysisError, retryCount, analyze, reset: resetAnalysis } = useImageAnalysis()
  const safeAnalysisResult = useMemo(
    () => analysisResult ? normalizeImageAnalysisResult(analysisResult) : null,
    [analysisResult]
  )

  const bmi = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (!h || !w || h <= 0 || w <= 0) return null
    return calcBmi(h, w)
  }, [height, weight])

  const positionLabel = POSITIONS.find((p) => p.value === position)?.label || "通用岗位"
  const isLoading = phase === "analyzing" || phase === "parsing" || phase === "validating"
  const analysisPhotos = processedPhotos.length > 0 ? processedPhotos : photos
  const canAnalyze = !isLoading

  useEffect(() => {
    if (analysisError) setError(analysisError)
  }, [analysisError])

  useEffect(() => {
    if (phase === "complete" && safeAnalysisResult) {
      onResultChange({
        outfit: {
          summary: safeAnalysisResult.outfit_analysis.outfit_advice,
          recommendations: [],
        },
        diet: {
          dailyCalories: safeAnalysisResult.health_guide?.daily_calories || 2000,
          summary: safeAnalysisResult.health_guide?.diet_advice.summary || "",
          foods: [],
          tips: [],
        },
        fitness: {
          summary: safeAnalysisResult.fitness_guide?.summary || "",
          weeklyPlan: safeAnalysisResult.fitness_guide?.weekly_plan?.map((w) => ({
            day: w.day, workout: w.workout, duration: w.duration,
          })) || [],
          tips: safeAnalysisResult.fitness_guide?.quick_tips || [],
        },
        bmi: {
          height: bmi?.height || 0,
          weight: bmi?.weight || 0,
          bmi: bmi?.bmi || 0,
          category: bmi?.category || "normal",
          categoryLabel: bmi?.categoryLabel || "",
        },
      })
    } else if (phase === "idle") {
      onResultChange(null)
    }
  }, [phase, safeAnalysisResult, onResultChange, bmi])

  useEffect(() => {
    if (phase === "complete" && safeAnalysisResult) {
      window.requestAnimationFrame(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [phase, safeAnalysisResult])

  useEffect(() => {
    if (processedPhotos.length > 0 && phase === "idle") {
      validatePhoto(processedPhotos[0])
    } else if (processedPhotos.length === 0) {
      clearValidation()
    }
  }, [processedPhotos, phase, validatePhoto, clearValidation])

  const doAnalyze = useCallback(async () => {
    if (!analysisPhotos[0]) {
      setError("请先上传照片")
      return
    }
    setError("")
    onResultChange(null)
    setActiveTab("outfit")

    await analyze(bmi, age, gender, position, analysisPhotos)
  }, [bmi, analysisPhotos, age, gender, position, analyze, onResultChange])

  const handleReset = useCallback(() => {
    clearPhotos()
    clearValidation()
    resetAnalysis()
    setError("")
    onResultChange(null)
  }, [clearPhotos, clearValidation, resetAnalysis, onResultChange])

  return (
    <div className="h-full overflow-y-auto bg-[#eef4fb] px-6 pb-6 pt-20">
      <div className="grid h-[calc(100vh-6.5rem)] min-h-0 grid-cols-[minmax(0,1fr)_390px] gap-5 max-xl:grid-cols-1">
        <main className="flex h-full min-h-0 flex-col rounded-[34px] border border-slate-200 bg-white/95 p-7 shadow-[0_22px_70px_rgba(15,23,42,0.075)]">
          <section className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_430px] gap-6 max-2xl:grid-cols-[minmax(0,1fr)_400px] max-lg:grid-cols-1">
            <div className="flex min-h-0 flex-col">
              <div>
                <p className="text-sm font-black text-blue-600">面试出镜准备舱</p>
                <h1 className="mt-3 text-[42px] font-black leading-tight tracking-[-0.04em] text-slate-950 max-lg:text-3xl">
                  面试前，先确认你的形象是否稳妥
                </h1>
                <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-500">
                  上传一张面试出镜照片，补充基础身体数据和目标岗位。系统会先确认照片是否适合分析，再围绕着装职业感、发型面容、仪态比例与岗位适配，生成一份可执行的形象调整建议。
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {["照片仅用于本次分析", "按岗位给出建议", "分析后进入报告区"].map((item) => (
                    <span key={item} className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto rounded-[28px] border border-blue-100 bg-gradient-to-b from-slate-50 to-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900">补充必要信息</h2>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">用于个性化建议</span>
                </div>
                <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                  <Field label="年龄">
                    <NumberStepper value={age} onChange={setAge} placeholder="25" unit="" min={16} max={70} ariaName="年龄" />
                  </Field>
                  <Field label="性别">
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-9 border-0 bg-transparent p-0 text-base font-black shadow-none focus:ring-0">
                        <SelectValue placeholder="可选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男</SelectItem>
                        <SelectItem value="female">女</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="身高">
                    <NumberStepper value={height} onChange={setHeight} placeholder="170" unit="cm" min={120} max={220} ariaName="身高" />
                  </Field>
                  <Field label="体重">
                    <NumberStepper value={weight} onChange={setWeight} placeholder="50" unit="kg" min={30} max={180} ariaName="体重" />
                  </Field>
                  <div className="col-span-2 max-lg:col-span-1">
                    <Field label="目标岗位">
                      <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger className="h-9 border-0 bg-transparent p-0 text-base font-black shadow-none focus:ring-0">
                          <SelectValue placeholder="可选" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="照片类型">
                    <p className="pt-1 text-base font-black text-slate-900">{photos[0] ? "已上传" : "待上传"}</p>
                  </Field>
                </div>
              </div>
            </div>

            <div
              ref={dropRef}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex min-h-0 cursor-pointer flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm transition-all ${
                isDragging ? "scale-[1.01] border-blue-300 ring-4 ring-blue-100" : "hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-500">
                <span className="text-slate-900">照片预览与拍摄要点</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">正面 / 上半身 / 光线均匀</span>
              </div>
              <div className="relative mx-4 mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_32%,rgba(37,99,235,0.08)_33%,transparent_34%,transparent_65%,rgba(37,99,235,0.08)_66%,transparent_67%),linear-gradient(180deg,transparent_32%,rgba(37,99,235,0.08)_33%,transparent_34%,transparent_65%,rgba(37,99,235,0.08)_66%,transparent_67%)]" />
                {photos[0] ? (
                  <img src={photos[0]} alt="形象分析照片预览" className="relative z-10 h-full w-full object-cover" />
                ) : (
                  <>
                    <img
                      src="/image-analysis/appearance-cartoon.png"
                      alt="职业形象示例"
                      className="relative z-10 h-full w-full scale-[1.08] object-cover opacity-95 transition duration-500 group-hover:scale-[1.1]"
                    />
                    <div className="absolute inset-0 z-20 bg-gradient-to-b from-white/10 via-transparent to-slate-950/35" />
                    <div className="absolute bottom-5 left-5 right-5 z-30 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-white">职业形象示例</p>
                        <p className="mt-1 text-xs font-semibold text-white/85">上传本人照片后，这里会替换为实际预览</p>
                      </div>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 py-3">
                {PHOTO_GUIDE.map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <Check className="size-3 text-blue-600" />
                      {title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-500">
                <span>{photos[0] ? "已上传照片，可点击替换" : "建议上传证件照或上半身职业照"}</span>
                <span className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm">
                  {photos[0] ? "更换照片" : "上传照片"}
                </span>
              </div>
            </div>
          </section>

          {(validation || isValidatingPhoto || error) && (
            <section className="mt-5 grid gap-3">
              {isValidatingPhoto && (
                <StatusCard tone="blue" icon={<Loader2 className="size-4 animate-spin" />} title="正在校验照片质量" desc="会检查人物数量、清晰度、光线和背景是否适合职业形象分析。" />
              )}
              {validation && photos.length > 0 && (
                <StatusCard
                  tone={validation.is_valid ? "green" : "amber"}
                  icon={validation.is_valid ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                  title={validation.is_valid ? "照片质量合格" : "照片质量有待改善"}
                  desc={validation.suggestion || (validation.is_valid ? "当前照片可以用于本次形象分析。" : "建议按拍摄要点重新拍摄或补充一张照片。")}
                  footer={`人物：${validation.person_count}人 · 光线：${validation.lighting_quality} · 背景：${validation.background_suitable ? "适合" : "需改善"}`}
                />
              )}
              {error && (
                <StatusCard tone="red" icon={<AlertCircle className="size-4" />} title="暂时无法开始分析" desc={error} footer={retryCount > 0 ? `已重试 ${retryCount} 次` : undefined} />
              )}
            </section>
          )}

        </main>

        <aside className="flex h-full min-h-0 flex-col rounded-[34px] border border-slate-200 bg-white/95 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.075)]">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950">分析建议</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            上传照片并补充信息后，AI 会围绕面试出镜场景给出可执行的形象调整建议。
          </p>

          <div className="mt-4 rounded-[24px] bg-slate-950 p-5 text-white">
            <h3 className="text-base font-black">重点推荐方向</h3>
            <div className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-300">
              <p>当前形象最影响面试观感的问题是什么</p>
              <p>哪些地方必须改，哪些只是建议优化</p>
              <p>目标岗位需要什么样的着装、仪容和职业呈现</p>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-900">报告结构预览</h3>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-blue-600 shadow-sm">示例</span>
            </div>
            <div className="mt-4 grid gap-2.5">
              {[
                ["职业感", "整体专业度与第一印象"],
                ["仪容整洁", "面部、发型和清爽程度"],
                ["着装协调", "颜色、款式和正式程度"],
                ["仪态比例", "肩颈、坐姿和精神状态"],
                ["岗位适配", "与目标岗位场景的匹配度"],
              ].map(([label, desc]) => (
                <div key={label} className="rounded-2xl border border-blue-100 bg-white p-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-xs font-black text-slate-800">{label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              这里展示的是报告会覆盖的维度，不代表已完成分析。上传照片并生成报告后，下方报告区会显示真实评分和建议。
            </p>
          </div>

          <button
            onClick={() => setShowPrivacy(true)}
            className="mt-auto inline-flex items-center justify-center gap-2 border-t border-slate-200 pt-5 text-xs font-bold text-slate-400 transition hover:text-blue-600"
          >
            <Shield className="size-3.5" />
            照片仅用于本次分析，结果保存在本地浏览器
          </button>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              onClick={doAnalyze}
              disabled={!canAnalyze}
              className="inline-flex min-h-[64px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-base font-black text-white shadow-[0_16px_38px_rgba(37,99,235,0.24)] transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
              {isLoading ? "正在分析" : safeAnalysisResult ? "重新分析" : "开始 AI 形象分析"}
            </button>
            {safeAnalysisResult && !isLoading && (
              <button
                onClick={() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100"
              >
                查看分析结果
              </button>
            )}
          </div>
        </aside>
      </div>

      {showPrivacy && (
        <div className="mt-5 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-black text-slate-900">隐私保护说明</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                照片仅用于本次形象分析，不会写入简历文件。使用 AI 分析时，照片和必要身体数据会发送到当前配置的 OpenAI 服务；分析结果仅保存在当前浏览器。
              </p>
              <button onClick={() => setShowPrivacy(false)} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {safeAnalysisResult && !isLoading && (
        <section ref={reportRef} className="mt-5 scroll-mt-20 space-y-4 rounded-[34px] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-blue-600">形象报告</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">本次形象分析结果</h2>
            </div>
            <button onClick={handleReset} className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100">
              <Upload className="size-3.5" />
              重新上传分析
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            {[
              { label: "综合评分", value: safeAnalysisResult.overall_score, suffix: "" },
              { label: "穿搭评分", value: safeAnalysisResult.outfit_analysis.outfit_score, suffix: "" },
              { label: "岗位匹配", value: safeAnalysisResult.job_match.overall_match, suffix: "%" },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5 text-center">
                <p className="text-4xl font-black text-blue-700">{item.value}{item.suffix}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>

          <VisualImageReport
            data={safeAnalysisResult}
            photo={photos[0]}
            bmi={bmi}
            positionLabel={positionLabel}
          />

          <div className="flex rounded-2xl bg-slate-100 p-1 max-lg:flex-wrap">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                  activeTab === tab.key
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-6">
            {activeTab === "outfit" && <OutfitTab data={safeAnalysisResult.outfit_analysis} />}
            {activeTab === "facehair" && <FaceHairTab data={safeAnalysisResult.face_hair} />}
            {activeTab === "comprehensive" && <ComprehensiveTab data={safeAnalysisResult} />}
            {activeTab === "health" && safeAnalysisResult.health_guide && <HealthGuideTab data={safeAnalysisResult.health_guide} />}
            {activeTab === "fitness" && safeAnalysisResult.fitness_guide && <FitnessGuideTab data={safeAnalysisResult.fitness_guide} />}
            {activeTab === "reference" && <ReferenceTab position={position} />}
          </div>
        </section>
      )}
    </div>
  )
}

function VisualImageReport({
  data,
  photo,
  bmi,
  positionLabel,
}: {
  data: ImageAnalysisV2Result
  photo?: string
  bmi: BmiData | null
  positionLabel: string
}) {
  const faceItems = [
    { label: "脸型", value: data.face_hair.face_shape },
    { label: "肤质", value: data.face_hair.skin_status },
    { label: "发型", value: data.face_hair.hair_style },
  ]
  const quickWins = data.summary_advice.quick_wins.slice(0, 4)
  const bmiScenario = getBmiScenario(bmi)
  const meals = data.health_guide?.diet_advice.recommendations.slice(0, 3) || []
  const postureItems = data.fitness_guide?.posture_training.slice(0, 4) || []
  const morningTips = [
    data.health_guide?.diet_advice.interview_day,
    data.health_guide?.sleep_routine,
    data.fitness_guide?.interview_morning,
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-4 rounded-[30px] border border-slate-200 bg-[#f8fafc] p-4">
      <section className="grid grid-cols-[260px_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#6f524d] px-4 py-2 text-center text-sm font-black text-white">个人形象分析</div>
          <div className="p-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-slate-100">
              <img
                src={photo || "/image-analysis/appearance-cartoon.png"}
                alt="个人形象照片"
                className="h-full w-full object-cover"
              />
              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                {positionLabel}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {faceItems.map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-bold text-slate-400">{item.label}</p>
                  <p className="mt-1 truncate text-xs font-black text-slate-800">{item.value}</p>
                </div>
              ))}
              <div className="rounded-xl bg-blue-50 px-3 py-2">
                <p className="text-[11px] font-bold text-blue-400">总评分</p>
                <p className="mt-1 text-xs font-black text-blue-700">{data.overall_score} 分</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <ReportPanel title="发型与仪容对照" subtitle="把第一眼的整洁度做上来">
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              <LookCompareCard
                tone="best"
                title="最适合"
                image={photo}
                tags={["额头清爽", "鬓角利落", "眉形干净"]}
                desc={data.face_hair.hair_advice}
              />
              <LookCompareCard
                tone="ok"
                title="可接受"
                image={photo}
                tags={["自然发型", "轻度修整", "低存在感配饰"]}
                desc={data.face_hair.makeup_advice}
              />
              <LookCompareCard
                tone="avoid"
                title="不建议"
                image={photo}
                tags={["遮眼刘海", "胡茬明显", "油光杂乱"]}
                desc="避免过厚刘海、明显胡茬、过亮发蜡和抢镜眼镜框。"
              />
            </div>
          </ReportPanel>

          <ReportPanel title="西装与岗位适配" subtitle="面试默认走正式、清爽、可信赖路线">
            <div className="grid grid-cols-[1fr_1.1fr] gap-4 max-md:grid-cols-1">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-700 p-4 text-white">
                <div className="flex items-center justify-between">
                  <Shirt className="size-8 text-blue-100" />
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">正式度 {data.outfit_analysis.formal_level}/5</span>
                </div>
                <p className="mt-5 text-lg font-black">{data.outfit_analysis.clothing_type}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-blue-100">{data.outfit_analysis.outfit_advice}</p>
              </div>
              <div className="grid gap-3">
                <MetricRow label="合身度" value={data.outfit_analysis.fit_appropriateness} />
                <MetricRow label="穿搭分" value={data.outfit_analysis.outfit_score} />
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-black text-slate-500">推荐色板</p>
                  <div className="mt-2 flex gap-2">
                    {data.outfit_analysis.color_palette.slice(0, 5).map((color, index) => (
                      <span key={`${color}-${index}`} className="size-8 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{data.outfit_analysis.accessory_advice}</p>
                </div>
              </div>
            </div>
          </ReportPanel>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_1.2fr] gap-4 max-xl:grid-cols-1">
        <ReportPanel title="BMI 健康指南" subtitle="按身体数据生成面试前状态管理">
          <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-4 max-sm:grid-cols-1">
            <div className={`rounded-3xl p-5 text-white ${bmiScenario.bg}`}>
              <p className="text-xs font-black opacity-80">当前 BMI</p>
              <p className="mt-2 text-5xl font-black tracking-tight">{bmi?.bmi || "--"}</p>
              <p className="mt-2 text-sm font-black">{bmiScenario.label}</p>
              <p className="mt-4 text-xs font-semibold leading-5 opacity-85">{bmiScenario.strategy}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 max-md:grid-cols-2">
              {BMI_GUIDE.map((item) => (
                <div key={item.label} className={`rounded-2xl border p-3 ${item.active === bmi?.category ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                  <p className="text-xs font-black text-slate-800">{item.label}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{item.range}</p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>
          {data.health_guide?.bmi_assessment && (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">
              {data.health_guide.bmi_assessment}
            </p>
          )}
        </ReportPanel>

        <ReportPanel title="饮食图卡" subtitle={`建议摄入 ${data.health_guide?.daily_calories || "--"} 千卡，目标是稳定精神状态`}>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            {meals.map((meal, index) => (
              <MealCard key={meal.meal} meal={meal.meal} items={meal.items} note={meal.note} index={index} />
            ))}
          </div>
          <AvoidList />
        </ReportPanel>
      </section>

      <section className="grid grid-cols-[1.1fr_0.9fr] gap-4 max-xl:grid-cols-1">
        <ReportPanel title="体态纠正对照" subtitle="照片能看出的上半身体态，会转成面试动作建议">
          <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4 max-md:grid-cols-1">
            <PostureCompare />
            <div className="grid gap-2">
              {(postureItems.length ? postureItems : ["靠墙站立 5 分钟，后脑勺、肩胛骨、臀部尽量贴墙", "坐姿下巴微收，肩膀自然下沉", "答题时身体微前倾，不后仰靠椅", "入场前做 3 次深呼吸，放松肩颈"]).map((item, index) => (
                <div key={index} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600">{index + 1}</span>
                  <p className="text-xs font-semibold leading-5 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </ReportPanel>

        <ReportPanel title="面试前一天状态清单" subtitle="少做减分项，比临场补救更重要">
          <div className="space-y-3">
            {quickWins.map((item, index) => (
              <div key={index} className="flex items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="size-4" />
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
              </div>
            ))}
            {morningTips.slice(0, 3).map((item, index) => (
              <div key={`morning-${index}`} className="flex items-start gap-3 rounded-2xl bg-blue-50 p-3">
                {index === 0 ? <Utensils className="mt-1 size-4 shrink-0 text-blue-600" /> : index === 1 ? <Moon className="mt-1 size-4 shrink-0 text-blue-600" /> : <CalendarDays className="mt-1 size-4 shrink-0 text-blue-600" />}
                <p className="text-xs font-semibold leading-5 text-blue-700">{item}</p>
              </div>
            ))}
          </div>
        </ReportPanel>
      </section>
    </div>
  )
}

const BMI_GUIDE: { label: string; range: string; tip: string; active: BmiData["category"] }[] = [
  { label: "偏瘦", range: "< 18.5", tip: "规律三餐，补足蛋白和力量训练，避免显得疲惫。", active: "underweight" },
  { label: "标准", range: "18.5-23.9", tip: "维持清淡饮食和睡眠，让面部状态更稳定。", active: "normal" },
  { label: "偏胖", range: "24-27.9", tip: "轻控盐油糖，优先改善消肿、挺拔和衣服合身度。", active: "overweight" },
  { label: "肥胖", range: ">= 28", tip: "循序渐进减脂，正装选择深色、挺括、合肩线。", active: "obese" },
]

function getBmiScenario(bmi: BmiData | null) {
  if (!bmi) return { label: "待计算", strategy: "输入身高体重后生成对应健康策略。", bg: "bg-slate-700" }
  if (bmi.category === "underweight") return { label: "偏瘦策略", strategy: "重点是补足能量、改善气色和肩颈挺拔度。", bg: "bg-gradient-to-br from-sky-500 to-blue-700" }
  if (bmi.category === "normal") return { label: "标准策略", strategy: "重点是维持体态、睡眠和面试当天精神状态。", bg: "bg-gradient-to-br from-emerald-500 to-teal-700" }
  if (bmi.category === "overweight") return { label: "轻控脂策略", strategy: "重点是控盐消肿、提升核心和西装轮廓。", bg: "bg-gradient-to-br from-amber-500 to-orange-700" }
  return { label: "稳步管理策略", strategy: "重点是安全减脂、改善体态和选择挺括正装。", bg: "bg-gradient-to-br from-rose-500 to-red-700" }
}

function ReportPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function LookCompareCard({
  tone,
  title,
  image,
  tags,
  desc,
}: {
  tone: "best" | "ok" | "avoid"
  title: string
  image?: string
  tags: string[]
  desc: string
}) {
  const toneClass = {
    best: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ok: "border-blue-200 bg-blue-50 text-blue-700",
    avoid: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone]

  return (
    <div className={`overflow-hidden rounded-2xl border ${toneClass}`}>
      <div className="px-3 py-2 text-center text-sm font-black">{title}</div>
      <div className="relative aspect-[4/3] bg-white">
        {image ? (
          <img src={image} alt={title} className={`h-full w-full object-cover ${tone === "avoid" ? "opacity-75 grayscale" : ""}`} />
        ) : (
          <img src="/image-analysis/appearance-cartoon.png" alt={title} className="h-full w-full object-cover" />
        )}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {tone === "best" && <Scissors className="size-5 rounded-full bg-white p-1 text-emerald-600 shadow" />}
          {tone === "ok" && <Glasses className="size-5 rounded-full bg-white p-1 text-blue-600 shadow" />}
          {tone === "avoid" && <XCircle className="size-5 rounded-full bg-white p-1 text-rose-600 shadow" />}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-black">{tag}</span>
          ))}
        </div>
        <p className="line-clamp-3 text-xs font-semibold leading-5 opacity-85">{desc}</p>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between text-xs font-black">
        <span className="text-slate-500">{label}</span>
        <span className="text-blue-600">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function MealCard({ meal, items, note, index }: { meal: string; items: string[]; note: string; index: number }) {
  const colors = ["from-emerald-100 to-lime-50", "from-amber-100 to-orange-50", "from-sky-100 to-blue-50"]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className={`flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br ${colors[index % colors.length]}`}>
        <div className="relative size-24 rounded-full bg-white shadow-sm">
          <span className="absolute left-5 top-4 size-7 rounded-full bg-emerald-400" />
          <span className="absolute right-5 top-5 size-6 rounded-full bg-amber-300" />
          <span className="absolute bottom-5 left-6 size-8 rounded-full bg-slate-700" />
          <Utensils className="absolute bottom-4 right-4 size-5 text-slate-400" />
        </div>
      </div>
      <p className="mt-3 text-sm font-black text-slate-900">{meal}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {items.slice(0, 4).map((item) => (
          <span key={item} className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500">{item}</span>
        ))}
      </div>
      {note && <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{note}</p>}
    </div>
  )
}

function AvoidList() {
  const items = ["油腻辛辣", "酒精", "过量咖啡", "奶茶甜饮", "产气食物", "熬夜"]
  return (
    <div className="mt-3 rounded-2xl bg-rose-50 p-3">
      <p className="text-xs font-black text-rose-700">面试前一天尽量避免</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-rose-600">
            <XCircle className="size-3" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function PostureCompare() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-rose-50 p-3 text-center">
        <div className="relative mx-auto h-40 w-20">
          <span className="absolute left-7 top-2 size-8 rounded-full bg-rose-200" />
          <span className="absolute left-8 top-10 h-20 w-8 origin-top rotate-12 rounded-full bg-rose-300" />
          <span className="absolute left-2 top-16 h-3 w-16 rotate-12 rounded-full bg-rose-300" />
          <span className="absolute left-5 bottom-3 h-12 w-3 rotate-12 rounded-full bg-rose-300" />
          <span className="absolute right-5 bottom-3 h-12 w-3 rotate-12 rounded-full bg-rose-300" />
        </div>
        <p className="text-xs font-black text-rose-700">含胸松散</p>
      </div>
      <div className="rounded-2xl bg-emerald-50 p-3 text-center">
        <div className="relative mx-auto h-40 w-20">
          <span className="absolute left-7 top-2 size-8 rounded-full bg-emerald-200" />
          <span className="absolute left-8 top-10 h-20 w-8 rounded-full bg-emerald-400" />
          <span className="absolute left-2 top-16 h-3 w-16 rounded-full bg-emerald-400" />
          <span className="absolute left-6 bottom-3 h-12 w-3 rounded-full bg-emerald-400" />
          <span className="absolute right-6 bottom-3 h-12 w-3 rounded-full bg-emerald-400" />
          <Ruler className="absolute right-0 top-5 size-5 text-emerald-600" />
          <Activity className="absolute left-0 bottom-1 size-5 text-emerald-600" />
        </div>
        <p className="text-xs font-black text-emerald-700">挺拔稳定</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
      <label className="block text-xs font-bold text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function NumberStepper({
  value,
  onChange,
  placeholder,
  unit,
  min,
  max,
  ariaName,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  unit: string
  min: number
  max: number
  ariaName: string
}) {
  const current = Number.parseInt(value, 10)
  const step = (delta: number) => {
    const base = Number.isFinite(current) ? current : Number.parseInt(placeholder, 10)
    const next = Math.min(max, Math.max(min, base + delta))
    onChange(String(next))
  }

  return (
    <div className="flex h-9 w-full items-center justify-between gap-2">
      <div className="flex min-w-0 items-center">
        <Input
          type="text"
          inputMode="numeric"
          placeholder={unit ? `${placeholder} ${unit}` : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          className="h-9 w-[3.5ch] min-w-[3.5ch] border-0 bg-transparent p-0 text-base font-black shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {unit && <span className="ml-1 text-[11px] font-black text-slate-400">{unit}</span>}
      </div>
      <div className="flex h-8 w-4 shrink-0 flex-col items-center justify-center">
        <button
          type="button"
          aria-label={`增加${ariaName}`}
          onClick={() => step(1)}
          className="flex h-4 w-4 items-center justify-center rounded-md text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`减少${ariaName}`}
          onClick={() => step(-1)}
          className="flex h-4 w-4 items-center justify-center rounded-md text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function StatusCard({
  tone,
  icon,
  title,
  desc,
  footer,
}: {
  tone: "blue" | "green" | "amber" | "red"
  icon: React.ReactNode
  title: string
  desc: string
  footer?: string
}) {
  const toneClass = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-700",
  }[tone]

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-3.5 ${toneClass}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-xs font-medium leading-5 opacity-85">{desc}</p>
        {footer && <p className="mt-1.5 text-[11px] font-bold opacity-60">{footer}</p>}
      </div>
    </div>
  )
}

function ChecklistItem({
  state,
  index,
  title,
  desc,
}: {
  state: "done" | "warn" | "todo"
  index: string
  title: string
  desc: string
}) {
  const toneClass = state === "done"
    ? "bg-emerald-50 text-emerald-600"
    : state === "warn"
      ? "bg-amber-50 text-amber-600"
      : "bg-blue-50 text-blue-700"

  return (
    <div className="flex gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3.5">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${toneClass}`}>
        {index}
      </span>
      <div>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{desc}</p>
      </div>
    </div>
  )
}
