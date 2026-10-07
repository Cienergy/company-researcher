import { useEffect, useMemo, useState } from "react";
import { SignalCard, typeLabel } from "../components/SignalCard";
import type { FeedItem, SignalType } from "../lib/types";
import { formatStamp } from "../lib/time";
import { useFeed } from "../lib/useData";

export function FeedPage() {
  const { feed, loading, refreshing, error, refresh, lastFetch } = useFeed();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [q, setQ] = useState("");
  const [type, setType] = useState<SignalType | "all">("all");
  const [company, setCompany] = useState("");
  const [selected, setSelected] = useState<FeedItem | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    if (!feed) return [];
    const qq = q.trim().toLowerCase();
    return feed.items.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (company && !(item.companies || []).some((c) => c === company)) return false;
      if (!qq) return true;
      const blob = `${item.title} ${item.summary} ${(item.companies || []).join(" ")}`.toLowerCase();
      return blob.includes(qq);
    });
  }, [feed, q, type, company]);

  if (loading && !feed) return <div className="loading">Loading news…</div>;
  if (error && !feed) return <div className="error">{error}</div>;
  if (!feed) return <div className="error">No news yet — run npm run crawl.</div>;

  const active = selected && filtered.find((i) => i.id === selected.id) ? selected : null;

  return (
    <div className="page">
      <div className="scan-hero">
        <h1>Company news</h1>
        <p>
          Fresh mentions of procurement, carbon rules, Net Zero, ESG, and CSR — useful when you are researching a
          buyer or partner.
        </p>
      </div>

      <div className="toolbar">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, company, or keywords…"
        />
        <select value={type} onChange={(e) => setType(e.target.value as SignalType | "all")}>
          <option value="all">All topics</option>
          <option value="procurement">Procurement</option>
          <option value="carbon">Carbon / CCTS / CBAM</option>
          <option value="netzero">Net Zero</option>
          <option value="esg">ESG / BRSR</option>
          <option value="csr">CSR</option>
          <option value="news">Other news</option>
        </select>
        <select value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">All companies</option>
          {(feed.watchCompanies || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="button" className="btn primary" disabled={refreshing} onClick={() => void refresh(true)}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <span className="live-pill" title={feed.updatedAt}>
          <span className="pulse" />
          Updated {formatStamp(feed.updatedAt, nowMs)}
          {lastFetch ? ` · checked ${formatStamp(lastFetch, nowMs)}` : ""}
        </span>
      </div>

      <div className="feed-layout">
        <aside className="feed-list">
          {filtered.length === 0 ? (
            <p className="muted empty">No matches.</p>
          ) : (
            filtered.map((item) => (
              <SignalCard
                key={item.id}
                item={item}
                active={active?.id === item.id}
                nowMs={nowMs}
                onSelect={() => setSelected(item)}
              />
            ))
          )}
        </aside>

        <div className="panel feed-detail">
          <div className="panel-head">
            <h2>Story detail</h2>
            {active ? <span className={`type-pill ${active.type}`}>{typeLabel(active.type)}</span> : null}
          </div>
          <div className="panel-body detail-body">
            {!active ? (
              <div className="empty-detail">
                <h1>Pick a story</h1>
                <p className="summary">Open an item on the left to read the summary and jump to the source.</p>
              </div>
            ) : (
              <>
                <h1>{active.title}</h1>
                <p className="meta-line">
                  {formatStamp(active.publishedAt || active.discoveredAt, nowMs)}
                  {(active.companies || []).length ? ` · ${active.companies.join(", ")}` : ""}
                </p>
                <p className="summary">{active.summary || "No summary."}</p>
                <div className="chip-row">
                  {(active.companies || []).map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
                <p style={{ marginTop: "1rem" }}>
                  <a className="btn primary" href={active.url} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
