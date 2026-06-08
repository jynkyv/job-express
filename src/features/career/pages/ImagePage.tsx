import { useAppContext } from "@/features/career/context/AppContext"
import ImageAnalysis from "@/features/career/components/ImageAnalysis"
import { ArrowLeft, Settings } from "lucide-react"

export default function ImagePage() {
  const { navigateTo, openSettings, setImageResult } = useAppContext()

  return (
    <div className="relative flex h-screen flex-col bg-[#eef4fb]">
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-transparent px-6 text-slate-800">
        <button
          onClick={() => navigateTo("home")}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          返回首页
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">形象分析</p>
          <p className="text-xs text-slate-500">Presence Check</p>
        </div>
        <button
          onClick={openSettings}
          className="pointer-events-auto size-10 rounded-full flex items-center justify-center bg-white/70 text-slate-500 shadow-sm backdrop-blur hover:text-blue-600 hover:bg-white transition"
          title="设置"
        >
          <Settings className="size-4.5" />
        </button>
      </header>

      <ImageAnalysis onResultChange={setImageResult} />
    </div>
  )
}
