import { getCO2Daily, getArcticSeaIceDaily, getGISTEMPMonthly } from './src/lib/datasources.js';

const co2 = await getCO2Daily();
console.log('CO2 last point', co2.at(-1));

const seaIce = await getArcticSeaIceDaily();
console.log('Sea ice last point', seaIce.at(-1));

const temp = await getGISTEMPMonthly();
console.log('Temp last point', temp.at(-1));
