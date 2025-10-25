"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Download, Search, Calendar, MapPin } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Contaminant } from "@/types/water";

type Filters = {
  contaminant: Contaminant | "All";
  systemType: "drinking" | "recreational" | "All";
  status: "safe" | "warn" | "alert" | "All";
  dateRange: "1y" | "5y" | "all";
};

// Mock water data - in real implementation this would come from API
const mockWaterData = [
  {
    id: "des-moines-nitrate",
    systemName: "Des Moines Water Works",
    systemType: "drinking" as const,
    contaminant: "nitrate" as Contaminant,
    value: 8.5,
    unit: "mg/L",
    status: "safe" as const,
    lastUpdated: "2024-01-15T10:30:00Z",
    location: "Des Moines, IA",
    source: "Iowa DNR",
  },
  {
    id: "cedar-rapids-pfas",
    systemName: "Cedar Rapids Water Department",
    systemType: "drinking" as const,
    contaminant: "pfas" as Contaminant,
    value: 15.2,
    unit: "ng/L",
    status: "alert" as const,
    lastUpdated: "2024-01-14T15:45:00Z",
    location: "Cedar Rapids, IA",
    source: "Iowa DNR",
  },
  {
    id: "lake-macbride-bacteria",
    systemName: "Lake Macbride State Park",
    systemType: "recreational" as const,
    contaminant: "ecoli" as Contaminant,
    value: 235,
    unit: "CFU/100mL",
    status: "alert" as const,
    lastUpdated: "2024-01-13T08:20:00Z",
    location: "Solon, IA",
    source: "Iowa DNR Beach Monitoring",
  },
  {
    id: "iowa-city-arsenic",
    systemName: "Iowa City Water Department",
    systemType: "drinking" as const,
    contaminant: "arsenic" as Contaminant,
    value: 3.2,
    unit: "μg/L",
    status: "safe" as const,
    lastUpdated: "2024-01-15T12:00:00Z",
    location: "Iowa City, IA",
    source: "Iowa DNR",
  },
  {
    id: "waterloo-fluoride",
    systemName: "Waterloo Water Works",
    systemType: "drinking" as const,
    contaminant: "fluoride" as Contaminant,
    value: 0.8,
    unit: "mg/L",
    status: "safe" as const,
    lastUpdated: "2024-01-14T09:15:00Z",
    location: "Waterloo, IA",
    source: "Iowa DNR",
  },
];

const contaminantOptions = [
  { label: "All Contaminants", value: "All" },
  { label: "Nitrate", value: Contaminant.NITRATE },
  { label: "Nitrite", value: Contaminant.NITRITE },
  { label: "E. coli", value: Contaminant.ECOLI },
  { label: "PFAS", value: Contaminant.PFAS },
  { label: "Arsenic", value: Contaminant.ARSENIC },
  { label: "DBP", value: Contaminant.DBP },
  { label: "Fluoride", value: Contaminant.FLUORIDE },
];

const systemTypeOptions = [
  { label: "All Systems", value: "All" },
  { label: "Drinking Water", value: "drinking" },
  { label: "Recreational", value: "recreational" },
];

const statusOptions = [
  { label: "All Status", value: "All" },
  { label: "Safe", value: "safe" },
  { label: "Warning", value: "warn" },
  { label: "Alert", value: "alert" },
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

export default function ExplorerPage() {
  const [filters, setFilters] = useState<Filters>({
    contaminant: "All",
    systemType: "All",
    status: "All",
    dateRange: "1y",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedData, setSelectedData] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return mockWaterData.filter((item) => {
      if (
        filters.contaminant !== "All" &&
        item.contaminant !== filters.contaminant
      )
        return false;
      if (
        filters.systemType !== "All" &&
        item.systemType !== filters.systemType
      )
        return false;
      if (filters.status !== "All" && item.status !== filters.status)
        return false;
      if (
        searchQuery &&
        !item.systemName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [filters, searchQuery]);

  const handleExportCSV = () => {
    const csvData = filteredData.map((item) => ({
      System: item.systemName,
      Type: item.systemType,
      Contaminant: item.contaminant,
      Value: item.value,
      Unit: item.unit,
      Status: item.status,
      Location: item.location,
      "Last Updated": new Date(item.lastUpdated).toLocaleDateString(),
      Source: item.source,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iowa-water-data-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSelectData = (id: string) => {
    setSelectedData((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties;

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
                    Water Data Explorer
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Explore Iowa water quality data by contaminant, system type,
                    and location. Filter, search, and export data for analysis.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {filteredData.length} records
                  </Badge>
                  <p>Filter by contaminant, system type, or status.</p>
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <aside className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur">
                <FilterBlock label="Search">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search systems..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </FilterBlock>

                <FilterBlock label="Contaminant">
                  <Select
                    value={filters.contaminant}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        contaminant: value as Contaminant | "All",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contaminantOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterBlock>

                <FilterBlock label="System Type">
                  <ToggleGroup
                    type="single"
                    value={filters.systemType}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        systemType: value as
                          | "drinking"
                          | "recreational"
                          | "All",
                      }))
                    }
                    variant="outline"
                    className="grid grid-cols-1 gap-2"
                  >
                    {systemTypeOptions.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className="text-xs font-medium"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FilterBlock>

                <FilterBlock label="Status">
                  <ToggleGroup
                    type="single"
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: value as "safe" | "warn" | "alert" | "All",
                      }))
                    }
                    variant="outline"
                    className="grid grid-cols-1 gap-2"
                  >
                    {statusOptions.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className="text-xs font-medium"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FilterBlock>

                <FilterBlock label="Date Range">
                  <ToggleGroup
                    type="single"
                    value={filters.dateRange}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: value as "1y" | "5y" | "all",
                      }))
                    }
                    variant="outline"
                    className="grid grid-cols-1 gap-2"
                  >
                    <ToggleGroupItem value="1y" className="text-xs font-medium">
                      1 Year
                    </ToggleGroupItem>
                    <ToggleGroupItem value="5y" className="text-xs font-medium">
                      5 Years
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="all"
                      className="text-xs font-medium"
                    >
                      All Time
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FilterBlock>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleExportCSV}
                    disabled={filteredData.length === 0}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  {selectedData.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedData([])}
                      className="w-full"
                    >
                      Clear Selection ({selectedData.length})
                    </Button>
                  )}
                </div>
              </aside>

              <main className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Water Quality Data
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredData.length} records found
                    </p>
                  </div>
                </div>

                {filteredData.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredData.map((item) => (
                      <WaterDataCard
                        key={item.id}
                        data={item}
                        selected={selectedData.includes(item.id)}
                        onSelect={() => handleSelectData(item.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    No data matches the current filters.
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function FilterBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      {children}
    </section>
  );
}

function WaterDataCard({
  data,
  selected,
  onSelect,
}: {
  data: (typeof mockWaterData)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{data.systemName}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              {data.location}
            </CardDescription>
          </div>
          <Badge
            variant={statusConfig[data.status].variant}
            className="text-xs"
          >
            {statusConfig[data.status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Contaminant</Label>
            <p className="font-medium capitalize">{data.contaminant}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Value</Label>
            <p className="font-medium">
              {data.value} {data.unit}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(data.lastUpdated).toLocaleDateString()}
          </div>
          <Badge variant="outline" className="text-xs">
            {data.systemType}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          Source: {data.source}
        </div>
      </CardContent>
    </Card>
  );
}
