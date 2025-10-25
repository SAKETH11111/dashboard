import {
  fetchRealtimeNitrateSensors,
  getIowaArsenicSeries,
  getIowaBacteriaSeries,
  getIowaDbpSeries,
  getIowaFluorideSeries,
  getIowaNitrateSeries,
  getIowaNitriteSeries,
  getIowaPfasSeries,
  getWaterAdvisories,
  getWaterDatasourcesOverview,
} from "../src/lib/water/iowa-datasources"
import { validateWaterSeries } from "../src/lib/water/iowa-datasources"

async function main() {
  const nitrate = await getIowaNitrateSeries()
  validateWaterSeries(nitrate)
  console.log("Nitrate latest", nitrate.points.at(-1))

  const bacteria = await getIowaBacteriaSeries()
  console.log("E. coli advisories", bacteria.advisories?.map((advisory) => advisory.id) ?? [])

  const nitrite = await getIowaNitriteSeries()
  console.log("Nitrite latest", nitrite.points.at(-1))

  const pfas = await getIowaPfasSeries()
  console.log("PFAS status", pfas.status, pfas.threshold?.alertLevel)

  const arsenic = await getIowaArsenicSeries()
  console.log("Arsenic trend", arsenic.points.slice(-2))

  const dbp = await getIowaDbpSeries()
  console.log("DBP status", dbp.status, dbp.points.slice(-2))

  const fluoride = await getIowaFluorideSeries()
  console.log("Fluoride latest", fluoride.points.at(-1))

  const advisories = await getWaterAdvisories()
  console.log("Advisories count", advisories.length)

  const overview = await getWaterDatasourcesOverview()
  console.log("Overview generated at", overview.generatedAt)

  const sensors = await fetchRealtimeNitrateSensors()
  console.log("Realtime sensors", sensors.length, sensors.map((sensor) => sensor.status))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
