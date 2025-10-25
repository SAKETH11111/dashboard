"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Layers, Info, Filter, ZoomIn, ZoomOut } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  LocationPicker,
  useLocationPreference,
} from "@/components/water/location-picker";
import type { WaterSystem } from "@/types/water";
import { Contaminant } from "@/types/water";
import { cn } from "@/lib/utils";

// Mock water systems data
const MOCK_WATER_SYSTEMS: WaterSystem[] = [
  {
    id: "des-moines-water-works",
    name: "Des Moines Water Works",
    type: "drinking",
    location: { lat: 41.5868, lng: -93.625 },
    status: "safe",
    lastUpdated: "2024-01-15T10:30:00Z",
    contaminants: [Contaminant.NITRATE, Contaminant.ARSENIC, Contaminant.DBP],
  },
  {
    id: "cedar-rapids-water",
    name: "Cedar Rapids Water Department",
    type: "drinking",
    location: { lat: 41.9778, lng: -91.6656 },
    status: "alert",
    lastUpdated: "2024-01-14T15:45:00Z",
    contaminants: [Contaminant.PFAS, Contaminant.NITRATE],
  },
  {
    id: "lake-macbride",
    name: "Lake Macbride State Park",
    type: "recreational",
    location: { lat: 41.8, lng: -91.5 },
    status: "alert",
    lastUpdated: "2024-01-13T08:20:00Z",
    contaminants: [Contaminant.ECOLI],
  },
  {
    id: "iowa-city-water",
    name: "Iowa City Water Department",
    type: "drinking",
    location: { lat: 41.6611, lng: -91.5302 },
    status: "safe",
    lastUpdated: "2024-01-15T12:00:00Z",
    contaminants: [Contaminant.ARSENIC, Contaminant.FLUORIDE],
  },
  {
    id: "waterloo-water-works",
    name: "Waterloo Water Works",
    type: "drinking",
    location: { lat: 42.4928, lng: -92.3422 },
    status: "safe",
    lastUpdated: "2024-01-14T09:15:00Z",
    contaminants: [Contaminant.FLUORIDE, Contaminant.DBP],
  },
  {
    id: "ames-water-utility",
    name: "Ames Water Utility",
    type: "drinking",
    location: { lat: 42.0308, lng: -93.6209 },
    status: "warn",
    lastUpdated: "2024-01-12T14:30:00Z",
    contaminants: [Contaminant.NITRATE, Contaminant.ARSENIC],
  },
];

const STATUS_COLORS = {
  safe: "#10b981", // emerald-500
  warn: "#f59e0b", // amber-500
  alert: "#ef4444", // red-500
};

const SYSTEM_TYPE_COLORS = {
  drinking: "#3b82f6", // blue-500
  recreational: "#8b5cf6", // violet-500
};

type MapViewport = {
  center: { lat: number; lng: number };
  zoom: number;
};

type MapFilters = {
  systemType: "drinking" | "recreational" | "all";
  status: "safe" | "warn" | "alert" | "all";
  contaminant: Contaminant | "all";
};

export default function MapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<MapViewport>({
    center: { lat: 41.878, lng: -93.0977 }, // Center of Iowa
    zoom: 7,
  });
  const [filters, setFilters] = useState<MapFilters>({
    systemType: "all",
    status: "all",
    contaminant: "all",
  });
  const [selectedSystem, setSelectedSystem] = useState<WaterSystem | null>(
    null
  );
  const [showLegend, setShowLegend] = useState(true);
  const { location } = useLocationPreference();

  const filteredSystems = MOCK_WATER_SYSTEMS.filter((system) => {
    if (filters.systemType !== "all" && system.type !== filters.systemType)
      return false;
    if (filters.status !== "all" && system.status !== filters.status)
      return false;
    if (
      filters.contaminant !== "all" &&
      !system.contaminants.includes(filters.contaminant)
    )
      return false;
    return true;
  });

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Iowa bounds: roughly lat 40.4 to 43.5, lng -96.6 to -90.1
    const iowaBounds = {
      north: 43.5,
      south: 40.4,
      east: -90.1,
      west: -96.6,
    };

    // Scale factors for mapping lat/lng to canvas coordinates
    const scaleX = canvas.width / (iowaBounds.east - iowaBounds.west);
    const scaleY = canvas.height / (iowaBounds.north - iowaBounds.south);

    // Draw Iowa outline (simplified)
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Simplified Iowa shape - using relative coordinates
    const margin = 20;
    ctx.moveTo(margin, margin);
    ctx.lineTo(canvas.width - margin, margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.closePath();
    ctx.stroke();

    // Draw water systems
    filteredSystems.forEach((system) => {
      // Convert lat/lng to canvas coordinates
      const x = (system.location.lng - iowaBounds.west) * scaleX;
      const y = (iowaBounds.north - system.location.lat) * scaleY;

      if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
        // Draw marker
        const statusColor = STATUS_COLORS[system.status];
        const systemTypeColor = SYSTEM_TYPE_COLORS[system.type];

        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = systemTypeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw system type indicator
        ctx.fillStyle = systemTypeColor;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    drawMap();

    // Handle window resize
    const handleResize = () => {
      drawMap();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [filters, viewport]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Iowa bounds for coordinate conversion
    const iowaBounds = {
      north: 43.5,
      south: 40.4,
      east: -90.1,
      west: -96.6,
    };

    const scaleX = canvas.width / (iowaBounds.east - iowaBounds.west);
    const scaleY = canvas.height / (iowaBounds.north - iowaBounds.south);

    // Find clicked system
    const clickedSystem = filteredSystems.find((system) => {
      const systemX = (system.location.lng - iowaBounds.west) * scaleX;
      const systemY = (iowaBounds.north - system.location.lat) * scaleY;
      const distance = Math.sqrt((x - systemX) ** 2 + (y - systemY) ** 2);
      return distance <= 12;
    });

    setSelectedSystem(clickedSystem || null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Water Quality Map
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Explore Iowa water systems and recreational sites. Click
                    markers to view details and advisories.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {filteredSystems.length} systems
                  </Badge>
                  <p>Filter by type, status, or contaminant.</p>
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <aside className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Filters
                  </h3>

                  <LocationPicker className="w-full" />

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      System Type
                    </h4>
                    <ToggleGroup
                      type="single"
                      value={filters.systemType}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          systemType: value as
                            | "drinking"
                            | "recreational"
                            | "all",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      <ToggleGroupItem
                        value="all"
                        className="text-xs font-medium"
                      >
                        All Systems
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="drinking"
                        className="text-xs font-medium"
                      >
                        Drinking Water
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="recreational"
                        className="text-xs font-medium"
                      >
                        Recreational
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Status
                    </h4>
                    <ToggleGroup
                      type="single"
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: value as "safe" | "warn" | "alert" | "all",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      <ToggleGroupItem
                        value="all"
                        className="text-xs font-medium"
                      >
                        All Status
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="safe"
                        className="text-xs font-medium"
                      >
                        Safe
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="warn"
                        className="text-xs font-medium"
                      >
                        Warning
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="alert"
                        className="text-xs font-medium"
                      >
                        Alert
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Contaminant
                    </h4>
                    <ToggleGroup
                      type="single"
                      value={filters.contaminant}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          contaminant: value as Contaminant | "all",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      <ToggleGroupItem
                        value="all"
                        className="text-xs font-medium"
                      >
                        All Contaminants
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value={Contaminant.NITRATE}
                        className="text-xs font-medium"
                      >
                        Nitrate
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value={Contaminant.PFAS}
                        className="text-xs font-medium"
                      >
                        PFAS
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value={Contaminant.ECOLI}
                        className="text-xs font-medium"
                      >
                        E. coli
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value={Contaminant.ARSENIC}
                        className="text-xs font-medium"
                      >
                        Arsenic
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                {showLegend && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Legend
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          Status
                        </h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span>Safe</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span>Warning</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Alert</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          System Type
                        </h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full border-2 border-blue-500"></div>
                            <span>Drinking Water</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full border-2 border-violet-500"></div>
                            <span>Recreational</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </aside>

              <main className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Iowa Water Systems
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredSystems.length} systems shown
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLegend(!showLegend)}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      {showLegend ? "Hide" : "Show"} Legend
                    </Button>
                  </div>
                </div>

                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-[400px] cursor-pointer"
                        onClick={handleCanvasClick}
                      />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <Button size="sm" variant="outline">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedSystem && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedSystem.name}
                          </CardTitle>
                          <CardDescription>
                            {selectedSystem.type === "drinking"
                              ? "Drinking Water System"
                              : "Recreational Site"}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            selectedSystem.status === "safe"
                              ? "default"
                              : selectedSystem.status === "warn"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {selectedSystem.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Last Updated:
                          </span>
                          <p className="font-medium">
                            {formatDate(selectedSystem.lastUpdated)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Coordinates:
                          </span>
                          <p className="font-mono text-xs">
                            {selectedSystem.location.lat.toFixed(4)},{" "}
                            {selectedSystem.location.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-muted-foreground">
                          Monitored Contaminants:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedSystem.contaminants.map((contaminant) => (
                            <Badge
                              key={contaminant}
                              variant="outline"
                              className="text-xs"
                            >
                              {contaminant}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="w-full">
                        <Info className="h-4 w-4 mr-2" />
                        View Detailed Report
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
