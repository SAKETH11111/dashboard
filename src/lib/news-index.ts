import type { NewsItem } from "@/types/content"

const featured: NewsItem[] = [
  {
    id: "news-placeholder-gst",
    title: "Global Stocktake outcomes highlight need for accelerated finance",
    summary: "UNFCCC brief summarising finance pledges and cooperative mitigation coalitions emerging from the 2025 Global Stocktake.",
    link: "https://unfccc.int",
    source: "UNFCCC",
    publishedAt: "2025-10-01T00:00:00.000Z",
    categories: ["Policy", "Finance"],
  },
  {
    id: "news-placeholder-noaa",
    title: "NOAA releases latest State of the Climate snapshot",
    summary: "Monthly temperature anomalies and cryosphere indicators show continued warming trends across all basins.",
    link: "https://www.ncei.noaa.gov",
    source: "NOAA NCEI",
    publishedAt: "2025-09-20T00:00:00.000Z",
    categories: ["Temperature", "Science"],
  },
]

export const newsEntries = featured.map((item) => ({
  title: item.title,
  description: item.summary,
  href: "/news",
  tags: item.categories,
}))
