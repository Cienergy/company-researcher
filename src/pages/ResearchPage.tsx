import { useMemo, useState, type ReactNode } from "react";
import type { CompanyDossier } from "../lib/types";
import { useDossiers } from "../lib/useData";

const NA = "Not Available / Not disclosed";

function hasText(v?: string | null) {
  if (!v) return false;
  const s = v.trim();
  if (!s || s === NA) return false;
  const low = s.toLowerCase();
  return !(low.includes("not found") || low.includes("not assessed") || low === "0");
}

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

function fitTone(label: string) {
  if (label.startsWith("Strong")) return "strong";
  if (label.startsWith("Good")) return "ok";
  return "weak";
}

function Fact({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fact-card">
      <h3>{title}</h3>
      <div className="fact-body">{children}</div>
    </div>
  );
}

function DossierDetail({ c }: { c: CompanyDossier }) {
  const t = c.targeting;
  const storyBits = [
    t?.pelletSalesAngle,
    c.partnerFit.rationale,
    t?.commercialSignal,
    c.esg.commercialDetail,
  ].filter(hasText);

  const netZero =
    (hasText(t?.netZeroTargets) && t?.netZeroTargets) ||
    c.netZeroCommitment[0] ||
    (hasText(t?.netZeroYear) ? `Net Zero target year: ${t?.netZeroYear}` : null);

  return (
    <div className="panel feed-detail">
      <div className="panel-head">
        <h2>Company profile</h2>
        <span className={`level ${fitTone(c.partnerFit.label)}`}>{c.partnerFit.label}</span>
      </div>
      <div className="panel-body detail-body">
        <h1>{c.name}</h1>
        <p className="meta-line">
          {hasText(c.parentGroup) && c.parentGroup !== "Not Available" ? `${c.parentGroup} · ` : ""}
          {c.sectors.join(", ")}
          {c.states.length ? ` · ${c.states.slice(0, 3).join(", ")}` : ""}
          {t?.researched ? " · Full research on file" : ""}
        </p>

        <div className="chip-row">
          {(c.partnerFit.roleLabels || []).map((r) => (
            <span key={r} className="chip">
              {r}
            </span>
          ))}
          {hasText(t?.carbonBuyerProfile) ? <span className="chip">{t!.carbonBuyerProfile}</span> : null}
        </div>

        {storyBits[0] ? <p className="summary">{storyBits[0]}</p> : null}
        {storyBits[1] && storyBits[1] !== storyBits[0] ? <p className="summary">{storyBits[1]}</p> : null}

        <div className="section-grid">
          <Fact title="Why this company matters">
            <p>
              {hasText(c.whyTarget[0])
                ? c.whyTarget[0]
                : hasText(t?.pelletSalesAngle)
                  ? t!.pelletSalesAngle
                  : "Under India’s carbon rules. Open the sections below for ESG, Europe exposure, and fuel buying clues."}
            </p>
          </Fact>
          <Fact title="Net Zero & climate plans">
            <p>
              {netZero || "No clear Net Zero note in our files yet."}
              {hasText(t?.sbtiStatus) ? `\n\nSBTi: ${t!.sbtiStatus}` : ""}
              {t?.internalCarbonPriceUsd ? `\n\nInternal carbon price: about $${t.internalCarbonPriceUsd}/tCO₂e` : ""}
              {hasText(t?.icpDetail) ? `\n${t!.icpDetail}` : ""}
            </p>
          </Fact>
          <Fact title="ESG & compliance">
            <p>
              {hasText(c.esg.envCapex) ? c.esg.envCapex : "ESG spend not disclosed in reviewed sources."}
              {hasText(c.esg.esgComplianceNote) ? `\n\n${c.esg.esgComplianceNote}` : ""}
              {hasText(c.esg.greenCredits) ? `\n\nGreen credits (BRSR): ${c.esg.greenCredits}` : ""}
            </p>
          </Fact>
          <Fact title="Carbon credits & trading">
            <p>
              {hasText(c.esg.carbonSpendNote)
                ? c.esg.carbonSpendNote
                : "Carbon credit purchases not clearly disclosed."}
              {hasText(t?.carbonBuyerProfile) ? `\n\nBuyer profile: ${t!.carbonBuyerProfile}` : ""}
            </p>
          </Fact>
          <Fact title="Europe / CBAM">
            <p>
              {(hasText(t?.euExportEvidence) && t!.euExportEvidence) ||
                c.euExportEvidence[0] ||
                "No researched EU export note on file."}
              {hasText(c.cbamApplicability) ? `\n\n${c.cbamApplicability}` : ""}
              {hasText(t?.sectorCbamLevers) ? `\n\nWhat they may do next: ${t!.sectorCbamLevers}` : ""}
            </p>
          </Fact>
          <Fact title="Procurement / biomass">
            <p>
              {hasText(c.esg.biomassActivity)
                ? c.esg.biomassActivity
                : "No biomass or pellet buying detail found yet."}
              {hasText(c.esg.biomassPrice) ? `\n\nPrice note: ${c.esg.biomassPrice}` : ""}
              {hasText(c.esg.commercialImplication) ? `\n\n${c.esg.commercialImplication}` : ""}
            </p>
          </Fact>
        </div>

        {(c.eySectorNotes || []).length > 0 ? (
          <div className="fact-card" style={{ marginTop: "0.75rem" }}>
            <h3>Sector angle (simple)</h3>
            <div className="fact-body">
              {c.eySectorNotes.map((e) => (
                <p key={e.sector || e.partnerAngle} style={{ marginBottom: "0.75rem" }}>
                  <strong>{e.sector || c.sectors[0]}</strong>
                  {"\n"}
                  {e.partnerAngle}
                  {"\n\n"}
                  India carbon rules: {e.cctsFocus}
                  {"\n"}
                  Europe angle: {e.cbamFocus}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="numbers-block">
          <h3>Numbers (after you pick the company)</h3>
          <div className="numbers-grid">
            <div>
              <span>CCTS plants</span>
              <strong>{fmtNum(t?.cctsPlants ?? c.plantCount)}</strong>
            </div>
            <div>
              <span>Est. certificate need</span>
              <strong>{t?.estCccNeedCr != null ? `₹ ${fmtNum(t.estCccNeedCr, 1)} Cr/yr` : "—"}</strong>
            </div>
            <div>
              <span>Near-term pellet opportunity</span>
              <strong>{t?.nearTermPelletTpa != null ? `${fmtNum(t.nearTermPelletTpa)} TPA` : "—"}</strong>
            </div>
            <div>
              <span>ESG readiness</span>
              <strong>{t?.esgReadinessScore != null ? `${fmtNum(t.esgReadinessScore)} / 100` : "—"}</strong>
            </div>
            <div>
              <span>CBAM-linked plants</span>
              <strong>{fmtNum(t?.cbamPlants)}</strong>
            </div>
            <div>
              <span>High-risk plants</span>
              <strong>{fmtNum(t?.highRiskPlants)}</strong>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: "0.85rem", boxShadow: "none" }}>
          <div className="panel-head">
            <h2>Plants we track</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Plant</th>
                  <th>Sector</th>
                  <th>State</th>
                  <th>Intensity gap</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {c.plants.slice(0, 25).map((p) => (
                  <tr key={p.registration}>
                    <td className="wrap">
                      <strong>{p.plant}</strong>
                      <div className="muted">{p.registration}</div>
                    </td>
                    <td>{p.sector}</td>
                    <td>{p.state}</td>
                    <td>{p.geiGap ?? "—"}</td>
                    <td className="wrap">{p.classification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {hasText(c.esg.sources) ? (
          <p className="meta-line" style={{ marginTop: "0.85rem" }}>
            Sources: {c.esg.sources}
            {hasText(c.esg.reportingPeriod) ? ` · ${c.esg.reportingPeriod}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="panel feed-detail empty-detail">
      <div className="panel-body detail-body">
        <h1>Pick a company</h1>
        <p className="summary">
          Search or scroll the list. We show the story first — ESG, Net Zero, Europe exposure, fuel buying —
          and the detailed numbers only after you select a company.
        </p>
        <ul className="plain-list">
          <li>Who may buy pellets, briquettes, or CBG</li>
          <li>Who needs a decarbonization partner</li>
          <li>What they have said about carbon, CSR, and procurement</li>
        </ul>
      </div>
    </div>
  );
}

export function ResearchPage() {
  const { data, loading, error } = useDossiers();
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [researchedOnly, setResearchedOnly] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sectors = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.companies.flatMap((c) => c.sectors))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const qq = q.trim().toLowerCase();
    return data.companies.filter((c) => {
      if (researchedOnly && !c.esg.researched && !c.targeting?.researched) return false;
      if (sector !== "all" && !c.sectors.includes(sector)) return false;
      if (!qq) return true;
      const blob = `${c.name} ${c.parentGroup} ${c.targeting?.group || ""} ${c.sectors.join(" ")} ${c.states.join(" ")}`.toLowerCase();
      return blob.includes(qq);
    });
  }, [data, q, sector, researchedOnly]);

  const active = selectedId ? filtered.find((c) => c.id === selectedId) || null : null;

  if (loading && !data) return <div className="loading">Loading company research…</div>;
  if (error && !data) return <div className="error">{error}</div>;
  if (!data) return <div className="error">No company data yet — run npm run dossiers.</div>;

  return (
    <div className="page">
      <div className="scan-hero">
        <h1>Company research</h1>
        <p>
          Look up Indian industrial companies that may buy pellets, briquettes, or CBG — or need help cutting
          carbon. Start with the company, not the scoreboard.
        </p>
      </div>

      <div className="toolbar">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by company name, group, or state…"
        />
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="all">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={researchedOnly ? "yes" : "no"}
          onChange={(e) => setResearchedOnly(e.target.value === "yes")}
        >
          <option value="yes">Full research first</option>
          <option value="no">Show all companies</option>
        </select>
        <span className="live-pill">
          <span className="pulse" />
          {filtered.length === 1 ? "1 company" : `${filtered.length} companies`}
        </span>
      </div>

      <div className="research-layout">
        <aside className="company-list">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`co-card${active?.id === c.id ? " active" : ""}`}
              onClick={() => setSelectedId(c.id)}
            >
              <div className="co-top">
                {(c.targeting?.researched || c.esg.researched) && (
                  <span className="type-pill esg">Researched</span>
                )}
                <span className={`level ${fitTone(c.partnerFit.label)}`}>{c.partnerFit.label}</span>
              </div>
              <h3>{c.name}</h3>
              <p className="co-meta">
                {c.sectors.join(" · ")}
                {hasText(c.targeting?.carbonBuyerProfile) ? ` · ${c.targeting!.carbonBuyerProfile}` : ""}
              </p>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="muted empty">No matches. Try “Show all companies” or clear the search.</p>
          ) : null}
        </aside>
        {active ? <DossierDetail c={active} /> : <EmptyDetail />}
      </div>
    </div>
  );
}
