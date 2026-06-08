"use client"

import { Palette, User, Target, Lightbulb, CheckCircle2, AlertCircle, Search, ExternalLink, BookOpen, Apple, Dumbbell } from "lucide-react"
import { POSITIONS } from "@/features/career/lib/prompts"
import type { ImageAnalysisV2Result, HealthGuideV2, FitnessGuideV2 } from "@/features/career/types"

// ====== 通用信息卡片 ======
function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <p className="text-[11px] font-semibold text-gray-400 mb-1">{label}</p>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  )
}

// ====== Tab 1: 着装分析 ======
export function OutfitTab({ data }: { data: ImageAnalysisV2Result["outfit_analysis"] }) {
  const colorMatchMap: Record<string, string> = {
    "优": "bg-green-100 text-green-700", "良": "bg-blue-100 text-blue-700",
    "中": "bg-amber-100 text-amber-700", "差": "bg-red-100 text-red-700",
  }
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-sm text-blue-700 leading-relaxed font-medium">{data.outfit_advice}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="着装类型" value={data.clothing_type} />
        <InfoCard label="颜色搭配" value={
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colorMatchMap[data.color_match] || "bg-gray-100 text-gray-600"}`}>
            {data.color_match}
          </span>
        } />
        <InfoCard label="正式程度" value={`${"★".repeat(data.formal_level)}${"☆".repeat(5 - data.formal_level)}`} />
        <InfoCard label="配饰建议" value={data.accessory_advice} />
      </div>
      {data.color_palette.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Palette className="size-4" />推荐色板
          </p>
          <div className="flex gap-2">
            {data.color_palette.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="size-9 rounded-lg border border-gray-200" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-gray-400">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ====== Tab 2: 面部/发型 ======
export function FaceHairTab({ data }: { data: ImageAnalysisV2Result["face_hair"] }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="脸型" value={data.face_shape} />
        <InfoCard label="皮肤状态" value={data.skin_status} />
        <InfoCard label="发型评价" value={data.hair_style} />
      </div>
      <div className="rounded-xl bg-blue-50 p-4 space-y-1">
        <p className="text-sm font-semibold text-blue-800">💇 发型建议</p>
        <p className="text-sm text-blue-700">{data.hair_advice}</p>
      </div>
      <div className="rounded-xl bg-blue-50 p-4 space-y-1">
        <p className="text-sm font-semibold text-blue-800">✨ 妆容/仪容建议</p>
        <p className="text-sm text-blue-700">{data.makeup_advice}</p>
      </div>
    </div>
  )
}

// ====== Tab 3: 综合建议 ======
export function ComprehensiveTab({ data }: { data: ImageAnalysisV2Result }) {
  return (
    <div className="space-y-5 text-sm">
      {/* 风格标签 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <User className="size-4" />形象风格
        </p>
        <div className="flex flex-wrap gap-2">
          {data.style_tags.map((tag, i) => (
            <div key={i} className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-sm font-semibold text-blue-800">{tag.tag}</p>
              <p className="text-xs text-blue-600 mt-0.5">{tag.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 岗位匹配 */}
      <div className="rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Target className="size-4" />岗位匹配度
          </p>
          <span className="text-lg font-bold text-blue-600">{data.job_match.overall_match}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 mb-3">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${data.job_match.overall_match}%` }} />
        </div>
        <p className="text-sm text-gray-600">{data.job_match.match_reason}</p>
        {data.job_match.key_adjustments.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">需要调整：</p>
            {data.job_match.key_adjustments.map((adj, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 mb-1 last:mb-0">
                <AlertCircle className="size-3 shrink-0 mt-0.5" /><span>{adj}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 改进路线 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <Lightbulb className="size-4" />改进路线
        </p>
        {data.summary_advice.quick_wins.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-green-600 mb-1.5">⚡ 立即执行</p>
            {data.summary_advice.quick_wins.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-green-50 rounded-lg px-3 py-2 mb-1 last:mb-0">
                <CheckCircle2 className="size-3 text-green-500 shrink-0 mt-0.5" /><span>{item}</span>
              </div>
            ))}
          </div>
        )}
        {data.summary_advice.medium_term.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-amber-600 mb-1.5">📅 中期准备（1-2周）</p>
            {data.summary_advice.medium_term.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-amber-50 rounded-lg px-3 py-2 mb-1 last:mb-0">
                <CheckCircle2 className="size-3 text-amber-500 shrink-0 mt-0.5" /><span>{item}</span>
              </div>
            ))}
          </div>
        )}
        {data.summary_advice.long_term.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-1.5">🎯 长期培养</p>
            {data.summary_advice.long_term.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-1 last:mb-0">
                <CheckCircle2 className="size-3 text-blue-500 shrink-0 mt-0.5" /><span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ====== Tab 4: 健康指南 ======
export function HealthGuideTab({ data }: { data: HealthGuideV2 }) {
  return (
    <div className="space-y-4 text-sm">
      {/* BMI 评估 */}
      <div className="rounded-xl bg-emerald-50 p-4">
        <p className="text-sm text-emerald-700 leading-relaxed font-medium">{data.bmi_assessment}</p>
      </div>

      {/* 每日热量 */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="每日推荐热量" value={<span className="text-base font-bold text-emerald-600">{data.daily_calories} 千卡</span>} />
        <InfoCard label="作息建议" value={data.sleep_routine} />
      </div>

      {/* 饮食建议 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <Apple className="size-4 text-emerald-500" />饮食策略
        </p>
        <p className="text-sm text-gray-500 mb-2 bg-emerald-50/60 rounded-lg px-3 py-2">{data.diet_advice.summary}</p>
        <div className="space-y-2">
          {data.diet_advice.recommendations.map((rec, i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-xs font-bold text-gray-500 mb-1">{rec.meal}</p>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {rec.items.map((item, j) => (
                  <span key={j} className="text-xs bg-white rounded-full px-2.5 py-1 border border-gray-100 text-gray-600">{item}</span>
                ))}
              </div>
              {rec.note && <p className="text-[11px] text-gray-400 italic">{rec.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* 面试当天饮食 */}
      {data.diet_advice.interview_day && (
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">📌 面试当天饮食</p>
          <p className="text-sm text-amber-600">{data.diet_advice.interview_day}</p>
        </div>
      )}

      {/* 皮肤护理 */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-700 mb-1">✨ 皮肤护理</p>
        <p className="text-sm text-blue-600">{data.skin_care}</p>
      </div>
    </div>
  )
}

// ====== Tab 5: 运动指南 ======
export function FitnessGuideTab({ data }: { data: FitnessGuideV2 }) {
  return (
    <div className="space-y-4 text-sm">
      {/* 运动策略总结 */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-sm text-blue-700 leading-relaxed font-medium flex items-center gap-1.5">
          <Dumbbell className="size-4 shrink-0" />{data.summary}
        </p>
      </div>

      {/* 周计划 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-blue-500" />一周运动计划
        </p>
        <div className="space-y-1.5">
          {data.weekly_plan.map((day, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <span className="text-xs font-bold text-blue-600 min-w-[3em] shrink-0">{day.day}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">{day.workout}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0">{day.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 体态训练 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">🧘 体态训练动作</p>
        <div className="space-y-1.5">
          {data.posture_training.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="size-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
              <span className="leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 快速技巧 */}
      {data.quick_tips.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1.5">⚡ 快速改善技巧</p>
          <div className="space-y-1">
            {data.quick_tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-amber-50/60 rounded-lg px-3 py-2">
                <CheckCircle2 className="size-3 text-amber-500 shrink-0 mt-0.5" /><span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 面试当天晨间准备 */}
      {data.interview_morning && (
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">🌅 面试当天晨间准备</p>
          <p className="text-sm text-blue-600">{data.interview_morning}</p>
        </div>
      )}
    </div>
  )
}

// ====== Tab 6: 参考形象 ======
export function ReferenceTab({ position }: { position: string }) {
  const posLabel = POSITIONS.find((p) => p.value === position)?.label || "面试"
  const sq = encodeURIComponent(`${posLabel} 标准职业装 面试着装 参考`)
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
          <BookOpen className="size-4" />标准职业形象参考
        </p>
        <p className="text-xs text-blue-600 mt-1">以下是根据目标岗位推荐的标准职业形象参考，点击链接查看更多穿搭示例。</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        <p className="text-sm text-gray-600 text-center mb-3">搜索 <strong className="text-blue-600">{posLabel}</strong> 相关标准职业形象</p>
        <div className="flex gap-2.5 justify-center">
          {[{ label: "百度图片", url: `https://image.baidu.com/search?word=${sq}` },
            { label: "必应图片", url: `https://cn.bing.com/images/search?q=${sq}` },
          ].map((item) => (
            <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all"
            >
              <Search className="size-3.5" />{item.label}搜索<ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      </div>
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">💡 搜索关键词</p>
        <div className="flex flex-wrap gap-1.5">
          {["商务正装", `${posLabel} 面试着装`, "职业套装搭配", "面试形象照"].map((kw) => (
            <a key={kw} href={`https://cn.bing.com/images/search?q=${encodeURIComponent(kw)}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-500 bg-white rounded-full px-3 py-1 border border-gray-100 hover:border-blue-200 transition-all"
            >{kw}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
