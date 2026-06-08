"use client"

import { OutfitTab, FaceHairTab, ReferenceTab } from "./ImageAnalysisTabs"
import CrashPlanCard from "./CrashPlanCard"
import HeadshotCard from "./HeadshotCard"
import type { BmiData, ImageAnalysisV2Result } from "@/features/career/types"
import {
  ArrowLeft, Upload, Shirt, User, Target, Sparkles, AlertCircle, BookOpen, Shield,
} from "lucide-react"

interface Props {
  result: ImageAnalysisV2Result
  photo?: string
  bmi: BmiData | null
  position: string
  positionLabel: string
  onBack: () => void
  onReanalyze: () => void
}

function gradeOf(score: number) {
  if (score >= 85) return { label: "优秀", tone: "text-emerald-600" }
  if (score >= 75) return { label: "良好", tone: "text-blue-600" }
  if (score >= 60) return { label: "合格", tone: "text-amber-600" }
  return { label: "待提升", tone: "text-rose-600" }
}

export default function ImageResult({ result, photo, bmi, position, positionLabel, onBack, onReanalyze }: Props) {
  const grade = gradeOf(result.overall_score)

  return (
    <div className="h-full overflow-y-auto bg-[#eef4fb] px-6 pb-10 pt-20">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* 顶部操作条 */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:text-blue-600"
          >
            <ArrowLeft className="size-4" />
            返回上传
          </button>
          <button
            onClick={onReanalyze}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            <Upload className="size-3.5" />
            重新上传分析
          </button>
        </div>

        {/* ① 形象总览 */}
        <section className="grid grid-cols-[240px_minmax(0,1fr)] gap-5 rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] max-md:grid-cols-1">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
            <div className="relative aspect-[4/5]">
              <img src={photo || "/image-analysis/appearance-cartoon.png"} alt="形象照片" className="h-full w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                {positionLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-black text-blue-600">形象分析结果</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-[64px] font-black leading-none tracking-tight text-slate-950">{result.overall_score}</span>
              <span className={`mb-2 text-xl font-black ${grade.tone}`}>{grade.label}</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{result.job_match.match_reason}</p>

            <div className="mt-auto grid grid-cols-3 gap-3 pt-5">
              {[
                { label: "综合评分", value: result.overall_score, suffix: "" },
                { label: "穿搭评分", value: result.outfit_analysis.outfit_score, suffix: "" },
                { label: "岗位匹配", value: result.job_match.overall_match, suffix: "%" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center">
                  <p className="text-3xl font-black text-blue-700">{item.value}{item.suffix}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ② 形象分析主体 */}
        <Panel icon={<Shirt className="size-4" />} title="着装分析" subtitle="面试默认走正式、清爽、可信赖路线">
          <OutfitTab data={result.outfit_analysis} />
        </Panel>

        <Panel icon={<User className="size-4" />} title="面部与发型" subtitle="把第一眼的整洁度做上来">
          <FaceHairTab data={result.face_hair} />
        </Panel>

        <Panel icon={<Target className="size-4" />} title="岗位适配与风格" subtitle={`与「${positionLabel}」面试场景的匹配度`}>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">岗位匹配度</span>
                <span className="text-lg font-bold text-blue-600">{result.job_match.overall_match}%</span>
              </div>
              <div className="mb-3 h-1.5 rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${result.job_match.overall_match}%` }} />
              </div>
              <p className="text-sm text-gray-600">{result.job_match.match_reason}</p>
              {result.job_match.key_adjustments.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-500">需要调整：</p>
                  {result.job_match.key_adjustments.map((adj, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                      <AlertCircle className="mt-0.5 size-3 shrink-0" /><span>{adj}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Sparkles className="size-4" />形象风格
              </p>
              <div className="flex flex-wrap gap-2">
                {result.style_tags.map((tag, i) => (
                  <div key={i} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="text-sm font-semibold text-blue-800">{tag.tag}</p>
                    <p className="mt-0.5 text-xs text-blue-600">{tag.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* ③ 下一步行动 */}
        <div>
          <h2 className="mb-1 text-xl font-black tracking-[-0.03em] text-slate-950">下一步</h2>
          <p className="mb-4 text-sm font-semibold text-slate-500">基于上面的分析，挑一个动作继续：临场冲刺，或生成一张面试形象照。</p>
          <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
            <CrashPlanCard analysis={result} position={position} />
            <HeadshotCard photo={photo} analysis={result} position={position} />
          </div>
        </div>

        {/* 参考形象 */}
        <Panel icon={<BookOpen className="size-4" />} title="标准职业形象参考" subtitle="想找更多穿搭示例可以直接搜索">
          <ReferenceTab position={position} />
        </Panel>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-xs font-semibold text-slate-400">
          <Shield className="size-3.5" />
          照片仅用于本次分析与形象照生成，结果保存在当前浏览器
        </p>
        {bmi && (
          <p className="text-center text-[11px] font-medium text-slate-300">
            当前 BMI {bmi.bmi}（{bmi.categoryLabel}）· 健康与体态建议已编入急训计划
          </p>
        )}
      </div>
    </div>
  )
}

function Panel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</span>
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
