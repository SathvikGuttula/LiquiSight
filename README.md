# LiquiSight
LiquiSight is a screen‑aware AI copilot for traders that runs as a Chrome extension and web dashboard, scans live financial charts, explains trends/risk in natural language, and builds a portfolio view with RAG‑based insights over your past scans.

# 💧 LiquiSight – Screen‑Aware AI Copilot for Visual Financial Intelligence

> Screen‑aware AI copilot for visual financial intelligence – scan charts, understand risk, and analyze your portfolio with Gemini‑powered insights.

LiquiSight is an AI copilot that **looks at the same charts you do** and turns visual market data into natural‑language insights.

It runs as:

- a **Chrome extension** with a Comet‑style side panel (`Alt + L`) over TradingView / Yahoo Finance / etc.
- a **web dashboard** (Next.js) with a glassmorphism UI, live metrics, and a portfolio view powered by **RAG** over your past scans.

> ⚠️ LiquiSight is for educational & research use only. It does **not** provide financial advice.

---

## ✨ Core Features

### Browser Extension (AI Side Panel)

- **One‑click side panel**
  - Click the LiquiSight icon or press `Alt + L` to slide in a glassy side panel on any tab.
  - Designed to sit on top of TradingView, Yahoo Finance, Google Finance, etc.

- **Visual scanning modes**
  - **Scan Page** – detects chart‑like elements (`canvas`, `svg`, `.chart`, `.graph`, …).  
    Adds a neon blue border + animated scan line and generates an AI summary of trend, volatility, and risk.
  - **Select Area** – lets you drag a rectangle around any region of the page (e.g. a specific chart).  
    LiquiSight focuses analysis on just that selection.

- **On‑screen chat**
  - Chat UI inside the panel explains:
    - Trend direction (bullish / bearish / sideways)
    - Volatility and risk level
    - Confidence score
    - Short textual insight + recommendation
  - Backed by a Node.js server that talks to **Google Gemini** (with safe fallbacks if the API fails).

- **Portfolio capture**
  - Every scan is stored locally / in your backend as a **Scan**:
    ```ts
    type Scan = {
      id: string
      symbol: string
      url: string
      trend: 'up' | 'down' | 'sideways'
      riskLevel: 'low' | 'medium' | 'high'
      confidence: number
      explanation: string
      timestamp: string
    }
    ```
  - These scans feed the LiquiSight **Dashboard** and **Portfolio** views.

---

### Web Dashboard (Next.js)

- **Dashboard tab**
  - Glassmorphism UI over a pink, frosted hero background.
  - Metrics:
    - Total scans
    - Average confidence
    - Number of high‑risk signals
    - Risk distribution (low / medium / high)
  - “Latest scan” card:
    - Symbol, trend badge, risk badge
    - Explanation snippet
    - Sparkline mini‑chart
    - Confidence gauge
    - “View details” entry point

- **Portfolio tab**
  - Left column: **all symbols LiquiSight has ever scanned**, grouped by ticker.
  - Each symbol shows:
    - Latest explanation
    - Number of scans
    - Average confidence (gauge)
  - **Analyze** button (per symbol):
    - Calls `/api/portfolio-analyze`
    - Uses all your historical scans as **RAG context**
    - Asks Gemini for:
      - A portfolio‑aware view of that symbol (trend, risk, key levels to watch)
      - Up to 3 similar / alternative symbols drawn from your own portfolio
  - Right‑hand “AI Portfolio Insight” panel displays the full response.

---

## 🏗️ Architecture

```text
Browser tab (TradingView / Yahoo Finance / ...)
     │
     ├─ Chrome Extension
     │   ├─ content/content.js       ← injects LiquiSight side panel & scan overlays
     │   ├─ content/style.css        ← neon scan effects, glass panel styles
     │   ├─ background/background.js ← icon click + Alt+L → togglePanel
     │   └─ manifest.json
     │
     ├─ Node Backend (extension/backend/server.js)
     │   ├─ Exposes POST /api/chat
     │   ├─ Reads GOOGLE_API_KEY (.env)
     │   ├─ Calls Google Gemini (generateContent)
     │   └─ Returns analysis text (with graceful fallbacks)
     │
     └─ Next.js App (dashboard)
         ├─ app/page.tsx                         ← AppShell with left tabs
         ├─ components/dashboard.tsx             ← pink glassy dashboard
         ├─ components/portfolio-view.tsx        ← portfolio + RAG UI
         ├─ context/scans-context.tsx            ← Scan data from DB / Supabase
         └─ app/api/portfolio-analyze/route.ts   ← RAG endpoint using Gemini
```
Tech stack:

Extension: Chrome MV3, content scripts, vanilla JS/TS, Tailwind‑style CSS
Backend (for extension chat): Node.js, Express, Google Gemini API
Web app: Next.js (App Router), React, Tailwind CSS, lucide‑react, custom glass components
Storage: Supabase (or any DB) surfaced through useScans() for the dashboard/portfolio

📂 Repository Structure

.
├── extension/                # Browser Extension source code
│   ├── backend/              # Internal logic or API integration services
│   ├── background/           # Service workers for persistent background tasks
│   ├── content/              # Scripts that read/analyze stock data on the page
│   ├── popup/                # The UI that appears when clicking the extension icon
│   ├── manifest.json         # Extension metadata, permissions, and entry points
│   └── README.md             # Extension-specific documentation
├── website/                  # Project landing page or web-based dashboard
│   ├── build/                # Compiled production files (ignored by git)
│   ├── public/               # Static assets (favicons, manifest.json for web)
│   ├── src/                  # React/Frontend source code for the dashboard
│   ├── .gitignore            # Files to exclude from the website repository
│   ├── package.json          # Website-specific dependencies
│   ├── README.md             # Website-specific instructions
│   └── tsconfig.json         # TypeScript configuration for the web app
├── node_modules/             # Shared dependencies (managed by the root)
├── package.json              # Root config for workspace management
└── package-lock.json         # Locked dependency versions for the whole repo


🚀 Getting Started
1. Prerequisites
Node.js ≥ 18
npm or pnpm
Google Gemini API key from Google AI Studio
Chrome / Edge (for the extension)
Optional: Supabase project (or any DB) for persistent scans
2. Set up the extension backend (Gemini chat)
Bash

cd extension/backend
npm install
Create extension/backend/.env:

env

GOOGLE_API_KEY=your_gemini_key_here
# or any of these names; server.js checks all three:
# GEMINI_API_KEY=your_gemini_key_here
# LIQUISIGHT_API_KEY=your_gemini_key_here
Run the backend:

Bash

cd extension/backend
node server.js
You should see:

text

LiquiSight backend running on http://localhost:3000
If Gemini is misconfigured or rate‑limited, the server will still return fallback replies so the demo never shows HTTP 500 to the frontend.

3. Run the Next.js dashboard
From the web app root (usually repo root if monorepo):

Bash

npm install
npm run dev
Create .env.local in the Next.js app root:

env

GOOGLE_API_KEY=your_gemini_key_here

# If you use Supabase for scans:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
Then visit:

text

http://localhost:3000
You should see the Dashboard with the frosted pink background. Click Portfolio in the left sidebar to access the portfolio/RAG view.

4. Load the Chrome extension
Open Chrome → go to chrome://extensions
Toggle Developer mode (top right)
Click Load unpacked
Select the extension/ folder
You should now see LiquiSight in your extensions bar.

5. Use LiquiSight
Open a site with financial charts (e.g. TradingView, Yahoo Finance, Google Finance, etc.)

Click the LiquiSight icon in the browser toolbar
or press Alt + L

→ The LiquiSight side panel slides in from the right.

In the side panel:

Click Scan Page
LiquiSight sweeps an animated scan line over the viewport, highlights chart regions, and posts an analysis into the chat.
Or click Select Area
Drag around a specific chart; LiquiSight analyzes only that region and posts the result in the chat.
Ask follow‑up questions in the chat (e.g. “How risky does this look?”).
LiquiSight uses the Node backend + Gemini to respond.

Each scan is saved as a Scan record (locally and/or in your DB).
Open the web dashboard → Portfolio tab to see all symbols and run portfolio‑aware analysis.

🔍 RAG: How Portfolio Analysis Works
Data collection

Every scan from the extension is stored as:

TypeScript

type Scan = {
  id: string
  symbol: string
  url: string
  trend: 'up' | 'down' | 'sideways'
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  explanation: string
  timestamp: string
}
Context building (/api/portfolio-analyze)

Receives { symbol, scans } from the client.

Extracts:

All scans for symbol (historical pattern for this stock)
All other symbols the user has scanned (candidate alternatives).
Builds a prompt like:

History for SYMBOL:
– [timestamp] trend=x, risk=y, confidence=z, note="…"
Other portfolio symbols: A, B, C, …

Gemini call

Calls gemini-1.0-pro with this context via the Google Generative Language API.
Asks Gemini to:
Summarise the current situation for the symbol (trend, risk, volatility, key levels to watch).
Select up to 3 similar/alternative symbols from the user’s own portfolio and briefly justify them.
If Gemini fails (bad key, quota, etc.), the endpoint returns a graceful fallback string so the UI never breaks.
UI

components/portfolio-view.tsx:
Left column: all symbols + their scan count and average confidence.
“Analyze” button triggers /api/portfolio-analyze.
Right column: renders the returned multi‑paragraph explanation.
🧪 Scripts
Typical scripts (adjust to your package.json):

Bash

# Next.js app
npm run dev        # start dev server on http://localhost:3000
npm run build      # build for production
npm run start      # run production build

# Extension backend (Gemini chat)
cd extension/backend
node server.js

⚠️ Disclaimer
LiquiSight is:

a technical demo / hackathon project
not a registered investment advisor
not suitable for live trading decisions
All outputs are generated by machine learning models and may be inaccurate, incomplete, or outdated.

Always do your own research and consult a qualified financial professional before making investment decisions.

🗺️ Possible Future Work
Real‑time price feeds and broker integration (orders, P&L).
Fine‑tuned financial LLMs (e.g. FinGPT, custom Gemini fine‑tunes).
Multi‑screen / cross‑device sync for scans and portfolios.
Rich per‑symbol timelines and backtests of LiquiSight’s historical calls.
More advanced chart recognition (candlestick patterns, indicators, volume profiles).

🤝 Contributing
Pull requests, issues, and feature ideas are welcome — especially around:

Better chart / indicator detection in the extension
Stronger financial reasoning prompts & safety
New portfolio visualizations or risk metrics
Feel free to open an issue describing how you’d like to extend LiquiSight.

