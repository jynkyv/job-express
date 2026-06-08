import { createFileRoute } from "@tanstack/react-router";
import CareerPageShell from "@/features/career/CareerPageShell";
import ImagePage from "@/features/career/pages/ImagePage";

export const Route = createFileRoute("/app/dashboard/image")({
  component: ImageRoute
});

function ImageRoute() {
  return <CareerPageShell page={ImagePage} />;
}
