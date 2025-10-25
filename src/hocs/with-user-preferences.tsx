"use client"

import type { ComponentType } from "react"

import { useUserPreferences } from "@/hooks/use-user-preferences"

export function withUserPreferences<P extends object>(Component: ComponentType<P>) {
  function WithUserPreferences(props: P) {
    const { preferences, updatePreferences } = useUserPreferences()

    return <Component {...props} preferences={preferences} updatePreferences={updatePreferences} />
  }

  WithUserPreferences.displayName = `withUserPreferences(${Component.displayName ?? Component.name ?? "Component"})`

  return WithUserPreferences
}


