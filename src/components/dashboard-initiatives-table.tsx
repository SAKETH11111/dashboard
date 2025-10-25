"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"

import type { Initiative } from "@/types/initiatives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type InitiativesResponse = {
  initiatives: Initiative[]
  updatedAt: string | null
}

export function DashboardInitiativesTable() {
  const initiativesQuery = useQuery<InitiativesResponse>({
    queryKey: ["initiatives-dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/initiatives", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Failed to load initiatives (${response.status})`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 30,
  })

  const initiativesData = initiativesQuery.data?.initiatives ?? null
  const dataset = useMemo(() => initiativesData ?? [], [initiativesData])

  const topRows = useMemo(
    () =>
      dataset
        .slice()
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5),
    [dataset]
  )

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/95 p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-tight">Flagship UN Climate Initiatives</h2>
          <p className="text-sm text-muted-foreground">
            Live feed curated from UNEP, UNDP, UNFCCC, and GCF programmes. Track status and momentum in one glance.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/initiatives">View full initiatives board</Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Initiative</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[160px]">Tags</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="text-right">Votes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initiativesQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={6} className="py-3">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : initiativesQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  {(initiativesQuery.error instanceof Error
                    ? initiativesQuery.error.message
                    : "Failed to load initiatives.")}
                </TableCell>
              </TableRow>
            ) : topRows.length ? (
              topRows.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25, ease: "easeOut" }}
                  className="border-border/80"
                >
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <Link href={`/initiatives#${item.id}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">{item.branch}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[0.65rem] font-medium">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.lastUpdated))}
                  </TableCell>
                  <TableCell className="py-3 text-right text-sm font-semibold tabular-nums">
                    {item.votes.toLocaleString()}
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  No initiatives available yet. Check back soon.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
