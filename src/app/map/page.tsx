"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { MapPin, Droplets, Waves, ToggleLeft, ToggleRight } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Mock water systems data - in real implementation this would come from API
const mockWaterSystems = [
  {
    id: "des-moines-water",
    name: "Des Moines Water Works",
    type: "drinking" as const,
    location: { lat: 41.5868, lng: -93.625 },
    status: "safe" as const,
    lastUpdated: "2024-01-15T10:30:00Z",
    contaminants: ["nitrate", "arsenic", "fluoride"] as any[],
  },
  {
    id: "cedar-rapids-water",
    name: "Cedar Rapids Water Department",
    type: "drinking" as const,
    location: { lat: 41.9778, lng: -91.6656 },
    status: "warn" as const,
    lastUpdated: "2024-01-14T15:45:00Z",
    contaminants: ["nitrate", "pfas", "dbp"] as any[],
  },
  {
    id: "lake-macbride",
    name: "Lake Macbride State Park",
    type: "recreational" as const,
    location: { lat: 41.8, lng: -91.4 },
    status: "alert" as const,
    lastUpdated: "2024-01-13T08:20:00Z",
    contaminants: ["bacteria"] as any[],
  },
  {
    id: "big-creek-lake",
    name: "Big Creek Lake",
    type: "recreational" as const,
    location: { lat: 41.7, lng: -93.8 },
    status: "safe" as const,
    lastUpdated: "2024-01-15T12:00:00Z",
    contaminants: ["bacteria"] as any[],
  },
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

export default function MapPage() {
  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties;

  const [showDrinking, setShowDrinking] = React.useState(true);
  const [showRecreational, setShowRecreational] = React.useState(true);
  const [selectedSystem, setSelectedSystem] = React.useState<string | null>(
    null
  );

  const filteredSystems = mockWaterSystems.filter((system) => {
    if (system.type === "drinking" && !showDrinking) return false;
    if (system.type === "recreational" && !showRecreational) return false;
    return true;
  });

  const selectedSystemData = selectedSystem
    ? mockWaterSystems.find((s) => s.id === selectedSystem)
    : null;

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 lg:grid-cols-3">
                {/* Map Controls */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Iowa Water Quality Map</CardTitle>
                    <CardDescription>
                      Interactive map showing water systems and recreational
                      sites
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Layer Controls */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Label htmlFor="drinking-toggle">
                            Drinking Water Systems
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="drinking-toggle"
                              checked={showDrinking}
                              onCheckedChange={setShowDrinking}
                            />
                            <Droplets className="h-4 w-4 text-blue-500" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recreational-toggle">
                            Recreational Sites
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="recreational-toggle"
                              checked={showRecreational}
                              onCheckedChange={setShowRecreational}
                            />
                            <Waves className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      </div>

                      {/* Map Placeholder */}
                      <div className="h-96 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Interactive map will be implemented here
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {filteredSystems.length} water systems visible
                          </p>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">Legend:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Safe</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Alert</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Water Systems</CardTitle>
                    <CardDescription>
                      Click on a system for details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredSystems.map((system) => (
                        <div
                          key={system.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${
                            selectedSystem === system.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedSystem(system.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm">
                                {system.name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {system.type}
                                </Badge>
                                <Badge
                                  variant={statusConfig[system.status].variant}
                                  className="text-xs"
                                >
                                  {statusConfig[system.status].label}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              {new Date(
                                system.lastUpdated
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selected System Details */}
              {selectedSystemData && (
                <Card className="mx-4 lg:mx-6">
                  <CardHeader>
                    <CardTitle>{selectedSystemData.name}</CardTitle>
                    <CardDescription>
                      Last updated:{" "}
                      {new Date(
                        selectedSystemData.lastUpdated
                      ).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">System Information</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="capitalize">
                              {selectedSystemData.type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <Badge
                              variant={
                                statusConfig[selectedSystemData.status].variant
                              }
                            >
                              {statusConfig[selectedSystemData.status].label}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Coordinates:</span>
                            <span className="font-mono text-xs">
                              {selectedSystemData.location.lat.toFixed(4)},{" "}
                              {selectedSystemData.location.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Monitored Contaminants</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedSystemData.contaminants.map(
                            (contaminant) => (
                              <Badge
                                key={contaminant}
                                variant="outline"
                                className="text-xs"
                              >
                                {contaminant}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
