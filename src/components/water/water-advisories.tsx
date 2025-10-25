"use client";

import * as React from "react";
import { useWaterAdvisories } from "@/hooks/use-water-series";
import type { Advisory } from "@/types/water";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const advisoryIcons = {
  boil: Droplets,
  swim: AlertTriangle,
  pfas: Shield,
};

const advisoryColors = {
  boil: "bg-blue-500",
  swim: "bg-yellow-500",
  pfas: "bg-red-500",
};

const severityColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

export function WaterAdvisories() {
  const { data: advisories, isLoading, error } = useWaterAdvisories();

  if (isLoading) {
    return <AdvisoriesSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Water Advisories</CardTitle>
          <CardDescription>
            Current water quality advisories and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Unable to load advisories
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!advisories || advisories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Water Advisories</CardTitle>
          <CardDescription>
            Current water quality advisories and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            No active advisories
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Water Advisories</CardTitle>
        <CardDescription>
          Current water quality advisories and alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {advisories.map((advisory: Advisory) => (
            <AdvisoryItem key={advisory.id} advisory={advisory} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AdvisoryItem({ advisory }: { advisory: Advisory }) {
  const Icon = advisoryIcons[advisory.type];
  const colorClass = advisoryColors[advisory.type];
  const severityClass = severityColors[advisory.severity];

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const isExpired =
    advisory.expiresAt && new Date(advisory.expiresAt) < new Date();

  return (
    <div
      className={`rounded-lg border p-4 ${severityClass} ${
        isExpired ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-full p-2 ${colorClass} text-white`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{advisory.title}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {advisory.type.toUpperCase()}
              </Badge>
              {isExpired && (
                <Badge variant="secondary" className="text-xs">
                  EXPIRED
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm">{advisory.description}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {advisory.location && <span>Location: {advisory.location}</span>}
              {advisory.systemId && <span>System: {advisory.systemId}</span>}
            </div>
            <div>
              Issued: {formatDate(advisory.issuedAt)}
              {advisory.expiresAt && (
                <span> • Expires: {formatDate(advisory.expiresAt)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvisoriesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Water Advisories</CardTitle>
        <CardDescription>
          Current water quality advisories and alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
