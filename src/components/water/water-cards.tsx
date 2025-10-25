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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type RangeOption = "1y" | "5y" | "all";

type WaterCardProps = {
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
  status: "safe" | "warn" | "alert";
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
};

const rangeOptions: { label: string; value: RangeOption }[] = [
  { label: "1 year", value: "1y" },
  { label: "5 years", value: "5y" },
  { label: "All", value: "all" },
];

const statusConfig = {
  safe: { color: "bg-green-500", label: "Safe", variant: "default" as const },
  warn: {
    color: "bg-yellow-500",
    label: "Warning",
    variant: "secondary" as const,
  },
  alert: {
    color: "bg-red-500",
    label: "Alert",
    variant: "destructive" as const,
  },
};

export function WaterCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <WaterCard
        metric="nitrate"
        title="Nitrate"
        description="Nitrate levels in drinking water"
        unit="mg/L"
        colorVar="var(--chart-1)"
        status="safe"
        valueFormatter={(value) => `${value.toFixed(2)} mg/L`}
        yAxisFormatter={(value) => value.toFixed(1)}
      />
      <WaterCard
        metric="bacteria"
        title="Bacteria (E. coli)"
        description="E. coli levels in recreational water"
        unit="CFU/100mL"
        colorVar="var(--chart-2)"
        status="warn"
        valueFormatter={(value) => `${value.toFixed(0)} CFU/100mL`}
        yAxisFormatter={(value) => value.toFixed(0)}
      />
      <WaterCard
        metric="pfas"
        title="PFAS"
        description="Per- and polyfluoroalkyl substances"
        unit="ng/L"
        colorVar="var(--chart-3)"
        status="alert"
        valueFormatter={(value) => `${value.toFixed(1)} ng/L`}
        yAxisFormatter={(value) => value.toFixed(0)}
      />
      <WaterCard
        metric="arsenic"
        title="Arsenic"
        description="Arsenic levels in drinking water"
        unit="μg/L"
        colorVar="var(--chart-4)"
        status="safe"
        valueFormatter={(value) => `${value.toFixed(1)} μg/L`}
        yAxisFormatter={(value) => value.toFixed(0)}
      />
      <WaterCard
        metric="dbp"
        title="Disinfection Byproducts"
        description="Total trihalomethanes and haloacetic acids"
        unit="μg/L"
        colorVar="var(--chart-5)"
        status="safe"
        valueFormatter={(value) => `${value.toFixed(1)} μg/L`}
        yAxisFormatter={(value) => value.toFixed(0)}
      />
      <WaterCard
        metric="fluoride"
        title="Fluoride"
        description="Fluoride levels in drinking water"
        unit="mg/L"
        colorVar="var(--chart-6)"
        status="safe"
        valueFormatter={(value) => `${value.toFixed(2)} mg/L`}
        yAxisFormatter={(value) => value.toFixed(1)}
      />
    </div>
  );
}

function WaterCard({
  metric,
  title,
  description,
  unit,
  colorVar,
  status,
  valueFormatter,
  yAxisFormatter,
}: WaterCardProps) {
  const query = useWaterSeries(metric);
  const [range, setRange] = React.useState<RangeOption>("1y");

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
        year: range === "1y" ? undefined : "numeric",
        day: range === "1y" ? "numeric" : undefined,
      }),
    [range]
  );

  const { chartData, latestValue, latestDate } = React.useMemo(() => {
    if (!query.data) {
      return {
        chartData: [] as { date: string; label: string; value: number }[],
        latestValue: null,
        latestDate: null,
      };
    }
    const filtered = filterByRange(query.data.points, range);
    const downsampled = downsample(filtered, 180);
    const data = downsampled.map((point) => ({
      date: point.date,
      label: formatter.format(new Date(point.date)),
      value: point.value as number,
    }));
    const latest = filtered
      .slice()
      .reverse()
      .find((pt) => pt.value !== null);
    return {
      chartData: data,
      latestValue: latest?.value ?? null,
      latestDate: latest?.date ?? null,
    };
  }, [query.data, formatter, range]);

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
      <ChartContainer className="h-[260px] w-full" config={chartConfig}>
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
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={statusConfig[status].variant}>
            {statusConfig[status].label}
          </Badge>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value: RangeOption) => value && setRange(value)}
            variant="outline"
            className="hidden justify-end gap-1 @[640px]/card:flex *:data-[slot=toggle-group-item]:!px-3"
          >
            {rangeOptions.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            value={range}
            onValueChange={(value: RangeOption) => setRange(value)}
          >
            <SelectTrigger className="w-36 @[640px]/card:hidden" size="sm">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

function filterByRange(points: WaterPoint[], range: RangeOption) {
  if (range === "all") {
    return points.filter((pt) => pt.value !== null);
  }
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - (range === "1y" ? 1 : 5));
  return points.filter((pt) => {
    if (pt.value === null) return false;
    const date = new Date(pt.date);
    return date >= cutoff;
  });
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
    <div className="flex h-[260px] w-full flex-col justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-[220px] w-full" />
    </div>
  );
}

function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}
