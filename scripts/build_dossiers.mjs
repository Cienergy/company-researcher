/**
 * Build company dossiers from CCTS master, ESG CSV, and Targeting Summary v7.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { parse } from "csv-parse/sync";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PLATFORM = join(ROOT, "..", "pellet-trade-platform", "data", "cbam-export-exposure");
const SRC = join(PLATFORM, "processed");
const TARGETING_XLSX = join(PLATFORM, "CCTS_CBAM_Targeting_Summary_v7.xlsx");
const OUT = join(ROOT, "public", "data", "dossiers.json");
const FRAMEWORK_OUT = join(ROOT, "public", "data", "framework.json");

const NA = "Not Available / Not disclosed";

const EY_SECTORS = {
  "Iron & Steel": {
    cctsFocus:
      "Steel plants are under draft carbon intensity targets. Falling short can mean buying expensive carbon certificates later.",
    cbamFocus:
      "Steel is India’s biggest CBAM risk. Selling to Europe gets harder if plant carbon intensity stays high.",
    levers: [
      "Use energy more efficiently",
      "Buy renewable power",
      "Use more scrap / EAF",
      "Try gas or hydrogen in ironmaking (longer term)",
      "Mix biomass or biochar into captive power and some iron processes",
    ],
    partnerAngle:
      "Best near-term offer: steady pellets or briquettes for captive power, priced against coal. Europe-facing mills also care about proof of lower intensity.",
  },
  Aluminium: {
    cctsFocus: "Smelters and refineries already have final carbon targets. Missing them means certificate costs.",
    cbamFocus:
      "Aluminium metal sold to Europe faces CBAM. Coal power at the plant makes the carbon number look worse.",
    levers: [
      "Round-the-clock renewable power",
      "Biomass co-firing in captive power",
      "Switch some fuel to gas",
      "Energy efficiency",
    ],
    partnerAngle:
      "Strong pellet/briquette fit for captive power. Long-term supply deals matter as much as price.",
  },
  Cement: {
    cctsFocus: "Cement (including grinding) has final targets. Alternative fuels are a normal lever.",
    cbamFocus: "Cement/clinker exports to Europe can face CBAM. India volumes are smaller than steel.",
    levers: [
      "Alternative fuels (AFR / biomass) in kilns",
      "Lower clinker factor",
      "Waste heat recovery",
      "Renewable power",
    ],
    partnerAngle: "Pitch consistent kiln fuel quality and reliable plant deliveries.",
  },
  "Chlor-Alkali": {
    cctsFocus: "Final targets. Power cost and renewable PPAs matter more than biomass for many sites.",
    cbamFocus: "Mostly outside core CBAM metal/cement lists.",
    levers: ["Renewable power", "Energy efficiency", "Fuel switch where coal boilers exist"],
    partnerAngle: "Look for sites with coal boilers; otherwise treat as a longer-cycle partner.",
  },
  "Pulp & Paper": {
    cctsFocus: "Final targets. Biomass for steam is a core lever.",
    cbamFocus: "Outside CBAM Annex I.",
    levers: ["Biomass for steam", "Energy efficiency"],
    partnerAngle: "Natural buyer of pellets/briquettes for boilers — supply continuity is critical.",
  },
  Textile: {
    cctsFocus: "Final targets from 2026-27. Cleaner heat and renewable power help compliance.",
    cbamFocus: "Outside CBAM Annex I.",
    levers: ["Renewable power", "Biomass boilers", "Process heat efficiency"],
    partnerAngle: "Often price-sensitive mid-size buyers; carbon rules still create pull for cleaner heat.",
  },
  "Petroleum Refinery": {
    cctsFocus: "Final targets. Decarbonization leans on electrification, alternate fuels, and CCUS.",
    cbamFocus: "Refined products mostly outside CBAM (hydrogen can be an exception).",
    levers: ["Electrification", "Alternate fuels", "Energy efficiency", "CCUS"],
    partnerAngle: "Harder agro-pellet fit; CBG or gas partnerships may be more relevant.",
  },
  Petrochemicals: {
    cctsFocus: "Final targets for crackers.",
    cbamFocus: "Outside CBAM Annex I.",
    levers: ["Energy efficiency", "Electrification", "Alternate fuels"],
    partnerAngle: "Selective thermal substitution — longer sales cycle.",
  },
};

const GROUP_ALIASES = {
  "jsw steel": ["jsw steel", "jsw group"],
  "sail steel authority of india": ["sail", "steel authority of india"],
  "tata steel": ["tata steel", "tata group"],
  "vedanta incl balco": ["vedanta", "balco", "bharat aluminium"],
  "ultratech cement": ["ultratech"],
  "jindal steel": ["jindal steel", "jindal group"],
  "hindalco aditya birla": ["hindalco", "aditya birla"],
  "am ns india": ["am/ns", "amns", "arcelormittal nippon"],
  "nalco": ["nalco", "national aluminium"],
  "shree cement": ["shree cement"],
  "dalmia bharat": ["dalmia"],
  "acc": ["acc limited", "acc ltd"],
  "ambuja cement": ["ambuja"],
};

function readCsv(name) {
  const p = join(SRC, name);
  if (!existsSync(p)) return [];
  return parse(readFileSync(p, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function cell(v) {
  if (v == null || v === "") return NA;
  const s = String(v).trim();
  return s || NA;
}

function isBlank(v) {
  if (v == null) return true;
  const s = String(v).trim().toLowerCase();
  return !s || s === "0" || s === "n/a" || s === "na" || s.includes("not found") || s.includes("not assessed") || s.includes("not disclosed") || s.includes("not available");
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\(incl\.?[^)]*\)/g, " ")
    .replace(/[^a-z0-9/+&]+/g, " ")
    .replace(/\b(limited|ltd|pvt|private|company|co|the|of|india|group)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTargetingProfiles() {
  if (!existsSync(TARGETING_XLSX)) {
    console.warn("Missing targeting workbook:", TARGETING_XLSX);
    return [];
  }
  const wb = XLSX.readFile(TARGETING_XLSX, { cellDates: false });
  const sheet = wb.Sheets["ESG & Carbon Profile"];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
  // Row 5 (index 4) is the header in the published workbook
  let headerIdx = rows.findIndex(
    (r) => Array.isArray(r) && String(r[1] || "").includes("Company") && String(r[3] || "").includes("Research")
  );
  if (headerIdx < 0) headerIdx = 4;
  const headers = rows[headerIdx].map((h) => String(h || "").trim());
  const out = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue;
    const get = (name) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? r[idx] : null;
    };
    const group = String(get("Company / Group") || "").trim();
    if (!group) continue;
    out.push({
      group,
      mainSector: cell(get("Main Sector")),
      researchStatus: cell(get("Research Status")),
      researched: String(get("Research Status") || "").toLowerCase() === "researched",
      cctsPlants: num(get("CCTS Plants (total)")),
      plantsInScope: num(get("Plants in Scope")),
      cctsShortfallTco2: num(get("CCTS Shortfall in Scope (tCO2e/yr)")),
      estCccNeedCr: num(get("Est. CCC Purchase Need (₹ Cr/yr)")),
      avgCctsScore: num(get("Avg CCTS Score")),
      highRiskPlants: num(get("High-Risk Plants")),
      cbamPlants: num(get("CBAM-applicable Plants")),
      avgCbamScore: num(get("Avg CBAM Score")),
      euExportEvidence: cell(get("EU Export Evidence")),
      netZeroYear: isBlank(get("Net Zero Year")) ? NA : String(get("Net Zero Year")),
      netZeroTargets: cell(get("Net Zero / Interim Targets")),
      sbtiStatus: cell(get("SBTi Status")),
      internalCarbonPriceUsd: num(get("Internal Carbon Price (USD/tCO2e)")),
      icpDetail: cell(get("ICP Detail")),
      esgSpend: cell(get("ESG / Environmental Spend")),
      carbonCreditsBought: cell(get("Carbon Credits Purchased / Retired")),
      greenCredits: cell(get("Green Credits (BRSR)")),
      biomassActivity: cell(get("Biomass / Pellet Activity")),
      commercialSignal: cell(get("Commercial Signal (Price vs Supply)")),
      sectorCbamLevers: cell(get("Sector CBAM Levers (EY 2026)")),
      pelletSalesAngle: cell(get("Pellet Sales Angle (EY 2026)")),
      esgReadinessScore: num(get("ESG Readiness Score (0-100)")),
      carbonBuyerProfile: cell(get("Carbon-Credit Buyer Profile")),
      nearTermPelletTpa: num(get("Near-term Pellet TPA (in scope)")),
      evidenceStrength: cell(get("Evidence Strength")),
      dataYear: cell(get("Data Year")),
      sources: cell(get("Sources")),
      rankCccNeed: num(get("Rank (CCC need, in scope)")),
    });
  }
  return out;
}

function profileKeys(group) {
  const keys = new Set();
  const n = normalize(group);
  if (n) keys.add(n);
  const compact = n.replace(/\s+/g, "");
  if (compact) keys.add(compact);
  for (const [aliasKey, aliases] of Object.entries(GROUP_ALIASES)) {
    if (n.includes(aliasKey) || aliases.some((a) => n.includes(normalize(a)))) {
      keys.add(aliasKey);
      for (const a of aliases) keys.add(normalize(a));
    }
  }
  // token heads
  const head = n.split(" ").slice(0, 2).join(" ");
  if (head.length >= 4) keys.add(head);
  return [...keys].filter(Boolean);
}

function matchProfile(companyName, parentGroup, profilesByKey, profiles) {
  const candidates = [parentGroup, companyName, companyName.split("–")[0], companyName.split("-")[0]];
  for (const c of candidates) {
    for (const k of profileKeys(c)) {
      if (profilesByKey.has(k)) return profilesByKey.get(k);
    }
  }
  const blob = normalize(`${companyName} ${parentGroup}`);
  let best = null;
  let bestLen = 0;
  for (const p of profiles) {
    for (const k of profileKeys(p.group)) {
      if (k.length >= 5 && blob.includes(k) && k.length > bestLen) {
        best = p;
        bestLen = k.length;
      }
    }
  }
  return best;
}

function fitLabel(score) {
  if (score >= 4) return "Strong fit";
  if (score >= 3) return "Good fit";
  if (score >= 2) return "Possible fit";
  return "Low fit";
}

function roleLabel(r) {
  return (
    {
      pellet_briquette_buyer: "May buy pellets / briquettes",
      thermal_fuel_buyer: "Uses biomass for heat",
      cbg_or_gas_adjacent: "Possible CBG / gas partner",
      decarb_partner: "Decarbonization partner",
    }[r] || r
  );
}

function partnerFit(company) {
  const roles = new Set();
  const sectors = company.sectors;
  const supply = (company.esg.supplyContinuitySignal || "").toUpperCase();
  const price = (company.esg.priceSensitivitySignal || "").toUpperCase();
  const bio = `${company.esg.biomassActivity || ""} ${company.targeting?.biomassActivity || ""}`.toLowerCase();
  const cls = (company.bestClassification || "").toUpperCase();
  const buyer = (company.targeting?.carbonBuyerProfile || "").toLowerCase();

  if (sectors.some((s) => ["Iron & Steel", "Aluminium", "Cement", "Pulp & Paper", "Textile"].includes(s))) {
    roles.add("pellet_briquette_buyer");
  }
  if (sectors.some((s) => ["Pulp & Paper", "Cement", "Textile"].includes(s)) || /biomass|briquette|co-fir|pellet/.test(bio)) {
    roles.add("thermal_fuel_buyer");
  }
  if (sectors.some((s) => ["Petroleum Refinery", "Petrochemicals", "Chlor-Alkali"].includes(s))) {
    roles.add("cbg_or_gas_adjacent");
  }
  if (cls.startsWith("A") || cls.startsWith("B") || company.esg.researched || company.targeting?.researched) {
    roles.add("decarb_partner");
  }

  let score = 2;
  if (company.bestPriorityScore && company.bestPriorityScore >= 3.5) score += 2;
  else if (company.bestPriorityScore && company.bestPriorityScore >= 3) score += 1;
  if (/HIGH/.test(supply)) score += 1;
  if (/HIGH/.test(price)) score += 0.5;
  if (/co-fir|biomass|briquette|biochar|pellet/.test(bio)) score += 1;
  if (sectors.includes("Aluminium") || sectors.includes("Iron & Steel") || sectors.includes("Cement")) score += 0.5;
  if (/priority|high ccc/.test(buyer)) score += 0.5;
  score = Math.min(5, Math.round(score * 2) / 2);

  let rationale =
    company.targeting?.pelletSalesAngle && company.targeting.pelletSalesAngle !== NA
      ? company.targeting.pelletSalesAngle
      : company.esg.commercialImplication && company.esg.commercialImplication !== NA
        ? company.esg.commercialImplication
        : "Listed under India’s carbon rules. Dig into ESG and buying signals before outreach.";

  if (company.targeting?.commercialSignal && company.targeting.commercialSignal !== NA) {
    rationale = `${rationale} Buying signal: ${company.targeting.commercialSignal}.`;
  }

  return {
    score,
    label: fitLabel(score),
    roles: [...roles],
    roleLabels: [...roles].map(roleLabel),
    rationale,
  };
}

function buildFramework(profiles) {
  const researched = profiles.filter((p) => p.researched).length;
  return {
    updatedAt: new Date().toISOString(),
    title: "How to read companies for pellet / CBG sales",
    sources: [
      {
        title: "EY — CCTS: Accelerating the path to decarbonization (2026)",
        url: "https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/insights/climate-change-sustainability-services/documents/2026/ey-ccts-accelerating-the-path-to-decarbonization.pdf",
      },
      {
        title: "EY — Carbon pricing meets raw materials: CBAM’s impact on Indian industries (2026)",
        url: "https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/insights/climate-change-sustainability-services/documents/2026/ey-carbon-pricing-meets-raw-materials-cabms-impact-on-indian-industries.pdf",
      },
      {
        title: "CCTS + CBAM Targeting Summary v7 (internal workbook)",
        url: "../pellet-trade-platform/data/cbam-export-exposure/CCTS_CBAM_Targeting_Summary_v7.xlsx",
      },
    ],
    headline:
      "India’s carbon market (CCTS) and Europe’s border carbon tax (CBAM) push factories to cut intensity. Many will need cleaner fuels or a decarbonization partner — not just carbon credits.",
    takeaways: [
      "Start with the company story: Net Zero plans, ESG spend, biomass already in use, and whether they sell to Europe.",
      "Green credits in BRSR are often Nil. Do not lead with “we sell carbon credits.” Lead with reliable fuel that cuts coal use.",
      "Steel and aluminium face the strongest Europe pressure. Cement and pulp & paper are natural biomass buyers.",
      `The targeting workbook has researched ESG / carbon profiles for ${researched} company groups — use those first.`,
      "Price vs coal matters, but missed biomass supply has already hurt some emitters’ targets. Continuity wins deals.",
    ],
    sectors: Object.entries(EY_SECTORS).map(([sector, v]) => ({ sector, ...v })),
  };
}

function main() {
  const master = readCsv("MASTER_DATABASE.csv");
  const esg = readCsv("ESG_CARBON_SPEND_RESEARCH.csv");
  const targetingProfiles = readTargetingProfiles();
  if (!master.length) {
    console.error("Missing MASTER_DATABASE.csv at", SRC);
    process.exit(1);
  }

  const profilesByKey = new Map();
  for (const p of targetingProfiles) {
    for (const k of profileKeys(p.group)) {
      if (!profilesByKey.has(k)) profilesByKey.set(k, p);
    }
  }

  const esgByKey = new Map();
  for (const row of esg) {
    const keys = String(row.Match_Company_Name_Keys || "")
      .split("|")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    for (const k of keys) esgByKey.set(k, row);
  }

  const byName = new Map();
  for (const row of master) {
    const name = (row.Company_Name || "").trim();
    if (!name) continue;
    if (!byName.has(name)) {
      byName.set(name, {
        name,
        parentGroup: row.Parent_Group || NA,
        sectors: new Set(),
        plants: [],
        states: new Set(),
        bestPriorityRank: null,
        bestPriorityScore: null,
        bestClassification: row.Final_Classification || NA,
        cctsStatuses: new Set(),
        notifications: new Set(),
        cbamNotes: new Set(),
        euEvidence: [],
        netZero: [],
        coal: [],
        biomassSuitability: new Set(),
        why: [],
      });
    }
    const c = byName.get(name);
    if (row.CCTS_Sector) c.sectors.add(row.CCTS_Sector);
    if (row.State && row.State !== NA) c.states.add(row.State);
    if (row.CCTS_Notification_Status) c.cctsStatuses.add(row.CCTS_Notification_Status);
    if (row.CCTS_Status) c.notifications.add(row.CCTS_Status);
    if (row.CBAM_Applicability) c.cbamNotes.add(row.CBAM_Applicability);
    if (row.Biomass_Suitability) c.biomassSuitability.add(row.Biomass_Suitability);
    const pr = num(row.Priority_Rank);
    const ps = num(row.Priority_Score);
    if (ps != null && (c.bestPriorityScore == null || ps > c.bestPriorityScore)) {
      c.bestPriorityScore = ps;
      c.bestPriorityRank = pr;
      c.bestClassification = row.Priority_Classification || row.Final_Classification || c.bestClassification;
    }
    if (row.EU_Export_Evidence && row.EU_Export_Evidence !== NA) c.euEvidence.push(row.EU_Export_Evidence);
    if (row.Net_Zero_Commitment && row.Net_Zero_Commitment !== NA) c.netZero.push(row.Net_Zero_Commitment);
    if (row.Coal_Access && row.Coal_Access !== NA) c.coal.push(row.Coal_Access);
    if (row.Why_Target && row.Why_Target !== NA) c.why.push(row.Why_Target);

    c.plants.push({
      registration: row.Registration_Number,
      plant: row.Plant_Unit_Name,
      district: row.District,
      state: row.State,
      sector: row.CCTS_Sector,
      currentGei: num(row.Current_GEI),
      targetGei: num(row.Target_GEI),
      geiGap: num(row.GEI_Gap),
      targetYear: row.Target_Year,
      priorityRank: pr,
      classification: row.Final_Classification,
    });
  }

  let targetingMatched = 0;
  const companies = [...byName.values()].map((c) => {
    const esgRow = esgByKey.get(c.name.toLowerCase());
    const targeting = matchProfile(c.name, c.parentGroup, profilesByKey, targetingProfiles);
    if (targeting) targetingMatched += 1;
    const sectors = [...c.sectors].sort();
    const dossier = {
      id: createHash("sha1").update(c.name).digest("hex").slice(0, 12),
      name: c.name,
      parentGroup: c.parentGroup,
      sectors,
      states: [...c.states].sort(),
      plantCount: c.plants.length,
      plants: c.plants
        .sort((a, b) => (a.priorityRank ?? 999) - (b.priorityRank ?? 999) || (b.geiGap ?? 0) - (a.geiGap ?? 0))
        .slice(0, 40),
      bestPriorityRank: c.bestPriorityRank,
      bestPriorityScore: c.bestPriorityScore,
      bestClassification: c.bestClassification,
      cctsNotificationStatus: [...c.cctsStatuses].join(" / ") || NA,
      cctsStatusNotes: [...c.notifications].slice(0, 3),
      cbamApplicability: [...c.cbamNotes][0] || NA,
      euExportEvidence: [...new Set(c.euEvidence)].slice(0, 2),
      netZeroCommitment: [...new Set(c.netZero)].slice(0, 2),
      coalAccess: [...new Set(c.coal)].slice(0, 2),
      biomassSuitability: [...c.biomassSuitability],
      whyTarget: [...new Set(c.why)].slice(0, 2),
      targeting: targeting || null,
      esg: {
        researched: Boolean(esgRow) || Boolean(targeting?.researched),
        companyGroup: targeting?.group || esgRow?.Company_Group || NA,
        greenCredits: targeting?.greenCredits !== NA && targeting ? targeting.greenCredits : esgRow?.Green_Credits_Generated_or_Procured_BRSR || NA,
        carbonCreditSpend: esgRow?.Carbon_Credit_Purchase_Spend_INR || NA,
        carbonSpendNote: targeting?.carbonCreditsBought || esgRow?.Carbon_Credit_Spend_Note || NA,
        envCapex: targeting?.esgSpend !== NA && targeting ? targeting.esgSpend : esgRow?.ESG_Environmental_Capex_Disclosed || NA,
        esgComplianceNote: esgRow?.ESG_Compliance_Spend_Note || NA,
        biomassActivity:
          targeting?.biomassActivity !== NA && targeting
            ? targeting.biomassActivity
            : esgRow?.Biomass_Pellet_Briquette_Activity || NA,
        biomassVolume: esgRow?.Biomass_Volume_MT || NA,
        biomassPrice: esgRow?.Biomass_Price_Disclosed || NA,
        priceSensitivitySignal: esgRow?.Price_Sensitivity_Signal || NA,
        supplyContinuitySignal: esgRow?.Supply_Continuity_Signal || NA,
        commercialImplication:
          targeting?.commercialSignal !== NA && targeting
            ? targeting.commercialSignal
            : esgRow?.Commercial_Implication_Price_vs_Supply || NA,
        commercialDetail: esgRow?.Commercial_Implication_Detail || NA,
        sources: targeting?.sources !== NA && targeting ? targeting.sources : esgRow?.Source_URLs || NA,
        evidenceStrength: targeting?.evidenceStrength || esgRow?.Evidence_Strength || NA,
        reportingPeriod: targeting?.dataYear || esgRow?.Reporting_Period || NA,
      },
      eySectorNotes: sectors
        .filter((s) => EY_SECTORS[s])
        .map((s) => ({ sector: s, ...EY_SECTORS[s] })),
    };
    dossier.partnerFit = partnerFit(dossier);
    return dossier;
  });

  companies.sort((a, b) => {
    const ar = a.targeting?.researched ? 1 : 0;
    const br = b.targeting?.researched ? 1 : 0;
    if (br !== ar) return br - ar;
    const as = a.partnerFit.score;
    const bs = b.partnerFit.score;
    if (bs !== as) return bs - as;
    const atr = a.targeting?.rankCccNeed ?? 9999;
    const btr = b.targeting?.rankCccNeed ?? 9999;
    if (atr !== btr) return atr - btr;
    return a.name.localeCompare(b.name);
  });

  mkdirSync(dirname(OUT), { recursive: true });
  const payload = {
    updatedAt: new Date().toISOString(),
    source: "MASTER_DATABASE + ESG research + CCTS_CBAM_Targeting_Summary_v7.xlsx",
    stats: {
      companies: companies.length,
      plants: master.length,
      researchedEsg: companies.filter((c) => c.esg.researched).length,
      targetingProfiles: targetingProfiles.length,
      targetingMatched,
      priorityTagged: companies.filter((c) => c.bestPriorityRank != null).length,
    },
    companies,
  };
  writeFileSync(OUT, JSON.stringify(payload, null, 2));
  writeFileSync(FRAMEWORK_OUT, JSON.stringify(buildFramework(targetingProfiles), null, 2));
  console.log(
    JSON.stringify(
      {
        dossiers: OUT,
        companies: companies.length,
        targetingProfiles: targetingProfiles.length,
        targetingMatched,
        researchedEsg: payload.stats.researchedEsg,
        top: companies.slice(0, 8).map((c) => ({
          name: c.name,
          fit: c.partnerFit.label,
          group: c.targeting?.group || null,
          sectors: c.sectors,
        })),
      },
      null,
      2
    )
  );
}

main();
