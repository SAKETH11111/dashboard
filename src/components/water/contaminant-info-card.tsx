"use client";

import { useState } from "react";
import {
  Info,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  WATER_THRESHOLDS,
  getThresholdForContaminant,
} from "@/lib/water/thresholds";
import type { ContaminantValue } from "@/types/water";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type ContaminantInfoCardProps = {
  contaminant: ContaminantValue;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
};

const STATUS_ICONS = {
  safe: CheckCircle,
  warn: Clock,
  alert: AlertTriangle,
  unknown: Info,
};

const STATUS_COLORS = {
  safe: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  alert: "text-red-600 dark:text-red-400",
  unknown: "text-muted-foreground",
};

export function ContaminantInfoCard({
  contaminant,
  className,
  showDetails = false,
  compact = false,
}: ContaminantInfoCardProps) {
  const [isOpen, setIsOpen] = useState(showDetails);
  const threshold = getThresholdForContaminant(contaminant);

  const StatusIcon = STATUS_ICONS.safe;
  const statusColor = STATUS_COLORS.safe;

  const formatValue = (value: number | undefined) => {
    if (value === undefined) return "Not set";
    if (value >= 100) return `${value.toFixed(0)}`;
    if (value >= 10) return `${value.toFixed(1)}`;
    if (value >= 1) return `${value.toFixed(2)}`;
    return `${value.toFixed(3)}`;
  };

  const getHealthImpact = (level: "safe" | "warn" | "alert") => {
    switch (level) {
      case "safe":
        return threshold.safeCopy;
      case "warn":
        return threshold.warnCopy;
      case "alert":
        return threshold.alertCopy;
      default:
        return "Status unknown. Check with local health authorities.";
    }
  };

  const getRegulatoryInfo = () => {
    const parts = [];
    if (threshold.mcl) {
      parts.push(`EPA MCL: ${formatValue(threshold.mcl)} ${threshold.unit}`);
    }
    if (threshold.healthAdvisory) {
      parts.push(
        `Health Advisory: ${formatValue(threshold.healthAdvisory)} ${
          threshold.unit
        }`
      );
    }
    return parts.join(" • ");
  };

  if (compact) {
    return (
      <Card
        className={cn("border-border/70 bg-card/90 backdrop-blur", className)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-sm">{threshold.label}</h3>
              <p className="text-xs text-muted-foreground">
                {threshold.mcl
                  ? `MCL: ${formatValue(threshold.mcl)} ${threshold.unit}`
                  : "No MCL set"}
              </p>
            </div>
            <StatusIcon className={cn("h-5 w-5", statusColor)} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn("border-border/70 bg-card/90 backdrop-blur", className)}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <StatusIcon className={cn("h-5 w-5", statusColor)} />
                  {threshold.label}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {threshold.notes}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {threshold.unit}
              </Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Regulatory Information */}
            <div className="rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2">
              <h4 className="text-xs font-semibold text-foreground/80 mb-2">
                Regulatory Standards
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {getRegulatoryInfo()}
              </p>
            </div>

            {/* Threshold Levels */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Threshold Levels</h4>
              <div className="grid grid-cols-1 gap-2">
                {threshold.warnLevel && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Warning Level:
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    >
                      {formatValue(threshold.warnLevel)} {threshold.unit}
                    </Badge>
                  </div>
                )}
                {threshold.alertLevel && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Alert Level:</span>
                    <Badge
                      variant="destructive"
                      className="bg-red-500/10 text-red-700 dark:text-red-300"
                    >
                      {formatValue(threshold.alertLevel)} {threshold.unit}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Health Impact Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Health Impact</h4>
              <div className="space-y-2">
                <div className="rounded-md bg-emerald-500/10 p-3 border border-emerald-500/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                        Safe Levels
                      </h5>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                        {threshold.safeCopy}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-amber-500/10 p-3 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                        Warning Levels
                      </h5>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        {threshold.warnCopy}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-red-500/10 p-3 border border-red-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                        Alert Levels
                      </h5>
                      <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                        {threshold.alertCopy}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Freshness */}
            <div className="rounded-md bg-blue-500/10 p-3 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    Data Freshness
                  </h5>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Data is considered current if samples are within{" "}
                    {threshold.freshnessDays} days. Older data may not reflect
                    current conditions.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {threshold.notes && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Additional Information</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {threshold.notes}
                </p>
              </div>
            )}

            {/* External Resources */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                <ExternalLink className="h-3 w-3 mr-2" />
                EPA Guidelines
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <ExternalLink className="h-3 w-3 mr-2" />
                Iowa DNR
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Utility component for displaying multiple contaminant cards
export function ContaminantInfoGrid({
  contaminants,
  className,
}: {
  contaminants: ContaminantValue[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {contaminants.map((contaminant) => (
        <ContaminantInfoCard key={contaminant} contaminant={contaminant} />
      ))}
    </div>
  );
}

// Compact grid for dashboard use
export function ContaminantInfoCompactGrid({
  contaminants,
  className,
}: {
  contaminants: ContaminantValue[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3",
        className
      )}
    >
      {contaminants.map((contaminant) => (
        <ContaminantInfoCard
          key={contaminant}
          contaminant={contaminant}
          compact
        />
      ))}
    </div>
  );
}
