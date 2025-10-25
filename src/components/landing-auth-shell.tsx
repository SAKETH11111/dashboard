"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowRight,
  CheckCircle,
  Globe2,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const weeklySchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

const featureItems = [
  {
    title: "Real-time climate monitoring",
    description: "Daily updates from NOAA, NASA, ECMWF, and the UN climate data hubs.",
  },
  {
    title: "Personalised insights",
    description: "Save favourite metrics and tailor the dashboard to your region of interest.",
  },
  {
    title: "Weekly climate briefings",
    description: "Receive Monday morning summaries with key indicators and curated headlines.",
  },
]

export function LandingAuthShell() {
  const router = useRouter()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const weeklyForm = useForm<z.infer<typeof weeklySchema>>({
    resolver: zodResolver(weeklySchema),
    defaultValues: { email: "" },
  })

  const primaryFeature = useMemo(
    () => featureItems[0],
    []
  )

  const handleLogin = loginForm.handleSubmit((values) => {
    toast.success("Welcome back!", {
      description: `Signed in as ${values.email}`,
    })
    router.push("/dashboard")
  })

  const handleSignup = signupForm.handleSubmit((values) => {
    toast.success("Account created", {
      description: `Check ${values.email} to confirm your account.`,
    })
    router.push("/dashboard")
  })

  const handleWeekly = weeklyForm.handleSubmit((values) => {
    toast.success("You're on the list!", {
      description: `Weekly summary will be delivered to ${values.email}`,
    })
    weeklyForm.reset()
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.15),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.18),_transparent_60%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-24 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-12">
        <div className="flex flex-1 flex-col gap-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              <Globe2 className="size-3.5" />
              UN Climate Dashboard
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Real-time climate intelligence for teams that need to move faster than the crisis.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Track live atmospheric signals, sea-level shifts, ecosystem stressors, and energy transitions—then automate Monday morning briefings for your stakeholders.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-white/70 p-5 backdrop-blur dark:border-emerald-500/30 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {primaryFeature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{primaryFeature.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700/80 dark:text-emerald-200/90">
                <CheckCircle className="size-4" />
                Powered by NOAA, NASA, ECMWF, and UNEP feeds
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/70 p-5 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60">
              {featureItems.slice(1).map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button asChild size="lg" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-600/90">
                  <Link href="/dashboard">
                    Continue as Guest
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Jump straight into the live dashboard—no account required.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80">
            <Tabs defaultValue="login" className="w-full">
              <TabsList>
                <TabsTrigger value="login" className="flex items-center gap-1">
                  <Lock className="size-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-1">
                  <UserPlus className="size-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Welcome back</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Access your starred metrics, saved regional filters, and weekly briefings.
                    </p>
                  </div>
                  <Form {...loginForm}>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <FormFieldItem
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.org" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormFieldItem
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" autoComplete="current-password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full gap-2">
                        Login
                        <ArrowRight className="size-4" />
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create your workspace</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Save dashboards, schedule weekly briefs, and collaborate with your team.
                    </p>
                  </div>
                  <Form {...signupForm}>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <FormFieldItem
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="Amelia Clark" autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormFieldItem
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="amelia@agency.gov" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormFieldItem
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a strong password" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Minimum 8 characters with numbers and symbols recommended.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full gap-2">
                        Create account
                        <ArrowRight className="size-4" />
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <Mail className="size-5 text-emerald-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Weekly climate hook
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Every Monday at 09:00 UTC we send a concise briefing—temperature, CO₂, sea level, and the three UN climate stories you can&apos;t miss.
            </p>
            <Form {...weeklyForm}>
              <form onSubmit={handleWeekly} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <FormFieldItem
                  control={weeklyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="sr-only">Email for weekly climate summary</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@organization.org" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="flex-none gap-2">
                  Join the briefing
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </Form>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              No spam, no sales—just the signals you need to brief leadership and communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
