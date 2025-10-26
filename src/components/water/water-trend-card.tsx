"use client";

import { useWaterSeries } from "@/hooks/use-water-series";
import { WATER_THRESHOLDS } from "@/lib/water/thresholds";
import type { ContaminantValue } from "@/types/water";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

type WaterTrendCardProps = {
  contaminant: ContaminantValue;
  title?: string;
  description?: string;
  className?: string;
};

const STATUS_BADGES: Record<string, string> = {
  safe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
  alert:
    "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
  unknown: "bg-muted text-muted-foreground border border-border",
};

const STATUS_COLORS: Record<string, string> = {
  safe: "#10b981", // emerald-500
  warn: "#f59e0b", // amber-500
  alert: "#ef4444", // red-500
  unknown: "#6b7280", // gray-500
};

function formatChartData(
  points: Array<{ date: string; value: number | null }>
): TrendDatum[] {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return points
    .filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= oneYearAgo && point.value !== null;
    })
    .map((point) => ({
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: point.value!,
      fullDate: point.date,
    }))
    .slice(-12); // Last 12 data points for readability
}

type TrendDatum = {
  date: string
  value: number
  fullDate: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as TrendDatum | undefined
    if (!data) return null
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          Value: <span className="font-mono">{data.value}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(data.fullDate).toLocaleDateString()}
        </p>
      </div>
    );
  }
  return null;
}

export function WaterTrendCard({
  contaminant,
  title,
  description,
  className,
}: WaterTrendCardProps) {
  const { data: series, isLoading, error } = useWaterSeries(contaminant);

  const threshold = WATER_THRESHOLDS[contaminant];
  const displayTitle = title || threshold.label;
  const displayDescription =
    description || `12-month trend for ${threshold.label.toLowerCase()} levels`;

  if (isLoading) {
    return (
      <Card
        className={cn("border-border/70 bg-card/90 backdrop-blur", className)}
      >
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !series) {
    return (
      <Card className={cn("border-dashed border-border/50", className)}>
        <CardHeader>
          <CardTitle>{displayTitle}</CardTitle>
          <CardDescription>{displayDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load trend data. {error?.message || "No data available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = formatChartData(series.points);
  const latestValue = chartData[chartData.length - 1]?.value;
  const statusColor = STATUS_COLORS[series.status] || STATUS_COLORS.unknown;
  const badgeClass = STATUS_BADGES[series.status] || STATUS_BADGES.unknown;

  return (
    <Card
      className={cn("border-border/70 bg-card/90 backdrop-blur", className)}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{displayTitle}</CardTitle>
            <CardDescription className="line-clamp-2">
              {displayDescription}
            </CardDescription>
          </div>
          <Badge
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase",
              badgeClass
            )}
          >
            {series.status === "warn"
              ? "Monitor"
              : series.status === "alert"
              ? "Advisory"
              : series.status === "safe"
              ? "Safe"
              : "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length > 0 ? (
          <>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    domain={["dataMin", "dataMax"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={statusColor}
                    fill={statusColor}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Latest: </span>
                <span className="font-mono font-medium">
                  {latestValue?.toFixed(latestValue >= 1 ? 1 : 2)} {series.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {chartData.length} data points
              </div>
            </div>

            {threshold.alertLevel && (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground/80">
                    Threshold:{" "}
                  </span>
                  {threshold.alertLevel} {threshold.unit}
                </div>
                <div className="mt-1">{series.source}</div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <p>No trend data available</p>
              <p className="text-xs">Check back for updated samples</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
