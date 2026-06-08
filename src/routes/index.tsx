import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, CheckCircle2, FileText, Settings, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: CareerHome
});

const journey = [
  {
    step: "01",
    title: "简历准备",
    desc: "先把可投递版本整理好，确保经历、项目和关键词完整。",
    href: "/product/resume",
    image: "/card-resume.png",
    icon: FileText,
    action: "整理简历",
  },
  {
    step: "02",
    title: "模拟训练",
    desc: "围绕目标岗位抽题或 AI 出题，完成作答后拿到复盘建议。",
    href: "/product/interview",
    image: "/card-interview.png",
    icon: Sparkles,
    action: "开始面试",
    primary: true,
  },
  {
    step: "03",
    title: "形象检查",
    desc: "检查照片质量、着装发型和岗位匹配，面试前快速校准状态。",
    href: "/product/image",
    image: "/card-image.png",
    icon: Camera,
    action: "检查形象",
  },
];

function CareerHome() {
  const primary = journey.find((item) => item.primary)!;

  return (
    <main className="h-screen overflow-hidden bg-[#f1f6fc] text-slate-950">
      <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between bg-transparent px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Job Express" className="h-12 w-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Job Express</p>
            <p className="text-xs text-slate-500">Interview Preparation Suite</p>
          </div>
        </div>
        <Link
          to="/settings"
          className="flex size-10 items-center justify-center rounded-full border border-white/70 bg-white/55 text-slate-500 shadow-sm backdrop-blur transition hover:text-blue-600"
          title="设置"
        >
          <Settings className="size-5" />
        </Link>
      </header>

      <section className="grid min-h-screen grid-cols-[minmax(0,1fr)_440px] gap-5 px-6 pb-6 pt-20 max-lg:grid-cols-1">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid h-full min-h-[620px] grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] max-lg:grid-cols-1">
            <div className="flex flex-col justify-between bg-[#163b75] p-8 text-white">
              <div>
                <p className="text-sm font-semibold text-blue-100">推荐下一步</p>
                <h1 className="mt-3 max-w-md text-5xl font-semibold leading-tight tracking-normal">
                  先做一轮模拟面试，找出当前短板
                </h1>
                <p className="mt-5 max-w-md text-base leading-7 text-blue-100/85">
                  候选人通常会在简历之后卡在表达结构。先用目标岗位做 5 题训练，再回头调整简历和面试形象。
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {["选择岗位和题源", "完成 5 道问答", "查看评分、参考答案和改进建议"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-blue-50">
                    <CheckCircle2 className="size-4 text-cyan-200" />
                    {item}
                  </div>
                ))}
              </div>

              <Link
                to={primary.href}
                className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#163b75] transition hover:bg-blue-50"
              >
                {primary.action}
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="relative min-h-[620px] bg-slate-100">
              <img src={primary.image} alt={primary.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-8 text-white">
                <p className="text-sm text-white/70">{primary.step}</p>
                <h2 className="mt-1 text-4xl font-semibold">{primary.title}</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/78">{primary.desc}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 shrink-0">
            <p className="text-lg font-semibold text-slate-900">面试准备路径</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">按顺序做，也可以直接进入当前最需要的工具。</p>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-3 gap-4">
            {journey.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`group grid min-h-0 grid-cols-[minmax(112px,34%)_minmax(0,1fr)] items-center gap-4 rounded-2xl border p-4 transition ${
                  item.primary
                    ? "border-blue-200 bg-blue-50/85 shadow-[0_12px_32px_rgba(37,99,235,0.08)]"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                }`}
              >
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                      {item.step}
                    </span>
                    <item.icon className="size-5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
