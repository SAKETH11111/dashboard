"use client";

import * as React from "react";
import { MapPin, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";

const IOWA_CITIES = [
  "Des Moines",
  "Cedar Rapids",
  "Davenport",
  "Sioux City",
  "Iowa City",
  "Waterloo",
  "Council Bluffs",
  "Ames",
  "West Des Moines",
  "Dubuque",
  "Ankeny",
  "Urbandale",
  "Cedar Falls",
  "Marion",
  "Bettendorf",
  "Mason City",
  "Marshalltown",
  "Ottumwa",
  "Clinton",
  "Burlington",
];

export function LocationPicker() {
  const [location, setLocation] = useLocalStorage<string>("water-location", "");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredCities = IOWA_CITIES.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationSelect = (city: string) => {
    setLocation(city);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClearLocation = () => {
    setLocation("");
    setIsOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
        <CardDescription>
          Select your location to see relevant water quality data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {location ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{location}</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearLocation}>
                Clear
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for a city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsOpen(true)}
                  className="pl-10"
                />
              </div>

              {isOpen && (
                <div className="max-h-48 overflow-y-auto rounded-lg border bg-background">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleLocationSelect(city)}
                        className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No cities found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {location
              ? `Showing water quality data for ${location}, Iowa`
              : "Select a location to see localized water quality information"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
