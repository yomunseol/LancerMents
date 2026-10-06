"use client";

import UpgradePanel from "../UpgradePanel";
import { useWorkspaceGate } from "../useWorkspaceData";

export default function AnalyticsPage() {
  const ws = useWorkspaceGate();

  if (!ws?.id) return <div className="h-40 animate-pulse rounded-2xl bg-[#E2D8E0] dark:bg-[#4A2E46]" />; // WS-GATE

  return <UpgradePanel title="Analytics" />;
}
