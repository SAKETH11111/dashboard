import type { ContaminantValue, WaterThreshold } from "@/types/water"

export type ThresholdMetadata = WaterThreshold & {
  label: string
  safeCopy: string
  warnCopy: string
  alertCopy: string
  colorTokens: {
    safe: string
    warn: string
    alert: string
  }
  freshnessDays: number
}

const DEFAULT_COLOR_TOKENS = {
  safe: "var(--water-safe)",
  warn: "var(--water-warn)",
  alert: "var(--water-alert)",
}

export const WATER_THRESHOLDS: Record<ContaminantValue, ThresholdMetadata> = {
  nitrate: {
    contaminant: "nitrate",
    label: "Nitrate (as N)",
    unit: "mg/L",
    mcl: 10,
    warnLevel: 5,
    alertLevel: 10,
    notes: "EPA Maximum Contaminant Level (MCL) for nitrate in finished drinking water is 10 mg/L as nitrogen.",
    safeCopy: "Levels are well below the 10 mg/L EPA limit. Typical tap water is expected to be safe for all ages.",
    warnCopy:
      "Levels are trending upward or above 50% of the EPA limit. Households mixing infant formula should monitor results closely.",
    alertCopy:
      "Recent samples meet or exceed the 10 mg/L EPA limit. Use alternate water for infants and contact the utility for updates.",
    colorTokens: DEFAULT_COLOR_TOKENS,
    freshnessDays: 7,
  },
  nitrite: {
    contaminant: "nitrite",
    label: "Nitrite (as N)",
    unit: "mg/L",
    mcl: 1,
    warnLevel: 0.5,
    alertLevel: 1,
    notes: "EPA MCL for nitrite is 1 mg/L as nitrogen. Infants are highly sensitive to elevated nitrite.",
    safeCopy: "Nitrite is below half of the EPA 1 mg/L limit.",
    warnCopy:
      "Nitrite is at or above 50% of the EPA limit. Sensitive groups should consider using bottled or filtered water.",
    alertCopy:
      "Nitrite is at or above the 1 mg/L limit or an advisory is in effect. Follow local health guidance immediately.",
    colorTokens: DEFAULT_COLOR_TOKENS,
    freshnessDays: 7,
  },
  ecoli: {
    contaminant: "ecoli",
    label: "E. coli",
    unit: "MPN/100mL",
    mcl: undefined,
    warnLevel: 126,
    alertLevel: 235,
    notes:
      "For recreational waters the EPA single-sample maximum is 235 MPN/100mL. Any detection in treated drinking water triggers a violation.",
    safeCopy: "No recent detections above advisory thresholds.",
    warnCopy:
      "Elevated results or recent rain events warrant caution. Public water systems may issue boil advisories if detections persist.",
    alertCopy:
      "Advisory level reached or exceeded. Avoid ingestion and follow boil water orders until cleared by officials.",
    colorTokens: DEFAULT_COLOR_TOKENS,
    freshnessDays: 3,
  },
  pfas: {
    contaminant: "pfas",
    label: "PFAS (PFOA+PFOS)",
    unit: "ppt",
    healthAdvisory: 4,
    warnLevel: 2,
    alertLevel: 4,
    notes:
      "EPA final rule (2025) sets a 4 ppt MCL for PFOA and PFOS with a hazard index of 1 for mixtures. Iowa DNR monitoring continues to expand.",
    safeCopy: "Results are below the 2025 EPA 4 ppt MCL for PFAS.",
    warnCopy:
      "Results approaching the 4 ppt federal limit. Consider point-of-use filtration if available and monitor upcoming samples.",
    alertCopy:
      "Results at or above the 4 ppt MCL or PFAS advisory issued. Use certified filtration or alternative water where possible.",
    colorTokens: DEFAULT_COLOR_TOKENS,
    freshnessDays: 30,
  },
  arsenic: {
    contaminant: "arsenic",
    label: "Arsenic",
    unit: "µg/L",
    mcl: 10,
    warnLevel: 5,
    alertLevel: 10,
    notes:
      "EPA MCL for arsenic is 10 µg/L. Chronic exposure above 5 µg/L has been linked to cancer and cardiovascular risks.",
    safeCopy: "Arsenic remains below half of the 10 µg/L MCL.",
    warnCopy:
      "Arsenic exceeds 50% of the EPA limit. Pregnant people and infants should consider alternative water sources.",
    alertCopy:
      "Arsenic meets or exceeds the 10 µg/L limit. Follow utility guidance and consider certified treatment options.",
    colorTokens: DEFAULT_COLOR_TOKENS,
    freshnessDays: 90,
  },
  dbp: {
    contaminant: "dbp",
    label: "Disinfection Byproducts",
    unit: "µg/L",
    mcl: 80,
    warnLevel: 56,
    alertLevel: 80,
    notes:
      "EPA Stage 2 DBPR sets MCLs at 80 µg/L for total trihalomethanes (TTHM) and 60 µg/L for haloacetic acids (HAA5). Utilities report locational running annual averages.",
    safeCopy: "Recent DBP results are well below EPA running annual limits.",
    warnCopy:
      "DBP levels are above 70% of allowable limits. Utilities may adjust treatment to manage precursors.",
    alertCopy:
      "DBP levels exceed EPA limits or an exceedance notice has been issued. Sensitive populations should consult healthcare providers.",
    colorTokens: DEFAULT_COLOR_TOKENS,
    freshnessDays: 90,
  },
  fluoride: {
    contaminant: "fluoride",
    label: "Fluoride",
    unit: "mg/L",
    mcl: 4,
    warnLevel: 2,
    alertLevel: 4,
    notes:
      "EPA primary MCL is 4 mg/L with a secondary standard of 2 mg/L to prevent dental fluorosis. Many systems target 0.7 mg/L for cavity prevention.",
    safeCopy: "Fluoride levels support cavity prevention and remain under 2 mg/L.",
    warnCopy:
      "Fluoride exceeds the secondary standard of 2 mg/L. Families with young children should monitor for mottled teeth.",
    alertCopy:
      "Fluoride meets or exceeds the 4 mg/L MCL. Seek alternative water and report any health concerns to your provider.",
    colorTokens: DEFAULT_COLOR_TOKENS,
    freshnessDays: 180,
  },
}

export const getThresholdForContaminant = (
  contaminant: ContaminantValue,
): ThresholdMetadata => WATER_THRESHOLDS[contaminant]

export const getWarnRatio = (threshold: ThresholdMetadata, value?: number | null) => {
  if (value == null || threshold.alertLevel == null) {
    return undefined
  }

  return value / threshold.alertLevel
}
