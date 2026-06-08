"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"
import type { AnswerAnalysis, StandardAnswer } from "@/features/career/types"

interface FeedbackPanelProps {
  analysis: AnswerAnalysis | null
  standardAnswer: StandardAnswer | null
  showExpertAnswer: boolean
  onToggleExpert: () => void
}

function scoreToStars(score: number) {
  return Math.round(score / 20)
}

export default function FeedbackPanel({
  analysis,
  standardAnswer,
  showExpertAnswer,
  onToggleExpert,
}: FeedbackPanelProps) {
  const scoreColor =
    analysis && analysis.score >= 80
      ? "text-emerald-600"
      : analysis && analysis.score >= 60
        ? "text-amber-600"
        : "text-red-500"

  return (
    <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">STAR 法则点评</h3>
        <p className="text-xs text-gray-400 mt-0.5">AI 对您回答的结构化分析</p>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        {analysis ? (
          <div className="space-y-5">
            {/* 综合评分 */}
            <div className="text-center py-2">
              <div className={`text-5xl font-bold ${scoreColor}`}>
                {analysis.score}
              </div>
              <p className="text-xs text-gray-400 mt-1">综合评分</p>
              <Progress value={analysis.score} className="h-1.5 mt-2" />
            </div>

            {/* STAR 卡片 */}
            <div className="space-y-2.5">
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
            <div className="space-y-2">
              {[
                { label: "准确性", value: analysis.accuracy, icon: Target },
                { label: "逻辑性", value: analysis.logic, icon: Brain },
                { label: "专业性", value: analysis.professionalism, icon: MessageSquare },
                { label: "完整度", value: analysis.completeness, icon: Layers },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <item.icon className="size-3 text-gray-400" />
                  <span className="text-gray-500 w-14">{item.label}</span>
                  <Progress value={item.value} className="flex-1 h-1.5" />
                  <span className="text-gray-600 font-medium w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>

            {/* 亮点 */}
            <div>
              <h4 className="flex items-center gap-1 text-xs font-medium text-emerald-600 mb-2">
                <CheckCircle2 className="size-3.5" />
                回答亮点
              </h4>
              <ul className="space-y-1">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* 待改进 */}
            <div>
              <h4 className="flex items-center gap-1 text-xs font-medium text-red-500 mb-2">
                <AlertCircle className="size-3.5" />
                待改进
              </h4>
              <ul className="space-y-1">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* 改进建议 */}
            {analysis.suggestion && (
              <div className="rounded-lg bg-blue-50 p-3">
                <h4 className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-1.5">
                  <Lightbulb className="size-3.5" />
                  改进建议
                </h4>
                <p className="text-xs text-blue-600/80 leading-relaxed">
                  {analysis.suggestion}
                </p>
              </div>
            )}

            {/* 专业答案开关 */}
            <div>
              <button
                onClick={onToggleExpert}
                className="w-full flex items-center justify-between rounded-lg bg-gray-50 hover:bg-gray-100 px-4 py-3 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">专业答案</span>
                </div>
                <ChevronRight
                  className={`size-4 text-gray-400 transition-transform ${
                    showExpertAnswer ? "rotate-90" : ""
                  }`}
                />
              </button>

              {showExpertAnswer && standardAnswer && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {standardAnswer.content}
                  </p>
                  {standardAnswer.keyPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">核心要点</p>
                      <div className="flex flex-wrap gap-1">
                        {standardAnswer.keyPoints.map((kp, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                            {kp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {standardAnswer.technique && (
                    <p className="text-xs text-gray-400 italic">
                      💡 {standardAnswer.technique}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 空状态 */
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
      </ScrollArea>
    </div>
  )
}
