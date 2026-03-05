export const UNIT_CONVERSION_MAP = {
  KG: { TON: 0.001, GRAM: 1000, GR: 1000, MG: 1000000, LB: 2.20462 },
  TON: { KG: 1000, GRAM: 1000000, GR: 1000000 },
  GRAM: { KG: 0.001, MG: 1000, TON: 0.000001 },
  GR: { KG: 0.001, MG: 1000, TON: 0.000001 },

  LITER: { ML: 1000, M3: 0.001 },
  LTR: { ML: 1000, M3: 0.001 },
  ML: { LITER: 0.001, LTR: 0.001 },

  METER: { CM: 100, MM: 1000, KM: 0.001 },
  CM: { METER: 0.01, MM: 10 },
  
  SAK: { KG: 50 },
};

export function convertQty(qty, fromUnit, toUnit) {
  const numericQty = parseFloat(qty);
  if (isNaN(numericQty)) return 0;

  const from = fromUnit?.toUpperCase().trim();
  const to = toUnit?.toUpperCase().trim();

  if (!from || !to || from === to) return numericQty;

  let result = numericQty;

  if (UNIT_CONVERSION_MAP[from] && UNIT_CONVERSION_MAP[from][to] !== undefined) {
    result = numericQty * UNIT_CONVERSION_MAP[from][to];
  } 
  else if (UNIT_CONVERSION_MAP[to] && UNIT_CONVERSION_MAP[to][from] !== undefined) {
    result = numericQty / UNIT_CONVERSION_MAP[to][from];
  } 
  else {
    console.warn(`Conversion from ${from} to ${to} not defined. Returning original value.`);
    return numericQty;
  }
  
  return cleanNumber(result);
}


export function getBaseUnit(unit) {
  const u = unit?.toUpperCase().trim();
  if (["TON", "GRAM", "GR", "KG", "MG", "LB", "SAK"].includes(u)) return "KG";
  if (["ML", "LITER", "LTR", "M3"].includes(u)) return "LITER";
  if (["CM", "MM", "METER", "KM"].includes(u)) return "METER";
  return unit; 
}

export const cleanNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  const rounded = Number(Math.round(num + 'e4') + 'e-4');
  return Math.abs(rounded) < 0.0000001 ? 0 : rounded;
};