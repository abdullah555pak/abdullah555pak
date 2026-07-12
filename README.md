# BrandSkull — Agency Operating System

A Next.js dashboard that operationalizes the BrandSkull Marketing Agency
playbook: lead generation, sales pipeline, client onboarding, ad campaigns,
SEO, social content, email marketing, automation, reporting, and customer
success — all in one internal tool.

The app ships with realistic mock data across the agency's target
industries (roofing, HVAC, dentists, law firms, med spas, real estate, and
more) so every module is browsable out of the box. Swap `src/lib/data.ts`
for live data (CRM export, ad platform APIs, etc.) to make it real.

## Modules

- **Overview** — executive KPIs, revenue/profit trend, top prospects, at-risk clients
- **Lead Generation** — scored, prioritized prospect list with recommended service and deal value
- **Sales Pipeline** — kanban across New → Qualified → Proposal → Negotiation → Won/Lost, plus an objection-handling playbook
- **Clients & Onboarding** — health score, churn risk, and onboarding checklist per account
- **Ad Campaigns** — Facebook & Google Ads performance (CPL, CPA, ROAS, CTR, CPC, conversion rate)
- **SEO** — keyword rankings, organic traffic, local pack visibility
- **Social Media** — 30-day content calendar
- **Email Marketing** — sequence performance (welcome, follow-up, nurture, re-engagement, promotional)
- **Automation** — integration status (GoHighLevel, Twilio, Stripe, Slack, Zapier, etc.) and automated workflows
- **Reports** — monthly revenue, profit, lead volume, and retention trends
- **Customer Success** — satisfaction signals, churn risk, and upsell/cross-sell opportunities

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4. Charts are custom
lightweight SVG components (no charting library dependency).
