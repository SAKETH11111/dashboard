"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Settings2, LogOut } from "lucide-react"
import type { CSSProperties } from "react"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormFieldItem,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  defaultPreferences,
  STORAGE_KEY,
  useUserPreferences,
} from "@/hooks/use-user-preferences"

const departmentOptions = [
  "Department of Economic and Social Affairs",
  "Department of Political and Peacebuilding Affairs",
  "Department of Peace Operations",
  "United Nations Environment Programme",
  "Office for the Coordination of Humanitarian Affairs",
  "United Nations Development Programme",
]

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(80, { message: "Name must be 80 characters or fewer" }),
  email: z
    .string()
    .email({ message: "Enter a valid email address" }),
  city: z
    .string()
    .min(2, { message: "City must be at least 2 characters" }),
  department: z
    .string()
    .min(2, { message: "Department must be at least 2 characters" }),
  defaultMetric: z.enum([
    "temp",
    "co2",
    "sea-ice",
    "sea-level",
    "methane",
    "enso",
    "ocean-heat",
    "electricity-mix",
    "forest-area",
    "deforestation-alerts",
  ]),
  units: z.enum(["metric", "imperial"]),
})

type SettingsFormValues = z.infer<typeof formSchema>

const metricLabels: Record<SettingsFormValues["defaultMetric"], string> = {
  temp: "Temperature anomaly",
  co2: "Atmospheric CO₂",
  "sea-ice": "Arctic sea ice extent",
  "sea-level": "Global mean sea level",
  methane: "Atmospheric methane concentration",
  enso: "ENSO index",
  "ocean-heat": "Ocean heat content",
  "electricity-mix": "Electricity from renewables",
  "forest-area": "Global forest area",
  "deforestation-alerts": "Deforestation alerts",
}

export default function SettingsPage() {
  const { preferences, updatePreferences, setPreferences } = useUserPreferences()

  const profileValues = useMemo<SettingsFormValues>(
    () => ({
      name: preferences.name,
      email: preferences.email,
      city: preferences.city,
      department: preferences.department,
      defaultMetric: preferences.defaultMetric,
      units: preferences.units,
    }),
    [
      preferences.city,
      preferences.department,
      preferences.defaultMetric,
      preferences.email,
      preferences.name,
      preferences.units,
    ]
  )

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: profileValues,
    mode: "onBlur",
  })

  useEffect(() => {
    form.reset(profileValues)
  }, [form, profileValues])

  const onSubmit = (values: SettingsFormValues) => {
    updatePreferences(values)
    toast.success("Preferences updated", {
      description: "Your dashboard metrics now reflect the latest settings.",
    })
  }

  const handleLogout = () => {
    if (typeof window === "undefined") return

    const keysToClear = [
      STORAGE_KEY,
      "climate-dataset-notes",
      "climate-pinned-datasets",
      "un-climate:lists-migrated",
    ]
    keysToClear.forEach((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // Ignore storage cleanup errors
      }
    })

    const resetPreferences = {
      ...defaultPreferences,
      lists: defaultPreferences.lists.map((list) => ({
        ...list,
        datasetIds: [...list.datasetIds],
      })),
    }

    setPreferences(resetPreferences)
    window.location.href = "/"
  }

  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Settings" />
        <div className="flex flex-1 flex-col">
          <div className="relative flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <Card className="max-w-4xl border-border/70 bg-background/70">
              <CardHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Settings2 className="size-4" />
                  <span className="text-xs uppercase tracking-wide">Profile</span>
                </div>
                <CardTitle className="text-2xl font-semibold">Your climate profile</CardTitle>
                <CardDescription>
                  Manage how the dashboard greets you, which data loads first, and how we format units.
                </CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormFieldItem
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input placeholder="Sara Ahmed" {...field} />
                            </FormControl>
                            <FormDescription>This name appears in the sidebar and greeting.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormFieldItem
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="sara.ahmed@example.org" type="email" autoComplete="email" {...field} />
                            </FormControl>
                            <FormDescription>We use this for your optional weekly summary.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                      <FormFieldItem
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary city</FormLabel>
                            <FormControl>
                              <Input placeholder="Nairobi, KE" autoComplete="address-level2" {...field} />
                            </FormControl>
                            <FormDescription>
                              Helps us highlight city-specific insights when they’re available.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormFieldItem
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 xl:col-span-2">
                            <FormLabel>UN department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departmentOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              We use this to tailor briefing summaries and navigation labels.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormFieldItem
                        control={form.control}
                        name="units"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred units</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select units" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="metric">Metric (°C, km²)</SelectItem>
                                <SelectItem value="imperial">Imperial (°F, mi²)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>Unit conversions apply wherever we surface weather-style metrics.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormFieldItem
                      control={form.control}
                      name="defaultMetric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default dashboard metric</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full md:w-72">
                                <SelectValue placeholder="Choose a metric" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="temp">Temperature anomaly (°C)</SelectItem>
                              <SelectItem value="co2">Atmospheric CO₂ (ppm)</SelectItem>
                              <SelectItem value="sea-ice">Arctic sea ice extent (million km²)</SelectItem>
                              <SelectItem value="sea-level">Global mean sea level (mm)</SelectItem>
                              <SelectItem value="methane">Atmospheric methane (ppb)</SelectItem>
                              <SelectItem value="enso">ENSO index (°C anomaly)</SelectItem>
                              <SelectItem value="ocean-heat">Ocean heat content (10^22 J)</SelectItem>
                              <SelectItem value="electricity-mix">Electricity from renewables (%)</SelectItem>
                              <SelectItem value="forest-area">Global forest area (million ha)</SelectItem>
                              <SelectItem value="deforestation-alerts">Deforestation alerts (daily)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            We’ll highlight {metricLabels[field.value]} when you land on the dashboard.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-6 py-4">
                    <p className="text-xs text-muted-foreground">
                      Preferences save automatically to your device. Clear browser data to reset.
                    </p>
                    <Button type="submit" size="sm">
                      Save changes
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
            
            <Card className="max-w-3xl border-border/70 bg-background/70">
              <CardHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LogOut className="size-4" />
                  <span className="text-xs uppercase tracking-wide">Account</span>
                </div>
                <CardTitle className="text-2xl font-semibold">Sign out</CardTitle>
                <CardDescription>
                  Sign out of your account and return to the home page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      This will clear your local preferences and sign you out.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleLogout}
                    className="ml-4"
                  >
                    <LogOut className="size-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
