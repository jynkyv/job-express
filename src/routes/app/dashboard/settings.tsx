import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app/dashboard/settings")({
  component: SettingsCompatibilityRedirect,
});

function SettingsCompatibilityRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/settings", replace: true });
  }, [navigate]);

  return null;
}
