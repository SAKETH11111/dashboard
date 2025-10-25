"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader() {
  return (
    <div className="flex items-center gap-2 pb-3">
      <SidebarTrigger />
      <div className="mx-2 h-5 w-px bg-foreground/30 dark:bg-foreground/40" />
      <h1 className="text-lg font-semibold">Dashboard</h1>
    </div>
  )
}


