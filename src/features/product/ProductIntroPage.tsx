import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { ProductLandingConfig } from "./productLandingData";

interface ProductIntroPageProps {
  config: ProductLandingConfig;
}

function ActionLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href as any} className={className}>
      {children}
    </Link>
  );
}

export default function ProductIntroPage({ config }: ProductIntroPageProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Job Express" className="size-11 rounded-xl object-contain" />
            <div>
              <p className="text-sm font-bold text-slate-900">Job Express</p>
              <p className="text-xs text-slate-500">{config.badge}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-500 md:flex">
            <a href="#features" className="transition hover:text-blue-700">核心能力</a>
            <a href="#steps" className="transition hover:text-blue-700">使用流程</a>
            <a href="#faq" className="transition hover:text-blue-700">常见问题</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              <ArrowLeft className="size-4" />
              返回工作台
            </Link>
            <Button asChild className="rounded-full px-5 shadow-sm">
              <Link to={config.toolHref as any}>{config.primaryAction}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden px-5 pb-24 pt-20 sm:px-8 lg:pb-32 lg:pt-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(37,99,235,0.13),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(14,165,233,0.10),transparent_25%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Sparkles className="size-4" />
              {config.badge}
            </div>
            <p className="mt-7 text-sm font-bold tracking-[0.24em] text-blue-600">
              JOB EXPRESS / {config.sequence}
            </p>
            <h1 className="mt-5 whitespace-pre-line text-5xl font-semibold leading-[1.08] tracking-tight text-slate-950 md:text-7xl">
              {config.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              {config.subtitle}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-14 rounded-2xl px-8 text-base shadow-xl shadow-blue-600/15">
                <Link to={config.toolHref as any}>
                  {config.primaryAction}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 rounded-2xl border-slate-300 bg-white/75 px-8 text-base">
                <ActionLink href={config.secondaryHref}>
                  {config.secondaryAction}
                  <ChevronRight className="size-5" />
                </ActionLink>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-blue-300/20 blur-3xl" />
            <div className="overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-slate-100">
                <img src={config.heroImage} alt={config.heroImageAlt} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent p-6 text-white">
                  <p className="text-xs font-bold tracking-[0.22em] text-blue-100">JOB EXPRESS / {config.sequence}</p>
                  <p className="mt-2 text-2xl font-semibold">{config.badge}</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
              <p className="text-xs font-semibold text-slate-400">下一步</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{config.primaryAction}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-5 sm:px-8 md:grid-cols-4 md:divide-y-0">
          {config.stats.map((stat) => (
            <div key={stat.label} className="px-4 py-8 text-center">
              <p className="text-3xl font-semibold text-blue-700">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-blue-600">CORE CAPABILITIES</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">{config.featureTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{config.featureSubtitle}</p>
          </div>

          <div className="mt-20 space-y-24 lg:space-y-32">
            {config.featureGroups.map((group, index) => (
              <div
                key={group.title}
                className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                    <group.icon className="size-4" />
                    {group.eyebrow}
                  </div>
                  <h3 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{group.title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">{group.description}</p>
                  <div className="mt-7 space-y-3">
                    {group.items.map((item) => (
                      <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <item.icon className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
                  <div className="absolute right-6 top-6 size-24 rounded-full bg-blue-200/50 blur-2xl" />
                  <div className="relative rounded-3xl border border-white bg-white/90 p-4 shadow-xl">
                    <img src={config.heroImage} alt="" className="aspect-[16/10] w-full rounded-2xl object-cover" />
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {group.items.map((item) => (
                        <div key={item.title} className="rounded-xl bg-slate-50 px-3 py-3">
                          <item.icon className="size-4 text-blue-700" />
                          <p className="mt-2 text-xs font-bold text-slate-700">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="scroll-mt-20 bg-[#eef5ff] px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-blue-600">HOW IT WORKS</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">三步开始使用</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {config.steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <step.icon className="size-6" />
                  </div>
                  <span className="text-sm font-bold tracking-[0.2em] text-blue-300">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-white px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-blue-600">FAQ</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">常见问题</h2>
          </div>
          <Accordion type="single" collapsible className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 px-6">
            {config.faqs.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index}`} className="border-slate-200">
                <AccordionTrigger className="py-6 text-base font-bold text-slate-900 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-sm leading-7 text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#163b75] px-6 py-16 text-center text-white sm:px-12">
          <CheckCircle2 className="mx-auto size-10 text-cyan-200" />
          <h2 className="mt-5 text-4xl font-semibold tracking-tight">{config.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-blue-100">{config.ctaDescription}</p>
          <Button asChild size="lg" className="mt-8 h-14 rounded-2xl bg-white px-8 text-base font-bold text-[#163b75] hover:bg-blue-50">
            <Link to={config.toolHref as any}>
              {config.primaryAction}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-slate-200 pt-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-slate-700">Job Express</p>
          <p>求职准备，从一次清晰的下一步开始。</p>
        </div>
      </footer>
    </main>
  );
}
