/** All Kosovo municipalities (official list). */
export const KOSOVO_CITIES = [
  "Deçan",
  "Dragash",
  "Drenas",
  "Ferizaj",
  "Fushë Kosovë",
  "Gjakovë",
  "Gjilan",
  "Graçanicë",
  "Hani i Elezit",
  "Istog",
  "Junik",
  "Kaçanik",
  "Kamenicë",
  "Klinë",
  "Kllokot",
  "Leposaviq",
  "Lipjan",
  "Malishevë",
  "Mamushë",
  "Mitrovicë",
  "Mitrovicë e Veriut",
  "Novobërdë",
  "Obiliq",
  "Partesh",
  "Pejë",
  "Podujevë",
  "Prishtinë",
  "Prizren",
  "Rahovec",
  "Ranillug",
  "Shtime",
  "Shtërpcë",
  "Skenderaj",
  "Suharekë",
  "Viti",
  "Vushtrri",
  "Zubin Potok",
  "Zveçan",
] as const;

export type KosovoCity = (typeof KOSOVO_CITIES)[number];

const CITY_SET = new Set<string>(KOSOVO_CITIES);

/** Case- and diacritic-insensitive match for the city combobox. */
export function normalizeCityQuery(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Filter municipalities by a typed query (e.g. "Pri" → Prishtinë). */
export function filterCities(query: string, limit = 12): KosovoCity[] {
  const q = normalizeCityQuery(query);
  if (!q) return [...KOSOVO_CITIES].slice(0, limit);
  return KOSOVO_CITIES.filter((city) =>
    normalizeCityQuery(city).includes(q),
  ).slice(0, limit);
}

export function isKosovoCity(value: string): value is KosovoCity {
  return CITY_SET.has(value);
}
