import yfinance as yf
import requests
import pandas as pd
from datetime import datetime
import uuid

def get_stock_info(ticker: str) -> dict:
    stock = yf.Ticker(ticker)
    info = stock.info
    return {
        "ticker": ticker.upper(),
        "name": info.get("longName", ""),
        "sector": info.get("sector", ""),
        "industry": info.get("industry", ""),
        "market_cap": info.get("marketCap", 0),
        "pe_ratio": info.get("trailingPE", 0),
        "pb_ratio": info.get("priceToBook", 0),
        "revenue": info.get("totalRevenue", 0),
        "net_income": info.get("netIncomeToCommon", 0),
        "ebitda": info.get("ebitda", 0),
        "debt_to_equity": info.get("debtToEquity", 0),
        "roe": info.get("returnOnEquity", 0),
    }

def get_price_history(ticker: str, period: str = "1y") -> pd.DataFrame:
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period)
    return hist

def get_news(ticker: str) -> list:
    stock = yf.Ticker(ticker)
    news = stock.news or []
    results = []
    for item in news[:10]:
        content = item.get("content", {})
        results.append({
            "id": str(uuid.uuid4()),
            "ticker": ticker.upper(),
            "headline": content.get("title", ""),
            "summary": content.get("summary", ""),
            "published_at": datetime.now(),
            "source": content.get("provider", {}).get("displayName", ""),
        })
    return results

def get_competitors(ticker: str) -> list:
    stock = yf.Ticker(ticker)
    info = stock.info
    sector = info.get("sector", "")
    # Return basic comp data for the main ticker to start
    return [get_stock_info(ticker)]

def format_large_number(n) -> str:
    if not n:
        return "N/A"
    if abs(n) >= 1e12:
        return f"${n/1e12:.2f}T"
    if abs(n) >= 1e9:
        return f"${n/1e9:.2f}B"
    if abs(n) >= 1e6:
        return f"${n/1e6:.2f}M"
    return f"${n:,.0f}"