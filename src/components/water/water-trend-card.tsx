"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { useWaterSeries } from "@/hooks/use-water-series";
import type { WaterPoint } from "@/types/water";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

type WaterTrendCardProps = {
  metric:
    | "nitrate"
    | "nitrite"
    | "bacteria"
    | "pfas"
    | "arsenic"
    | "dbp"
    | "fluoride";
  title: string;
  description: string;
  unit: string;
  colorVar: string;
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
};

export function WaterTrendCard({
  metric,
  title,
  description,
  unit,
  colorVar,
  valueFormatter,
  yAxisFormatter,
}: WaterTrendCardProps) {
  const query = useWaterSeries(metric);

  const chartConfig = React.useMemo<ChartConfig>(
    () => ({
      value: { label: unit, color: colorVar },
    }),
    [unit, colorVar]
  );

  const formatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }),
    []
  );

  const { chartData, latestValue, latestDate, trend } = React.useMemo(() => {
    if (!query.data) {
      return {
        chartData: [] as { date: string; label: string; value: number }[],
        latestValue: null,
        latestDate: null,
        trend: null,
      };
    }

    // Filter to last year only
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filtered = query.data.points.filter((pt) => {
      if (pt.value === null) return false;
      const date = new Date(pt.date);
      return date >= oneYearAgo;
    });

    const downsampled = downsample(filtered, 120); // 120 points for smooth trend
    const data = downsampled.map((point) => ({
      date: point.date,
      label: formatter.format(new Date(point.date)),
      value: point.value as number,
    }));

    const latest = filtered
      .slice()
      .reverse()
      .find((pt) => pt.value !== null);

    // Calculate trend (simple linear regression slope)
    let trend = null;
    if (data.length >= 2) {
      const values = data.map((d) => d.value).filter((v) => v !== null);
      if (values.length >= 2) {
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        trend = slope;
      }
    }

    return {
      chartData: data,
      latestValue: latest?.value ?? null,
      latestDate: latest?.date ?? null,
      trend,
    };
  }, [query.data, formatter]);

  const headerValue = React.useMemo(() => {
    if (latestValue === null) return "--";
    return valueFormatter
      ? valueFormatter(latestValue)
      : `${latestValue.toFixed(2)} ${unit}`;
  }, [latestValue, valueFormatter, unit]);

  const headerDate = latestDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(latestDate)
      )
    : null;

  const trendText = React.useMemo(() => {
    if (trend === null) return null;
    const isIncreasing = trend > 0;
    const isDecreasing = trend < 0;
    const isStable = Math.abs(trend) < 0.01;

    if (isStable) return "Stable";
    if (isIncreasing) return "Increasing";
    if (isDecreasing) return "Decreasing";
    return null;
  }, [trend]);

  const content = () => {
    if (query.isLoading) {
      return <ChartSkeleton />;
    }
    if (query.isError) {
      return <ChartError message="Unable to load data" />;
    }
    if (!chartData.length) {
      return <ChartError message="No data available" />;
    }
    return (
      <ChartContainer className="h-[200px] w-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ left: 12, right: 12, top: 12, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.4}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  className="min-w-[160px]"
                  formatter={(value) => {
                    const numericValue =
                      typeof value === "number" ? value : Number(value);
                    if (valueFormatter && !Number.isNaN(numericValue)) {
                      return valueFormatter(numericValue);
                    }
                    return value?.toString() ?? "";
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colorVar}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  };

  return (
    <Card className="@container/card">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums">
              {headerValue}
            </div>
            {headerDate && (
              <div className="text-xs text-muted-foreground">
                Updated {headerDate}
              </div>
            )}
            {trendText && (
              <div className="text-xs text-muted-foreground">
                Trend: {trendText}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{content()}</CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Source: {query.data?.source ?? "--"}
        </p>
      </CardFooter>
    </Card>
  );
}

function downsample(points: WaterPoint[], maxPoints: number) {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const result: WaterPoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    result.push(points[i]);
  }
  return result;
}

function ChartSkeleton() {
  return (
    <div className="flex h-[200px] w-full flex-col justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-[160px] w-full" />
    </div>
  );
}

function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-[160px] items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}
