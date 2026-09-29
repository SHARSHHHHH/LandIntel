import { NATIONAL_LAND_USE } from "./national-land-use";

/**
 * Deterministic, rule-based Q&A engine for the Scenario & Decision Support
 * page's "Ask a question" panel.
 *
 * No LLM API key is configured in this sandbox (see .env.example - only the
 * researcher portal's optional GROQ_API_KEY exists, and it is unset here),
 * so this parses the question for entities already present in the app's
 * own data - district names, land-use categories, percentages - and
 * generates an answer strictly from that local data: the district's real
 * area/forest-cover figures, the live scenario calculator's current state,
 * and the real, sourced National Land Use Trends dataset from the Policy
 * Analytics page. It never calls out to the network and never invents a
 * number that isn't derivable from those sources.
 */

export interface DistrictFact {
  id: string;
  name: string;
  stateName: string;
  areaKm2: number | null;
  forestCoverPct: number | null;
  populationDensity: number | null;
}

export interface ScenarioContext {
  districtName: string;
  stateName: string;
  totalKm2: number;
  totalHectares: number;
  currentForestPct: number;
  currentForestHectares: number;
  currentOtherHectares: number;
  deltaHectares: number;
  newForestPct: number;
  newForestHectares: number;
  newOtherHectares: number;
}

function fmt(n: number, digits = 1): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

function extractPercent(question: string): number | null {
  const m = question.match(/(\d+(?:\.\d+)?)\s*%/);
  if (m) return parseFloat(m[1]);
  const m2 = question.match(/(\d+(?:\.\d+)?)\s*percent/i);
  if (m2) return parseFloat(m2[1]);
  return null;
}

function mentionsAny(question: string, terms: string[]): boolean {
  const q = question.toLowerCase();
  return terms.some((t) => q.includes(t));
}

function findMentionedDistrict(question: string, districts: DistrictFact[]): DistrictFact | null {
  const q = question.toLowerCase();
  for (const d of districts) {
    if (q.includes(d.name.toLowerCase())) return d;
  }
  return null;
}

/**
 * Answers one question. `districts` should be every district this portal
 * has real area/forest-cover/density data for (queried from gov.db by the
 * API route), and `scenario` is the current state of the on-page
 * calculator (selected district + the reallocation slider's position).
 */
export function answerQuestion(
  question: string,
  districts: DistrictFact[],
  scenario: ScenarioContext | null
): string {
  const q = question.trim();
  if (!q) return "Ask a question about the current scenario, a district, or the national land-use data above.";

  const mentionedDistrict = findMentionedDistrict(q, districts);
  const pct = extractPercent(q);
  const mentionsResidential = mentionsAny(q, ["residential", "housing", "built-up", "built up", "urban"]);
  const mentionsAgricultural = mentionsAny(q, ["agricultur", "cropland", "farm", "crop"]);
  const mentionsForest = mentionsAny(q, ["forest", "afforest", "deforest"]);
  const mentionsRisk = mentionsAny(q, ["risk", "most at risk", "vulnerable", "pressure"]);
  const mentionsWhichDistrict = mentionsAny(q, ["which district", "which of the districts", "what district", "highest risk", "most risk"]);
  const mentionsNational = mentionsAny(q, ["national", "india", "nrsc", "country", "all india"]);

  // 1) "Which district has the most conversion risk?" (or similar) - rank
  //    the districts we actually hold real forest-cover + density data for.
  if (mentionsWhichDistrict || (mentionsRisk && !mentionedDistrict)) {
    const withData = districts.filter((d) => d.forestCoverPct !== null && d.populationDensity !== null);
    if (withData.length === 0) {
      return "None of the districts on record have both a forest-cover figure and a population-density figure yet, so a data-grounded risk ranking can't be produced.";
    }
    // Simple, transparent risk score: lower forest cover + higher density = higher conversion pressure.
    const scored = withData
      .map((d) => ({
        d,
        score: (100 - (d.forestCoverPct as number)) * 0.5 + Math.min(100, (d.populationDensity as number) / 100) * 0.5,
      }))
      .sort((a, b) => b.score - a.score);
    const top = scored[0].d;
    const rest = scored
      .slice(1, 4)
      .map((s) => `${s.d.name} (${fmt(s.d.forestCoverPct as number)}% forest, ${fmt(s.d.populationDensity as number, 0)} persons/km²)`)
      .join("; ");
    return (
      `Based on the districts with a real, cited forest-cover figure and population density on record, ` +
      `${top.name}, ${top.stateName} shows the highest land-conversion pressure: ${fmt(top.forestCoverPct as number)}% ` +
      `forest cover against a population density of ${fmt(top.populationDensity as number, 0)} persons/km². ` +
      (rest ? `Next highest: ${rest}. ` : "") +
      `This is computed from this platform's own district indicators (lower forest cover + higher density = higher pressure), not a predictive model.`
    );
  }

  // 2) A "what happens if I reallocate X% to <category>" question, answered
  //    against the currently selected district's real area/forest split.
  if (pct !== null && scenario) {
    const shareHectares = (pct / 100) * scenario.totalHectares;
    if (mentionsResidential || mentionsAny(q, ["reallocate", "convert", "shift"])) {
      // This platform's calculator only models two buckets (forest / all
      // other land), so a shift "to residential" is modelled as coming out
      // of forest into that other-land bucket - the same direction the
      // slider itself moves in - rather than invented from nowhere (which
      // would push the two shares' total past 100%).
      const cappedShare = Math.min(shareHectares, scenario.currentForestHectares);
      const newForest = scenario.currentForestHectares - cappedShare;
      const newOther = scenario.totalHectares - newForest;
      const newForestPct = (newForest / scenario.totalHectares) * 100;
      const newOtherPct = 100 - newForestPct;
      let answer =
        `Reallocating ${fmt(pct)}% of ${scenario.districtName}'s total area (${fmt(shareHectares)} ha of ` +
        `${fmt(scenario.totalHectares)} ha) toward ${mentionsResidential ? "residential/built-up" : "the reallocated"} use ` +
        `comes out of forest in this platform's two-bucket model: forest cover would fall from ${fmt(scenario.currentForestPct)}% ` +
        `to about ${fmt(newForestPct)}%, while "other land" (non-forest, including the new residential area) rises from ` +
        `${fmt(100 - scenario.currentForestPct)}% (${fmt(scenario.currentOtherHectares)} ha) to about ${fmt(newOtherPct)}% ` +
        `(${fmt(newOther)} ha). ` +
        (cappedShare < shareHectares
          ? `Note: ${scenario.districtName} only has ${fmt(scenario.currentForestHectares)} ha of forest, less than the ` +
            `${fmt(shareHectares)} ha requested, so the shift is capped at what forest land is available. `
          : "");
      if (mentionsAgricultural) {
        answer +=
          `This app does not hold a district-level agricultural-land figure to subtract from directly, but nationally, NRSC's ` +
          `Land Use and Land Cover Atlas (March 2024) shows agricultural categories supplied about ` +
          `${NATIONAL_LAND_USE.agriculturalCategoriesCombinedPct}% of all built-up growth between ${NATIONAL_LAND_USE.builtUpArea.period} - ` +
          `so a residential expansion of this kind nationally draws roughly a quarter of its land from agriculture, on top of wasteland (12.3%).`;
      }
      answer += ` Try the slider on this page, moved to ${fmt(-cappedShare)} ha, to see this modelled directly.`;
      return answer;
    }
    if (mentionsForest) {
      const sign = pct >= 0 ? 1 : -1;
      const delta = sign * shareHectares;
      const newForest = Math.min(scenario.totalHectares, Math.max(0, scenario.currentForestHectares + delta));
      const newForestPct = (newForest / scenario.totalHectares) * 100;
      return (
        `Converting ${fmt(pct)}% of ${scenario.districtName}'s total area (${fmt(shareHectares)} ha) into forest would move ` +
        `forest cover from ${fmt(scenario.currentForestPct)}% (${fmt(scenario.currentForestHectares)} ha) to about ` +
        `${fmt(newForestPct)}% (${fmt(newForest)} ha) of the district's ${fmt(scenario.totalKm2)} km² total area. ` +
        `Try dragging the slider on this page to ${delta >= 0 ? "the right" : "the left"} to see this modelled directly.`
      );
    }
  }

  // 3) A question about the currently selected district / scenario, no
  //    percentage given - describe the live scenario state.
  if ((mentionedDistrict || mentionsForest || mentionsAgricultural) && scenario) {
    return (
      `${scenario.districtName}, ${scenario.stateName} currently has ${fmt(scenario.currentForestPct)}% forest cover ` +
      `(${fmt(scenario.currentForestHectares)} ha) out of ${fmt(scenario.totalHectares)} ha total. With the slider at its ` +
      `current position (${scenario.deltaHectares >= 0 ? "+" : ""}${fmt(scenario.deltaHectares)} ha reallocated), the ` +
      `resulting split is ${fmt(scenario.newForestPct)}% forest (${fmt(scenario.newForestHectares)} ha) and ` +
      `${fmt(100 - scenario.newForestPct)}% other land (${fmt(scenario.newOtherHectares)} ha). Move the slider to model a ` +
      `different reallocation, or name a percentage in your question (e.g. "convert 10% to forest").`
    );
  }

  // 4) A question about the national dataset.
  if (mentionsNational || mentionsAgricultural || mentionsResidential) {
    return (
      `Nationally (NRSC, Annual Land Use and Land Cover Atlas of India, March 2024), India's built-up area grew by ` +
      `${NATIONAL_LAND_USE.builtUpArea.increaseMillionHectares} million hectares between ${NATIONAL_LAND_USE.builtUpArea.period} - a ` +
      `${NATIONAL_LAND_USE.builtUpArea.increasePct}% increase, averaging ${NATIONAL_LAND_USE.builtUpArea.avgAnnualGrowthPct}% a year. ` +
      `Agricultural categories (double/triple-cropped, kharif, rabi and plantation land) supplied about ` +
      `${NATIONAL_LAND_USE.agriculturalCategoriesCombinedPct}% of that growth and wasteland another ${NATIONAL_LAND_USE.landSources[0].pct}%. ` +
      `Agricultural land is ${NATIONAL_LAND_USE.agriculturalLandPctOfTotal}% of India's total land area (World Bank, ${NATIONAL_LAND_USE.agriculturalLandYear}), ` +
      `with ${NATIONAL_LAND_USE.irrigatedAgriculturalLandPct}% of that irrigated. See the Policy Analytics page for the charts and full citations.`
    );
  }

  return (
    `I can answer questions grounded in this district's scenario (try "what happens to forest cover if I convert 10% to residential?"), ` +
    `a specific district by name, or the national NRSC land-use dataset shown on the Policy Analytics page. Try rephrasing with a ` +
    `district name, a percentage, or "which district has the most conversion risk?".`
  );
}
