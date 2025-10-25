import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardInitiativesTable } from "@/components/dashboard-initiatives-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { LocationPicker } from "@/components/water/location-picker"
import { WaterAdvisories } from "@/components/water/water-advisories"
import { WaterCards } from "@/components/water/water-cards"
import { WaterOverviewCards } from "@/components/water/water-overview-cards"
import { WaterTrendCard } from "@/components/water/water-trend-card"

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
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <WaterCards />
                  <WaterTrendCard
                    metric="nitrate"
                    title="Nitrate Trends"
                    description="Past 12 months of nitrate sampling across selected systems."
                    unit="mg/L"
                    colorVar="var(--chart-1)"
                    valueFormatter={(value) => `${value.toFixed(2)} mg/L`}
                    yAxisFormatter={(value) => value.toFixed(1)}
                  />
                </div>
                <div className="space-y-4">
                  <LocationPicker />
                  <WaterAdvisories />
                </div>
              </div>
              <DashboardInitiativesTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
