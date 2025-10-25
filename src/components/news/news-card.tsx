import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface NewsCardProps {
  title: string
  summary: string
  link: string
  source: string
  publishedAt: string
  categories: string[]
}

export function NewsCard({
  title,
  summary,
  link,
  source,
  publishedAt,
  categories,
}: NewsCardProps) {
  return (
    <Link
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex h-full min-h-[220px] flex-col justify-between bg-card/70 transition-colors hover:bg-card",
        "before:absolute before:-left-px before:top-0 before:h-full before:w-px before:bg-border before:content-['']",
        "after:absolute after:-top-px after:left-0 after:h-px after:w-full after:bg-border after:content-['']",
        "md:border-r md:border-border"
      )}
    >
      <div className="flex flex-col gap-4 px-6 py-6">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[0.65rem] uppercase tracking-wide">
            {source}
          </Badge>
          <time>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(publishedAt))}</time>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
        </div>
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pb-6 pt-2">
          {categories.map((category) => (
            <Badge key={category} variant="secondary" className="text-[0.65rem]">
              {category}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  )
}
