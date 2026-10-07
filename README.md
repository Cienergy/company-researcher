# Company Researcher

Simple desk to research Indian industrial companies that may buy **pellets, briquettes, or CBG**, or need a **decarbonization partner**.

Same UI family as the other CIC radars (teal top bar, split list + detail).

## Tabs

| Tab | Purpose |
|-----|---------|
| **Companies** | Search a company → read the story (ESG, Net Zero, Europe, fuel buying). Numbers appear after you select. |
| **News** | Live mentions of procurement, carbon rules, Net Zero, ESG, CSR |
| **Guide** | Plain-English sector tips (from EY + our targeting work) |
| **Sources** | Where the data comes from |

## Data inputs

- `../pellet-trade-platform/data/cbam-export-exposure/processed/MASTER_DATABASE.csv`
- `../pellet-trade-platform/data/cbam-export-exposure/processed/ESG_CARBON_SPEND_RESEARCH.csv`
- `../pellet-trade-platform/data/cbam-export-exposure/CCTS_CBAM_Targeting_Summary_v7.xlsx`
- EY CCTS + CBAM PDFs (linked on Sources / Guide)

## Local

```bash
npm install
npm run data    # dossiers + news crawl
npm run dev
```

Open the URL Vite prints (often http://localhost:5173).

## Notes

- Green credits in BRSR are often **Nil** — dossiers say so; the sales angle is reliable fuel, not credit resale.
- News crawl uses Google News RSS (best-effort).
