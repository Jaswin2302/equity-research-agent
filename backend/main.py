from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import init_db, get_db
from models import Company, FinancialSnapshot, NewsItem
from data import get_stock_info, get_news, get_price_history, format_large_number
from agents import research_pipeline
import uvicorn

app = FastAPI(title="Equity Research Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

class ResearchRequest(BaseModel):
    ticker: str

class ChatRequest(BaseModel):
    ticker: str
    question: str

@app.get("/")
def root():
    return {"status": "Equity Research Agent is running"}

@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    try:
        data = get_stock_info(ticker.upper())
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/stock/{ticker}/news")
def get_stock_news(ticker: str):
    try:
        news = get_news(ticker.upper())
        return {"ticker": ticker.upper(), "news": news}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/stock/{ticker}/history")
def get_stock_history(ticker: str, period: str = "1y"):
    try:
        hist = get_price_history(ticker.upper(), period)
        records = hist.reset_index().to_dict(orient="records")
        for r in records:
            r["Date"] = str(r["Date"])
        return {"ticker": ticker.upper(), "history": records}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/research")
def run_research(request: ResearchRequest):
    try:
        result = research_pipeline.invoke({
            "ticker": request.ticker.upper(),
            "stock_data": {},
            "news": [],
            "analysis": "",
            "report": "",
            "messages": [],
        })
        return {
            "ticker": result["ticker"],
            "stock_data": result["stock_data"],
            "analysis": result["analysis"],
            "report": result["report"],
            "news": result["news"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat(request: ChatRequest):
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage
    import os
    try:
        stock_data = get_stock_info(request.ticker.upper())
        llm = ChatAnthropic(
            model="claude-opus-4-5",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            max_tokens=1000
        )
        prompt = f"""
        You are an equity research analyst. Answer this question about {stock_data.get('name')} ({request.ticker.upper()}):

        Financial context:
        - Market Cap: {format_large_number(stock_data.get('market_cap'))}
        - P/E Ratio: {stock_data.get('pe_ratio')}
        - Revenue: {format_large_number(stock_data.get('revenue'))}
        - Net Income: {format_large_number(stock_data.get('net_income'))}

        Question: {request.question}

        Give a concise, data-driven answer in 2-3 paragraphs.
        """
        response = llm.invoke([HumanMessage(content=prompt)])
        return {"ticker": request.ticker.upper(), "answer": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)