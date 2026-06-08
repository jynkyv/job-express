"use client"

import { ArrowLeft, FileText, Mic } from "lucide-react"

export type SidebarPanel = "stage" | "summary"

interface InterviewSidebarProps {
  activePanel: SidebarPanel
  onPanelChange: (panel: SidebarPanel) => void
  onClose: () => void
  /** 是否有面试结果可展示 */
  hasResult: boolean
}

const navItems: { key: SidebarPanel; icon: typeof Mic; label: string; shortLabel: string; color: string }[] = [
  { key: "stage", icon: Mic, label: "面试舱", shortLabel: "面试", color: "from-blue-500 to-indigo-500" },
  { key: "summary", icon: FileText, label: "面试复盘", shortLabel: "复盘", color: "from-emerald-500 to-teal-500" },
]

export default function InterviewSidebar({
  activePanel,
  onPanelChange,
  onClose,
  hasResult,
}: InterviewSidebarProps) {
  return (
    <aside className="relative z-20 flex h-full w-[72px] shrink-0 flex-col items-center border-r border-white/55 bg-white/35 px-3 py-5 shadow-[10px_0_28px_rgba(37,99,235,0.04)] backdrop-blur-xl">
      <button
        onClick={onClose}
        className="group relative flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-500 shadow-sm shadow-slate-200/70 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:text-blue-700 hover:shadow-lg"
        title="返回训练设置"
      >
        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span className="pointer-events-none absolute left-[54px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-slate-100 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-600 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          返回设置
        </span>
      </button>

      <nav className="mt-8 flex flex-col gap-2 rounded-full border border-white/65 bg-white/70 p-1.5 shadow-lg shadow-blue-100/60 backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = activePanel === item.key
          const isDisabled = item.key === "summary" && !hasResult

          return (
            <button
              key={item.key}
              onClick={() => {
                if (!isDisabled) onPanelChange(item.key)
              }}
              disabled={isDisabled}
              title={isDisabled ? "完成面试后查看复盘" : item.label}
              className={`group relative flex size-11 items-center justify-center rounded-full transition-all duration-200 ${
                isDisabled
                  ? "cursor-not-allowed text-slate-300 opacity-55"
                  : isActive
                    ? `bg-gradient-to-br ${item.color} text-white shadow-lg shadow-blue-300/50`
                    : "text-slate-400 hover:bg-white/90 hover:text-blue-700 hover:shadow-sm"
              }`}
            >
              {isActive && !isDisabled && (
                <div className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-br ${item.color} opacity-30 blur-lg`} />
              )}
              <item.icon className="size-[18px]" />
              <span className="pointer-events-none absolute left-[54px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-slate-100 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-600 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
                {isDisabled ? "完成后查看复盘" : item.shortLabel}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
