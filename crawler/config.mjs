/** Watch list + query pack for ESG / carbon / procurement intel. */

export const WATCH_COMPANIES = [
  "Vedanta",
  "BALCO",
  "Hindalco",
  "JSW Steel",
  "Tata Steel",
  "Jindal Steel",
  "AM/NS India",
  "ArcelorMittal Nippon",
  "UltraTech",
  "NALCO",
  "SAIL",
  "Ambuja Cement",
  "Dalmia Cement",
  "Shree Cement",
  "ITC Paper",
  "JK Paper",
];

export const QUERIES = [
  // Procurement / biomass fuel
  'India (biomass OR "agro pellet" OR briquette OR "biomass pellet") (tender OR procurement OR "long term" OR offtake OR "co-firing")',
  "NTPC biomass pellet tender OR procurement",
  "JSW Steel biomass OR biochar OR co-firing",
  "Vedanta biomass co-firing OR briquette OR pellet",
  "Hindalco rice husk OR biomass co-firing Hirakud",
  "Tata Steel biochar OR biomass",
  // ESG / Net Zero / CSR
  'India (BRSR OR "net zero" OR "net-zero" OR "carbon neutral") (steel OR aluminium OR cement) 2025 OR 2026',
  "CCTS India carbon credit OR CCC obligated",
  "CBAM India steel OR aluminium export",
  // Company-specific ESG
  '"Vedanta" (ESG OR BRSR OR "net zero" OR CSR OR CCTS)',
  '"JSW Steel" (ESG OR BRSR OR "net zero" OR CSR OR CCTS)',
  '"Tata Steel" (ESG OR BRSR OR "net zero" OR CSR)',
  '"Hindalco" (ESG OR BRSR OR "net zero" OR CSR)',
  '"Jindal Steel" (ESG OR BRSR OR "net zero" OR sustainability)',
  '"AM/NS India" OR "ArcelorMittal Nippon" (sustainability OR biomass OR CBAM)',
];

export const TYPE_HINTS = {
  procurement: [
    "tender",
    "procurement",
    "purchase",
    "offtake",
    "long-term agreement",
    "supply agreement",
    "e-tender",
    "gem.gov",
    "bid",
  ],
  carbon: [
    "ccts",
    "carbon credit",
    "ccc",
    "cbam",
    "emission intensity",
    "carbon market",
    "ets",
    "green credit",
  ],
  netzero: ["net zero", "net-zero", "carbon neutral", "decarbon", "sbti", "climate target"],
  csr: ["csr", "community", "social responsibility"],
  esg: ["esg", "brsr", "sustainability report", "tcfd", "integrated report"],
};
