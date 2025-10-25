## Iowa Water Quality Dashboard

A public dashboard built with Next.js that helps Iowans understand local drinking and recreational water quality—starting with nitrate, nitrite, E. coli, PFAS, arsenic, disinfection byproducts, and fluoride trends.

### Getting Started

Install dependencies and launch the local dev server:

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Generate the initial water JSON cache (rebuild whenever upstream data changes):

```bash
npm run water:etl
```

### Data Contract

The shared types for the data/API track live in `src/types/water.ts`. The core contract is the `WaterSeriesResponse` JSON shape returned by all water endpoints:

```ts
type WaterSeriesResponse = {
  contaminant: "nitrate" | "nitrite" | "ecoli" | "pfas" | "arsenic" | "dbp" | "fluoride"
  metric: string
  unit: string
  source: string
  sourceUrl?: string
  updatedAt: string
  region: string
  regionType?: "state" | "county" | "system" | "watershed" | "site" | "custom"
  systemId?: string
  points: Array<{ date: string; value: number | null }>
  status: "safe" | "warn" | "alert" | "unknown"
  threshold?: WaterThreshold
  advisories?: WaterAdvisory[]
  notes?: string
}
```

Base thresholds and health copy are defined in `src/lib/water/thresholds.ts`.

Stubbed JSON responses that power early UI work are stored under `public/data/water/`.

### Water API Endpoints

All routes return the `WaterSeriesResponse` contract unless noted otherwise.

- `GET /api/water/nitrate` — Optional query params: `systemId`, `zip`
- `GET /api/water/nitrite` — Optional query params: `systemId`
- `GET /api/water/bacteria` — Optional query params: `systemId`, `type=ecoli`
- `GET /api/water/pfas` — Optional query params: `systemId`
- `GET /api/water/arsenic` — Optional query params: `systemId`, `county`
- `GET /api/water/dbp` — Optional query params: `systemId`, `kind=tthm|haa5`
- `GET /api/water/fluoride` — Optional query params: `systemId`
- `GET /api/water/advisories` — Optional query params: `type=boil|swim|pfas`

Routes will hydrate from cached JSON in `public/data/water` first, then upgrade to live adapters in `src/lib/water/iowa-datasources.ts`.

### Project Structure Highlights

- `src/lib/water` — Thresholds, alert logic, data-source adapters (WIP)
- `src/app/api/water/*` — Route handlers (to be implemented with ISR)
- `scripts/water-etl` — Data fetchers that normalize CSV/API sources into `public/data/water`

### Contributing

1. Use feature branches and open PRs for review.
2. Keep TypeScript strict by expanding schemas in `src/types/water.ts`.
3. Update stub JSON and tests whenever the contract changes.

### License

This project inherits the upstream UN Climate template license until rebranded assets and copy are finalized.
