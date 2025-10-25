import type { Initiative } from "@/types/initiatives"

export const initiatives: Initiative[] = [
  {
    id: "unep-blue-carbon-acceleration",
    title: "Blue Carbon Accelerator Fund",
    branch: "UNEP",
    summary: "Scaling coastal ecosystem restoration projects to accelerate carbon sequestration and coastal resilience.",
    description:
      "The Blue Carbon Accelerator Fund supports readiness and pilot projects that expand mangrove, seagrass, and saltmarsh restoration in partnership with local communities. 2025 priorities include financing blue carbon methodologies, building community-led monitoring networks, and integrating climate resilience outcomes into national determined contributions (NDCs).",
    status: "Active",
    tags: ["Blue Carbon", "Coastal Resilience", "Finance"],
    metrics: ["co2", "sea-ice", "resilience"],
    link: "https://www.unep.org/explore-topics/oceans-seas/what-we-do/blue-carbon",
    votes: 892,
    comments: 45,
    lastUpdated: "2025-10-04T00:00:00.000Z",
  },
  {
    id: "unfccc-global-stocktake-support",
    title: "Global Stocktake Action Support Facility",
    branch: "UNFCCC",
    summary: "Technical assistance facility helping Parties translate Global Stocktake outcomes into 2035 climate action roadmaps.",
    description:
      "Following COP29, the Action Support Facility provides targeted advisory services to developing country Parties to enhance mitigation, adaptation, and means of implementation. Workstreams include sectoral deep dives on power decarbonisation, methane mitigation, and adaptation metrics aligned with the enhanced transparency framework.",
    status: "In Progress",
    tags: ["Mitigation", "Transparency", "Capacity Building"],
    metrics: ["co2", "temp", "finance"],
    link: "https://unfccc.int",
    votes: 648,
    comments: 32,
    lastUpdated: "2025-09-18T00:00:00.000Z",
  },
  {
    id: "undp-heatwave-adaptation-hub",
    title: "Heatwave Adaptation Innovation Hub",
    branch: "UNDP",
    summary: "Multi-city initiative deploying early warning systems and passive cooling retrofits for vulnerable communities.",
    description:
      "The Hub aggregates climate services, finance matchmaking, and knowledge exchange for cities facing recurring extreme heat. 2025 pilots in Lagos, Karachi, and Manaus combine localized forecast products, nature-based shading, and healthcare surge planning. Outcomes feed into national adaptation plans and urban resilience metrics.",
    status: "Active",
    tags: ["Urban Resilience", "Early Warning", "Health"],
    metrics: ["temp", "resilience"],
    link: "https://www.undp.org",
    votes: 512,
    comments: 28,
    lastUpdated: "2025-10-10T00:00:00.000Z",
  },
  {
    id: "fao-forest-guardian-network",
    title: "Forest Guardian Network Expansion",
    branch: "FAO",
    summary: "Supporting Indigenous forest monitoring partnerships across the Amazon and Congo basins to reduce deforestation.",
    description:
      "The initiative expands low-cost monitoring, legal support, and sustainable livelihood finance for Indigenous communities protecting high-carbon forests. New 2025 components include AI-assisted alert verification, satellite connectivity grants, and a performance-based finance window linked to verified emissions reductions.",
    status: "In Progress",
    tags: ["Forests", "Indigenous Leadership", "MRV"],
    metrics: ["co2", "resilience"],
    link: "https://www.fao.org",
    votes: 734,
    comments: 41,
    lastUpdated: "2025-09-30T00:00:00.000Z",
  },
  {
    id: "unep-cryosphere-data-collaborative",
    title: "Cryosphere Data Collaborative",
    branch: "UNEP",
    summary: "Shared infrastructure for glacier and sea-ice monitoring with open climate services for Arctic and alpine regions.",
    description:
      "The collaborative integrates satellite analytics, Indigenous observations, and in-situ measurements to improve cryosphere indicators. 2025 outputs include a near-real-time sea-ice alert API, glacier mass balance dashboards, and training modules for national hydrological services.",
    status: "Active",
    tags: ["Cryosphere", "Open Data", "Early Warning"],
    metrics: ["sea-ice", "temp"],
    link: "https://www.unep.org/explore-topics/climate-action",
    votes: 486,
    comments: 19,
    lastUpdated: "2025-08-22T00:00:00.000Z",
  },
  {
    id: "green-climate-fund-resilience-window",
    title: "GCF Just Resilience Investment Window",
    branch: "Green Climate Fund",
    summary: "Blended finance facility prioritizing locally led adaptation and loss & damage responses in SIDS and LDCs.",
    description:
      "The window channels concessional finance to community-designed resilience projects, with emphasis on coastal defenses, climate-smart agriculture, and anticipatory social protection. A 2025 milestone is the launch of a participatory monitoring framework reporting on resilience metrics alongside financial disbursements.",
    status: "Planned",
    tags: ["Finance", "Loss & Damage", "Locally Led"],
    metrics: ["finance", "resilience"],
    link: "https://www.greenclimate.fund",
    votes: 398,
    comments: 23,
    lastUpdated: "2025-07-15T00:00:00.000Z",
  },
]

export const branches = Array.from(new Set(initiatives.map((item) => item.branch))).sort()
export const statuses = Array.from(new Set(initiatives.map((item) => item.status))).sort()
export const tags = Array.from(new Set(initiatives.flatMap((item) => item.tags))).sort()
