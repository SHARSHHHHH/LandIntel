/**
 * Real, sourced national land-use dataset used by the Policy Analytics page
 * (components/gov/NationalLandUseTrends.tsx) and by the rule-based Q&A
 * engine (lib/gov/qa-engine.ts) on the Scenario & Decision Support page.
 * Kept as one plain-data module (no JSX) so a server-only route can import
 * the same numbers a client component renders, without duplicating them.
 *
 * Sources, quoted exactly as given in the brief:
 *  - NRSC, Annual Land Use and Land Cover Atlas of India, March 2024
 *    https://www.nrsc.gov.in/nrscnew/assets/pdf/atlas/LULC/LULC%20Atlas%20Final%20With%20Cover_March2024.pdf
 *  - Down To Earth, analysis of the same NRSC data
 *    https://www.downtoearth.org.in/urbanisation/india-s-built-up-area-grew-by-2-5-million-hectares-in-17-years-95484
 *  - World Bank WDI, AG.LND.AGRI.ZS / AG.LND.IRIG.AG.ZS
 *    https://data.worldbank.org/indicator/AG.LND.AGRI.ZS?locations=IN
 *    https://data.worldbank.org/indicator/AG.LND.IRIG.AG.ZS
 *  - FAO FAOSTAT (Land Use domain, 2020 figure)
 *    https://www.fao.org/faostat/en/#data/RL
 */

export const NATIONAL_LAND_USE = {
  builtUpArea: {
    period: "2005-06 to 2022-23",
    increaseMillionHectares: 2.5,
    increasePct: 31,
    avgAnnualGrowthPct: 2.4,
    baselineMillionHectares: 8.06,
    latestMillionHectares: 10.56,
    source: "NRSC, Annual Land Use and Land Cover Atlas of India, March 2024",
  },
  landSources: [
    { category: "Wasteland", pct: 12.3 },
    { category: "Double/triple-cropped land", pct: 6.3 },
    { category: "Kharif (monsoon) cropland", pct: 5.3 },
    { category: "Fallow land", pct: 5.8 },
    { category: "Rabi (winter) cropland", pct: 3.1 },
    { category: "Plantations", pct: 2.9 },
  ],
  agriculturalCategoriesCombinedPct: 23.4,
  highwayGrowthByState: [
    { state: "Gujarat", pct: 175 },
    { state: "Karnataka", pct: 109 },
    { state: "Andhra Pradesh", pct: 94 },
    { state: "Madhya Pradesh", pct: 75 },
    { state: "West Bengal", pct: 58 },
  ],
  agriculturalLandPctOfTotal: 60.06,
  agriculturalLandYear: 2023,
  croplandMillionHectares: 169,
  croplandYear: 2020,
  irrigatedAgriculturalLandPct: 44.41,
  irrigatedAgriculturalLandYear: 2023,
};
