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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { callDeepSeek } from "@/features/career/lib/deepseek"
import { SYSTEM_PROMPTS } from "@/features/career/lib/prompts"
import { Sparkles, Heart } from "lucide-react"

export default function BodyManagement() {
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const generate = async () => {
    if (!height || !weight) return
    setIsLoading(true)
    setResult("")

    try {
      const res = await callDeepSeek(
        [
          {
            role: "system",
            content: SYSTEM_PROMPTS.bodyManagement,
          },
          {
            role: "user",
            content: `我身高${height}cm，体重${weight}kg，即将参加面试，请给我面试形象管理建议。`,
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
            <Heart className="size-5 text-blue-500" />
            面试形象管理
          </CardTitle>
          <CardDescription>
            根据您的身体数据，获取体态调整和形象改善建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="height">身高 (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">体重 (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={generate}
            className="w-full"
            disabled={isLoading || !height || !weight}
          >
            <Sparkles className="size-4 mr-2" />
            {isLoading ? "生成中..." : "获取形象管理建议"}
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
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
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
