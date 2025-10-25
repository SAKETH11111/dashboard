import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardInitiativesTable } from "@/components/dashboard-initiatives-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { WaterCards } from "@/components/water/water-cards"
import { WaterOverviewCards } from "@/components/water/water-overview-cards"

export default function Page() {
  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <WaterOverviewCards />
              <WaterCards />
              <DashboardInitiativesTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
