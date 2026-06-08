import { useState } from "react"
import { Mail, MessageCircle, Clock, Download, ExternalLink } from "lucide-react"
import FooterDocModal from "@/features/career/components/FooterDocModal"

interface FooterLink {
  label: string
  docId?: string   // 打开本站文档弹窗
  href?: string    // 外部链接（新标签页打开）
}

const friendLinks: FooterLink[] = [
  { label: "AI 面试技巧指南", docId: "ai-interview-guide" },
  { label: "职业规划交流论坛" },
  { label: "面经分享社区" },
  { label: "大厂真题题库" },
]

const legalLinks: FooterLink[] = [
  { label: "用户使用协议", docId: "terms-of-service" },
  { label: "隐私政策", docId: "privacy-policy" },
  { label: "免责声明", docId: "disclaimer" },
  { label: "Cookie 偏好设置", docId: "cookie-settings" },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [activeDoc, setActiveDoc] = useState<string | null>(null)

  return (
    <footer className="bg-[#111827] text-gray-300 shrink-0">
      {/* === 主内容区：四栏布局 === */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">

          {/* 栏一：友情链接 */}
          <div>
            <h4 className="text-white text-xs font-semibold mb-3 tracking-wide uppercase opacity-80">友情链接</h4>
            <ul className="space-y-1.5">
              {friendLinks.map((link) => (
                <li key={link.label}>
                  {link.docId ? (
                    <button
                      onClick={() => setActiveDoc(link.docId!)}
                      className="text-xs text-gray-400 hover:text-violet-400 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
                    >
                      {link.label}
                    </button>
                  ) : link.href ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-violet-400 transition-colors duration-200 inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="size-3 opacity-50" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500 cursor-default">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 栏二：法律声明 */}
          <div>
            <h4 className="text-white text-xs font-semibold mb-3 tracking-wide uppercase opacity-80">法律声明</h4>
            <ul className="space-y-1.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => setActiveDoc(link.docId!)}
                    className="text-xs text-gray-400 hover:text-violet-400 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 栏三：联系我们 */}
          <div>
            <h4 className="text-white text-xs font-semibold mb-3 tracking-wide uppercase opacity-80">联系我们</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveDoc("contact-us")}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-violet-400 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
                >
                  <MessageCircle className="size-3.5 shrink-0 text-violet-500" />
                  <span>在线客服</span>
                </button>
              </li>
              <li>
                <a href="mailto:support@aimianshi.com" className="flex items-center gap-2 text-xs text-gray-400 hover:text-violet-400 transition-colors duration-200">
                  <Mail className="size-3.5 shrink-0 text-violet-500" />
                  <span>support@aimianshi.com</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="size-3.5 shrink-0 text-violet-500" />
                  <span>周一至周五 9:00 - 18:00</span>
                </div>
              </li>
            </ul>

            {/* 下载按钮区 */}
            <div className="mt-4">
              <h4 className="text-white text-xs font-semibold mb-2.5 tracking-wide uppercase opacity-80">下载客户端</h4>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-600/50 bg-gray-800/50 text-xs text-gray-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300 transition-all duration-200">
                  <Download className="size-3" />
                  Windows
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-600/50 bg-gray-800/50 text-xs text-gray-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300 transition-all duration-200">
                  <Download className="size-3" />
                  macOS
                </button>
              </div>
            </div>
          </div>

          {/* 栏四：二维码 */}
          <div>
            <h4 className="text-white text-xs font-semibold mb-3 tracking-wide uppercase opacity-80">关注我们</h4>
            <div className="flex gap-4">
              {/* 用户交流群二维码 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="size-[64px] rounded-lg bg-white p-1 shadow-sm">
                  <img
                    src="/qr-placeholder.svg"
                    alt="用户交流群"
                    className="size-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-gray-400">交流群</span>
              </div>

              {/* 公众号二维码 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="size-[64px] rounded-lg bg-white p-1 shadow-sm">
                  <img
                    src="/qr-placeholder.svg"
                    alt="公众号"
                    className="size-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-gray-400">公众号</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 分割线 === */}
      <div className="border-t border-gray-800/60" />

      {/* === 底部版权栏 === */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
          <p>&copy; {currentYear} AI 面试备考工具 · 职通车 版权所有</p>
          <div className="flex items-center gap-3">
            <span>京ICP备2026000001号-1</span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span>京公网安备 11010802000001号</span>
          </div>
        </div>
      </div>

      {/* === 文档弹窗 === */}
      <FooterDocModal docId={activeDoc} onClose={() => setActiveDoc(null)} />
    </footer>
  )
}
