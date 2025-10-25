export type NewsItem = {
  id: string
  title: string
  link: string
  source: string
  publishedAt: string
  categories: string[]
  summary: string
}

export type Initiative = {
  id: string
  title: string
  branch: string
  status: string
  tags: string[]
  region: string
  summary: string
  lastUpdated: string
  votes: number
  comments: number
  link: string
}
