import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/app/app/dashboard/settings/page";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
