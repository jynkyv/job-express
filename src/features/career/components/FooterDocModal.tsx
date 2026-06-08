import { X } from "lucide-react"
import { useEffect, useRef } from "react"
import { getFooterDoc } from "@/features/career/data/footer-docs"

interface FooterDocModalProps {
  docId: string | null
  onClose: () => void
}

/** 将简单 Markdown 文本渲染为 JSX */
function renderMarkdown(md: string): JSX.Element {
  const lines = md.split("\n")
  const elements: JSX.Element[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行跳过
    if (line.trim() === "") {
      i++
      continue
    }

    // 表格检测（下一行包含 |---|）
    if (i + 1 < lines.length && lines[i + 1].includes("|---")) {
      const headerLine = line
      const headers = headerLine
        .split("|")
        .filter(Boolean)
        .map((h) => h.trim().replace(/\*\*/g, ""))
      const rows: string[][] = []
      i += 2 // 跳过表头分隔线
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(
          lines[i]
            .split("|")
            .filter(Boolean)
            .map((c) => c.trim())
        )
        i++
      }

      elements.push(
        <div key={key++} className="my-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 text-gray-600 border-b border-gray-100">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // H2 标题
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-lg font-bold text-gray-800 mt-6 mb-3 pb-1.5 border-b border-gray-200">
          {renderInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }

    // H3 标题
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold text-gray-700 mt-4 mb-2">
          {renderInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }

    // 无序列表
    if (line.match(/^- /)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^- /)) {
        listItems.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1.5 pl-4">
          {listItems.map((item, li) => (
            <li key={li} className="text-sm text-gray-600 list-disc marker:text-violet-400">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // 引用块
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="my-3 pl-4 border-l-3 border-violet-400 bg-violet-50/50 py-2 pr-3 rounded-r-lg">
          <p className="text-sm text-gray-600">{renderInline(line.slice(2))}</p>
        </blockquote>
      )
      i++
      continue
    }

    // 分割线
    if (line.trim() === "---") {
      elements.push(<hr key={key++} className="my-4 border-gray-200" />)
      i++
      continue
    }

    // 带强调的段落
    if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={key++} className="text-sm font-semibold text-gray-700 my-2">
          {line.slice(2, -2)}
        </p>
      )
      i++
      continue
    }

    // 普通段落
    const paragraphLines: string[] = []
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("-") && !lines[i].startsWith(">") && !lines[i].startsWith("|") && !(lines[i].trim() === "---")) {
      paragraphLines.push(lines[i])
      i++
    }
    if (paragraphLines.length > 0) {
      const text = paragraphLines.join(" ").trim()
      elements.push(
        <p key={key++} className="text-sm text-gray-600 leading-relaxed my-2">
          {renderInline(text)}
        </p>
      )
    }
  }

  return <>{elements}</>
}

/** 行内格式：**加粗**、[链接](url) */
function renderInline(text: string): React.ReactNode {
  // 先处理链接 [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const boldRegex = /\*\*(.+?)\*\*/g

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // 简化处理：先替换链接，再替换粗体
  let processed = text
  const links: { placeholder: string; text: string; url: string }[] = []
  let linkIdx = 0

  processed = processed.replace(linkRegex, (_, t: string, u: string) => {
    const ph = `__LINK_${linkIdx}__`
    links.push({ placeholder: ph, text: t, url: u })
    linkIdx++
    return ph
  })

  // 分割并渲染
  const segments: React.ReactNode[] = []
  let remaining = processed

  while (remaining.length > 0) {
    const linkPH = remaining.match(/__LINK_\d+__/)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)

    if (!linkPH && !boldMatch) {
      segments.push(remaining)
      break
    }

    const linkIdx2 = linkPH ? linkPH.index! : Infinity
    const boldIdx = boldMatch ? boldMatch.index! : Infinity

    if (linkIdx2 < boldIdx) {
      // link comes first
      const before = remaining.slice(0, linkIdx2)
      if (before) segments.push(before)
      const ph = linkPH![0]
      const link = links.find((l) => l.placeholder === ph)
      if (link) {
        segments.push(
          <a
            key={`l-${link.placeholder}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 underline underline-offset-2 hover:text-violet-700"
          >
            {link.text}
          </a>
        )
      }
      remaining = remaining.slice(linkIdx2 + ph.length)
    } else {
      // bold comes first
      const before = remaining.slice(0, boldIdx)
      if (before) segments.push(before)
      segments.push(
        <strong key={`b-${boldMatch![1]}`} className="font-semibold text-gray-700">
          {boldMatch![1]}
        </strong>
      )
      remaining = remaining.slice(boldIdx + boldMatch![0].length)
    }
  }

  return <>{segments}</>
}

export default function FooterDocModal({ docId, onClose }: FooterDocModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const doc = docId ? getFooterDoc(docId) : undefined

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!doc) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h1 className="text-lg font-bold text-gray-800">{doc.title}</h1>
          <button
            onClick={onClose}
            className="size-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none">
          {renderMarkdown(doc.content)}
        </div>

        {/* 底部 */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/80 shrink-0 text-xs text-gray-400 text-center">
          本文档仅供信息参考，请以实际使用为准
        </div>
      </div>
    </div>
  )
}
