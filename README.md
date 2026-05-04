# ⬡ Equitas — AI-Powered Equity Research Terminal

**Live Demo:** [equity-research-agent-mauve.vercel.app](https://equity-research-agent-mauve.vercel.app)


---

## What It Does

Equitas is a full-stack AI application that automates the equity research workflow. Enter any stock ticker and the system deploys a multi-agent AI pipeline that fetches live financial data, analyzes valuations, aggregates news sentiment, and produces a professional Buy/Hold/Sell research report — in under 60 seconds.

What a junior analyst does in 2 hours, Equitas does in 30 seconds.

---

## Demo

### Search any ticker
Enter AAPL, NVDA, JPM, TSLA — any publicly traded stock.

### Get an institutional-grade report
- Executive Summary
- Financial Highlights table
- Investment Analysis (valuation, competitive position, risks)
- Buy / Hold / Sell recommendation

### Explore live data
- 12-month price history chart
- Key financial ratios (P/E, P/B, ROE, Debt/Equity, EBITDA)
- Real-time news aggregation with AI sentiment summary

### Ask the AI Analyst
Chat directly with a Claude-powered analyst about any stock.

---

## Architecture

The user interacts with a React frontend deployed on Vercel. The frontend calls a FastAPI backend deployed on Railway. The backend runs a LangGraph multi-agent pipeline with four specialized agents: the Researcher Agent pulls live data from yfinance, the Analyst Agent sends financials to Claude for valuation analysis, the News Agent summarizes headlines using Claude, and the Report Writer Agent assembles everything into a final professional report.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Recharts, TailwindCSS |
| Backend | FastAPI, Python, SQLAlchemy |
| AI / Agents | LangGraph, Claude (Anthropic API) |
| Data | yfinance, SEC EDGAR |
| Deployment | Vercel (frontend), Railway (backend) |
| Database | SQLite / PostgreSQL |

---

## Key Features

- **Multi-Agent Pipeline** — 4 specialized AI agents run in sequence via LangGraph: Researcher → Analyst → News Summarizer → Report Writer
- **Live Financial Data** — Real-time market data, financials, and news via yfinance
- **AI-Generated Reports** — Claude produces structured equity research reports with Buy/Hold/Sell recommendations
- **Interactive Dashboard** — Price charts, comp tables, news feed, and AI chat interface
- **Production Deployed** — Live on Vercel + Railway with CI/CD via GitHub

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node 18+
- Anthropic API key

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Agent Pipeline

### 1. Researcher Agent
Fetches live financial data from yfinance — market cap, revenue, net income, EBITDA, valuation ratios, and latest news headlines.

### 2. Analyst Agent
Sends financial data to Claude with a structured prompt. Returns a 3-4 paragraph analysis covering business overview, valuation assessment, and key risks.

### 3. News Summarizer Agent
Takes raw news headlines and asks Claude to synthesize them into a 2-3 sentence sentiment summary capturing key themes.

### 4. Report Writer Agent
Combines all outputs into a professional equity research report with Executive Summary, Financial Highlights, Investment Analysis, Key Risks, and a clear recommendation.

---

## Project Structure

The backend folder contains main.py for the FastAPI app and endpoints, agents.py for the LangGraph multi-agent pipeline, data.py for the yfinance data layer, database.py for SQLAlchemy setup, models.py for database table definitions, and requirements.txt for dependencies. The frontend folder contains the React dashboard inside src/App.jsx along with styling in App.css.

---

## Author

**Mahojaswin Chittamuru**
B.S. Computer Science, Worcester Polytechnic Institute
[GitHub](https://github.com/Jaswin2302) · [Email](mailto:mchittamuru@wpi.edu)