"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Location = {
  id: string;
  name: string;
  type: "city" | "zip" | "county";
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

// Mock Iowa locations - in a real app this would come from an API
const IOWA_LOCATIONS: Location[] = [
  {
    id: "des-moines",
    name: "Des Moines",
    type: "city",
    state: "IA",
    coordinates: { lat: 41.5868, lng: -93.625 },
  },
  {
    id: "cedar-rapids",
    name: "Cedar Rapids",
    type: "city",
    state: "IA",
    coordinates: { lat: 41.9778, lng: -91.6656 },
  },
  {
    id: "davenport",
    name: "Davenport",
    type: "city",
    state: "IA",
    coordinates: { lat: 41.5236, lng: -90.5776 },
  },
  {
    id: "sioux-city",
    name: "Sioux City",
    type: "city",
    state: "IA",
    coordinates: { lat: 42.4997, lng: -96.4006 },
  },
  {
    id: "iowa-city",
    name: "Iowa City",
    type: "city",
    state: "IA",
    coordinates: { lat: 41.6611, lng: -91.5302 },
  },
  {
    id: "waterloo",
    name: "Waterloo",
    type: "city",
    state: "IA",
    coordinates: { lat: 42.4928, lng: -92.3422 },
  },
  {
    id: "ames",
    name: "Ames",
    type: "city",
    state: "IA",
    coordinates: { lat: 42.0308, lng: -93.6209 },
  },
  {
    id: "west-des-moines",
    name: "West Des Moines",
    type: "city",
    state: "IA",
    coordinates: { lat: 41.5772, lng: -93.7113 },
  },
  {
    id: "council-bluffs",
    name: "Council Bluffs",
    type: "city",
    state: "IA",
    coordinates: { lat: 41.2619, lng: -95.8608 },
  },
  {
    id: "dubuque",
    name: "Dubuque",
    type: "city",
    state: "IA",
    coordinates: { lat: 42.5006, lng: -90.6646 },
  },
  { id: "50301", name: "50301", type: "zip", state: "IA" },
  { id: "50302", name: "50302", type: "zip", state: "IA" },
  { id: "50303", name: "50303", type: "zip", state: "IA" },
  { id: "52401", name: "52401", type: "zip", state: "IA" },
  { id: "52402", name: "52402", type: "zip", state: "IA" },
  { id: "52801", name: "52801", type: "zip", state: "IA" },
  { id: "52802", name: "52802", type: "zip", state: "IA" },
  { id: "51101", name: "51101", type: "zip", state: "IA" },
  { id: "51102", name: "51102", type: "zip", state: "IA" },
  { id: "52240", name: "52240", type: "zip", state: "IA" },
  { id: "52241", name: "52241", type: "zip", state: "IA" },
  { id: "50010", name: "50010", type: "zip", state: "IA" },
  { id: "50011", name: "50011", type: "zip", state: "IA" },
  { id: "50265", name: "50265", type: "zip", state: "IA" },
  { id: "50266", name: "50266", type: "zip", state: "IA" },
  { id: "51501", name: "51501", type: "zip", state: "IA" },
  { id: "51502", name: "51502", type: "zip", state: "IA" },
  { id: "52001", name: "52001", type: "zip", state: "IA" },
  { id: "52002", name: "52002", type: "zip", state: "IA" },
];

type LocationPickerProps = {
  value?: Location | null;
  onChange?: (location: Location | null) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
};

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search for a city or ZIP code...",
  className,
  showClear = true,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = IOWA_LOCATIONS.filter((location) =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredLocations([]);
    }
  }, [searchQuery]);

  const handleSelectLocation = (location: Location) => {
    onChange?.(location);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange?.(null);
    setSearchQuery("");
  };

  const getLocationDisplayName = (location: Location) => {
    if (location.type === "zip") {
      return `${location.name} (ZIP)`;
    }
    return `${location.name}, ${location.state}`;
  };

  const getLocationTypeColor = (type: Location["type"]) => {
    switch (type) {
      case "city":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "zip":
        return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "county":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="location-picker">Location</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {value ? (
                <span>{getLocationDisplayName(value)}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            {showClear && value && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-auto">
            {filteredLocations.length > 0 ? (
              <div className="p-1">
                {filteredLocations.map((location) => (
                  <Button
                    key={location.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleSelectLocation(location)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{getLocationDisplayName(location)}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          getLocationTypeColor(location.type)
                        )}
                      >
                        {location.type}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No locations found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Start typing to search for locations
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className={cn("text-xs", getLocationTypeColor(value.type))}
          >
            {value.type}
          </Badge>
          <span>Selected location will filter water quality data</span>
        </div>
      )}
    </div>
  );
}

// Hook for managing location preferences
export function useLocationPreference() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("water-location-preference");
    if (saved) {
      try {
        setLocation(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  const updateLocation = (newLocation: Location | null) => {
    setLocation(newLocation);
    if (newLocation) {
      localStorage.setItem(
        "water-location-preference",
        JSON.stringify(newLocation)
      );
    } else {
      localStorage.removeItem("water-location-preference");
    }
  };

  return {
    location,
    setLocation: updateLocation,
  };
}
