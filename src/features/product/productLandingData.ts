import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Download,
  Dumbbell,
  FileText,
  FolderLock,
  LayoutTemplate,
  ListChecks,
  MessageSquareText,
  Palette,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";

export type ProductSlug = "resume" | "interview" | "image";

export interface ProductFeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ProductFeatureGroup {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  items: ProductFeatureItem[];
}

export interface ProductStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

export interface ProductLandingConfig {
  slug: ProductSlug;
  sequence: string;
  badge: string;
  title: string;
  subtitle: string;
  heroImage: string;
  heroImageAlt: string;
  toolHref: string;
  primaryAction: string;
  secondaryAction: string;
  secondaryHref: string;
  featureTitle: string;
  featureSubtitle: string;
  featureGroups: ProductFeatureGroup[];
  steps: ProductStep[];
  stats: Array<{ value: string; label: string }>;
  faqs: ProductFaqItem[];
  ctaTitle: string;
  ctaDescription: string;
}

const PRODUCT_LANDING_CONFIGS: Record<ProductSlug, ProductLandingConfig> = {
  resume: {
    slug: "resume",
    sequence: "01",
    badge: "简历准备工作室",
    title: "整理一份真正\n可以投递的简历",
    subtitle:
      "从内容结构、视觉模板到导出投递，把零散经历整理成清晰、专业、便于持续维护的求职材料。",
    heroImage: "/card-resume.png",
    heroImageAlt: "简历准备功能预览",
    toolHref: "/app/dashboard/resumes",
    primaryAction: "开始整理简历",
    secondaryAction: "浏览简历模板",
    secondaryHref: "/app/dashboard/templates",
    featureTitle: "把简历整理变成一套清晰流程",
    featureSubtitle:
      "内容编辑、排版调整和投递准备集中在同一处，减少反复切换工具的时间。",
    featureGroups: [
      {
        eyebrow: "内容完善",
        title: "先写清楚，再写漂亮",
        description:
          "围绕招聘方真正关心的信息组织内容，让经历、项目和能力证明更容易被快速阅读。",
        icon: WandSparkles,
        items: [
          {
            title: "结构化编辑",
            description: "教育、经历、项目、技能和自定义模块分别维护。",
            icon: FileText,
          },
          {
            title: "AI 润色与语法检查",
            description: "优化措辞、检查表达问题，让内容更专业克制。",
            icon: Sparkles,
          },
          {
            title: "实时预览",
            description: "修改内容后即时查看排版效果，减少重复导出。",
            icon: ListChecks,
          },
        ],
      },
      {
        eyebrow: "投递准备",
        title: "模板、导出和本地保存一次完成",
        description:
          "选择适合岗位的视觉风格，导出 PDF，并按需将简历同步到自己的本地目录。",
        icon: LayoutTemplate,
        items: [
          {
            title: "八套简历模板",
            description: "覆盖经典、现代、时间线、极简等多种风格。",
            icon: Palette,
          },
          {
            title: "PDF 导出",
            description: "整理完成后直接生成适合投递和打印的文件。",
            icon: Download,
          },
          {
            title: "本地目录同步",
            description: "授权后自动保存 JSON 数据，便于长期维护。",
            icon: FolderLock,
          },
        ],
      },
    ],
    steps: [
      {
        title: "选择模板",
        description: "从模板库中选择适合目标岗位的版式。",
        icon: LayoutTemplate,
      },
      {
        title: "完善内容",
        description: "填写经历和项目，按需使用 AI 优化表达。",
        icon: FileText,
      },
      {
        title: "导出投递",
        description: "检查预览效果，生成 PDF 并开始投递。",
        icon: Download,
      },
    ],
    stats: [
      { value: "8", label: "套简历模板" },
      { value: "实时", label: "编辑预览" },
      { value: "PDF", label: "一键导出" },
      { value: "本地", label: "数据保存" },
    ],
    faqs: [
      {
        question: "简历数据会保存在哪里？",
        answer:
          "默认保存在当前浏览器中。你也可以在设置页授权一个本地目录，让简历数据同步保存为 JSON 文件。",
      },
      {
        question: "可以随时更换模板吗？",
        answer:
          "可以。简历内容和视觉模板相互独立，更换模板后可以继续微调颜色、间距和排版。",
      },
      {
        question: "支持导出什么格式？",
        answer: "当前主要支持 PDF 导出，适合在线投递和打印。",
      },
    ],
    ctaTitle: "先把简历整理到可投递状态",
    ctaDescription: "从一套合适的模板开始，逐步完善你的求职材料。",
  },
  interview: {
    slug: "interview",
    sequence: "02",
    badge: "AI 模拟面试工作室",
    title: "先练一轮，\n再走进真正的面试",
    subtitle:
      "围绕目标岗位完成五道问答训练，获得逐题评价、参考答案和综合复盘，提前发现表达短板。",
    heroImage: "/card-interview.png",
    heroImageAlt: "模拟面试功能预览",
    toolHref: "/app/dashboard/interview",
    primaryAction: "开始模拟面试",
    secondaryAction: "查看训练能力",
    secondaryHref: "#features",
    featureTitle: "让每一次练习都有反馈",
    featureSubtitle:
      "从选题、作答到复盘形成完整闭环，不只是随机看题，而是主动练习表达。",
    featureGroups: [
      {
        eyebrow: "定向练习",
        title: "根据岗位选择合适的问题",
        description:
          "支持本地题库快速抽题，也可以让 AI 围绕你的目标岗位生成一组定制问题。",
        icon: Target,
        items: [
          {
            title: "本地岗位题库",
            description: "无需等待即可开始训练，适合高频重复练习。",
            icon: BookOpenCheck,
          },
          {
            title: "AI 定制出题",
            description: "围绕岗位和面试类型生成更有针对性的问题。",
            icon: BrainCircuit,
          },
          {
            title: "五题训练节奏",
            description: "用一轮可完成的小训练，快速进入面试状态。",
            icon: MessageSquareText,
          },
        ],
      },
      {
        eyebrow: "复盘改进",
        title: "看见问题，才能稳定进步",
        description:
          "完成问答后逐题分析表达质量，并形成一份完整总结，帮助你明确下一轮练习重点。",
        icon: BarChart3,
        items: [
          {
            title: "逐题分析",
            description: "从准确度、逻辑性、专业度和完整度评估回答。",
            icon: ListChecks,
          },
          {
            title: "参考答案",
            description: "对照更完整的回答结构，补上遗漏的关键点。",
            icon: CheckCircle2,
          },
          {
            title: "综合总结报告",
            description: "汇总本轮表现，给出可执行的改进建议。",
            icon: BarChart3,
          },
        ],
      },
    ],
    steps: [
      {
        title: "选择岗位",
        description: "选择题库模式或 AI 出题，并设定目标岗位。",
        icon: BriefcaseBusiness,
      },
      {
        title: "完成问答",
        description: "按照真实面试节奏完成五道问题的作答。",
        icon: MessageSquareText,
      },
      {
        title: "查看复盘",
        description: "阅读逐题建议和总结报告，明确下一次改进方向。",
        icon: BarChart3,
      },
    ],
    stats: [
      { value: "5", label: "道题一轮训练" },
      { value: "2", label: "种出题模式" },
      { value: "4", label: "项回答评分" },
      { value: "1", label: "份总结报告" },
    ],
    faqs: [
      {
        question: "本地题库和 AI 出题有什么区别？",
        answer:
          "本地题库启动更快，适合反复练习；AI 出题会调用你配置的模型，更适合围绕目标岗位进行定向训练。",
      },
      {
        question: "模拟面试需要配置 API 吗？",
        answer:
          "使用本地题库开始答题不需要 API。若要使用 AI 出题、逐题分析和总结报告，需要先配置 DeepSeek API。",
      },
      {
        question: "一轮训练为什么设置为五道题？",
        answer:
          "五道题足够覆盖一轮表达训练，又不会造成过高的练习负担。完成后可以立即复盘并再次练习。",
      },
    ],
    ctaTitle: "用一次模拟面试找出当前短板",
    ctaDescription: "先完成五道题，再决定下一轮应该重点练什么。",
  },
  image: {
    slug: "image",
    sequence: "03",
    badge: "职业形象分析工作室",
    title: "面试之前，\n先检查自己的出镜状态",
    subtitle:
      "上传照片并填写必要信息，从着装、发型、岗位匹配和面试当天状态获得一份实用的准备建议。",
    heroImage: "/card-image.png",
    heroImageAlt: "职业形象分析功能预览",
    toolHref: "/app/dashboard/image",
    primaryAction: "开始形象分析",
    secondaryAction: "查看分析范围",
    secondaryHref: "#features",
    featureTitle: "把面试前的细节检查集中完成",
    featureSubtitle:
      "从第一印象到当天状态，用更具体的建议替代临出门前的反复犹豫。",
    featureGroups: [
      {
        eyebrow: "职业形象",
        title: "检查第一印象是否适合目标岗位",
        description:
          "围绕照片质量、着装、发型和整体精神状态，给出更贴近面试场景的建议。",
        icon: ScanFace,
        items: [
          {
            title: "照片质量检查",
            description: "先确认照片是否清晰、完整，适合进一步分析。",
            icon: Camera,
          },
          {
            title: "着装与发型建议",
            description: "结合面试场景，找出容易忽视的形象细节。",
            icon: ScanFace,
          },
          {
            title: "岗位匹配建议",
            description: "针对不同岗位，调整正式程度和表达重点。",
            icon: BriefcaseBusiness,
          },
        ],
      },
      {
        eyebrow: "状态准备",
        title: "把面试当天的状态也纳入计划",
        description:
          "在形象建议之外，补充饮食、运动和晨间准备提醒，让你更从容地进入面试。",
        icon: Dumbbell,
        items: [
          {
            title: "身体数据参考",
            description: "结合必要身体信息，提供更贴近个人情况的建议。",
            icon: ListChecks,
          },
          {
            title: "健康与饮食提醒",
            description: "整理面试前和面试当天更实用的状态管理建议。",
            icon: ShieldCheck,
          },
          {
            title: "运动与晨间准备",
            description: "用简单可执行的动作，帮助自己快速进入状态。",
            icon: Dumbbell,
          },
        ],
      },
    ],
    steps: [
      {
        title: "上传照片",
        description: "选择清晰照片，并填写年龄、身高、体重等必要信息。",
        icon: Camera,
      },
      {
        title: "完成分析",
        description: "根据目标岗位生成职业形象和状态建议。",
        icon: ScanFace,
      },
      {
        title: "准备面试",
        description: "按照建议调整着装、发型和面试当天安排。",
        icon: CheckCircle2,
      },
    ],
    stats: [
      { value: "6", label: "类分析建议" },
      { value: "VL", label: "视觉模型理解" },
      { value: "本次", label: "照片临时使用" },
      { value: "岗位", label: "定向匹配" },
    ],
    faqs: [
      {
        question: "照片会被保存吗？",
        answer:
          "照片只用于本次分析流程，不会写入简历数据或本地目录。分析完成后也可以立即重置页面。",
      },
      {
        question: "为什么需要填写身高和体重？",
        answer:
          "这些信息用于生成更贴近个人情况的状态管理建议。页面会据此计算 BMI 参考值。",
      },
      {
        question: "形象分析需要配置 API 吗？",
        answer:
          "需要。当前使用通义千问 VL 视觉模型，请先在设置中配置 DashScope API 密钥。",
      },
    ],
    ctaTitle: "在面试开始前，做一次快速检查",
    ctaDescription: "用几分钟整理细节，让自己更有把握地进入面试。",
  },
};

export function getProductLandingConfig(slug: string) {
  return PRODUCT_LANDING_CONFIGS[slug as ProductSlug];
}
