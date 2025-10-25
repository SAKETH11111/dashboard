"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { UserPreferencesProvider } from "@/hooks/use-user-preferences"

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient())

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <UserPreferencesProvider>{children}</UserPreferencesProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}


