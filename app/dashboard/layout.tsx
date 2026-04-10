// Dashboard route wrapper that mounts the authenticated app shell around all dashboard pages.

import { AppShell } from "@/components/app-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
