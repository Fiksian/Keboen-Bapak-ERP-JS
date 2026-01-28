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
  const numericQty = parseFloat(qty);
  if (isNaN(numericQty)) return 0;

  const from = fromUnit?.toUpperCase();
  const to = toUnit?.toUpperCase();

  if (!from || !to || from === to) return numericQty;

  let result = numericQty;

  if (UNIT_CONVERSION_MAP[from] && UNIT_CONVERSION_MAP[from][to] !== undefined) {
    result = numericQty * UNIT_CONVERSION_MAP[from][to];
  } 
  else if (UNIT_CONVERSION_MAP[to] && UNIT_CONVERSION_MAP[to][from] !== undefined) {
    result = numericQty / UNIT_CONVERSION_MAP[to][from];
  } 
  
  return result;
}


export function getBaseUnit(unit) {
  const u = unit?.toUpperCase();
  if (["TON", "GRAM", "KG", "MG", "LB"].includes(u)) return "KG";
  if (["ML", "LITER", "M3"].includes(u)) return "LITER";
  if (["CM", "MM", "METER", "KM"].includes(u)) return "METER";
  return unit; 
}

export const cleanNumber = (value) => {
  const rounded = parseFloat(parseFloat(value).toFixed(4));
  return Math.abs(rounded) < 0.00001 ? 0 : rounded;
};