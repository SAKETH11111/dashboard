"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GlobalSearch } from "@/components/global-search"
import { SimpleThemeToggle } from "@/components/simple-theme-toggle"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { usePathname } from "next/navigation"
import * as React from "react"

function getTitleFromPath(pathname: string | null): string {
  if (!pathname) return "Home"
  if (pathname.startsWith("/dashboard") || pathname === "/") return "Dashboard"
  if (pathname.startsWith("/news")) return "News"
  if (pathname.startsWith("/initiatives")) return "Initiatives"
  if (pathname.startsWith("/explorer")) return "Data Explorer"

  const parts = pathname.split("/").filter(Boolean)
  const last = parts[parts.length - 1] || "home"
  return last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname()
  const computed = React.useMemo(() => title ?? getTitleFromPath(pathname), [title, pathname])
  const { preferences } = useUserPreferences()

  const greeting = React.useMemo(() => {
    if (!preferences?.name) return "Welcome"
    const parts = preferences.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    if (!parts.length) return "Welcome"
    const initial = parts[1]?.charAt(0)?.toUpperCase()
    const display = initial ? `${parts[0]} ${initial}.` : parts[0]
    return `Welcome, ${display}`
  }, [preferences?.name])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col text-sm">
          <span className="text-xs text-muted-foreground">{greeting}</span>
          <h1 className="text-base font-medium leading-tight">{computed}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch />
          <SimpleThemeToggle />
        </div>
      </div>
    </header>
  )
}
