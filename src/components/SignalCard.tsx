import type { FeedItem, SignalType } from "../lib/types";
import { formatStamp } from "../lib/time";

const LABELS: Record<SignalType, string> = {
  procurement: "Procurement",
  carbon: "Carbon",
  netzero: "Net Zero",
  esg: "ESG",
  csr: "CSR",
  news: "News",
};

export function typeLabel(t: SignalType) {
  return LABELS[t] || t;
}

export function SignalCard({
  item,
  active,
  onSelect,
  nowMs,
}: {
  item: FeedItem;
  active: boolean;
  onSelect: () => void;
  nowMs: number;
}) {
  return (
    <button type="button" className={`opp-card${active ? " active" : ""}`} onClick={onSelect}>
      <div className="opp-top">
        <span className={`type-pill ${item.type}`}>{typeLabel(item.type)}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="opp-meta">
        {(item.companies || []).slice(0, 2).join(" · ") || "General"}
        {" · "}
        {formatStamp(item.publishedAt || item.discoveredAt, nowMs)}
      </p>
    </button>
  );
}
