import { initDb, getDatabase } from "../src/lib/db";
import { randomUUID } from "crypto";

const db = getDatabase();
initDb();

interface StateStat {
  name: string;
  code: string;
  villages?: number;
  clr?: number;
  maps?: number;
  linked?: number;
  ulpin?: number;
  disputes?: number;
  disputesTrend?: "rising" | "stable" | "falling";
  urban?: number;
  agri?: number;
  forest?: number;
  climate?: number;
  projects?: number;
  story?: string;
}

const STATE_STATS: StateStat[] = [
  {
    name: "Uttarakhand", code: "UK", villages: 16949, clr: 91, maps: 83, linked: 78, ulpin: 72,
    disputes: 96000, disputesTrend: "falling", urban: 30.2, agri: 30, forest: 65, climate: 60, projects: 64,
    story: "Mountain state where landslide-prone slopes make cadastral maps critical for safe, defensible land ownership.",
  },
  {
    name: "Andhra Pradesh", code: "AP", villages: 16370, clr: 100, maps: 100, linked: 100, ulpin: 95,
    disputes: 254000, disputesTrend: "falling", urban: 29.5, agri: 58, forest: 20, climate: 52, projects: 214,
    story: "Complete digital land records, one of the first states to finish map digitization. A model for the rest of India.",
  },
  {
    name: "Uttar Pradesh", code: "UP", villages: 97835, clr: 94, maps: 71, linked: 68, ulpin: 71,
    disputes: 1120000, disputesTrend: "stable", urban: 23.2, agri: 65, forest: 6, climate: 47, projects: 356,
    story: "India's largest land-record network with ~1 lakh villages. High dispute volume but rapid digitization is helping transparency.",
  },
  {
    name: "Maharashtra", code: "MH", villages: 39848, clr: 96, maps: 88, linked: 85, ulpin: 88,
    disputes: 620000, disputesTrend: "stable", urban: 45.2, agri: 60, forest: 17, climate: 58, projects: 289,
    story: "Urban expansion is fast across Mumbai-Pune belt; strong GIS linkage between maps and ownership records.",
  },
  {
    name: "Bihar", code: "BR", villages: 38973, clr: 90, maps: 65, linked: 58, ulpin: 46,
    disputes: 980000, disputesTrend: "rising", urban: 11.3, agri: 66, forest: 7, climate: 61, projects: 178,
    story: "Rising land disputes tied to dense rural population and less-complete digitization. A priority state for ULPIN.",
  },
  {
    name: "Rajasthan", code: "RJ", villages: 44839, clr: 93, maps: 85, linked: 80, ulpin: 76,
    disputes: 430000, disputesTrend: "falling", urban: 24.9, agri: 55, forest: 5, climate: 68, projects: 201,
    story: "Arid land governance focus; strong progress linking cadastral maps. Climate-vulnerability monitoring is central here.",
  },
  {
    name: "Madhya Pradesh", code: "MP", villages: 52179, clr: 92, maps: 78, linked: 74, ulpin: 69,
    disputes: 510000, disputesTrend: "stable", urban: 27.6, agri: 61, forest: 31, climate: 55, projects: 233,
    story: "Large forest cover (31%) makes forest-boundary mapping and tribal land rights a key policy area.",
  },
  {
    name: "West Bengal", code: "WB", villages: 40752, clr: 91, maps: 82, linked: 77, ulpin: 72,
    disputes: 560000, disputesTrend: "rising", urban: 31.9, agri: 62, forest: 14, climate: 64, projects: 155,
    story: "Sundarbans and river-erosion zones drive climate-land concerns; urban fringe land conflicts are growing.",
  },
  {
    name: "Tamil Nadu", code: "TN", villages: 16176, clr: 98, maps: 94, linked: 91, ulpin: 90,
    disputes: 350000, disputesTrend: "falling", urban: 48.4, agri: 50, forest: 18, climate: 57, projects: 167,
    story: "Among the most urbanised states; digitized records plus strong revenue administration keep disputes low.",
  },
  {
    name: "Karnataka", code: "KA", villages: 29553, clr: 97, maps: 93, linked: 90, ulpin: 89,
    disputes: 340000, disputesTrend: "falling", urban: 38.7, agri: 54, forest: 18, climate: 53, projects: 192,
    story: "Rural-urban transition around Bengaluru is intense; robust transparency tools and ULPIN coverage help.",
  },
  {
    name: "Gujarat", code: "GJ", villages: 14824, clr: 100, maps: 96, linked: 93, ulpin: 92,
    disputes: 195000, disputesTrend: "stable", urban: 42.6, agri: 57, forest: 8, climate: 66, projects: 227,
    story: "Industrial growth drives land-use change; high completion of records modernization and drone surveys.",
  },
  {
    name: "Chhattisgarh", code: "CG", villages: 20216, clr: 100, maps: 97, linked: 95, ulpin: 91,
    disputes: 120000, disputesTrend: "falling", urban: 23.2, agri: 48, forest: 44, climate: 50, projects: 118,
    story: "100% computerization of land records and among the highest map linkage in the country.",
  },
  {
    name: "Odisha", code: "OD", villages: 51348, clr: 92, maps: 81, linked: 76, ulpin: 70,
    disputes: 260000, disputesTrend: "stable", urban: 16.7, agri: 54, forest: 30, climate: 62, projects: 134,
    story: "Cyclone-prone coastal districts shape climate-resilient land planning; tribal land rights are a focus.",
  },
  {
    name: "Punjab", code: "PB", villages: 12701, clr: 99, maps: 95, linked: 92, ulpin: 90,
    disputes: 310000, disputesTrend: "stable", urban: 37.5, agri: 82, forest: 4, climate: 49, projects: 88,
    story: "Intensive agriculture (82% farmland) puts pressure on land records; disputes are mostly boundary-based.",
  },
  {
    name: "Haryana", code: "HR", villages: 6905, clr: 98, maps: 94, linked: 91, ulpin: 89,
    disputes: 205000, disputesTrend: "rising", urban: 34.9, agri: 74, forest: 4, climate: 55, projects: 97,
    story: "NCR growth triggers farmland-to-residential conversion; a test-bed for urban land policy.",
  },
  {
    name: "Kerala", code: "KL", villages: 1018, clr: 96, maps: 92, linked: 89, ulpin: 85,
    disputes: 150000, disputesTrend: "stable", urban: 47.7, agri: 48, forest: 27, climate: 63, projects: 92,
    story: "High-density state; focused on land consolidation and flood-resilient rebuilding after 2018 floods.",
  },
  {
    name: "Assam", code: "AS", villages: 26430, clr: 80, maps: 61, linked: 55, ulpin: 41,
    disputes: 240000, disputesTrend: "rising", urban: 14.1, agri: 50, forest: 35, climate: 71, projects: 76,
    story: "River erosion from the Brahmaputra displaces land parcels; forest rights and char (island) lands are challenges.",
  },
  {
    name: "Delhi", code: "DL", villages: 208, clr: 100, maps: 98, linked: 96, ulpin: 94,
    disputes: 180000, disputesTrend: "stable", urban: 97.5, agri: 0, forest: 11, climate: 54, projects: 64,
    story: "Fully urban. Land is scarce — disputes centre on demarcation, unauthorised colonies, and government land.",
  },
  {
    name: "Jharkhand", code: "JH", villages: 32371, clr: 82, maps: 64, linked: 60, ulpin: 38,
    disputes: 290000, disputesTrend: "rising", urban: 24.1, agri: 45, forest: 29, climate: 57, projects: 71,
    story: "Forest-land and mining overlaps drive complex rights; tribal land laws require specialised mapping.",
  },
  {
    name: "Telangana", code: "TS", villages: 10764, clr: 99, maps: 96, linked: 93, ulpin: 91,
    disputes: 180000, disputesTrend: "falling", urban: 38.9, agri: 59, forest: 16, climate: 51, projects: 143,
    story: "Dharani portal reform has modernized records; strong grievance redress linked to parcel-level data.",
  },
  {
    name: "Himachal Pradesh", code: "HP", villages: 17633, clr: 90, maps: 84, linked: 79, ulpin: 74,
    disputes: 62000, disputesTrend: "falling", urban: 10.0, agri: 17, forest: 66, climate: 59, projects: 58,
    story: "Mountain land governance — avalanche and landslide zones make geospatial mapping essential.",
  },
  {
    name: "Goa", code: "GA", villages: 191, clr: 95, maps: 92, linked: 89, ulpin: 86,
    disputes: 21500, disputesTrend: "stable", urban: 62.2, agri: 40, forest: 58, climate: 56, projects: 24,
    story: "Tourism-driven land pressure; Portuguese-era record systems being unified with digital ULPIN.",
  },
  {
    name: "Bihar_extra_arunachalpradesh", code: "AR", villages: 5567, clr: 60, maps: 40, linked: 30, ulpin: 18,
    disputes: 12000, disputesTrend: "stable", urban: 22.9, agri: 20, forest: 79, climate: 66, projects: 22,
    story: "Most of the land is forest/community-managed; ULPIN roll-out in early stage.",
  },
];

const STATE_FILL: Record<string, [string, number, number, number, number, number, number, number, number, number]> = {
  "Manipur": ["MN", 2790, 70, 50, 42, 22, 18000, 30.6, 46, 78],
  "Meghalaya": ["ML", 6596, 66, 44, 36, 16, 15000, 19.6, 38, 76],
  "Mizoram": ["MZ", 830, 72, 52, 40, 20, 9000, 51.5, 31, 85],
  "Nagaland": ["NL", 1307, 62, 40, 30, 12, 8000, 28.9, 38, 87],
  "Tripura": ["TR", 9467, 84, 66, 58, 40, 42000, 26.6, 47, 74],
  "Sikkim": ["SK", 191, 88, 78, 70, 60, 6000, 25.2, 29, 47],
  "Jammu & Kashmir": ["JK", 7102, 76, 55, 47, 34, 110000, 36.6, 48, 43],
  "Lakshadweep": ["LD", 25, 90, 80, 72, 55, 1200, 100, 1, 8],
  "Puducherry": ["PY", 196, 98, 94, 90, 88, 15000, 68.3, 30, 5],
  "Chandigarh": ["CH", 24, 100, 98, 96, 95, 9500, 97.2, 1, 10],
  "Dadra & Nagar Haveli": ["DN", 70, 75, 55, 45, 30, 6000, 75.2, 30, 18],
  "Daman and Diu": ["DD", 24, 85, 70, 60, 50, 4000, 75.0, 30, 14],
  "Andaman & Nicobar Islands": ["AN", 252, 80, 62, 52, 38, 8000, 38.1, 32, 83],
};

const fill = (
  s: StateStat,
  k: [string, number, number, number, number, number, number, number, number, number]
) => {
  s.code = k[0];
  const [, villages, clr, maps, linked, ulpin, disputes, urban, agri, forest] = k;
  s.villages = villages; s.clr = clr; s.maps = maps; s.linked = linked; s.ulpin = ulpin;
  s.disputes = disputes; s.urban = urban; s.agri = agri; s.forest = forest;
  s.climate = Math.min(90, 30 + Math.round(((s.agri ?? 50) + (s.forest ?? 20)) / 2 / 20) * 10);
  s.projects = Math.min(60, Math.round((s.villages ?? 1000) / 600));
  s.disputesTrend = s.disputesTrend ?? "stable";
  s.story = `${s.name} is steadily expanding its digital land records under DILRMP. Villages digitized, maps linked, and the ULPIN roll-out continues district by district.`;
};

const ARUNACHAL: StateStat = {
  name: "Arunachal Pradesh", code: "AR", villages: 5567, clr: 60, maps: 40, linked: 30, ulpin: 18,
  disputes: 12000, disputesTrend: "stable", urban: 22.9, agri: 20, forest: 79, climate: 66, projects: 22,
  story: "Most of the land is forest/community-managed; ULPIN roll-out is in an early stage.",
};

const finalStates: StateStat[] = [
  ...STATE_STATS.filter((s) => s.name !== "Bihar_extra_arunachalpradesh"),
  ARUNACHAL,
];

for (const [name, values] of Object.entries(STATE_FILL)) {
  finalStates.push({ name, code: "" } as StateStat);
  const st = finalStates[finalStates.length - 1];
  fill(st, values);
}

const upsertState = db.prepare(`
  INSERT INTO public_state_stats (
    state_name, state_code, villages_total, villages_computerized_pct, maps_digitized_pct,
    cadastral_linked_pct, ulpin_parcels, ulpin_coverage_pct, disputes_total, disputes_trend,
    disputes_per_1000, urbanshare_pct, agri_pct, forest_pct, climate_vulnerability,
    projects_active, story, data_available
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(state_name) DO UPDATE SET
    villages_total=excluded.villages_total, villages_computerized_pct=excluded.villages_computerized_pct,
    maps_digitized_pct=excluded.maps_digitized_pct, cadastral_linked_pct=excluded.cadastral_linked_pct,
    ulpin_parcels=excluded.ulpin_parcels, ulpin_coverage_pct=excluded.ulpin_coverage_pct,
    disputes_total=excluded.disputes_total, disputes_trend=excluded.disputes_trend,
    disputes_per_1000=excluded.disputes_per_1000, urbanshare_pct=excluded.urbanshare_pct,
    agri_pct=excluded.agri_pct, forest_pct=excluded.forest_pct,
    climate_vulnerability=excluded.climate_vulnerability, projects_active=excluded.projects_active,
    story=excluded.story, data_available=excluded.data_available
`);

let stateCount = 0;
for (const s of finalStates) {
  const disputesPer1000 = s.villages ? Math.round((s.disputes! / Math.max(1, s.villages!)) * 1000) : 0;
  upsertState.run(
    s.name, s.code, s.villages ?? null, s.clr ?? null, s.maps ?? null, s.linked ?? null,
    Math.round(((s.ulpin ?? 0) / 100) * (s.villages ?? 0) * 40), s.ulpin ?? null,
    s.disputes ?? null, s.disputesTrend ?? "stable", disputesPer1000,
    s.urban ?? null, s.agri ?? null, s.forest ?? null, s.climate ?? null,
    s.projects ?? null, s.story ?? null, 1
  );
  stateCount++;
}
console.log(`Seeded ${stateCount} states`);

interface Article {
  slug: string;
  title: string;
  source_type: string;
  organization: string;
  year: number;
  category: string;
  tags: string[];
  summary_easy: string[];
  summary_simple: string;
  summary_deep: string;
  key_stats: { label: string; value: string; context: string }[];
  takeaways: string[];
  content_doc: string;
}

const ARTICLES: Article[] = [
  {
    slug: "dilrmp-3-0-operational-guidelines",
    title: "DILRMP 3.0 Operational Guidelines (2026–2031)",
    source_type: "policy",
    organization: "Department of Land Resources, Ministry of Rural Development",
    year: 2026,
    category: "land-records",
    tags: ["DILRMP", "land records", "digitization", "policy", "ULPIN"],
    summary_easy: [
      "The government's new 5-year plan to finish digital land records.",
      "It connects every village's land map to its ownership list.",
      "Goal: fewer land disputes and faster, clearer land ownership.",
    ],
    summary_simple: "DILRMP 3.0 is the Government of India's fresh five-year programme (2026-2031) to complete the digital modernisation of land records. It works to link village maps with ownership records, issue unique parcel numbers (ULPIN) for every piece of land, and make land services available online. The result should be fewer disputes, more transparency, and a stronger foundation for rural development.",
    summary_deep: "The Digital India Land Records Modernisation Programme (DILRMP) 3.0 sets the operational roadmap for 2026-2031. Building on earlier phases that computerised over 6.26 lakh villages and digitised ~2.23 crore mapsheets, Phase 3.0 prioritises conclusive land titling — full geo-referencing of cadastral maps, nationwide ULPIN (Bhu-Aadhaar) issuance, integration of registration (NGDRS) with land records at the Sub-Registrar level, and real-time synchronisation of Record of Rights. It also emphasises convergence with SVAMITVA drone surveys and linkage to financial services like PM-KISAN and crop loans.",
    key_stats: [
      { label: "Villages computerised", value: "6.26 lakh", context: "95.56% of all villages" },
      { label: "Mapsheets digitised", value: "2.23 crore", context: "59.87% of total mapsheets" },
      { label: "Modern record rooms", value: "3,534", context: "76.08% completed" },
      { label: "ULPIN roll-out", value: "9.08 crore", context: "parcels across states" },
    ],
    takeaways: [
      "DILRMP 3.0 moves India from partial digitisation toward conclusive land titles.",
      "Integrating registration offices with records reduces fraud and duplicate sales.",
      "ULPIN gives every land parcel a permanent 11-digit identity.",
    ],
    content_doc: "## DILRMP 3.0 (2026-2031)\n\nThe Digital India Land Records Modernisation Programme entered its third operational phase in 2026. The guidelines cover village-level computerization, digital map services for citizens, ULPIN issuance, and integration with the National Generic Document Registration System (NGDRS). It requires all States and UTs to complete data entry and link cadastral maps to Record of Rights.",
  },
  {
    slug: "ulpin-bhu-aadhaar-explained",
    title: "ULPIN (Bhu-Aadhaar): One Identity for Every Land Parcel",
    source_type: "policy",
    organization: "Department of Land Resources",
    year: 2025,
    category: "ulpin",
    tags: ["ULPIN", "Bhu-Aadhaar", "land parcel", "identity", "land records"],
    summary_easy: [
      "ULPIN is like an Aadhaar number, but for land.",
      "Every piece of land gets a unique 11-digit code.",
      "It stops the same land being sold to two different people.",
    ],
    summary_simple: "ULPIN (Unique Land Parcel Identification Number), also called Bhu-Aadhaar, gives every land parcel in India a single permanent 11-digit number. Like Aadhaar for a person, ULPIN stays with the land forever. This makes it harder to sell the same land twice, easier to get a loan, and simpler for citizens and banks to check who truly owns a piece of land.",
    summary_deep: "The Unique Land Parcel Identification Number (ULPIN) is a 14-digit alphanumeric identifier (11 spatial + 3 check digits) generated from the state, district, tehsil, village and survey number of every cadastral parcel. It provides a common language across states, ending fragmentation where each state used its own numbering. By linking textual records to geo-referenced maps, ULPIN is a precondition for conclusive title and for credit access, since lenders can verify parcel identity unambiguously.",
    key_stats: [
      { label: "Parcels covered", value: "9.08 cr+", context: "ULPIN + SVAMITVA combined" },
      { label: "Geo-referenced parcels", value: "10.4 cr", context: "36.2% of total" },
      { label: "Total land parcels", value: "28.72 cr", context: "India wide" },
    ],
    takeaways: [
      "ULPIN gives every parcel one permanent identity across all states.",
      "It underpins finance, taxation, and urban planning use cases.",
      "Full coverage depends on cadastral map geo-referencing.",
    ],
    content_doc: "## What is ULPIN?\n\nULPIN assigns a permanent, machine-readable ID to each land parcel drawn from its administrative location and survey identifier. It enables seamless exchange of land data across state systems, supports PM-KISAN and credit products, and lays the base for conclusive titling.",
  },
  {
    slug: "svamitva-drone-mapping",
    title: "SVAMITVA: Drone Mapping of Every Village",
    source_type: "case_study",
    organization: "Ministry of Panchayati Raj",
    year: 2025,
    category: "technology",
    tags: ["SVAMITVA", "drone", "survey", "village maps", "property"],
    summary_easy: [
      "Drones fly over villages to map every property from the sky.",
      "Villagers get a clear map showing who owns what.",
      "This turns informal village plots into official property.",
    ],
    summary_simple: "SVAMITVA is a government programme that uses drones to map all land in India's villages. Drone photos are turned into accurate digital maps that show each household's plot. For the first time, many villagers get an official property card. This helps people get loans, settle boundary disputes, and helps panchayats plan roads and drains.",
    summary_deep: "SVAMITVA (Survey of Villages and Mapping with Improvised Technology in Village Areas) deploys drone-based surveys to prepare unit-level property records in inhabited village areas. High-resolution imagery is used to draft property cards (such as 'Pahani' and record extracts) that are validated by the community before formal issue. The programme strengthens Gram Panchayat planning (LRDP/WRDP), improves property-tax assessment, and enables bank credit against documented plots. Over 6.74 crore parcels now carry SVAMITVA-linked ULPIN.",
    key_stats: [
      { label: "SVAMITVA parcels", value: "6.74 cr", context: "with ULPIN issued" },
      { label: "Scale", value: "All India", context: "village-level drone survey" },
      { label: "Benefit", value: "Property card", context: "credit + planning + taxation" },
    ],
    takeaways: [
      "Drones create village property maps far faster than manual surveys.",
      "Community validation keeps maps accurate and dispute-free.",
      "Property cards unlock bank credit for rural families.",
    ],
    content_doc: "## SVAMITVA: Mapping India's Villages from the Sky\n\nThe SVAMITVA scheme uses drone technology and GIS to map inhabited village areas. Each property plot is digitised, validated by villagers, and issued a record. The satellite and drone imagery also feeds village development planning and tax systems.",
  },
  {
    slug: "why-land-disputes-rise",
    title: "Why Land Disputes Rise in India — Trends and Causes",
    source_type: "paper",
    organization: "National Land Research Forum (illustrative)",
    year: 2026,
    category: "disputes",
    tags: ["land disputes", "litigation", "records", "urbanization", "research"],
    summary_easy: [
      "Most land fights start because records are unclear.",
      "As cities grow, farmland is converted and fights increase.",
      "Clean digital records can prevent many of these cases.",
    ],
    summary_simple: "Most land disputes in India begin with unclear or outdated records, missing maps, or the same land claimed by several people. Growth in cities makes this worse, because farmland is converted into housing or factories and old maps no longer match reality. Research shows that digitising records, linking maps to ownership, and issuing unique parcel numbers sharply reduces new disputes.",
    summary_deep: "An estimated bracket of India's civil litigation relates to land. Key drivers include (1) textual-spatial mismatch where the Record of Rights and cadastral map disagree, (2) fragmentation of holdings and inheritance ambiguity, (3) urban fringe conversion pressures, and (4) informal transactions never recorded. States with high map-to-record linkage and dispute-resolution e-portals (e.g., Telangana's Dharani, Gujarat) report falling disputes, while digitisation laggards see rising volumes. The paper recommends geo-referenced maps, SVAMITVA coverage, and ULPIN as systemic remedies.",
    key_stats: [
      { label: "Civil cases (land-related)", value: "~2/3", context: "of civil litigation (approx.)" },
      { label: "Map-linkage states", value: "72%", context: "villages with linked records" },
      { label: "Trend", value: "Falling", context: "in fully digitised states" },
    ],
    takeaways: [
      "Records-maps mismatch is the top cause of disputes.",
      "Urbanisation concentrates disputes on city fringes.",
      "Digitisation plus ULPIN measurably reduces new cases.",
    ],
    content_doc: "## Land Disputes: Causes and Remedies\n\nThis research review examines dispute data and district-court filings across states, correlating dispute growth with record digitisation, urbanisation indices, and household fragmentation. It find that combination of digital records, linked maps and ULPIN reduces new filings.",
  },
  {
    slug: "urbanization-land-use",
    title: "Urbanisation and the Changing Use of Land in India",
    source_type: "paper",
    organization: "Institute of Urban Land Policy (illustrative)",
    year: 2025,
    category: "land-use",
    tags: ["urbanization", "land use", "city growth", "agriculture", "research"],
    summary_easy: [
      "Indian cities are growing and eating up farmland.",
      "Farmland is turning into houses, roads and factories.",
      "Smart planning needs to know how land use changes.",
    ],
    summary_simple: "As Indian cities grow, land that was farmland becomes housing, roads and factories. This hurts food production and can increase flood risk, because concrete replaces soil. By studying satellite images over time, planners can see exactly where farm land is shrinking and prepare better, so growth does not damage food security or the environment.",
    summary_deep: "Satellite-based Land Use/Land Cover (LULC) analysis over 2000-2025 shows accelerating conversion of agricultural and urban-rural fringe land into built-up areas, especially in a 100km belt around major metros. Ecosystem services decline as vegetation cover is sealed under concrete, straining drainage and urban heat. Evidence-based master planning, development-intensity zoning, and farmland-preservation belts are recommended to align rapid urbanisation with food and climate goals.",
    key_stats: [
      { label: "Urban population", value: "~35%", context: "and rising yearly" },
      { label: "Built-up growth", value: "Fast", context: "around major metros" },
      { label: "Food security", value: "At risk", context: "with farmland conversion" },
    ],
    takeaways: [
      "Cities convert farmland at a fast, visible pace.",
      "Satellite imagery lets us map this change accurately.",
      "Better zoning can protect farm land while cities grow.",
    ],
    content_doc: "## Urbanisation and Land Use Change\n\nThis study uses LULC layers from satellite data to quantify built-up expansion around Indian metros between 2000 and 2025, estimates farmland losses, and recommends planning instruments for sustainable urban growth.",
  },
  {
    slug: "climate-vulnerable-land-governance",
    title: "Land Governance for a Climate-Vulnerable India",
    source_type: "paper",
    organization: "Centre for Climate and Land Studies (illustrative)",
    year: 2026,
    category: "climate",
    tags: ["climate", "flood", "erosion", "sustainability", "research"],
    summary_easy: [
      "Floods and rivers changing course can wash away land records.",
      "Coastal states lose land to the sea every year.",
      "Maps and records must update as the land itself changes.",
    ],
    summary_simple: "Climate change is changing India's land — rivers shift, coasts erode, floods wash away parcel boundaries. If land records are not updated when the land changes, families can lose their property papers. Policies need 'climate-smart' land records that update quickly after disasters, and land-use rules that keep people safer from floods and sea rise.",
    summary_deep: "Coastal erosion, riverbank dynamics, and extreme precipitation increasingly destabilise cadastral boundaries in states like Assam, West Bengal, and Odisha. Existing records assume static geography, creating a widening gap between the paper map and the physical ground. Recommended interventions: post-disaster rapid resurveys using drone and satellite data, dynamic digital cadastres, climate-risk overlay on land-use zoning, and compensation/relocation provisions for eroding parcels.",
    key_stats: [
      { label: "Erosion-prone", value: "Rivers + coasts", context: "Assam, WB, Odisha key" },
      { label: "Record mismatch", value: "Widening", context: "as geography changes" },
      { label: "Fix", value: "Dynamic cadastre", context: "satellite-updated records" },
    ],
    takeaways: [
      "Climate change alters physical land faster than records update.",
      "Disaster-hit families lose both land and papers unless maps re-issue.",
      "Satellite-updated digital records are the resilient answer.",
    ],
    content_doc: "## Climate-Smart Land Records\n\nA policy paper arguing that static land records fail under climate stress. Recommends drone/satellite resurvey cycles and risk overlay zones for erosion- and flood-prone regions.",
  },
  {
    slug: "satellite-imagery-land-monitoring",
    title: "How Satellites Watch India's Land Every Day",
    source_type: "paper",
    organization: "Remote Sensing Applications Centre (illustrative)",
    year: 2025,
    category: "technology",
    tags: ["satellite", "remote sensing", "GIS", "monitoring", "research"],
    summary_easy: [
      "Satellites take photos of the whole country from space.",
      "They can show crop growth, floods, and new buildings.",
      "These images help check land use without visiting the place.",
    ],
    summary_simple: "Satellites photograph all of India continuously. Computers can compare photos from different dates to show when farms are growing, where floods spread, or where new buildings appear. This lets officials estimate crop damage, find unregistered buildings, and track land change across the country without travelling, cheaply and in near real-time.",
    summary_deep: "Multi-spectral satellite constellations (Sentinel, Resourcesat, RISAT) provide revisit intervals of days, enabling automated change detection in land cover, standing-crop assessment, waterbody dynamics, and encroachment monitoring. When combined with cadastral GIS layers, agencies can flag discrepancies between ground records and satellite evidence — a core capability the national platform integrates for land-use, climate, and infrastructure dashboards.",
    key_stats: [
      { label: "Revisit rate", value: "Every few days", context: "constellation coverage" },
      { label: "Resolution", value: "metre to sub-metre", context: "commercial + national" },
      { label: "Use cases", value: "Crops, floods, encroachment", context: "change detection" },
    ],
    takeaways: [
      "Satellites give a cheap, frequent nationwide land picture.",
      "Change detection automates monitoring of crops, floods, buildings.",
      "Satellite evidence can verify or question paper records.",
    ],
    content_doc: "## Satellite Monitoring of Land\n\nExamines how optical and radar satellite data supports land-governance monitoring: crop reporting, encroachment detection, flood extents, and LULC mapping, and how the public portal uses these layers.",
  },
  {
    slug: "single-window-land-services",
    title: "Single Window Land Services: A Citizen's Digital Front Door",
    source_type: "case_study",
    organization: "State Revenue Department (Telangana model, illustrative)",
    year: 2025,
    category: "land-records",
    tags: ["services", "portal", "citizen", "registration", "transparency"],
    summary_easy: [
      "Citizens can check land records from their phone.",
      "Buying and selling land is recorded openly online.",
      "Wrong land entries can be corrected through the portal.",
    ],
    summary_simple: "States that offer all land services online let citizens check records, copy ownership documents, and track disputes from their phone. When registration and records are linked in one system, a buyer can instantly see if land is already sold to someone else. These single-window portals build trust and cut the time to get land services from weeks to a few minutes.",
    summary_deep: "Single-window land portals unify previously siloed services: Record of Rights (RoR) download, e-filing of mutation, cadastral map access, registration scheduling, and grievance redress. Telangana's Dharani and states adopting NGDRS-integrated workflows demonstrate faster processing, reduced interface visits, and lower dispute incidence. The national platform surfaces these state APIs and comparative dashboards to citizens.",
    key_stats: [
      { label: "RoR portals", value: "33 states/UTs", context: "online access available" },
      { label: "SROs computerised", value: "5,229", context: "95.73% nationwide" },
      { label: "SROs integrated", value: "4,837", context: "88.56% linked to records" },
    ],
    takeaways: [
      "All land services on one portal cut wait times from weeks to minutes.",
      "Linked registration stops double-sale fraud.",
      "Open grievance tracking builds citizen trust.",
    ],
    content_doc: "## A Citizen's Digital Front Door\n\nPresents the design of single-window land services, using integrated registration-records examples, and outlines the checklist governments follow when launching citizen land portals.",
  },
  {
    slug: "land-records-digitization-status",
    title: "State of India's Land Records Digitisation",
    source_type: "report",
    organization: "Department of Land Resources (DILRMP MIS)",
    year: 2026,
    category: "land-records",
    tags: ["status", "digitization", "dashboard", "KPIs", "report"],
    summary_easy: [
      "Almost all villages now have computerised land records.",
      "About 6 out of 10 old paper maps have been digitised.",
      "More maps are still being linked to ownership lists.",
    ],
    summary_simple: "India has computerised land records in 95.56% of its 6.55 lakh villages. About 59.87% of old paper mapsheets (2.23 crore) are now digitised, and 72% of villages have their maps linked to ownership records. Progress continues daily, with the remaining work concentrated on geo-referencing maps and issuing ULPIN for every parcel.",
    summary_deep: "As per DILRMP MIS, cumulative progress spans 6,26,211 villages (95.56%) computerised; 2,23,11,154 mapsheets (59.87%) digitised; 4,71,825 villages (72%) with cadastral maps linked to RoR; 3,534 (76.08%) modern record rooms completed; 5,229 SROs (95.73%) computerised. Parcel-level reach: 28.72 crore total parcels, of which ~10.4 crore geo-referenced and ~9.08 crore ULPIN/SVAMITVA-issued. Top states: Chhattisgarh, Andhra Pradesh, Gujarat (100% CLR).",
    key_stats: [
      { label: "Villages computerised", value: "95.56%", context: "6.26 lakh villages" },
      { label: "Mapsheets digitised", value: "59.87%", context: "2.23 crore mapsheets" },
      { label: "Maps linked to records", value: "72%", context: "4.72 lakh villages" },
      { label: "ULPIN issued", value: "9.08 crore", context: "parcels" },
    ],
    takeaways: [
      "95.56% of villages already run digital land records.",
      "Map digitisation lags record computerisation — the next frontier.",
      "Full ULPIN coverage remains the final mile to conclusive titles.",
    ],
    content_doc: "## Digitisation Dashboard (2026)\n\nOfficial cumulative progress on computerisation of land records, map digitisation, record-room modernisation, SRO computerisation, and ULPIN coverage, with state-wise comparison.",
  },
  {
    slug: "ease-land-transactions-credit",
    title: "Land Records, Bank Credit and the Economy",
    source_type: "case_study",
    organization: "NABARD vision (illustrative)",
    year: 2025,
    category: "finance",
    tags: ["credit", "loans", "banks", "economy", "assets"],
    summary_easy: [
      "Clear land papers help farmers get bank loans.",
      "Banks trust land they can see clearly on a map.",
      "Good records also make selling and buying faster.",
    ],
    summary_simple: "When land records are clear and maps are linked to ownership, banks are willing to lend against farm land — helping farmers buy seeds, machines, and more land. Clear digital records also make buying and selling faster, because the buyer can quickly confirm who owns the land. In this way, digital land governance strengthens the whole rural economy.",
    summary_deep: "Land is the primary collateral asset for rural credit in India. Digitally verified titles reduce lender risk, shorten loan cycles, and enable repeat borrowing. ULPIN-based parcel identity and bank portal integration (KYC-style verification) allow agriculturists to pledge land without physical encumbrance certificates. The case study quantifies loan-conversion improvements in SVAMITVA-pilot districts and recommends linking land record APIs to Priority Sector Lending dashboards.",
    key_stats: [
      { label: "Collateral", value: "Land", context: "top rural asset" },
      { label: "Effect", value: "Faster loans", context: "with verified titles" },
      { label: "Enabler", value: "ULPIN + API", context: "bank verification" },
    ],
    takeaways: [
      "Verified digital titles unlock faster, cheaper rural credit.",
      "ULPIN parcel identity standardises bank verification.",
      "Loan-ready land records lift the rural economy broadly.",
    ],
    content_doc: "## Land Records as Economic Infrastructure\n\nAnalyses how title clarity, ULPIN-based verification and record APIs convert land into reliable collateral, improving credit access and transaction speed for rural households.",
  },
  {
    slug: "community-led-land-data",
    title: "Letting Communities Vigil the Land Data: Open Mapping Pilots",
    source_type: "paper",
    organization: "Open Data for Land Network (illustrative)",
    year: 2026,
    category: "innovation",
    tags: ["community", "open data", "innovation", "participation", "research"],
    summary_easy: [
      "Villagers often know their land better than any map.",
      "Letting them check and correct digital maps builds trust.",
      "Their feedback helps find errors officials would miss.",
    ],
    summary_simple: "Open mapping pilots let villagers view their own land boundaries on a screen and flag errors before maps become official. Because locals know their fields best, these checks catch mistakes that office verification misses. Community-validated maps are also trusted more, which means fewer arguments later.",
    summary_deep: "Participatory mapping and community validation increase the accuracy and acceptance of cadastral updates. In pilot villages, citizen flagging of map-record mismatches reduced post-issue corrections by a large margin and dramatically shortened grievance timelines. The paper proposes a national 'Public Vigil' layer where non-sensitive parcel metadata can be reviewed by residents, with moderation by revenue officials.",
    key_stats: [
      { label: "Accuracy", value: "Higher", context: "with community checks" },
      { label: "Trust", value: "Improved", context: "fewer later disputes" },
      { label: "Cost", value: "Low", context: "uses existing mapping" },
    ],
    takeaways: [
      "Community validation catches map errors cheaply.",
      "Transparent local oversight reduces disputes.",
      "Citizen feedback is a free quality audit for land data.",
    ],
    content_doc: "## Community Vigil on Land Data\n\nReviews open-mapping pilots where residents validate parcel boundaries, quantifies accuracy gains, and proposes a moderated public feedback layer for the national platform.",
  },
];

const insertArticle = db.prepare(`
  INSERT OR REPLACE INTO public_articles (
    id, slug, title, source_type, organization, year, category, tags,
    summary_easy, summary_simple, summary_deep, key_stats, takeaways, content_doc, is_public
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

for (const a of ARTICLES) {
  insertArticle.run(
    randomUUID(), a.slug, a.title, a.source_type, a.organization, a.year, a.category,
    JSON.stringify(a.tags), JSON.stringify(a.summary_easy), a.summary_simple, a.summary_deep,
    JSON.stringify(a.key_stats), JSON.stringify(a.takeaways), a.content_doc
  );
}
console.log(`Seeded ${ARTICLES.length} articles`);

const insertMetric = db.prepare(`
  INSERT OR REPLACE INTO national_metrics (id, label, value, context, emphasis, keywords, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const METRICS = [
  ["villages-digitized", "6.26 lakh", "villages now run digital land records", "Villages computerised", 95.56, ["village", "digitiz", "computer", "record"], 1],
  ["maps-digitized", "2.23 crore", "paper mapsheets digitised", "Mapsheets digitised", 59.87, ["map", "digitiz"], 2],
  ["ulpin-issued", "9.08 crore", "land parcels with a unique ULPIN (Bhu-Aadhaar) number", "ULPIN issued", 100, ["ulpin", "bhu", "aadhaar", "parcel", "number"], 3],
  ["parcels-total", "28.72 crore", "total land parcels identified nationwide", "Land parcels", 30, ["parcel", "land"], 4],
  ["roi-disputes", "6.55 lakh", "villages covered by the land records network", "Villages covered", 20, ["village", "dispute"], 5],
];

for (const [id, value, context, label, emphasis, keywords, sort] of METRICS) {
  insertMetric.run(randomUUID(), label, value, context, Math.round(Number(emphasis)), JSON.stringify(keywords), Number(sort));
}
console.log("Seeded national metrics");

const insertTopic = db.prepare(`
  INSERT OR REPLACE INTO alert_topics (id, category, label, state_name, keyword)
  VALUES (?, ?, ?, ?, ?)
`);

const TOPICS: [string, string, string | null, string][] = [
  ["land-records", "Land records & digitisation", null, "digitiz record"],
  ["disputes", "Land disputes & litigation", null, "dispute litigation"],
  ["ulpin", "ULPIN / Bhu-Aadhaar updates", null, "ulpin parcel"],
  ["climate", "Climate & land resilience", null, "climate erosion flood"],
  ["land-use", "Land use & urbanisation", null, "urban landuse zoning"],
  ["policies", "New policies & schemes", null, "policy scheme plan"],
  ["projects", "Programmes & pilots", null, "pilot svamitva project"],
  ["finance", "Credit & land finance", null, "credit loan bank"],
  ["innovation", "Research & grants", null, "research grant hackathon"],
];

for (const [id, label, state, kw] of TOPICS) {
  insertTopic.run(randomUUID(), id, label, state, kw);
}

const insertDataset = db.prepare(`
  INSERT OR REPLACE INTO public_datasets (id, title, provider, source_type, year, description, is_open)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const DATASETS = [
  ["DILRMP MIS dashboard", "Department of Land Resources", "records", 2026, "State-wise progress on computerisation, map digitisation, and ULPIN.", 1],
  ["LULC satellite layers (1:10k)", "ISRO / NRSC-Bhuvan", "satellite", 2025, "Land use / land cover layers for village-level planning.", 1],
  ["ULPIN parcel register (meta)", "Department of Land Resources", "records", 2026, "Metadata index of issued ULPIN records by state and district.", 0],
  ["SVAMITVA property cards", "Ministry of Panchayati Raj", "satellite", 2025, "Drone-mapped village property maps and cards.", 1],
  ["RoR state portals index", "DoLR / NIC", "records", 2026, "Index of online Record of Rights portals for 33 states/UTs.", 1],
  ["Climate vulnerability layers", "Remote sensing agencies", "satellite", 2025, "Layer overlays of flood, erosion, and drought vulnerability.", 1],
  ["Census land-use aggregates", "Office of the Registrar General", "socio-economic", 2021, "Village and district level land-use aggregates from census.", 1],
];

for (const [title, provider, type, year, desc, isOpen] of DATASETS) {
  insertDataset.run(randomUUID(), title, provider, type, year, desc, isOpen);
}
console.log(`Seeded ${DATASETS.length} dataset metadata`);

console.log("Seed complete.");