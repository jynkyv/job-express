import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app/dashboard/ai")({
  component: AISettingsCompatibilityRedirect,
});

function AISettingsCompatibilityRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/settings", replace: true, hash: "ai" });
  }, [navigate]);

  return null;
}
