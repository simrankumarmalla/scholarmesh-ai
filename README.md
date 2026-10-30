# ScholarMesh AI — Multi-Source Research Synthesis & Evidence Discovery Platform

> **AI for Research & Knowledge Discovery Challenge**  
> An autonomous research synthesis engine built with Google Gemini 2.5 Flash, Node.js/Express, PostgreSQL, and React.

---

## 1. Problem Statement
Academic researchers, clinical scientists, R&D analysts, and policy professionals spend up to 60% of their workflow manually cross-referencing fragmented PDFs, laboratory notes, and published literature. Crucially, single-paper summaries fail to uncover:
- **Direct Empirical Contradictions:** When Study A concludes a compound is safe at 0.5 mg/kg in mice, but Study B reveals acute hepatotoxicity in primates at 0.3 mg/kg.
- **Methodological Variances:** Discrepancies driven by sample size, cohort species, or measurement techniques.
- **Unaddressed Research Gaps:** Blind spots across populations and longitudinal exposure.

---

## 2. Solution: ScholarMesh AI
ScholarMesh AI is an end-to-end research discovery and literature synthesis platform that turns multi-document corpora into structured knowledge graphs:
1. **Dedicated Research Workspaces:** Group literature by scientific question, working hypothesis, and target domain.
2. **Multi-Modal Document Ingestion:** Upload `.pdf`, `.txt`, and `.md` files via Multer or paste study abstracts.
3. **Structured Claim Extraction:** Automatically decomposes documents into atomic, categorized claims (`empirical_finding`, `statistic`, `methodology`, `limitation`, `hypothesis`) with rigor scores (0–100).
4. **Cross-Source Synthesis & Contradiction Matrix:** Compares 2+ studies simultaneously to highlight consensus themes, direct conflicts, and research gaps.
5. **Citation-Grounded Research Copilot:** Interactive RAG assistant that cites sources by exact ID and quote with follow-up inquiry chips.
6. **One-Click Markdown & PDF Export:** Export synthesized literature reviews into formatted Markdown.

---

## 3. Architecture & AI Workflow

```
[ Research Paper (PDF/TXT/MD) ] 
               │
               ▼
   [ Multer + pdf-parse ] ──► [ Server-Side Text Extraction ]
                                       │
                                       ▼
                     [ Google Gemini 2.5 Flash (@google/genai) ]
                     - System: Principal Scientific Epistemologist
                     - Schema: sourceAnalysisSchema (JSON)
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     [ sources (PostgreSQL) ]                    [ extracted_claims (PostgreSQL) ]
     - Executive Summary                         - Atomic Claim Statement
     - Methodology Critique                      - Category (Finding, Stat, Limit)
     - Rigor Score (0-100)                       - Verbatim Quote + Confidence
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                 [ Cross-Source Multi-Doc Synthesis ]
                 - Consensus Discovery
                 - Contradiction & Discrepancy Matrix
                 - Horizon Research Gaps
                 - Evidence-Based Recommendations
                                       │
                                       ▼
                [ Grounded Research Copilot (RAG Chat) ]
                - Exact Inline Citations
                - Zero-Hallucination Policy
                - Follow-Up Inquiry Chips
```

---

## 4. Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, Axios (with JWT interceptor), React Router DOM v6
- **Backend:** Node.js, Express.js (REST API architecture), Zod validation, Multer (memory storage, 10MB limit), pdf-parse, JWT + bcryptjs
- **Artificial Intelligence:** Official `@google/genai` TypeScript SDK with `gemini-2.5-flash` model and strict JSON Schema output enforcement
- **Database:** PostgreSQL (with `uuid-ossp` and cascade relations) + Resilient In-Memory/JSON fallback engine for instant evaluation

---

## 5. Quick Start & Local Setup

### Prerequisites
- Node.js (v18+)
- (Optional) PostgreSQL database (defaults to embedded store if `DATABASE_URL` is omitted)
- Google Gemini API Key

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/scholarmesh-ai.git
cd scholarmesh-ai

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Configure `.env`
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=scholarmesh_ultra_secure_jwt_secret_token_2026
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scholarmesh_db
```

### Run Server & Client
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Pre-Seeded Demo Researcher Account
For evaluation, ScholarMesh AI automatically initializes with a rich pre-populated research workspace:
- **Email:** `demo@scholarmesh.ai`
- **Password:** `DemoPass123!`
- **1-Click Login:** Click the **"1-Click Demo Researcher Login"** button on the sign-in page to enter immediately.
- **Workspace:** *"mRNA Delivery Lipid Nanoparticles: Efficacy vs. Hepatic Toxicity"* (3 conflicting studies, 12+ atomic claims, and a complete cross-document contradiction synthesis report).

---

## 7. Deployment Guide

### Deploy to Render / Railway / Fly.io (Full-Stack)
1. Fork or push this repository to GitHub.
2. In your deployment dashboard, select **Node.js Environment**.
3. Set build command:
   ```bash
   npm install && npm run build
   ```
4. Set start command:
   ```bash
   npm run start
   ```
5. Configure Environment Variables (`GEMINI_API_KEY`, `JWT_SECRET`, and optional `DATABASE_URL`).

### Deploy Database to Supabase / Neon
1. Create a free PostgreSQL database on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy the Connection String and set as `DATABASE_URL` in your environment.
3. The server runs `server/src/db/init.sql` automatically on initial connection.

---

## 8. License
Apache 2.0. Built for the AI for Research & Knowledge Discovery challenge.
