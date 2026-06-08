"use client";

import type { ComponentType } from "react";
import { AppProvider } from "@/features/career/context/AppContext";

interface CareerPageShellProps {
  page: ComponentType;
}

export default function CareerPageShell(props: CareerPageShellProps) {
  const { page: Page } = props;

  return (
    <AppProvider>
      <div className="relative flex h-full min-h-0 flex-col">
        <Page />
      </div>
    </AppProvider>
  );
}
