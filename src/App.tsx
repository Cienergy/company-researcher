import { NavLink, Route, Routes } from "react-router-dom";
import { ResearchPage } from "./pages/ResearchPage";
import { FeedPage } from "./pages/FeedPage";
import { FrameworkPage } from "./pages/FrameworkPage";
import { SourcesPage } from "./pages/SourcesPage";

const links = [
  { to: "/", label: "Companies", end: true },
  { to: "/feed", label: "News", end: false },
  { to: "/framework", label: "Guide", end: false },
  { to: "/sources", label: "Sources", end: false },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <div>
            <strong>Company Researcher</strong>
            <span>Who to sell to · ESG · carbon · procurement</span>
          </div>
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<ResearchPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/framework" element={<FrameworkPage />} />
        <Route path="/sources" element={<SourcesPage />} />
      </Routes>
    </div>
  );
}
