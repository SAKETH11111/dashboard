import { Contaminant, type WaterSystem } from "@/types/water"

export const WATER_SYSTEMS: WaterSystem[] = [
  {
    id: "des-moines-water-works",
    name: "Des Moines Water Works",
    type: "drinking",
    location: { lat: 41.5868, lng: -93.625 },
    status: "warn",
    lastUpdated: "2024-05-20T12:00:00Z",
    systemId: "IA2580091",
    source: "Iowa DNR Source Water (stub)",
    contaminants: [
      {
        id: Contaminant.NITRATE,
        systemId: "IA2580091",
        label: "Nitrate (as N)",
      },
      {
        id: Contaminant.NITRITE,
        systemId: "IA3114560",
        label: "Nitrite (as N)",
      },
    ],
  },
  {
    id: "quad-cities-davenport",
    name: "Quad Cities Davenport",
    type: "drinking",
    location: { lat: 41.5236, lng: -90.5776 },
    status: "alert",
    lastUpdated: "2024-03-30T15:30:00Z",
    systemId: "IA5224026",
    source: "Iowa DNR PFAS Survey (stub)",
    contaminants: [
      {
        id: Contaminant.PFAS,
        systemId: "IA5224026",
        label: "PFAS (PFOA + PFOS)",
      },
    ],
  },
  {
    id: "big-creek-beach",
    name: "Big Creek Beach",
    type: "recreational",
    location: { lat: 41.7579, lng: -93.7197 },
    status: "alert",
    lastUpdated: "2024-05-18T09:00:00Z",
    source: "Iowa DNR Beach Monitoring (stub)",
    contaminants: [
      {
        id: Contaminant.ECOLI,
        site: "Big Creek Beach",
        label: "E. coli",
      },
    ],
  },
  {
    id: "marshalltown-water",
    name: "City of Marshalltown",
    type: "drinking",
    location: { lat: 42.0495, lng: -92.9071 },
    status: "warn",
    lastUpdated: "2024-02-20T10:00:00Z",
    systemId: "IA5970011",
    source: "EPA SDWIS (stub)",
    contaminants: [
      {
        id: Contaminant.ARSENIC,
        systemId: "IA5970011",
        label: "Arsenic",
      },
    ],
  },
  {
    id: "west-des-moines-water",
    name: "West Des Moines Water Works",
    type: "drinking",
    location: { lat: 41.5772, lng: -93.7113 },
    status: "warn",
    lastUpdated: "2023-12-31T00:00:00Z",
    systemId: "IA2570970",
    source: "Iowa HHS Compliance (stub)",
    contaminants: [
      {
        id: Contaminant.DBP,
        systemId: "IA2570970",
        label: "Disinfection Byproducts",
      },
    ],
  },
  {
    id: "sioux-city-water",
    name: "Sioux City Water",
    type: "drinking",
    location: { lat: 42.4993, lng: -96.4003 },
    status: "safe",
    lastUpdated: "2024-01-31T00:00:00Z",
    systemId: "IA8300487",
    source: "Iowa HHS Oral Health (stub)",
    contaminants: [
      {
        id: Contaminant.FLUORIDE,
        systemId: "IA8300487",
        label: "Fluoride",
      },
    ],
  },
]

