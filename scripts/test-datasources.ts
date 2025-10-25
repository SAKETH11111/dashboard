import { getCO2Daily, getArcticSeaIceDaily, getGISTEMPMonthly } from "../src/lib/datasources"

async function main() {
  const co2 = await getCO2Daily()
  console.log("CO2", co2.slice(-3))
  const ice = await getArcticSeaIceDaily()
  console.log("Ice", ice.slice(-3))
  const temp = await getGISTEMPMonthly()
  console.log("Temp", temp.slice(-3))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
