"use client"

import { Star } from "lucide-react"

interface StarCardProps {
  letter: "S" | "T" | "A" | "R"
  label: string
  feedback: string
  rating: number // 0-5
  color: string
}

const colorMap: Record<string, { bg: string; text: string; letterBg: string; letterText: string }> = {
  blue:   { bg: "hover:bg-blue-50/60",   text: "text-gray-700", letterBg: "bg-blue-100",   letterText: "text-blue-700" },
  emerald:{ bg: "hover:bg-emerald-50/60",text: "text-gray-700", letterBg: "bg-emerald-100",letterText: "text-emerald-700" },
  amber:  { bg: "hover:bg-amber-50/60",  text: "text-gray-700", letterBg: "bg-amber-100",  letterText: "text-amber-700" },
}

export default function StarCard({ letter, label, feedback, rating, color }: StarCardProps) {
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${c.bg}`}>
      {/* 字母圆圈 */}
      <div className={`flex-shrink-0 size-9 rounded-xl ${c.letterBg} ${c.letterText} flex items-center justify-center text-sm font-black`}>
        {letter}
      </div>

      {/* 中间文字 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 mb-1">{label}</p>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{feedback}</p>
      </div>

      {/* 星级评分 */}
      <div className="flex items-center gap-0.5 flex-shrink-0 pt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`size-3.5 ${
              i <= rating ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
