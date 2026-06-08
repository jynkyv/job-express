import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

// ---- 共享形象分析结果 ----
export interface SharedImageResult {
  outfit: {
    summary: string
    recommendations: { item: string; advice: string; color: string }[]
  }
  diet: { dailyCalories: number; summary: string; foods: { category: string; items: string[] }[]; tips: string[] }
  fitness: { summary: string; weeklyPlan: { day: string; workout: string; duration: string }[]; tips: string[] }
  bmi: { height: number; weight: number; bmi: number; category: string; categoryLabel: string }
}

// ---- 页面类型 ----
export type PageKey = "home" | "interview" | "image" | "resume"

// ---- Context 值 ----
interface AppContextValue {
  // 页面导航
  currentPage: PageKey
  navigateTo: (page: PageKey) => void

  // 共享数据
  imageResult: SharedImageResult | null
  setImageResult: (result: SharedImageResult | null) => void

  // 全局状态
  apiConfigured: boolean
  refreshApiStatus: () => void

  openSettings: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function hashToPage(hash: string): PageKey {
  const page = hash.replace("#", "")
  return ["interview", "image", "resume"].includes(page) ? (page as PageKey) : "home"
}

function pageToPath(page: PageKey) {
  const map: Record<PageKey, string> = {
    home: "/",
    interview: "/app/dashboard/interview",
    image: "/app/dashboard/image",
    resume: "/app/dashboard/resumes",
  }
  return map[page]
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageKey>(
    typeof window !== "undefined" ? hashToPage(window.location.hash) : "home"
  )
  const [imageResult, setImageResult] = useState<SharedImageResult | null>(null)
  const [apiConfigured, setApiConfigured] = useState(true)

  useEffect(() => {
    const onHashChange = () => setCurrentPage(hashToPage(window.location.hash))
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const navigateTo = useCallback((page: PageKey) => {
    setCurrentPage(page)
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", pageToPath(page))
      window.dispatchEvent(new PopStateEvent("popstate"))
    }
  }, [])
  const refreshApiStatus = useCallback(() => setApiConfigured(true), [])
  const openSettings = useCallback(() => {
    window.location.assign("/settings#ai")
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentPage,
        navigateTo,
        imageResult,
        setImageResult,
        apiConfigured,
        refreshApiStatus,
        openSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppContext must be used within AppProvider")
  return ctx
}
