import { NextResponse } from "next/server"
import Parser from "rss-parser"

import type { NewsItem } from "@/types/content"

export const runtime = "nodejs"
export const revalidate = 1800
export const dynamic = "force-dynamic"

const FEEDS = [
  {
    url: "https://www.earthobservatory.nasa.gov/feeds/earth-observatory.rss",
    source: "NASA Earth Observatory",
    maxItems: 18,
  },
  {
    url: "https://www.ncei.noaa.gov/maps/gis-news.xml",
    source: "NOAA NCEI",
    maxItems: 18,
  },
  {
    url: "https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml",
    source: "UN News",
    maxItems: 18,
  },
  {
    url: "https://nsidc.org/arcticseaicenews/feed/",
    source: "NSIDC Sea Ice Today",
    maxItems: 18,
  },
]

const parser = new Parser({
  customFields: {
    item: ["content", "contentSnippet", "category", "categories"],
  },
})

function strip(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function truncate(value: string, length = 160) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`
}

const TAG_MAP: Record<string, string> = {
  temperature: "Temperature",
  heatwave: "Temperature",
  heat: "Temperature",
  warming: "Temperature",
  carbon: "Carbon",
  emissions: "Carbon",
  methane: "Carbon",
  co2: "Carbon",
  greenhouse: "Carbon",
  policy: "Policy",
  negotiation: "Policy",
  finance: "Finance",
  funding: "Finance",
  investment: "Finance",
  adaptation: "Adaptation",
  resilience: "Resilience",
  ocean: "Oceans",
  marine: "Oceans",
  "sea level": "Oceans",
  "sea ice": "Sea Ice",
  cryosphere: "Sea Ice",
  arctic: "Sea Ice",
  antarctic: "Sea Ice",
  glacier: "Sea Ice",
  storm: "Extreme Weather",
  hurricane: "Extreme Weather",
  typhoon: "Extreme Weather",
  cyclone: "Extreme Weather",
  flood: "Extreme Weather",
  drought: "Extreme Weather",
  wildfire: "Extreme Weather",
  fire: "Extreme Weather",
  science: "Science",
  research: "Science",
  study: "Science",
  biodiversity: "Biodiversity",
  forest: "Forests",
  forests: "Forests",
  ecosystem: "Ecosystems",
  ecosystems: "Ecosystems",
  agriculture: "Food Systems",
  food: "Food Systems",
  water: "Water",
}

const KEYWORD_RULES: Array<{ category: string; pattern: RegExp }> = [
  { category: "Sea Ice", pattern: /sea[ -]?ice|cryosphere|antarctic|arctic|iceberg|glacier|permafrost/ },
  { category: "Temperature", pattern: /temperature|heatwave|record warm|warmest|hot spell|heat dome|heat index/ },
  { category: "Carbon", pattern: /co2|carbon|emission|methane|ghg|greenhouse|decarboni[sz]e|net-zero/ },
  { category: "Policy", pattern: /unfccc|cop\d+|delegation|negotiation|policy|roadmap|pledge|agreement/ },
  { category: "Finance", pattern: /finance|fund|investment|grant|pledge|bond|capital|market/ },
  { category: "Adaptation", pattern: /adaptation|adaptive|resilien|preparedness|early warning/ },
  { category: "Resilience", pattern: /resilien|community|housing|infrastructure|capacity building/ },
  { category: "Oceans", pattern: /ocean|marine|sea level|coral|coast|mangrove|blue carbon/ },
  { category: "Extreme Weather", pattern: /wildfire|flood|extreme|drought|storm|hurricane|typhoon|cyclone|landslide|deluge/ },
  { category: "Science", pattern: /research|study|scientist|observation|satellite|analysis/ },
  { category: "Biodiversity", pattern: /biodiversity|species|habitat|wildlife/ },
  { category: "Forests", pattern: /forest|deforestation|reforestation|mangrove/ },
  { category: "Food Systems", pattern: /agriculture|crop|harvest|food security/ },
  { category: "Water", pattern: /river|lake|water|hydrology|watershed/ },
  { category: "Ecosystems", pattern: /ecosystem|restoration|landscape|wetland|desert/ },
]

function normalizeTag(tag: string) {
  const cleaned = tag.toLowerCase().replace(/[^a-z\s-]/g, "").trim()
  if (!cleaned) return undefined
  if (TAG_MAP[cleaned]) return TAG_MAP[cleaned]
  const direct = TAG_MAP[cleaned.replace(/\s+/g, " ")]
  if (direct) return direct
  // try partial matches
  for (const key of Object.keys(TAG_MAP)) {
    if (cleaned.includes(key)) {
      return TAG_MAP[key]
    }
  }
  return undefined
}

function inferCategories(source: string, title: string, text: string, tags: string[] = []) {
  const haystack = `${source} ${title} ${text}`.toLowerCase()
  const categories = new Set<string>()

  for (const tag of tags) {
    const mapped = normalizeTag(tag)
    if (mapped) categories.add(mapped)
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(haystack)) {
      categories.add(rule.category)
    }
  }

  if (!categories.size) {
    if (/nasa|noaa|nsidc/.test(source.toLowerCase())) {
      categories.add("Science")
    }
  }

  if (!categories.size && /un/.test(source.toLowerCase())) {
    categories.add("Policy")
  }

  if (!categories.size) {
    categories.add("Climate Science")
  }

  return Array.from(categories).slice(0, 4)
}

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const results = await Promise.allSettled(
      FEEDS.map(async ({ url, source, maxItems }) => {
        const feed = await parser.parseURL(url)
        return feed.items.slice(0, maxItems ?? feed.items.length).map((item) => {
          const title = item.title ?? "Untitled"
          const link = item.link ?? "#"
          const publishedAt = item.isoDate || item.pubDate || new Date().toISOString()
          const raw = (item.contentSnippet as string) || (item.content as string) || ""
          const summary = truncate(strip(raw))
          const tags = Array.isArray(item.categories)
            ? (item.categories as string[]).filter(Boolean)
            : item.category
            ? [String(item.category)]
            : []
          const categories = inferCategories(source, title, summary, tags)
          if (!categories.length) {
            categories.push("Climate")
          }
          const id = Buffer.from(link).toString("base64url")
          return {
            id,
            title,
            link,
            source,
            publishedAt,
            categories,
            summary,
          } satisfies NewsItem
        })
      })
    )

    clearTimeout(timeout)

    const merged = results
      .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === "fulfilled")
      .flatMap((result) => result.value)

    const seen = new Set<string>()
    const deduped: NewsItem[] = []
    for (const item of merged) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      deduped.push(item)
    }

    const items = deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return NextResponse.json(
      {
        items,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=1800, stale-while-revalidate=300",
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch climate news"
    return NextResponse.json(
      {
        items: [] as NewsItem[],
        error: message,
      },
      { status: 502 }
    )
  }
}
