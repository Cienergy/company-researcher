/**
 * Company Researcher — news crawl for ESG / carbon / Net Zero / procurement.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { QUERIES, WATCH_COMPANIES, TYPE_HINTS } from "./config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "data", "feed.json");
const HISTORY_CAP = 400;

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "CompanyResearcher/1.0 (+https://github.com/Cienergy/company-researcher; BD intel bot)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

function hashId(url, title) {
  return createHash("sha1").update(`${url || ""}|${title || ""}`).digest("hex").slice(0, 16);
}

function stripHtml(html = "") {
  return cheerio.load(`<body>${html}</body>`)("body").text().replace(/\s+/g, " ").trim();
}

function googleNewsRss(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

function detectCompanies(text) {
  const lower = text.toLowerCase();
  return WATCH_COMPANIES.filter((c) => lower.includes(c.toLowerCase()));
}

function classify(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  const scores = Object.fromEntries(
    Object.entries(TYPE_HINTS).map(([k, hints]) => [k, hints.filter((h) => text.includes(h)).length])
  );
  const hasFuel =
    /biomass|briquette|agro.?pellet|wood pellet|co-fir|biochar|torrefied|cbg|compressed biogas/.test(
      text
    );
  let type = "news";
  let score = 15;
  if (scores.procurement >= 1 && (hasFuel || scores.esg || scores.carbon)) {
    type = "procurement";
    score += 30;
  } else if (scores.carbon >= 1) {
    type = "carbon";
    score += 25;
  } else if (scores.netzero >= 1) {
    type = "netzero";
    score += 22;
  } else if (scores.esg >= 1) {
    type = "esg";
    score += 20;
  } else if (scores.csr >= 1) {
    type = "csr";
    score += 12;
  }
  if (hasFuel) score += 20;
  if (/india|indian|ccts|cbam|brsr/.test(text)) score += 10;
  score += Math.min(20, (scores.procurement + scores.carbon + scores.netzero) * 5);
  return { type, score: Math.min(100, score) };
}

function relevanceGate(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  if (/plastic pellet|resin pellet|fish pellet|feed pellet/.test(text) && !/biomass|wood|agro/.test(text)) {
    return false;
  }
  return (
    /biomass|briquette|pellet|biochar|co-fir|cbg|biogas|ccts|cbam|brsr|esg|net.?zero|carbon credit|decarbon|sustainability|csr|procurement|tender|aluminium|aluminum|steel|cement/.test(
      text
    )
  );
}

async function fetchRss(label, query) {
  try {
    const feed = await parser.parseURL(googleNewsRss(query));
    return (feed.items || [])
      .map((item) => {
        const title = (item.title || "").trim();
        const summary = stripHtml(item.contentSnippet || item.content || item.summary || "");
        const link = item.link || item.guid || "";
        if (!title || !relevanceGate(title, summary)) return null;
        const { type, score } = classify(title, summary);
        if (score < 25) return null;
        const companies = detectCompanies(`${title} ${summary}`);
        return {
          id: hashId(link, title),
          title,
          summary: summary.slice(0, 600),
          url: link,
          publishedAt: item.isoDate || item.pubDate || null,
          discoveredAt: new Date().toISOString(),
          source: "google_news",
          channel: "news",
          query: label,
          type,
          score,
          companies,
        };
      })
      .filter(Boolean);
  } catch (e) {
    console.warn("RSS fail", label, e.message || e);
    return [];
  }
}

function loadHistory() {
  if (!existsSync(OUT)) return [];
  try {
    const prev = JSON.parse(readFileSync(OUT, "utf8"));
    return Array.isArray(prev.items) ? prev.items : [];
  } catch {
    return [];
  }
}

async function main() {
  const collected = [];
  for (const q of QUERIES) {
    const label = q.slice(0, 60);
    const items = await fetchRss(label, q);
    collected.push(...items);
    await new Promise((r) => setTimeout(r, 350));
  }

  const byId = new Map();
  for (const item of [...collected, ...loadHistory()]) {
    const prev = byId.get(item.id);
    if (!prev || (item.score || 0) >= (prev.score || 0)) byId.set(item.id, item);
  }

  const items = [...byId.values()]
    .sort((a, b) => {
      const da = Date.parse(a.publishedAt || a.discoveredAt || 0);
      const db = Date.parse(b.publishedAt || b.discoveredAt || 0);
      if (db !== da) return db - da;
      return (b.score || 0) - (a.score || 0);
    })
    .slice(0, HISTORY_CAP);

  const stats = {
    total: items.length,
    procurement: items.filter((i) => i.type === "procurement").length,
    carbon: items.filter((i) => i.type === "carbon").length,
    netzero: items.filter((i) => i.type === "netzero").length,
    esg: items.filter((i) => i.type === "esg").length,
    csr: items.filter((i) => i.type === "csr").length,
    news: items.filter((i) => i.type === "news").length,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  const payload = {
    updatedAt: new Date().toISOString(),
    watchCompanies: WATCH_COMPANIES,
    stats,
    items,
  };
  writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify({ out: OUT, stats }, null, 2));
}

main();
