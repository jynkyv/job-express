import type { InterviewQuestion } from "@/features/career/types"

export function validateInterviewAnswer(question: InterviewQuestion | undefined, answer: string) {
  const trimmed = answer.trim()
  const compact = trimmed.replace(/\s+/g, "")
  const label = question?.kind === "selfIntro" ? "自我介绍" : "本题回答"

  if (!trimmed) {
    return {
      valid: false,
      message: `请先完成${label}，再进入下一题。`,
    }
  }

  if (/^[\d０-９]+$/.test(compact) || /^[^\u4e00-\u9fa5a-zA-Z]+$/.test(compact)) {
    return {
      valid: false,
      message: `${label}不能只写数字或符号，请补充完整表达。`,
    }
  }

  return {
    valid: true,
    message: "",
  }
}
