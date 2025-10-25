import type { CSSProperties } from "react"

import { Loader2, RefreshCw } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { InitiativesBoard } from "@/components/initiatives-board"
import { FlickeringGrid } from "@/components/magicui/flickering-grid"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export const metadata = {
  title: "UN Climate Initiatives | UN Climate Dashboard",
  description: "Explore priority UN climate initiatives with filters, upvotes, and notes.",
}

export default function InitiativesPage() {
  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="relative flex flex-1 flex-col">
          <div className="absolute left-0 top-0 w-full">
            <FlickeringGrid className="h-[220px] w-full [mask-image:linear-gradient(to_top,transparent_25%,black_95%)]" />
          </div>

          <div className="relative flex flex-1 flex-col gap-6 py-6">
            <header className="flex flex-col gap-4 border-b border-border/70 bg-background/70 px-4 pb-6 lg:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                    UN Climate Initiatives Board
                  </h1>
                  <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                    Track flagship programmes across UN agencies, align action with climate metrics, and keep your local notes in sync with the latest updates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 border border-border"
                    disabled
                  >
                    <Loader2 className="size-3.5 animate-spin" />
                    Syncing data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled
                  >
                    <RefreshCw className="size-3.5" />
                    Coming soon
                  </Button>
                </div>
              </div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Updated with the latest agency programmes and community votes.
              </p>
            </header>
            <InitiativesBoard />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
