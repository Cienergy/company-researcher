import { useFramework } from "../lib/useData";

export function FrameworkPage() {
  const { data, loading, error } = useFramework();

  if (loading) return <div className="loading">Loading guide…</div>;
  if (error || !data) return <div className="error">{error || "Guide missing — run npm run dossiers."}</div>;

  return (
    <div className="page">
      <div className="scan-hero">
        <h1>{data.title}</h1>
        <p>{data.headline}</p>
      </div>

      <div className="panel" style={{ marginBottom: "0.85rem" }}>
        <div className="panel-head">
          <h2>What to look for in a company</h2>
        </div>
        <div className="panel-body">
          <ul className="plain-list">
            {data.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>By sector — how to talk to them</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Sector</th>
                <th>India carbon rules</th>
                <th>Europe angle</th>
                <th>What they can do</th>
                <th>Our pitch</th>
              </tr>
            </thead>
            <tbody>
              {data.sectors.map((s) => (
                <tr key={s.sector}>
                  <td>
                    <strong>{s.sector}</strong>
                  </td>
                  <td className="wrap">{s.cctsFocus}</td>
                  <td className="wrap">{s.cbamFocus}</td>
                  <td className="wrap">{(s.levers || []).join("; ")}</td>
                  <td className="wrap">{s.partnerAngle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="source-list" style={{ marginTop: "0.85rem" }}>
        {data.sources.map((s) => (
          <div key={s.title} className="source-item">
            <strong>{s.title}</strong>
            {s.url.startsWith("http") ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                Open
              </a>
            ) : (
              <p className="muted">Loaded from the internal targeting workbook when you rebuild data.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
