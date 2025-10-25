"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChangeDirection = "up" | "down" | "flat"

interface IndicatorCardProps {
  title: string
  value: string
  unit?: string
  change?: number
  changeDirection?: ChangeDirection
  changeLabel?: string
  description?: string
  progress?: number
  onViewTrend?: () => void
  className?: string
  cadence?: "Daily" | "Monthly" | "Annual" | "Quarterly"
}

const changeIcon: Record<ChangeDirection, typeof ArrowUpRight> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
}

export function IndicatorCard({
  title,
  value,
  unit,
  change,
  changeDirection = "flat",
  changeLabel,
  description,
  progress,
  className,
  onViewTrend,
  cadence,
}: IndicatorCardProps) {
  const clickable = Boolean(onViewTrend)
  const handleActivate = () => {
    if (onViewTrend) {
      onViewTrend()
    }
  }

  const Icon = changeIcon[changeDirection]
  const formattedChange =
    typeof change === "number"
      ? `${changeDirection === "down" ? "" : "+"}${change}${unit ? (unit === "%" ? unit : ` ${unit}`) : "%"}`
      : undefined

  return (
    <Card
      className={cn(
        "h-full border-border",
        clickable && "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleActivate : undefined}
      onKeyDown={clickable ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleActivate()
        }
      } : undefined}
    >
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              {cadence && (
                <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                  {cadence}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {value}
              {unit && unit !== "%" && (
                <span className="text-base font-medium text-muted-foreground"> {unit}</span>
              )}
            </div>
          </div>
          {formattedChange && (
            <Badge variant="outline" className="gap-1">
              <Icon className="size-3" />
              {formattedChange}
            </Badge>
          )}
        </div>
        {changeLabel && (
          <p className="text-xs text-muted-foreground">{changeLabel}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
              />
            </div>
          </div>
        )}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardContent>
      <CardFooter className="justify-end">
        {onViewTrend && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={(event) => {
              event.stopPropagation()
              onViewTrend()
            }}
            type="button"
          >
            View trend
            <ArrowUpRight className="size-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
