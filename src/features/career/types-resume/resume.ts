// ====== 简历制作模块类型定义 ======

export interface BasicInfo {
  name: string
  title: string          // 职位名称
  email: string
  phone: string
  location: string
  photo?: string         // base64 或 URL
  github?: string
  website?: string
}

export interface Education {
  id: string
  school: string
  major: string
  degree: string         // 学历: 本科/硕士/博士
  startDate: string      // "2020-09"
  endDate: string        // "2024-06" 或 "至今"
  description: string    // 在校经历/荣誉
}

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string    // 工作内容，每行一个要点
}

export interface Project {
  id: string
  name: string
  role: string           // 担任角色
  startDate: string
  endDate: string
  description: string    // 项目描述与成果
  link?: string
}

// 字段标签集中管理，便于国际化扩展
export const BASIC_INFO_LABELS: Record<keyof BasicInfo, string> = {
  name: '姓名',
  title: '职位',
  email: '邮箱',
  phone: '电话',
  location: '所在地',
  photo: '照片',
  github: 'GitHub',
  website: '个人网站',
}

export interface ResumeData {
  id: string
  title: string           // 简历名称（用于多份管理）
  templateId: string      // 模板 ID
  createdAt: string       // ISO 时间
  updatedAt: string
  basic: BasicInfo
  education: Education[]
  experience: Experience[]
  projects: Project[]
  skills: string          // 自由文本
  selfEvaluation: string  // 自由文本
}

// AI 生成结果的临时态，不直接写入 Store
export interface AIGenerationResult {
  field: string           // 字段名
  content: string         // 生成的文本
  original: string        // 原始文本（用于对比）
  timestamp: number
}

export type TemplateId = "classic" | "modern" | "minimal"
