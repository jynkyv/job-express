import { createFileRoute } from "@tanstack/react-router";
import CareerPageShell from "@/features/career/CareerPageShell";
import InterviewPage from "@/features/career/pages/InterviewPage";

export const Route = createFileRoute("/app/dashboard/interview")({
  component: InterviewRoute
});

function InterviewRoute() {
  return <CareerPageShell page={InterviewPage} />;
}
