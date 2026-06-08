import { FileText } from "lucide-react"

/**
 * 简历制作 Tab 占位组件
 * 阶段 1：仅验证 Tab 切换和 Store 初始化
 * 阶段 2+：替换为完整的左右分栏编辑视图
 */
export default function ResumeBuilder() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="size-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-soft">
          <FileText className="size-10 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">简历制作</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          简历制作模块正在开发中…
          <br />
          Store 和 AI 基础设施已就绪。
        </p>
      </div>
    </div>
  )
}
