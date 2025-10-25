export type DatasetFrequency = "Daily" | "Monthly" | "Annual"
export type DatasetDomain = "Atmosphere" | "Ocean" | "Cryosphere" | "Energy" | "Land"
export type DatasetCategory = "monitor" | "annual" | "index"

export interface DatasetDefinition {
  id: string
  title: string
  provider: string
  frequency: DatasetFrequency
  domain: DatasetDomain
  unit: string
  endpoint: string
  downloadUrl?: string
  description: string
  metricKey?:
    | "co2"
    | "sea-ice"
    | "temp"
    | "sea-level"
    | "methane"
    | "enso"
    | "ocean-heat"
    | "electricity-mix"
    | "forest-area"
    | "deforestation-alerts"
  status?: "available" | "coming-soon"
  category: DatasetCategory
  notes?: string
  lastUpdatedHint?: string
}

export const climateDatasets: DatasetDefinition[] = [
  {
    id: "co2_noaa_mlo_daily",
    title: "Atmospheric CO₂ (Mauna Loa)",
    provider: "NOAA GML",
    frequency: "Daily",
    domain: "Atmosphere",
    unit: "ppm",
    endpoint: "https://gml.noaa.gov/ccgg/trends/",
    downloadUrl: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv",
    description: "Daily mean concentration measured at Mauna Loa Observatory.",
    metricKey: "co2",
    category: "monitor",
    notes: "Preliminary values subject to quality control.",
  },
  {
    id: "temp_gistemp_global_monthly",
    title: "Global Temperature Anomaly",
    provider: "NASA GISTEMP v4",
    frequency: "Monthly",
    domain: "Atmosphere",
    unit: "°C",
    endpoint: "https://data.giss.nasa.gov/gistemp/",
    downloadUrl: "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv",
    description: "Monthly global mean surface temperature anomaly (1951–1980 baseline).",
    metricKey: "temp",
    category: "monitor",
  },
  {
    id: "sea_ice_nsidc_arctic_daily",
    title: "Arctic Sea Ice Extent",
    provider: "NSIDC Sea Ice Index",
    frequency: "Daily",
    domain: "Cryosphere",
    unit: "million km²",
    endpoint: "https://nsidc.org/data/seaice_index",
    downloadUrl: "https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv",
    description: "Daily area of the ocean with at least 15% Arctic sea ice coverage.",
    metricKey: "sea-ice",
    category: "monitor",
  },
  {
    id: "enso_noaa_nino34_monthly",
    title: "ENSO Index (Niño 3.4)",
    provider: "NOAA CPC / PSL",
    frequency: "Monthly",
    domain: "Ocean",
    unit: "°C anomaly",
    endpoint: "https://www.cpc.ncep.noaa.gov/data/indices/",
    downloadUrl: "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/nino34.long.data",
    description: "Monthly sea surface temperature anomaly over the Niño 3.4 region, used to track El Niño and La Niña phases.",
    category: "index",
    lastUpdatedHint: "Updated monthly around the 10th.",
    metricKey: "enso",
  },
  {
    id: "ocean_heat_content_noaa_ncei",
    title: "Global Ocean Heat Content (0–700m)",
    provider: "NOAA NCEI",
    frequency: "Annual",
    domain: "Ocean",
    unit: "10²² Joules",
    endpoint: "https://www.ncei.noaa.gov/access/global-ocean-heat-content/",
    downloadUrl: "https://www.ncei.noaa.gov/data/ocean-heat-content/access/ohc_0-700m_annual.csv",
    description: "Annual global ocean heat content anomaly for the upper 700m of the ocean.",
    category: "index",
    lastUpdatedHint: "Updated annually with ~3 month latency.",
    metricKey: "ocean-heat",
  },
  {
    id: "sea_level_nasa_jpl_monthly",
    title: "Global Mean Sea Level",
    provider: "NASA/JPL",
    frequency: "Monthly",
    domain: "Ocean",
    unit: "mm",
    endpoint: "https://sealevel.nasa.gov/understanding-sea-level/key-indicators/global-mean-sea-level/",
    description: "Satellite altimetry derived global mean sea level anomalies. Currently using documented fallback until direct API access is confirmed.",
    metricKey: "sea-level",
    category: "monitor",
    lastUpdatedHint: "Updated monthly with ~3 month latency.",
  },
  {
    id: "ch4_noaa_global_monthly",
    title: "Atmospheric Methane",
    provider: "NOAA GML",
    frequency: "Monthly",
    domain: "Atmosphere",
    unit: "ppb",
    endpoint: "https://gml.noaa.gov/ccgg/trends_ch4/",
    downloadUrl: "https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_mm_gl.csv",
    description: "Globally averaged mole fraction of methane.",
    metricKey: "methane",
    category: "monitor",
    lastUpdatedHint: "Updated monthly following laboratory calibration.",
  },
  {
    id: "energy_mix_owid_annual",
    title: "Electricity Mix (Global & Country)",
    provider: "Our World in Data",
    frequency: "Annual",
    domain: "Energy",
    unit: "%",
    endpoint: "https://ourworldindata.org/grapher/share-electricity-renewables",
    description: "Annual share of electricity from renewables, nuclear, and fossil fuels.",
    category: "annual",
    lastUpdatedHint: "Updated annually with ~1 year lag.",
    metricKey: "electricity-mix",
  },
  {
    id: "forest_area_fao_fra",
    title: "Forest Area (FAO FRA)",
    provider: "FAO Forest Resources Assessment",
    frequency: "Annual",
    domain: "Land",
    unit: "million hectares",
    endpoint: "https://www.fao.org/forest-resources-assessment/",
    description: "Global forest area estimates from the FAO FRA. Five-year assessment with annual interpolations.",
    category: "annual",
    lastUpdatedHint: "Updated every five years; latest cycle 2025.",
    metricKey: "forest-area",
  },
  {
    id: "gfw_deforestation_alerts",
    title: "Integrated Deforestation Alerts",
    provider: "Global Forest Watch",
    frequency: "Daily",
    domain: "Land",
    unit: "alerts",
    endpoint: "https://data-api.globalforestwatch.org/",
    description: "Daily tree cover loss alerts for tropical forests. Requires API key and supports map visualisation.",
    category: "monitor",
    notes: "Requires custom spatial integration; roadmap item for map overlay.",
    metricKey: "deforestation-alerts",
  },
]
