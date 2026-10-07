export type SignalType = "procurement" | "carbon" | "netzero" | "esg" | "csr" | "news";

export type FeedItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  discoveredAt: string;
  source: string;
  channel: string;
  query?: string;
  type: SignalType;
  score: number;
  companies: string[];
};

export type Feed = {
  updatedAt: string;
  watchCompanies: string[];
  stats: Record<string, number>;
  items: FeedItem[];
};

export type PlantRow = {
  registration: string;
  plant: string;
  district: string;
  state: string;
  sector: string;
  currentGei: number | null;
  targetGei: number | null;
  geiGap: number | null;
  targetYear: string;
  priorityRank: number | null;
  classification: string;
};

export type TargetingProfile = {
  group: string;
  mainSector: string;
  researchStatus: string;
  researched: boolean;
  cctsPlants: number | null;
  plantsInScope: number | null;
  cctsShortfallTco2: number | null;
  estCccNeedCr: number | null;
  avgCctsScore: number | null;
  highRiskPlants: number | null;
  cbamPlants: number | null;
  avgCbamScore: number | null;
  euExportEvidence: string;
  netZeroYear: string;
  netZeroTargets: string;
  sbtiStatus: string;
  internalCarbonPriceUsd: number | null;
  icpDetail: string;
  esgSpend: string;
  carbonCreditsBought: string;
  greenCredits: string;
  biomassActivity: string;
  commercialSignal: string;
  sectorCbamLevers: string;
  pelletSalesAngle: string;
  esgReadinessScore: number | null;
  carbonBuyerProfile: string;
  nearTermPelletTpa: number | null;
  evidenceStrength: string;
  dataYear: string;
  sources: string;
  rankCccNeed: number | null;
};

export type CompanyDossier = {
  id: string;
  name: string;
  parentGroup: string;
  sectors: string[];
  states: string[];
  plantCount: number;
  plants: PlantRow[];
  bestPriorityRank: number | null;
  bestPriorityScore: number | null;
  bestClassification: string;
  cctsNotificationStatus: string;
  cctsStatusNotes: string[];
  cbamApplicability: string;
  euExportEvidence: string[];
  netZeroCommitment: string[];
  coalAccess: string[];
  biomassSuitability: string[];
  whyTarget: string[];
  targeting: TargetingProfile | null;
  esg: {
    researched: boolean;
    companyGroup: string;
    greenCredits: string;
    carbonCreditSpend: string;
    carbonSpendNote: string;
    envCapex: string;
    esgComplianceNote: string;
    biomassActivity: string;
    biomassVolume: string;
    biomassPrice: string;
    priceSensitivitySignal: string;
    supplyContinuitySignal: string;
    commercialImplication: string;
    commercialDetail: string;
    sources: string;
    evidenceStrength: string;
    reportingPeriod: string;
  };
  eySectorNotes: Array<{
    sector?: string;
    cctsFocus: string;
    cbamFocus: string;
    levers: string[];
    partnerAngle: string;
  }>;
  partnerFit: {
    score: number;
    label: string;
    roles: string[];
    roleLabels: string[];
    rationale: string;
  };
};

export type Dossiers = {
  updatedAt: string;
  source: string;
  stats: Record<string, number>;
  companies: CompanyDossier[];
};

export type Framework = {
  updatedAt: string;
  title: string;
  sources: Array<{ title: string; url: string }>;
  headline: string;
  takeaways: string[];
  sectors: Array<{
    sector: string;
    cctsFocus: string;
    cbamFocus: string;
    levers: string[];
    partnerAngle: string;
  }>;
};
