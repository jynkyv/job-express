import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app/dashboard/")({
  component: DashboardCompatibilityRedirect
});

function DashboardCompatibilityRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);

  return null;
}
