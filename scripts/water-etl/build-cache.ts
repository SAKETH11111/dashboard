import { createSeries, writeWaterSeriesToCache } from "./helpers"
import { WATER_THRESHOLDS } from "../../src/lib/water/thresholds"
import type { WaterSeriesResponse } from "../../src/types/water"

const cacheBuilders: WaterSeriesResponse[] = [
  createSeries({
    contaminant: "nitrate",
    metric: "Nitrate (as N)",
    unit: "mg/L",
    source: "Iowa DNR Source Water (stub)",
    sourceUrl: "https://www.iowadnr.gov/Environmental-Protection/Water-Quality/Water-Monitoring",
    updatedAt: "2024-05-20T12:00:00Z",
    region: "Des Moines Water Works",
    regionType: "system",
    systemId: "IA2580091",
    points: [
      { date: "2023-12-01", value: 4.2 },
      { date: "2024-01-01", value: 4.8 },
      { date: "2024-02-01", value: 5.5 },
      { date: "2024-03-01", value: 6.2 },
      { date: "2024-04-01", value: 6.7 },
      { date: "2024-05-01", value: 7.1 },
    ],
    status: "warn",
    threshold: WATER_THRESHOLDS.nitrate,
    advisories: [],
  }),
  createSeries({
    contaminant: "nitrite",
    metric: "Nitrite (as N)",
    unit: "mg/L",
    source: "Iowa DNR Compliance (stub)",
    sourceUrl: "https://www.iowadnr.gov/Environmental-Protection/Water-Quality",
    updatedAt: "2024-04-15T12:00:00Z",
    region: "Cedar Rapids Water",
    regionType: "system",
    systemId: "IA3114560",
    points: [
      { date: "2023-10-01", value: 0.12 },
      { date: "2023-12-01", value: 0.16 },
      { date: "2024-02-01", value: 0.24 },
      { date: "2024-04-01", value: 0.32 },
    ],
    status: "safe",
    threshold: WATER_THRESHOLDS.nitrite,
    advisories: [],
  }),
  createSeries({
    contaminant: "ecoli",
    metric: "E. coli",
    unit: "MPN/100mL",
    source: "Iowa DNR Beach Monitoring (stub)",
    sourceUrl: "https://www.iowadnr.gov/Things-to-Do/Beach-Monitoring",
    updatedAt: "2024-05-18T09:00:00Z",
    region: "Big Creek Beach",
    regionType: "site",
    points: [
      { date: "2024-04-20", value: 22 },
      { date: "2024-04-27", value: 35 },
      { date: "2024-05-04", value: 58 },
      { date: "2024-05-11", value: 165 },
      { date: "2024-05-18", value: 280 },
    ],
    status: "alert",
    threshold: WATER_THRESHOLDS.ecoli,
    advisories: [
      {
        id: "2024-big-creek-beach-ecoli",
        type: "swim",
        contaminant: "ecoli",
        title: "Swim advisory issued",
        summary: "Elevated E. coli detected on May 18 sample. Avoid swallowing water and monitor DNR updates.",
        issuedAt: "2024-05-18T12:00:00Z",
        source: "Iowa DNR",
        sourceUrl: "https://www.iowadnr.gov/Things-to-Do/Beach-Monitoring",
        status: "alert",
      },
    ],
  }),
  createSeries({
    contaminant: "pfas",
    metric: "PFAS (PFOA + PFOS)",
    unit: "ppt",
    source: "Iowa DNR PFAS Survey (stub)",
    sourceUrl: "https://www.iowadnr.gov/Environmental-Protection/Water-Quality/PFAS",
    updatedAt: "2024-03-30T15:30:00Z",
    region: "Quad Cities Davenport",
    regionType: "system",
    systemId: "IA5224026",
    points: [
      { date: "2023-06-15", value: 3.1 },
      { date: "2023-09-18", value: 3.6 },
      { date: "2023-12-12", value: 3.9 },
      { date: "2024-03-25", value: 4.3 },
    ],
    status: "alert",
    threshold: WATER_THRESHOLDS.pfas,
    advisories: [
      {
        id: "2024-pfas-davenport",
        type: "pfas",
        contaminant: "pfas",
        title: "PFAS public notice",
        summary: "Davenport Water reports PFOA + PFOS above the new 4 ppt MCL. Utility researching treatment upgrades.",
        issuedAt: "2024-04-10T18:00:00Z",
        source: "Davenport Water Works",
        sourceUrl: "https://www.cityofdavenportiowa.com/pfas",
        affectedSystems: ["IA5224026"],
        status: "alert",
      },
    ],
  }),
  createSeries({
    contaminant: "arsenic",
    metric: "Arsenic",
    unit: "µg/L",
    source: "EPA SDWIS (stub)",
    sourceUrl: "https://data.epa.gov/efservice/SDWIS_STATE_VIOLATIONS/",
    updatedAt: "2024-02-20T10:00:00Z",
    region: "City of Marshalltown",
    regionType: "system",
    systemId: "IA5970011",
    points: [
      { date: "2023-05-01", value: 4.8 },
      { date: "2023-08-01", value: 5.2 },
      { date: "2023-11-01", value: 6.1 },
      { date: "2024-02-01", value: 6.4 },
    ],
    status: "warn",
    threshold: WATER_THRESHOLDS.arsenic,
  }),
  createSeries({
    contaminant: "dbp",
    metric: "Disinfection Byproducts (TTHM)",
    unit: "µg/L",
    source: "Iowa HHS Compliance (stub)",
    sourceUrl: "https://hhs.iowa.gov/drinkingwater",
    updatedAt: "2023-12-31T00:00:00Z",
    region: "West Des Moines Water Works",
    regionType: "system",
    systemId: "IA2570970",
    points: [
      { date: "2023-03-31", value: 58.2 },
      { date: "2023-06-30", value: 61.7 },
      { date: "2023-09-30", value: 63.5 },
      { date: "2023-12-31", value: 64.8 },
    ],
    status: "warn",
    threshold: WATER_THRESHOLDS.dbp,
  }),
  createSeries({
    contaminant: "fluoride",
    metric: "Fluoride",
    unit: "mg/L",
    source: "Iowa HHS Oral Health (stub)",
    sourceUrl: "https://hhs.iowa.gov/oral-health-center",
    updatedAt: "2024-01-31T00:00:00Z",
    region: "Sioux City Water",
    regionType: "system",
    systemId: "IA8300487",
    points: [
      { date: "2023-09-30", value: 0.76 },
      { date: "2023-10-31", value: 0.74 },
      { date: "2023-11-30", value: 0.71 },
      { date: "2023-12-31", value: 0.69 },
      { date: "2024-01-31", value: 0.72 },
    ],
    status: "safe",
    threshold: WATER_THRESHOLDS.fluoride,
  }),
]

async function main() {
  for (const series of cacheBuilders) {
    const location = await writeWaterSeriesToCache(series)
    console.log(`🔁 wrote ${series.contaminant} cache to ${location}`)
  }
}

main().catch((error) => {
  console.error("water-etl failed", error)
  process.exit(1)
})

