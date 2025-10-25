export type ClimateSearchSection = {
  title: string
  description: string
  href: string
  tags?: string[]
}

export const climateSections: ClimateSearchSection[] = [
  {
    title: "Global Temperature Anomaly",
    description: "Latest temperature anomaly trends and detailed analysis",
    href: "/dashboard#temp",
    tags: ["temp", "temperature", "climate"],
  },
  {
    title: "Atmospheric CO₂",
    description: "Daily mean concentration, change insights, and chart explorer",
    href: "/dashboard#co2",
    tags: ["co2", "carbon", "emissions"],
  },
  {
    title: "Arctic Sea Ice",
    description: "Extent of Arctic sea ice and long-term trends",
    href: "/dashboard#sea-ice",
    tags: ["sea-ice", "cryosphere", "ice"],
  },
  {
    title: "Global Climate Metrics Table",
    description: "Sortable table of climate indicators and projections",
    href: "/dashboard#data-table",
    tags: ["table", "metrics", "data"],
  },
  {
    title: "UN Climate Initiatives",
    description: "Active adaptation and mitigation programmes",
    href: "/initiatives",
    tags: ["initiatives", "programs", "projects"],
  },
]
