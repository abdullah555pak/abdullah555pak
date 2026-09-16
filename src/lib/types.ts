export type Lead = {
  id: string;
  businessName: string;
  ownerName: string;
  website: string;
  phone: string;
  email: string;
  industry: string;
  location: string;
  monthlyRevenueEstimate: number;
  marketingScore: number; // 1-100, lower = weaker existing marketing = bigger opportunity
  opportunityScore: number; // 1-100
  recommendedService: string;
  estimatedDealValue: number;
  source: string;
};

export type PipelineStage =
  | "New"
  | "Qualified"
  | "Proposal Sent"
  | "Negotiation"
  | "Won"
  | "Lost";

export type Deal = {
  id: string;
  businessName: string;
  stage: PipelineStage;
  value: number;
  owner: string;
  lastActivity: string;
  objection?: string;
};

export type OnboardingStep = {
  label: string;
  done: boolean;
};

export type Client = {
  id: string;
  businessName: string;
  industry: string;
  plan: string;
  mrr: number;
  startDate: string;
  healthScore: number; // 0-100
  churnRisk: "Low" | "Medium" | "High";
  onboarding: OnboardingStep[];
  csm: string;
};

export type AdPlatform = "Facebook" | "Google";

export type Campaign = {
  id: string;
  client: string;
  platform: AdPlatform;
  name: string;
  status: "Active" | "Paused" | "Learning";
  budgetPerDay: number;
  spend: number;
  leads: number;
  cpl: number;
  cpa: number;
  roas: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
};

export type SeoReport = {
  id: string;
  client: string;
  industry: string;
  keywordsTracked: number;
  keywordsTop10: number;
  organicTraffic: number;
  trafficChangePct: number;
  domainAuthority: number;
  backlinksGained: number;
  localPackRankings: number;
};

export type ContentItem = {
  day: number;
  type: "Reel" | "Carousel" | "Story" | "Static Post";
  topic: string;
  status: "Planned" | "In Production" | "Scheduled" | "Published";
};

export type EmailSequence = {
  id: string;
  name: string;
  type: "Welcome" | "Follow-Up" | "Nurture" | "Re-Engagement" | "Promotional";
  emails: number;
  openRate: number;
  clickRate: number;
  active: boolean;
};

export type Integration = {
  name: string;
  category: string;
  status: "Connected" | "Not Connected";
  syncing: string;
};

export type PerformancePoint = {
  label: string;
  revenue: number;
  profit: number;
  leads: number;
};

export type CustomerSuccessSignal = {
  client: string;
  satisfaction: number; // 0-100
  churnRisk: "Low" | "Medium" | "High";
  lastCheckIn: string;
  upsellOpportunity: string | null;
  note: string;
};

export type Objection = {
  objection: string;
  response: string;
};
