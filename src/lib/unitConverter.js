export const UNIT_CONVERSION_MAP = {
  // BERAT (Base: KG)
  KG: { TON: 0.001, GRAM: 1000, MG: 1000000, LB: 2.20462 },
  TON: { KG: 1000, GRAM: 1000000 },
  GRAM: { KG: 0.001, MG: 1000 },

  // VOLUME (Base: LITER)
  LITER: { ML: 1000, M3: 0.001 },
  ML: { LITER: 0.001 },

  // PANJANG (Base: METER)
  METER: { CM: 100, MM: 1000, KM: 0.001 },
  CM: { METER: 0.01, MM: 10 },
};

export function convertQty(qty, fromUnit, toUnit) {
  const from = fromUnit.toUpperCase();
  const to = toUnit.toUpperCase();

  if (from === to) return qty;

  if (UNIT_CONVERSION_MAP[from] && UNIT_CONVERSION_MAP[from][to]) {
    return qty * UNIT_CONVERSION_MAP[from][to];
  }

  if (UNIT_CONVERSION_MAP[to] && UNIT_CONVERSION_MAP[to][from]) {
    return qty / UNIT_CONVERSION_MAP[to][from];
  }


  console.warn(`No conversion found from ${from} to ${to}`);
  return qty;
}