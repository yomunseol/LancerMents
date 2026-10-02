import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";

export const metadata: Metadata = {
  title: "LancerMents — Dashboard",
};

export default function DashboardPage() {
  return <Dashboard />;
}
