from pathlib import Path

CITIES = [
    ("Tbilisi", "\u10d7\u10d1\u10d8\u10da\u10d8\u10e1\u10d8"),
    ("Batumi", "\u10d1\u10d0\u10d7\u10e3\u10db\u10d8"),
    ("Kutaisi", "\u10e5\u10e3\u10d7\u10d0\u10d8\u10e1\u10d8"),
    ("Rustavi", "\u10e0\u10e3\u10e1\u10e2\u10d0\u10d5\u10d8"),
    ("Gori", "\u10d2\u10dd\u10e0\u10d8"),
    ("Zugdidi", "\u10d6\u10e3\u10d2\u10d3\u10d8\u10d3\u10d8"),
    ("Poti", "\u10e4\u10dd\u10d7\u10d8"),
    ("Khashuri", "\u10ee\u10d0\u10e8\u10e3\u10e0\u10d8"),
    ("Samtredia", "\u10e1\u10d0\u10db\u10e2\u10e0\u10d4\u10d3\u10d8\u10d0"),
    ("Senaki", "\u10e1\u10d4\u10dc\u10d0\u10d9\u10d8"),
    ("Zestaponi", "\u10d6\u10d4\u10e1\u10e2\u10d0\u10e4\u10dd\u10dc\u10d8"),
    ("Marneuli", "\u10db\u10d0\u10e0\u10dc\u10d4\u10e3\u10da\u10d8"),
    ("Telavi", "\u10d7\u10d4\u10da\u10d0\u10d5\u10d8"),
    ("Akhaltsikhe", "\u10d0\u10ee\u10d0\u10da\u10ea\u10d8\u10ee\u10d4"),
    ("Kobuleti", "\u10e5\u10dd\u10d1\u10e3\u10da\u10d4\u10d7\u10d8"),
    ("Ozurgeti", "\u10dd\u10d6\u10e3\u10e0\u10d2\u10d4\u10d7\u10d8"),
    ("Kaspi", "\u10d9\u10d0\u10e1\u10e4\u10d8"),
    ("Chiatura", "\u10ed\u10d8\u10d0\u10e2\u10e3\u10e0\u10d0"),
    ("Sagarejo", "\u10e1\u10d0\u10d2\u10d0\u10e0\u10d4\u10df\u10dd"),
    ("Gardabani", "\u10d2\u10d0\u10e0\u10d3\u10d0\u10d1\u10d0\u10dc\u10d8"),
    ("Borjomi", "\u10d1\u10dd\u10e0\u10df\u10dd\u10db\u10d8"),
    ("Gurjaani", "\u10d2\u10e3\u10e0\u10df\u10d0\u10d0\u10dc\u10d8"),
    ("Mtskheta", "\u10db\u10ea\u10ee\u10d4\u10d7\u10d0"),
    ("Ambrolauri", "\u10d0\u10db\u10d1\u10e0\u10dd\u10da\u10d0\u10e3\u10e0\u10d8"),
    ("Lagodekhi", "\u10da\u10d0\u10d2\u10dd\u10d3\u10d0\u10ee\u10d8"),
    ("Sighnaghi", "\u10e1\u10d8\u10d2\u10dc\u10d0\u10e6\u10d8"),
    ("Tkibuli", "\u10e2\u10ed\u10d8\u10d1\u10e3\u10da\u10d8"),
    ("Tskaltubo", "\u10ec\u10e7\u10d0\u10da\u10e2\u10e3\u10d1\u10dd"),
    ("Bolnisi", "\u10d1\u10dd\u10da\u10dc\u10d8\u10e1\u10d8"),
    ("Akhalgori", "\u10d0\u10ee\u10d0\u10da\u10d2\u10dd\u10e0\u10d8"),
]

lines = [
    "export type GeorgianCity = { en: string; ka: string }",
    "",
    "export const GEORGIAN_CITIES: GeorgianCity[] = [",
]
for en, ka in CITIES:
    lines.append(f"  {{ en: '{en}', ka: '{ka}' }},")
lines += [
    "]",
    "",
    "const KA_TO_EN = new Map(GEORGIAN_CITIES.map((c) => [c.ka, c.en]))",
    "",
    "export function cityLabel(lang: 'en' | 'ka', city: GeorgianCity) {",
    "  return lang === 'ka' ? city.ka : city.en",
    "}",
    "",
    "export function filterCities(query: string, lang: 'en' | 'ka') {",
    "  const q = query.trim().toLowerCase()",
    "  if (!q) return GEORGIAN_CITIES",
    "  return GEORGIAN_CITIES.filter((city) => {",
    "    const label = cityLabel(lang, city).toLowerCase()",
    "    return label.includes(q) || city.en.toLowerCase().includes(q) || city.ka.includes(q)",
    "  })",
    "}",
    "",
    "export function cityValueForSubmit(input: string) {",
    "  const trimmed = input.trim()",
    "  if (!trimmed) return ''",
    "  return KA_TO_EN.get(trimmed) ?? trimmed",
    "}",
    "",
]

Path(__file__).with_name("georgianCities.ts").write_text("\n".join(lines), encoding="utf-8")
print("wrote georgianCities.ts", len(CITIES), "cities")
