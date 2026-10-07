export function SourcesPage() {
  return (
    <div className="page">
      <div className="scan-hero">
        <h1>Where this comes from</h1>
        <p>Plain list of inputs behind Company Researcher. We do not invent company facts.</p>
      </div>

      <div className="source-list">
        <div className="source-item">
          <strong>CCTS plant list</strong>
          <p className="muted">
            Obligated plants from Carbon Market India and gazette schedules, stored in the pellet-trade-platform
            master database.
          </p>
        </div>
        <div className="source-item">
          <strong>Targeting Summary v7</strong>
          <p className="muted">
            <code>CCTS_CBAM_Targeting_Summary_v7.xlsx</code> — company ESG &amp; carbon profiles (Net Zero, SBTi,
            internal carbon price, biomass activity, pellet sales angle, certificate need).
          </p>
        </div>
        <div className="source-item">
          <strong>ESG / carbon spend notes</strong>
          <p className="muted">
            Curated BRSR / ESG extracts for priority groups — green credits, env spend, biomass offtake language.
          </p>
        </div>
        <div className="source-item">
          <strong>Live news</strong>
          <p className="muted">
            Google News RSS for procurement, CCTS/CBAM, Net Zero, ESG/BRSR, and CSR. Refresh with{" "}
            <code>npm run crawl</code>.
          </p>
        </div>
        <div className="source-item">
          <strong>EY — CCTS path to decarbonization (2026)</strong>
          <a
            href="https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/insights/climate-change-sustainability-services/documents/2026/ey-ccts-accelerating-the-path-to-decarbonization.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Open PDF
          </a>
          <p className="muted">Sector levers and why early action beats late certificate buying.</p>
        </div>
        <div className="source-item">
          <strong>EY — CBAM impact on Indian industries (2026)</strong>
          <a
            href="https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/insights/climate-change-sustainability-services/documents/2026/ey-carbon-pricing-meets-raw-materials-cabms-impact-on-indian-industries.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Open PDF
          </a>
          <p className="muted">How Europe’s border carbon tax hits steel, aluminium, and cement.</p>
        </div>
        <div className="source-item">
          <strong>Rebuild locally</strong>
          <p className="muted">
            <code>npm run dossiers</code> · <code>npm run crawl</code> · <code>npm run data</code>
          </p>
        </div>
      </div>
    </div>
  );
}
