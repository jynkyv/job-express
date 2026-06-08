export interface InterviewQuestion {
  id: string
  question: string
  category: "technical" | "behavioral" | "resume" | "situational"
  difficulty: "basic" | "intermediate" | "advanced"
  kind?: "selfIntro" | "interview"
  /** 题库模式：参考答案 */
  referenceAnswer?: string
  /** 题库模式：答题要点 */
  keyPoints?: string[]
}

export type QuestionMode = "quiz" | "ai"

export interface UserAnswer {
  questionId: string
  content: string
  timestamp: number
}

export interface AnswerAnalysis {
  score: number
  accuracy: number
  logic: number
  professionalism: number
  completeness: number
  strengths: string[]
  weaknesses: string[]
  suggestion: string
}

export interface StandardAnswer {
  content: string
  keyPoints: string[]
  technique: string
}

export interface InterviewRecord {
  id: string
  timestamp: number
  position: string
  type: string
  question: string
  userAnswer: string
  analysis: AnswerAnalysis
  standardAnswer: StandardAnswer
}

export type InterviewMode = "typing" | "voice"

export interface APIConfig {
  apiKey: string
  baseURL: string
  model: string
}

// ====== 形象分析相关类型 ======

export interface BmiData {
  height: number // cm
  weight: number // kg
  bmi: number
  category: "underweight" | "normal" | "overweight" | "obese"
  categoryLabel: string
}

export interface OutfitAdvice {
  summary: string
  recommendations: {
    item: string
    advice: string
    color: string
  }[]
  imageDescriptions: string[]
}

export interface DietAdvice {
  dailyCalories: number
  summary: string
  foods: { category: string; items: string[] }[]
  tips: string[]
}

export interface FitnessAdvice {
  summary: string
  weeklyPlan: { day: string; workout: string; duration: string }[]
  tips: string[]
}

export interface ImageAnalysisResult {
  outfit: OutfitAdvice
  diet: DietAdvice
  fitness: FitnessAdvice
  bmi: BmiData
}

// ====== 面试总结报告类型 ======

export interface DimensionEval {
  name: string
  label: string
  score: number
  comment: string
  evidence: string
}

export interface SummaryItem {
  title: string
  description: string
  detail: string
}

export interface InterviewSummaryReport {
  overallScore: number
  overallGrade: string
  summaryAssessment: string
  selfIntroduction?: SummaryItem
  dimensionScores: DimensionEval[]
  strengths: SummaryItem[]
  weaknesses: SummaryItem[]
  improvementPlan: string[]
  nextSteps: string[]
}

// ====== 形象分析 v2（通义千问VL）类型 ======

export interface FaceHairAnalysis {
  face_shape: string
  skin_status: string
  hair_style: string
  hair_advice: string
  makeup_advice: string
}

export interface OutfitAnalysisV2 {
  clothing_type: string
  color_match: string          // 优/良/中/差
  fit_appropriateness: number  // 0-100
  outfit_score: number         // 0-100
  outfit_advice: string
  formal_level: number         // 1-5
  color_palette: string[]      // hex 颜色数组
  accessory_advice: string
}

export interface StyleTag {
  tag: string
  description: string
}

export interface JobMatchAnalysis {
  overall_match: number        // 0-100
  match_reason: string
  key_adjustments: string[]
}

export interface SummaryAdviceV2 {
  quick_wins: string[]
  medium_term: string[]
  long_term: string[]
}

// ====== 健康指南 v2 ======
export interface DietPlanItem {
  meal: string
  items: string[]
  note: string
}

export interface HealthGuideV2 {
  bmi_assessment: string
  daily_calories: number
  diet_advice: {
    summary: string
    recommendations: DietPlanItem[]
    interview_day: string
  }
  sleep_routine: string
  skin_care: string
}

// ====== 运动指南 v2 ======
export interface WeeklyWorkout {
  day: string
  workout: string
  duration: string
}

export interface FitnessGuideV2 {
  summary: string
  weekly_plan: WeeklyWorkout[]
  posture_training: string[]
  quick_tips: string[]
  interview_morning: string
}

export interface ImageAnalysisV2Result {
  analyzed_at: string
  model_used: string
  overall_score: number        // 0-100
  face_hair: FaceHairAnalysis
  outfit_analysis: OutfitAnalysisV2
  style_tags: StyleTag[]
  job_match: JobMatchAnalysis
  summary_advice: SummaryAdviceV2
  health_guide?: HealthGuideV2       // 健康指南（基于年龄/性别/BMI）
  fitness_guide?: FitnessGuideV2     // 运动指南（基于体态/身体数据）
}

/** 照片质量校验结果 */
export interface PhotoValidationResult {
  is_valid: boolean
  issues: string[]
  person_count: number
  face_visible: boolean
  background_suitable: boolean
  lighting_quality: "优" | "良" | "中" | "差"
  suggestion: string
}
