export interface InterviewerProfile {
  id: string
  name: string
  title: string
  style: string
  image: string
}

export const INTERVIEWER_PROFILES: InterviewerProfile[] = [
  {
    id: "interviewer-01",
    name: "陈总监",
    title: "业务面试官",
    style: "稳重正式",
    image: "/interviewers/interviewer-01-executive-male.png",
  },
  {
    id: "interviewer-02",
    name: "林经理",
    title: "综合面试官",
    style: "冷静专业",
    image: "/interviewers/interviewer-02-modern-female.png",
  },
  {
    id: "interviewer-03",
    name: "周总",
    title: "高压面试官",
    style: "资深严谨",
    image: "/interviewers/interviewer-03-senior-male.png",
  },
  {
    id: "interviewer-04",
    name: "许老师",
    title: "HR 面试官",
    style: "亲和观察",
    image: "/interviewers/interviewer-04-hr-female.png",
  },
  {
    id: "interviewer-05",
    name: "顾主管",
    title: "技术面试官",
    style: "理性直接",
    image: "/interviewers/interviewer-05-tech-male.png",
  },
  {
    id: "interviewer-06",
    name: "沈经理",
    title: "产品面试官",
    style: "专注克制",
    image: "/interviewers/interviewer-06-product-female.png",
  },
]

export function pickInterviewImage(previousImage?: string | null) {
  const images = INTERVIEWER_PROFILES.map((profile) => profile.image)
  const candidates = images.length > 1
    ? images.filter((image) => image !== previousImage)
    : images

  return candidates[Math.floor(Math.random() * candidates.length)] || images[0]
}
