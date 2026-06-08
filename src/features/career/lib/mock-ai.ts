import type { DeepSeekMessage } from "./deepseek"
import type { TongyiMessage } from "./tongyi"

type StreamCallback = (text: string) => void

const MOCK_DELAY_MS = 8

const answerAnalysis = (score = 78) => ({
  score,
  accuracy: Math.max(0, score - 3),
  logic: score,
  professionalism: Math.min(100, score + 2),
  completeness: Math.max(0, score - 5),
  strengths: ["回答方向基本贴合题意", "能体现岗位意识和学习意愿"],
  weaknesses: ["案例细节还不够具体", "可以补充行动步骤和结果数据"],
  suggestion: "建议按背景、行动、结果三段补充细节，并把铁路安全意识落到具体做法上。",
})

const standardAnswer = {
  content: "我会先确认现场安全和信息来源，按岗位规章进行汇报、隔离风险并协同处理。处置后复盘原因，形成记录，避免同类问题重复发生。",
  keyPoints: ["先安全后效率", "按流程汇报", "说明协作方式", "补充复盘改进"],
  technique: "先给结论，再用一个具体场景证明你的判断和行动。",
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function collectText(messages: Array<{ content: unknown }>) {
  return messages
    .map((message) => {
      if (typeof message.content === "string") return message.content
      if (Array.isArray(message.content)) {
        return message.content
          .map((part) => {
            if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
              return part.text
            }
            return ""
          })
          .join("\n")
      }
      return ""
    })
    .join("\n")
}

function extractAnswerCount(messages: DeepSeekMessage[]) {
  const userText = messages.find((message) => message.role === "user")?.content || ""
  try {
    const parsed = JSON.parse(userText)
    if (Array.isArray(parsed?.answers)) return parsed.answers.length
  } catch {
    // Fall through to the default count.
  }
  return 6
}

export async function streamMockText(text: string, onChunk?: StreamCallback) {
  if (!onChunk) return text

  for (let index = 0; index < text.length; index += 36) {
    const chunk = text.slice(index, index + 36)
    onChunk(chunk)
    await sleep(MOCK_DELAY_MS)
  }

  return text
}

export function getMockDeepSeekResponse(messages: DeepSeekMessage[]) {
  const text = collectText(messages)

  if (/生成5道|面试题|questionGeneration|questions/.test(text)) {
    return JSON.stringify({
      questions: [
        { id: "mock-q1", question: "请说明你对目标岗位核心职责的理解。", category: "resume", difficulty: "basic" },
        { id: "mock-q2", question: "遇到突发任务冲突时，你会如何排序处理？", category: "situational", difficulty: "intermediate" },
        { id: "mock-q3", question: "请举例说明你如何保证工作中的安全与准确。", category: "behavioral", difficulty: "intermediate" },
        { id: "mock-q4", question: "如果现场信息不完整，你会怎样沟通确认？", category: "situational", difficulty: "advanced" },
        { id: "mock-q5", question: "入职后前三个月你准备重点提升什么能力？", category: "resume", difficulty: "advanced" },
      ],
    })
  }

  if (/一次性分析一轮模拟面试|\"answers\"/.test(text)) {
    const count = extractAnswerCount(messages)
    return JSON.stringify({
      items: Array.from({ length: count }, (_, index) => ({
        index,
        analysis: answerAnalysis(index === 0 ? 76 : 74 + index * 3),
        standardAnswer: {
          ...standardAnswer,
          content: index === 0
            ? "自我介绍可以按教育背景、关键经历、岗位理解、求职动机四段展开，最后用一句话收束个人优势。"
            : standardAnswer.content,
        },
      })),
    })
  }

  if (/快速分析面试回答|题目：|面试者回答/.test(text)) {
    return JSON.stringify({
      analysis: answerAnalysis(78),
      standardAnswer,
    })
  }

  if (/面试总结报告|完整的面试记录|summaryAssessment/.test(text)) {
    return JSON.stringify({
      overallScore: 79,
      overallGrade: "良好",
      summaryAssessment: "本轮回答整体方向清晰，能体现求职动机和岗位意识。下一步需要把经历、行动和结果讲得更具体，减少泛泛表态。",
      selfIntroduction: {
        title: "自我介绍结构较完整",
        description: "能说明基本背景和求职意愿，但岗位匹配证据还可以再加强。",
        detail: "建议加入一段与目标岗位相关的课程、实习或项目经历，形成更明确的胜任理由。",
      },
      dimensionScores: [
        { name: "situation", label: "情境理解 (S)", score: 80, comment: "能识别问题场景和安全边界。", evidence: "多处回答提到先确认信息再处理。" },
        { name: "task", label: "任务识别 (T)", score: 76, comment: "任务优先级基本清楚。", evidence: "突发任务题中能区分紧急和重要事项。" },
        { name: "action", label: "行动方案 (A)", score: 78, comment: "行动步骤可执行，但细节仍可补充。", evidence: "提到了汇报、协作和复盘。" },
        { name: "result", label: "结果完整 (R)", score: 74, comment: "结果表达略弱。", evidence: "多数回答缺少量化成果或复盘指标。" },
      ],
      strengths: [
        { title: "安全意识稳定", description: "回答中能把安全、规章和确认流程放在前面。", detail: "来自应急处置类问题的回答。" },
        { title: "学习动机明确", description: "能表达入职后持续提升专业能力的意愿。", detail: "来自职业规划类问题的回答。" },
      ],
      weaknesses: [
        { title: "案例颗粒度不足", description: "部分回答仍偏原则性，缺少具体场景和数据。", detail: "每题准备一个真实经历，至少包含行动和结果。" },
        { title: "岗位语言还可加强", description: "可以多使用目标岗位相关术语。", detail: "把通用表达替换成岗位流程、设备、协作对象等具体词。" },
      ],
      improvementPlan: [
        "整理3个个人经历案例，分别对应安全、协作、学习能力。",
        "每次答题用30秒列出背景、行动、结果，训练结构化表达。",
        "补充目标岗位常见业务流程和安全规范，提升专业可信度。",
      ],
      nextSteps: ["完善自我介绍", "按岗位题库再练一轮", "录音复盘语速和停顿"],
    })
  }

  if (/optimizedTitle|一句话专业简介/.test(text)) {
    return JSON.stringify({
      optimizedTitle: "轨道交通求职候选人",
      summary: "具备扎实专业基础与较强执行力，关注安全规范、现场协作和持续学习，适合轨道交通相关岗位。",
    })
  }

  if (/教育信息|在校经历/.test(text)) {
    return "系统学习专业核心课程，具备扎实理论基础\n参与课程项目与实践训练，强化问题分析和协作能力\n在校期间保持稳定学习投入，具备良好的纪律性与执行力"
  }

  if (/STAR 法则|工作经历|实习经历/.test(text)) {
    return "负责整理业务资料与流程记录，提升信息交接效率\n参与现场/项目协作，按要求完成任务并及时反馈风险\n复盘执行过程中的问题，沉淀可复用的检查清单"
  }

  if (/技能列表/.test(text)) {
    return "铁路基础知识, 安全规范意识, 沟通协作, 文档整理, 问题分析, 执行力, 学习能力"
  }

  if (/自我评价/.test(text)) {
    return "我具备扎实的专业学习基础和稳定的执行力，重视安全规范与团队协作。过往学习和实践中，我能够主动拆解任务、按流程推进并及时复盘，希望在目标岗位中持续提升业务能力，为一线运行和服务质量贡献价值。"
  }

  if (/职业形象顾问|穿搭建议/.test(text)) {
    return "### 面试穿搭建议\n\n建议选择深蓝或深灰色外套，搭配白色或浅蓝衬衫，整体保持干净、合身、少装饰。鞋面提前清洁，配饰控制在简约手表即可。"
  }

  if (/健康管理顾问|体态调整/.test(text)) {
    return "### 面试前体态管理\n\n每天进行10分钟靠墙站立和肩颈拉伸，面试前一周保证睡眠，减少高盐高糖饮食。进入考场时下巴微收、肩膀放松，坐姿保持稳定。"
  }

  return "这是开发模拟模式返回的示例内容。真实 AI 服务恢复后，关闭设置中的开发模拟模式即可重新使用线上模型。"
}

export function getMockTongyiResponse(messages: TongyiMessage[]) {
  const text = collectText(messages)
  if (/照片是否适合|photoValidation|person_count|face_visible/.test(text)) {
    return getMockPhotoValidationResponse()
  }
  return getMockImageAnalysisResponse()
}

export function getMockPhotoValidationResponse() {
  return JSON.stringify({
    is_valid: true,
    issues: [],
    person_count: 1,
    face_visible: true,
    background_suitable: true,
    lighting_quality: "良",
    suggestion: "照片可用于职业形象分析。若用于正式材料，建议选择纯色背景并保证面部光线更均匀。",
  })
}

export function getMockImageAnalysisResponse() {
  return JSON.stringify({
    analyzed_at: new Date().toISOString(),
    model_used: "mock-qwen-vl",
    overall_score: 82,
    face_hair: {
      face_shape: "鹅蛋脸",
      skin_status: "肤色较均匀，精神状态良好",
      hair_style: "发型整体整洁，适合面试场景",
      hair_advice: "建议面试前整理鬓角和发尾，保持额头适度露出，显得更清爽利落。",
      makeup_advice: "男生建议清理胡茬、控油并修整眉形；女生建议淡妆、自然眉形和低饱和唇色。",
    },
    outfit_analysis: {
      clothing_type: "商务休闲",
      color_match: "良",
      fit_appropriateness: 84,
      outfit_score: 82,
      outfit_advice: "建议选择肩线合适的深色外套，衬衫领口保持平整，裤长以刚好触及鞋面为宜。",
      formal_level: 4,
      color_palette: ["#1E3A5F", "#FFFFFF", "#64748B", "#111827"],
      accessory_advice: "配饰以简约腕表为主，避免明显 logo、夸张项链或过亮饰品。",
    },
    style_tags: [
      { tag: "稳重专业型", description: "整体风格适合正式面试，可信度较高。" },
      { tag: "亲和表达型", description: "面部状态自然，适合服务和沟通类岗位。" },
      { tag: "清爽利落型", description: "通过发型和衣领细节可以进一步提升精神感。" },
    ],
    job_match: {
      overall_match: 84,
      match_reason: "整体形象符合求职面试的专业、整洁要求，稍加强正式度会更稳。",
      key_adjustments: ["提升服装正式度", "整理发型边缘", "优化背景和光线"],
    },
    summary_advice: {
      quick_wins: ["面试前熨烫衬衫", "整理鬓角和眉形", "选择纯色背景拍照"],
      medium_term: ["准备一套合身深色外套", "训练站姿和坐姿稳定性"],
      long_term: ["建立固定面试着装清单", "保持规律作息和皮肤清洁"],
    },
    health_guide: {
      bmi_assessment: "BMI 处于标准附近，建议面试前保持稳定作息和清淡饮食，重点提升精神状态。",
      daily_calories: 2100,
      diet_advice: {
        summary: "保持足量蛋白和复合碳水，减少高盐、油炸和甜饮。",
        recommendations: [
          { meal: "早餐", items: ["全麦面包", "鸡蛋", "无糖豆浆"], note: "避免空腹面试，保持稳定能量。" },
          { meal: "午餐", items: ["米饭", "鸡胸肉或鱼肉", "绿叶蔬菜"], note: "清淡为主，避免过饱。" },
          { meal: "晚餐", items: ["杂粮粥", "蒸蛋", "蔬菜"], note: "面试前一晚少油少盐。" },
        ],
        interview_day: "面试当天避免油腻、辛辣、酒精、过量咖啡和产气食物，可随身带水。",
      },
      sleep_routine: "面试前一周尽量23点前入睡，保证7小时以上睡眠。",
      skin_care: "早晚清洁和保湿，面试当天控制油光，避免临时尝试刺激性护肤品。",
    },
    fitness_guide: {
      summary: "以肩颈放松、核心稳定和轻有氧为主，帮助体态更挺拔。",
      weekly_plan: [
        { day: "周一", workout: "快走30分钟 + 靠墙站立", duration: "40分钟" },
        { day: "周三", workout: "肩颈拉伸 + 平板支撑", duration: "25分钟" },
        { day: "周五", workout: "慢跑或跳绳 + 背部激活", duration: "35分钟" },
        { day: "周日", workout: "全身拉伸与放松", duration: "20分钟" },
      ],
      posture_training: ["靠墙站立5分钟", "肩胛后缩训练", "下巴微收练习", "腹式呼吸稳定核心"],
      quick_tips: ["入场前放松肩颈", "坐下时背部挺直", "答题时眼神稳定", "手部自然放在桌面"],
      interview_morning: "起床后做5分钟拉伸，洗漱后整理仪容，出门前练习站姿和微笑。",
    },
  })
}

export function getMockCrashPlanResponse(daysUntil = 3) {
  return JSON.stringify({
    days_until: daysUntil,
    headline: "时间足够把减分项清零，重点把仪容和着装正式度提上来",
    focus: "当前最该补的是着装正式度和发型边缘的清爽度，把第一眼的整洁感做上去。",
    phases: [
      {
        title: "现在就做",
        window: "D-3 ~ D-2",
        items: [
          { text: "把面试要穿的衬衫和外套熨烫平整并挂好备用", category: "着装" },
          { text: "整理发型，修剪鬓角和发尾，露出额头显清爽", category: "仪容" },
          { text: "每天靠墙站立 5 分钟改善含胸驼背", category: "体态" },
        ],
      },
      {
        title: "面试前一天",
        window: "D-1",
        items: [
          { text: "23 点前入睡，保证 7-8 小时睡眠", category: "状态" },
          { text: "晚餐清淡，避免油腻辛辣和产气食物", category: "状态" },
          { text: "提前试穿全套正装，检查肩线、袖长和裤长", category: "着装" },
        ],
      },
      {
        title: "面试当天晨间",
        window: "面试当天",
        items: [
          { text: "起床后靠墙站立 5 分钟，做 3 次深呼吸放松肩颈", category: "体态" },
          { text: "出门前对镜检查领口、扣子、发型和面部控油", category: "仪容" },
          { text: "正常吃早餐但别过饱，随身带一小瓶水", category: "状态" },
        ],
      },
    ],
    avoid: ["熬夜", "油腻辛辣饮食", "临时尝试新发型或新护肤品", "酒精和过量咖啡"],
  })
}
