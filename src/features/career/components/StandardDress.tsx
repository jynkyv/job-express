"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { callDeepSeek } from "@/features/career/lib/deepseek"
import { SYSTEM_PROMPTS, POSITIONS } from "@/features/career/lib/prompts"
import { Sparkles, Shirt } from "lucide-react"

export default function StandardDress() {
  const [position, setPosition] = useState("all")
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const generate = async () => {
    setIsLoading(true)
    setResult("")

    try {
      const res = await callDeepSeek(
        [
          {
            role: "system",
            content: SYSTEM_PROMPTS.standardDress,
          },
          {
            role: "user",
            content: `我的目标岗位：${POSITIONS.find((p) => p.value === position)?.label || "综合"}，性别：${gender === "male" ? "男" : "女"}，请给我面试穿搭建议。`,
          },
        ],
        (chunk) => setResult((prev) => prev + chunk)
      )
      setResult(res)
    } catch (e) {
      console.error(e)
      setResult("生成失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shirt className="size-5 text-blue-500" />
            标准穿搭指南
          </CardTitle>
          <CardDescription>
            根据目标行业和岗位，获取专业的面试穿搭建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">目标岗位</label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">性别</label>
              <Select
                value={gender}
                onValueChange={(v) => setGender(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} className="w-full" disabled={isLoading}>
            <Sparkles className="size-4 mr-2" />
            {isLoading ? "生成中..." : "获取穿搭建议"}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <Card>
          <CardContent className="py-6">
            <ScrollArea className="max-h-[500px] pr-4">
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {result.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) {
                    return (
                      <h1 key={i} className="text-lg font-bold mt-4 mb-2">
                        {line.replace("# ", "")}
                      </h1>
                    )
                  }
                  if (line.startsWith("## ")) {
                    return (
                      <h2 key={i} className="text-base font-semibold mt-3 mb-1">
                        {line.replace("## ", "")}
                      </h2>
                    )
                  }
                  if (line.startsWith("### ")) {
                    return (
                      <h3 key={i} className="text-sm font-medium mt-2 mb-1">
                        {line.replace("### ", "")}
                      </h3>
                    )
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <li
                        key={i}
                        className="text-sm ml-4 text-muted-foreground"
                      >
                        {line.replace("- ", "")}
                      </li>
                    )
                  }
                  if (line.trim() === "") return <br key={i} />
                  return (
                    <p key={i} className="text-sm text-muted-foreground mb-1">
                      {line}
                    </p>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
