"use client";

import { AlertCircle, BookOpen, BriefcaseBusiness, CheckCircle2, Clock3, Sparkles, Target, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INTERVIEW_TYPES, POSITIONS } from "@/features/career/lib/prompts";
import type { QuestionMode } from "@/features/career/types";

interface LandingPageProps {
  mode: QuestionMode;
  onModeChange: (v: QuestionMode) => void;
  positionValue: string;
  onPositionChange: (v: string) => void;
  aiPosition: string;
  onAiPositionChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  onStart: () => void;
  isLoading: boolean;
  errorMsg: string;
  onOpenSettings: () => void;
}

export default function LandingPage({
  mode,
  onModeChange,
  positionValue,
  onPositionChange,
  aiPosition,
  onAiPositionChange,
  type,
  onTypeChange,
  onStart,
  isLoading,
  errorMsg,
  onOpenSettings,
}: LandingPageProps) {
  const positionLabel = POSITIONS.find((p) => p.value === positionValue)?.label ?? "通用类";
  const typeLabel = INTERVIEW_TYPES.find((t) => t.value === type)?.label ?? "综合面";
  const targetPositionLabel = mode === "ai" ? aiPosition.trim() || "自定义岗位" : positionLabel;

  return (
    <div className="h-full overflow-hidden bg-[#eef4fb] px-6 pb-6 pt-20">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_390px] gap-5 max-lg:grid-cols-1">
        <section className="flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-blue-600">模拟面试控制台</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal text-slate-950">
              生成一组可复盘的岗位面试题
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
              只配置题源、岗位和面试类型。开始后进入问答界面，结束后自动汇总评分和参考答案。
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <label className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Wand2 className="size-5 text-blue-600" />
                出题方式
              </label>
              <Tabs value={mode} onValueChange={(v) => onModeChange(v as QuestionMode)}>
                <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-slate-200/70 p-1">
                  <TabsTrigger value="quiz" className="rounded-lg data-[state=active]:bg-white">
                    题库抽题
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-white">
                    AI 出题
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                题库抽题使用内置岗位分类；AI 出题可输入任意目标岗位做专项训练。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <label className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <BriefcaseBusiness className="size-5 text-blue-600" />
                目标岗位
              </label>
              {mode === "quiz" ? (
                <Select value={positionValue} onValueChange={onPositionChange}>
                  <SelectTrigger className="h-12 rounded-xl bg-white text-base">
                    <SelectValue placeholder="请选择题库岗位" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={aiPosition}
                  onChange={(event) => onAiPositionChange(event.target.value)}
                  className="h-12 rounded-xl bg-white text-base"
                  placeholder="例如：AI 产品经理、数据分析师、Java 后端开发"
                />
              )}
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {mode === "quiz"
                  ? `先做自我介绍，再从「${positionLabel}」题库中抽取 5 道题。`
                  : `先做自我介绍，再由 AI 围绕「${targetPositionLabel}」生成 5 道定制题。`}
              </p>
            </div>
          </div>

          {mode === "ai" && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <label className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Target className="size-5 text-blue-600" />
                面试类型
              </label>
              <Select value={type} onValueChange={onTypeChange}>
                <SelectTrigger className="h-12 rounded-xl bg-white text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {errorMsg && (
            <div className="mt-5 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{errorMsg}</p>
              </div>
              {errorMsg.includes("API") && (
                <button
                  onClick={onOpenSettings}
                  className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
                >
                  去全局设置
                </button>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-5 rounded-3xl bg-[#071326] p-6 text-white max-sm:flex-col max-sm:items-stretch">
            <div>
              <p className="text-lg font-semibold">开始本轮训练</p>
              <p className="mt-2 text-sm text-white/58">完成自我介绍和 5 道面试题后进入复盘报告。</p>
            </div>
            <button
              onClick={onStart}
              disabled={isLoading}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-slate-950 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === "quiz" ? <BookOpen className="size-5" /> : <Sparkles className="size-5" />}
              {isLoading ? "准备题目中..." : "开始训练"}
            </button>
          </div>
        </section>

        <aside className="grid min-h-0 grid-rows-[180px_minmax(0,1fr)] gap-5">
          <section className="rounded-3xl border border-slate-200 bg-[#071326] p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Session</p>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-white/50">本轮结构</p>
                <p className="mt-1 text-3xl font-semibold">1+5</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-white/50">训练流程</p>
                <p className="mt-1 text-3xl font-semibold">3步</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">本轮训练流程</h2>
            <div className="mt-6 space-y-6">
              {[
                ["获取题目", "固定自我介绍，再抽取或生成 5 道面试题。", Wand2],
                ["限时作答", "自我介绍单独评估，普通题用 STAR 结构组织回答。", Clock3],
                ["查看复盘", "评分、改进建议、图表和参考答案汇总。", CheckCircle2],
              ].map(([title, desc, Icon], index) => (
                <div key={title as string} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-slate-400" />
                      <p className="text-base font-semibold text-slate-900">{title as string}</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{desc as string}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">重点</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                这一步只解决训练配置，不混入简历和形象任务，减少开始前的选择负担。
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
