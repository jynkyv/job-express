import { callDeepSeek, DeepSeekNotConfiguredError } from "./deepseek"
import type { BasicInfo, Education, Experience } from "@/features/career/types-resume/resume"

// ====== Prompt 模板 ======

const RESUME_PROMPTS = {
  /**
   * 优化基本信息和职位描述
   */
  basicInfo: (data: Partial<BasicInfo>) => ({
    system: "你是一位资深的简历顾问。用简洁、专业的口吻帮助求职者优化简历基本信息。",
    user: `请根据以下信息，优化职位名称（title）和一句话专业简介。
要求：职位名称要精准匹配目标岗位；一句话简介突出核心竞争力和经验年限。
输出格式：JSON { optimizedTitle: string, summary: string }

当前信息：
${JSON.stringify(data, null, 2)}`,
  }),

  /**
   * 优化教育经历描述
   */
  education: (edu: Education) => ({
    system: "你是一位资深的简历顾问。帮助优化教育背景描述，突出学术成就。",
    user: `请根据以下教育信息，生成在校经历/荣誉的描述（2-3 个要点，每点一行）。

学校：${edu.school}
专业：${edu.major}
学历：${edu.degree}
已有描述：${edu.description || "无"}

输出格式：纯文本，每行一个要点，无需序号。`,
  }),

  /**
   * 用 STAR 法则优化工作经历
   */
  experience: (exp: Experience, targetPosition: string) => ({
    system: "你是一位资深的简历顾问，擅长用 STAR 法则（情境-任务-行动-结果）优化工作经历。",
    user: `目标岗位：${targetPosition}
公司：${exp.company}
职位：${exp.position}
时间段：${exp.startDate} - ${exp.endDate}
原始描述：${exp.description || "无"}

请用 STAR 法则将上述经历改写为 3-4 个要点。每个要点：
- 以有影响力的动词开头
- 包含具体的量化数据或成果
- 体现个人贡献（非团队）

输出格式：纯文本，每行一个要点。`,
  }),

  /**
   * 生成/优化技能列表
   */
  skills: (existing: string, targetPosition: string) => ({
    system: "你是一位资深的简历顾问，了解各岗位的必备技能。",
    user: `目标岗位：${targetPosition}
现有技能：${existing || "（空）"}

请补充优化技能列表，要求：
1. 保留已有的合理技能
2. 补充该岗位必备的硬技能和软技能
3. 按类别分组（如"前端技术 / 工具链 / 软技能"）
4. 不要重复、不要泛泛而谈

输出格式：纯文本，每个技能用逗号分隔。`,
  }),

  /**
   * 生成自我评价
   */
  selfEvaluation: (data: { name: string; position: string; skills: string; experience: string }) => ({
    system: "你是一位资深的简历顾问。请撰写一段简洁有力的自我评价。",
    user: `根据以下信息生成一段 100-150 字的自我评价：

姓名：${data.name}
目标岗位：${data.position}
技能：${data.skills}
经历概要：${data.experience}

要求：
- 第一句话概括个人定位
- 中间陈述核心能力和关键经历
- 最后体现职业态度或发展目标
- 语气自信但不浮夸

输出格式：纯文本。`,
  }),
}

// ====== 字段级别调用函数 ======

export type AIField = "basicInfo" | "education" | "experience" | "skills" | "selfEvaluation"

export async function generateResumeContent(
  field: AIField,
  params: Record<string, unknown>,
  onChunk?: (text: string) => void
): Promise<string> {
  let prompt: { system: string; user: string }

  switch (field) {
    case "basicInfo":
      prompt = RESUME_PROMPTS.basicInfo(params as Partial<BasicInfo>)
      break
    case "education":
      prompt = RESUME_PROMPTS.education(params as unknown as Education)
      break
    case "experience":
      prompt = RESUME_PROMPTS.experience(
        params as unknown as Experience,
        (params as { targetPosition: string }).targetPosition || ""
      )
      break
    case "skills":
      prompt = RESUME_PROMPTS.skills(
        (params as { existing: string }).existing || "",
        (params as { targetPosition: string }).targetPosition || ""
      )
      break
    case "selfEvaluation":
      prompt = RESUME_PROMPTS.selfEvaluation(
        params as { name: string; position: string; skills: string; experience: string }
      )
      break
    default:
      throw new Error(`未知的 AI 字段: ${field}`)
  }

  try {
    const result = await callDeepSeek(
      [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      onChunk
    )
    return result
  } catch (error) {
    if (error instanceof DeepSeekNotConfiguredError) {
      throw error
    }
    throw new Error(`AI 生成失败: ${(error as Error).message}`)
  }
}
