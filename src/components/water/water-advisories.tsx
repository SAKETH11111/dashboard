"use client";

import { useWaterAdvisories } from "@/hooks/use-water-series";
import type { WaterAdvisory } from "@/types/water";
import { AlertTriangle, ExternalLink, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type WaterAdvisoriesProps = {
  className?: string;
  showTitle?: boolean;
  maxItems?: number;
};

const ADVISORY_COLORS = {
  boil: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
  swim: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20",
  pfas: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20",
};

const SEVERITY_COLORS = {
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  high: "bg-red-500/10 text-red-700 dark:text-red-300",
};

function AdvisoryCard({ advisory }: { advisory: WaterAdvisory }) {
  const advisoryColor = ADVISORY_COLORS[advisory.type] || ADVISORY_COLORS.boil;
  const severityColor = advisory.severity
    ? SEVERITY_COLORS[advisory.severity]
    : "";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isExpired =
    advisory.expiresAt && new Date(advisory.expiresAt) < new Date();
  const isActive = !isExpired && new Date(advisory.issuedAt) <= new Date();

  return (
    <Card
      className={cn(
        "border-border/70 bg-card/90 backdrop-blur transition-all hover:shadow-md",
        !isActive && "opacity-60"
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {advisory.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {advisory.summary || advisory.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            <Badge
              className={cn(
                "rounded-full px-2 py-1 text-xs font-semibold uppercase",
                advisoryColor
              )}
            >
              {advisory.type}
            </Badge>
            {advisory.severity && (
              <Badge variant="outline" className={cn("text-xs", severityColor)}>
                {advisory.severity}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {advisory.description && advisory.description !== advisory.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {advisory.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Issued {formatDate(advisory.issuedAt)}</span>
          </div>

          {advisory.expiresAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={isExpired ? "text-red-500" : ""}>
                {isExpired ? "Expired" : "Expires"}{" "}
                {formatDate(advisory.expiresAt)}
              </span>
            </div>
          )}

          {advisory.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{advisory.location}</span>
            </div>
          )}
        </div>

        {advisory.affectedSystems && advisory.affectedSystems.length > 0 && (
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium text-foreground/80 mb-1">
              Affected Systems:
            </p>
            <div className="flex flex-wrap gap-1">
              {advisory.affectedSystems.slice(0, 3).map((system) => (
                <Badge key={system} variant="secondary" className="text-xs">
                  {system}
                </Badge>
              ))}
              {advisory.affectedSystems.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{advisory.affectedSystems.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {advisory.sourceUrl && (
          <Button variant="outline" size="sm" asChild className="w-full">
            <a
              href={advisory.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              View Source
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function WaterAdvisories({
  className,
  showTitle = true,
  maxItems = 5,
}: WaterAdvisoriesProps) {
  const { data: series, isLoading, error } = useWaterAdvisories();

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {showTitle && <Skeleton className="h-8 w-48" />}
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className={cn("space-y-4", className)}>
        {showTitle && (
          <h2 className="text-2xl font-semibold tracking-tight">
            Water Advisories
          </h2>
        )}
        <Card className="border-dashed border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Unable to load advisories.{" "}
              {error?.message || "No advisory data available."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const advisories = series.advisories || [];
  const activeAdvisories = advisories
    .filter((advisory) => {
      const isExpired =
        advisory.expiresAt && new Date(advisory.expiresAt) < new Date();
      const isActive = !isExpired && new Date(advisory.issuedAt) <= new Date();
      return isActive;
    })
    .sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    )
    .slice(0, maxItems);

  const expiredAdvisories = advisories
    .filter((advisory) => {
      const isExpired =
        advisory.expiresAt && new Date(advisory.expiresAt) < new Date();
      return isExpired;
    })
    .sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    )
    .slice(0, 2);

  return (
    <div className={cn("space-y-4", className)}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Water Advisories
          </h2>
          <Badge variant="secondary" className="text-xs">
            {activeAdvisories.length} active
          </Badge>
        </div>
      )}

      {activeAdvisories.length > 0 ? (
        <div className="grid gap-4">
          {activeAdvisories.map((advisory) => (
            <AdvisoryCard key={advisory.id} advisory={advisory} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-foreground">
                No Active Advisories
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                All water systems are operating normally
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {expiredAdvisories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recent Expired Advisories
          </h3>
          <div className="grid gap-2">
            {expiredAdvisories.map((advisory) => (
              <AdvisoryCard key={advisory.id} advisory={advisory} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
