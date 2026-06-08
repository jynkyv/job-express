import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import ResumesPage from "@/app/app/dashboard/resumes/page";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/dashboard/resumes")({
  component: ResumeRoute
});

function ResumeRoute() {
  return (
    <div className="relative h-screen overflow-hidden bg-[#eef4fb]">
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-transparent px-6 text-slate-800">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          返回首页
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold">简历准备</p>
          <p className="text-xs text-slate-500">Resume Studio</p>
        </div>
        <div className="w-[88px]" />
      </header>
      <div className="h-full pt-14">
        <ResumesPage />
      </div>
    </div>
  );
}
