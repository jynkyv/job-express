"use client"

import { useMemo, useState } from "react"
import { OutfitTab, FaceHairTab, ReferenceTab } from "./ImageAnalysisTabs"
import CrashPlanCard from "./CrashPlanCard"
import HeadshotCard from "./HeadshotCard"
import type { BmiData, ImageAnalysisV2Result } from "@/features/career/types"
import {
  ArrowLeft,
  Upload,
  Shirt,
  User,
  Target,
  Sparkles,
  AlertCircle,
  BookOpen,
  Shield,
  ClipboardCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Gauge,
  Lightbulb,
} from "lucide-react"

interface Props {
  result: ImageAnalysisV2Result
  photo?: string
  bmi: BmiData | null
  gender: string
  position: string
  positionLabel: string
  onBack: () => void
  onReanalyze: () => void
}

type SectionId = "overview" | "outfit" | "faceHair" | "jobMatch" | "crashPlan" | "headshot" | "reference"

const SECTIONS: Array<{
  id: SectionId
  title: string
  shortTitle: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "overview", title: "报告总览", shortTitle: "总览", subtitle: "先看结论和优先级", icon: ClipboardCheck },
  { id: "outfit", title: "着装分析", shortTitle: "着装", subtitle: "穿搭正式度与颜色建议", icon: Shirt },
  { id: "faceHair", title: "面部与发型", shortTitle: "仪容", subtitle: "清爽度、发型和面试前检查", icon: User },
  { id: "jobMatch", title: "岗位适配度", shortTitle: "适配", subtitle: "当前形象与岗位气质对照", icon: Target },
  { id: "crashPlan", title: "面试急训冲刺", shortTitle: "急训", subtitle: "按剩余天数生成行动清单", icon: Sparkles },
  { id: "headshot", title: "面试形象照生成", shortTitle: "形象照", subtitle: "原图到职业形象照", icon: Camera },
  { id: "reference", title: "职业形象参考", shortTitle: "参考", subtitle: "标准着装与搜索关键词", icon: BookOpen },
]

function gradeOf(score: number) {
  if (score >= 85) return { label: "优秀", tone: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" }
  if (score >= 75) return { label: "良好", tone: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" }
  if (score >= 60) return { label: "合格", tone: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" }
  return { label: "待提升", tone: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" }
}

const guide = (name: string) => `/image-guides/${name}.png`

function genderedImage(gender: string, male: string, female: string) {
  return gender === "female" ? guide(female) : guide(male)
}

function genderLabel(gender: string) {
  return gender === "female" ? "女士" : "男士"
}

function primaryJobImage(position: string, gender: string) {
  if (position === "jwu") {
    return genderedImage(gender, "job-railway-mechanical-male", "job-railway-mechanical-female")
  }
  return genderedImage(gender, "reference-male-business-formal", "reference-female-business-formal")
}

function secondaryJobImage(position: string, gender: string) {
  if (position === "jwu") {
    return genderedImage(gender, "job-railway-formal-male", "job-railway-formal-female")
  }
  return guide("outfit-business-casual")
}

export default function ImageResult({ result, photo, bmi, gender, position, positionLabel, onBack, onReanalyze }: Props) {
  const [activeId, setActiveId] = useState<SectionId>("overview")
  const grade = gradeOf(result.overall_score)
  const activeIndex = SECTIONS.findIndex((section) => section.id === activeId)
  const activeSection = SECTIONS[activeIndex] || SECTIONS[0]
  const ActiveIcon = activeSection.icon

  const priorities = useMemo(
    () => [
      ...result.summary_advice.quick_wins,
      ...result.job_match.key_adjustments,
    ].filter(Boolean).slice(0, 3),
    [result]
  )

  const goPrev = () => setActiveId(SECTIONS[Math.max(0, activeIndex - 1)].id)
  const goNext = () => setActiveId(SECTIONS[Math.min(SECTIONS.length - 1, activeIndex + 1)].id)

  return (
    <div className="h-full overflow-y-auto bg-[#f4f7fa] px-5 pb-8 pt-20 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
          <div className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-4 max-lg:grid-cols-[72px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div className="aspect-[4/5]">
                <img src={photo || "/image-analysis/appearance-cartoon.png"} alt="形象照片" className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  Career Image Report
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                  {positionLabel}
                </span>
                {bmi && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                    BMI {bmi.bmi} · {bmi.categoryLabel}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <span className="text-5xl font-black leading-none text-slate-950">{result.overall_score}</span>
                <span className={`mb-1 rounded-full border px-3 py-1 text-sm font-black ${grade.bg} ${grade.border} ${grade.tone}`}>
                  {grade.label}
                </span>
                <p className="max-w-3xl pb-1 text-sm font-semibold leading-6 text-slate-500">
                  {result.job_match.match_reason}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 max-lg:col-span-2 max-lg:justify-end">
              <button
                onClick={onBack}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <ArrowLeft className="size-4" />
                返回上传
              </button>
              <button
                onClick={onReanalyze}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Upload className="size-4" />
                重新分析
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
          <aside className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.04)] max-lg:overflow-x-auto">
            <nav className="grid gap-1 max-lg:flex max-lg:min-w-max">
              {SECTIONS.map((section, index) => {
                const Icon = section.icon
                const active = section.id === activeId
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveId(section.id)}
                    className={`group flex min-h-[64px] items-center gap-3 rounded-2xl px-3 text-left transition max-lg:min-w-[150px] ${
                      active ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      active ? "bg-white/12 text-white" : "bg-slate-100 text-slate-500 group-hover:text-blue-600"
                    }`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{section.shortTitle}</span>
                      <span className={`mt-0.5 block truncate text-[11px] font-semibold ${active ? "text-white/60" : "text-slate-400"}`}>
                        {String(index + 1).padStart(2, "0")} / {SECTIONS.length.toString().padStart(2, "0")}
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>

          <main className="min-w-0 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] max-sm:p-4">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ActiveIcon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-blue-600">Section {activeIndex + 1} / {SECTIONS.length}</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{activeSection.title}</h1>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{activeSection.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 max-sm:hidden">
                <button
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-30"
                  title="上一页"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={goNext}
                  disabled={activeIndex === SECTIONS.length - 1}
                  className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-30"
                  title="下一页"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <AdvisorNote>{sectionAdvice(activeId, result, positionLabel)}</AdvisorNote>

            <div className="mt-5 min-h-[440px]">
              {activeId === "overview" && <OverviewSection result={result} priorities={priorities} gender={gender} position={position} />}
              {activeId === "outfit" && <OutfitSection result={result} gender={gender} />}
              {activeId === "faceHair" && <FaceHairSection result={result} gender={gender} />}
              {activeId === "jobMatch" && <JobMatchSection result={result} position={position} positionLabel={positionLabel} gender={gender} />}
              {activeId === "crashPlan" && <CrashPlanSection result={result} position={position} />}
              {activeId === "headshot" && <HeadshotCard photo={photo} analysis={result} position={position} gender={gender} />}
              {activeId === "reference" && <ReferenceSection position={position} positionLabel={positionLabel} gender={gender} />}
            </div>

            <footer className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 max-sm:flex-col">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Shield className="size-3.5" />
                照片仅用于本次分析与形象照生成，结果保存在当前浏览器
              </p>
              <div className="flex gap-2 max-sm:w-full">
                <button
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-black text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-30 max-sm:flex-1"
                >
                  <ChevronLeft className="size-4" />
                  上一页
                </button>
                <button
                  onClick={goNext}
                  disabled={activeIndex === SECTIONS.length - 1}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-30 max-sm:flex-1"
                >
                  下一页
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}

function sectionAdvice(id: SectionId, result: ImageAnalysisV2Result, positionLabel: string) {
  const map: Record<SectionId, string> = {
    overview: `整体评分 ${result.overall_score}，先处理最容易加分的细节，再进入具体模块逐项调整。`,
    outfit: result.outfit_analysis.outfit_advice,
    faceHair: `${result.face_hair.hair_advice} ${result.face_hair.makeup_advice}`,
    jobMatch: `当前形象与「${positionLabel}」的匹配度为 ${result.job_match.overall_match}%，重点看岗位需要和当前表现之间的差距。`,
    crashPlan: "这里把分析结果转成行动清单，适合在面试前按时间倒排执行。",
    headshot: "上传真实照片后，可以生成更干净、正式的面试形象照，作为求职资料补充。",
    reference: "参考页用于建立审美标准，先看岗位方向，再用关键词搜索更多穿搭样例。",
  }
  return map[id]
}

function AdvisorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
      <p className="flex items-start gap-2 text-sm font-semibold leading-6 text-blue-800">
        <Lightbulb className="mt-1 size-4 shrink-0" />
        <span>{children}</span>
      </p>
    </div>
  )
}

function OverviewSection({
  result,
  priorities,
  gender,
  position,
}: {
  result: ImageAnalysisV2Result
  priorities: string[]
  gender: string
  position: string
}) {
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <ScoreCard label="综合评分" value={result.overall_score} icon={<Gauge className="size-5" />} />
        <ScoreCard label="穿搭评分" value={result.outfit_analysis.outfit_score} icon={<Shirt className="size-5" />} />
        <ScoreCard label="岗位匹配" value={`${result.job_match.overall_match}%`} icon={<Target className="size-5" />} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-xl:grid-cols-1">
        <section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
          <h2 className="text-lg font-black text-slate-950">优先改进顺序</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">先做见效最快的事情，让面试第一印象更稳定。</p>
          <div className="mt-4 grid gap-3">
            {(priorities.length ? priorities : ["保持服装平整", "整理发型边缘", "优化背景和光线"]).map((item, index) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm font-bold leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <GuideImage
            src={primaryJobImage(position, gender)}
            title={`${genderLabel(gender)}职业形象基准`}
            desc={position === "jwu" ? "机务岗位优先强调可靠、整洁和现场专业感。" : "先用干净、平整、低饱和的职业装建立安全线。"}
          />
          <div className="grid gap-3">
            {result.style_tags.slice(0, 2).map((tag) => (
              <div key={tag.tag} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-sm font-black text-blue-800">{tag.tag}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-blue-700/75">{tag.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function OutfitSection({ result, gender }: { result: ImageAnalysisV2Result; gender: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-xl:grid-cols-1">
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-5 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          <GuideImage
            src={genderedImage(gender, "reference-male-business-formal", "reference-female-business-formal")}
            title={`${genderLabel(gender)}标准职业装`}
            desc="西装、白衬衫、鞋履与配饰保持统一。"
            compact
          />
          <GuideImage src={guide("outfit-navy-suit")} title="深蓝西装" desc="稳重、可信，适合多数正式面试。" compact />
          <GuideImage src={guide("outfit-business-casual")} title="商务休闲" desc="技术、产品、运营岗位可参考。" compact />
        </div>
        <OutfitTab data={result.outfit_analysis} />
      </section>
      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
        <h2 className="text-lg font-black text-slate-950">推荐穿法</h2>
        <div className="mt-4 grid gap-3">
          {[
            ["保守正式版", "深色外套、浅色衬衫、低饱和领带或无领带，优先稳定可信。"],
            ["亲和沟通版", "浅蓝或白色衬衫搭配深灰外套，降低距离感，保持清爽。"],
            ["技术产品版", "干净衬衫或针织内搭配深色外套，正式但不过度商务。"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">{title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3">
          <GuideImage src={guide("outfit-shirt-collar")} title="领口与袖口" desc="衬衫平整度会直接影响清爽感。" compact />
          <GuideImage src={guide("accessory-ties")} title="领带选择" desc="深蓝、深灰、低饱和酒红更稳。" compact />
        </div>
      </section>
    </div>
  )
}

function FaceHairSection({ result, gender }: { result: ImageAnalysisV2Result; gender: string }) {
  const checklist = ["整理鬓角和碎发", "面部控油并保持自然表情", "检查领口、肩线和上装平整度", "拍照或入场前调整肩颈姿态"]
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-xl:grid-cols-1">
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <GuideImage
            src={genderedImage(gender, "grooming-male-reference", "grooming-female-reference")}
            title={`${genderLabel(gender)}发型参考`}
            desc={gender === "female" ? "低马尾或低盘发，保持线条整洁。" : "后颈、鬓角干净，整体短而利落。"}
            compact
          />
          <GuideImage
            src={genderedImage(gender, "reference-male-business-formal", "reference-female-business-formal")}
            title={`${genderLabel(gender)}整体仪容`}
            desc="发型、领口、肩线要和职业装一起看。"
            compact
          />
        </div>
        <FaceHairTab data={result.face_hair} />
      </section>
      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
        <h2 className="text-lg font-black text-slate-950">面试前 30 分钟</h2>
        <div className="mt-4 grid gap-3">
          {checklist.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-600" />
              <p className="text-sm font-bold leading-5 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3">
          <GuideImage src={guide("grooming-hair-tools")} title="发型整理工具" desc="梳子、定型和除尘工具提前备好。" compact />
          <GuideImage src={guide("grooming-shaving-kit")} title="胡茬清理" desc="面试默认保持清爽洁净，不建议留明显胡须。" compact />
        </div>
      </section>
    </div>
  )
}

function JobMatchSection({
  result,
  position,
  positionLabel,
  gender,
}: {
  result: ImageAnalysisV2Result
  position: string
  positionLabel: string
  gender: string
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">岗位匹配度</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">与「{positionLabel}」面试场景的专业、可信和清爽要求对照。</p>
          </div>
          <span className="text-4xl font-black text-blue-600">{result.job_match.overall_match}%</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${result.job_match.overall_match}%` }} />
        </div>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{result.job_match.match_reason}</p>
      </section>

      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <h2 className="text-lg font-black text-slate-950">岗位需要</h2>
          <div className="mt-4 grid gap-3">
            {["稳定可信", "干净清爽", "正式但自然"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <CircleDot className="size-4 text-blue-600" />
                <span className="text-sm font-black text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5">
          <h2 className="text-lg font-black text-slate-950">需要调整</h2>
          <div className="mt-4 grid gap-3">
            {result.job_match.key_adjustments.map((adj) => (
              <div key={adj} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-white p-4">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span className="text-sm font-bold leading-5 text-slate-700">{adj}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
        <GuideImage
          src={primaryJobImage(position, gender)}
          title={position === "jwu" ? "机务岗位现场感" : "正式稳重型"}
          desc={position === "jwu" ? "整洁、可靠、偏现场专业，是机务岗位的核心气质。" : "适合管理、金融、法务、行政等高正式度场景。"}
          compact
        />
        <GuideImage
          src={secondaryJobImage(position, gender)}
          title={position === "jwu" ? "铁路面试正式版" : "清爽专业型"}
          desc={position === "jwu" ? "正式面试场景可加入铁路系统的规范感。" : "适合技术、产品、运营等强调能力表达的岗位。"}
          compact
        />
        <GuideImage src={guide("outfit-formal-flatlay")} title="通用安全线" desc="不知道怎么选时，深色外套 + 白衬衫最稳。" compact />
      </section>
    </div>
  )
}

function CrashPlanSection({ result, position }: { result: ImageAnalysisV2Result; position: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-xl:grid-cols-1">
      <CrashPlanCard analysis={result} position={position} />
      <aside className="grid gap-4">
        <GuideImage src={guide("interview-day-items")} title="面试当天物品" desc="资料、笔、水、手表和衣物检查放在同一张清单里。" />
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <h2 className="text-lg font-black text-slate-950">饮食参考</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">面试前保持轻盈、稳定、不过量。</p>
          <div className="mt-4 grid gap-3">
            <GuideImage src={guide("meal-breakfast")} title="当天早餐" desc="鸡蛋、全麦、酸奶和水，稳定能量。" compact />
            <GuideImage src={guide("meal-chicken-broccoli")} title="清淡正餐" desc="蛋白质 + 蔬菜 + 复合碳水。" compact />
            <GuideImage src={guide("meal-avoid-foods")} title="尽量避免" desc="油炸、辛辣、酒精和过量咖啡。" compact />
          </div>
        </div>
      </aside>
    </div>
  )
}

function ReferenceSection({ position, positionLabel, gender }: { position: string; positionLabel: string; gender: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-xl:grid-cols-1">
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <GuideImage
            src={primaryJobImage(position, gender)}
            title={position === "jwu" ? `${genderLabel(gender)}机务岗位形象` : `${genderLabel(gender)}职业形象`}
            desc={position === "jwu" ? "按机务岗位展示更贴近现场的职业形象。" : "西装、白衬衫、皮鞋与配饰统一成套。"}
            compact
          />
          <GuideImage
            src={genderedImage(gender, "grooming-male-reference", "grooming-female-reference")}
            title={`${genderLabel(gender)}发型参考`}
            desc={gender === "female" ? "低马尾或低盘发更适合正式面试。" : "短发清爽，鬓角和后颈保持干净。"}
            compact
          />
        </div>
        <ReferenceTab position={position} />
      </section>
      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
        <h2 className="text-lg font-black text-slate-950">参考方向</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">围绕「{positionLabel}」建立统一的职业形象标准。</p>
        <div className="mt-4 grid gap-3">
          {[
            ["推荐上装", "深色外套、白色或浅蓝衬衫"],
            ["推荐颜色", "深蓝、深灰、白色、低饱和蓝灰"],
            ["避免事项", "过亮颜色、明显 logo、过度休闲和复杂饰品"],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3">
          <GuideImage src={secondaryJobImage(position, gender)} title={position === "jwu" ? "铁路面试参考" : "商务休闲参考"} desc={position === "jwu" ? "保留铁路系统岗位的规范和可靠感。" : "更亲和，但仍保持专业边界。"} compact />
          <GuideImage src={guide("outfit-formal-flatlay")} title="通用组合参考" desc="深色外套、白衬衫、领带、腰带、皮鞋。" compact />
        </div>
      </section>
    </div>
  )
}

function ScoreCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-600">{label}</p>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">{icon}</span>
      </div>
      <p className="mt-5 text-4xl font-black text-blue-700">{value}</p>
    </div>
  )
}

function guideImageFrameClass(src: string, compact?: boolean) {
  const isPortrait = /reference-|grooming-(male|female)-reference|job-railway/.test(src)
  const isSquare = /outfit-|accessory-|grooming-(hair-tools|shaving-kit|checklist)|meal-/.test(src)

  if (isPortrait) {
    return compact ? "aspect-[4/5]" : "aspect-[3/4]"
  }

  if (isSquare) {
    return "aspect-square"
  }

  return compact ? "aspect-[4/3]" : "aspect-[16/10]"
}

function GuideImage({
  src,
  title,
  desc,
  compact,
}: {
  src: string
  title: string
  desc: string
  compact?: boolean
}) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={`grid place-items-center bg-slate-50 ${guideImageFrameClass(src, compact)}`}>
        <img src={src} alt={title} className="h-full w-full object-contain p-2" />
      </div>
      <figcaption className={compact ? "p-3" : "p-4"}>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{desc}</p>
      </figcaption>
    </figure>
  )
}
