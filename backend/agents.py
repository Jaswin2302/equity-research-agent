from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator
from data import get_stock_info, get_news, get_price_history, format_large_number
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatAnthropic(
    model="claude-opus-4-5",
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    max_tokens=2000
)

class ResearchState(TypedDict):
    ticker: str
    stock_data: dict
    news: list
    analysis: str
    report: str
    messages: Annotated[list, operator.add]

def researcher_agent(state: ResearchState) -> ResearchState:
    ticker = state["ticker"]
    print(f"[Researcher] Fetching data for {ticker}...")
    stock_data = get_stock_info(ticker)
    news = get_news(ticker)
    return {**state, "stock_data": stock_data, "news": news}

def analyst_agent(state: ResearchState) -> ResearchState:
    data = state["stock_data"]
    print(f"[Analyst] Analyzing {data.get('ticker')}...")
    prompt = f"""
    You are a senior equity research analyst. Analyze the following financial data and provide
    a concise but insightful analysis covering valuation, profitability, and key risks.

    Company: {data.get('name')} ({data.get('ticker')})
    Sector: {data.get('sector')} | Industry: {data.get('industry')}

    Key Financials:
    - Market Cap: {format_large_number(data.get('market_cap'))}
    - Revenue: {format_large_number(data.get('revenue'))}
    - Net Income: {format_large_number(data.get('net_income'))}
    - EBITDA: {format_large_number(data.get('ebitda'))}

    Valuation Ratios:
    - P/E Ratio: {data.get('pe_ratio')}
    - P/B Ratio: {data.get('pb_ratio')}
    - Debt/Equity: {data.get('debt_to_equity')}
    - ROE: {data.get('roe')}

    Provide a 3-4 paragraph analysis covering:
    1. Business overview and competitive position
    2. Valuation assessment (cheap, fair, expensive?)
    3. Key risks and opportunities
    """
    response = llm.invoke([HumanMessage(content=prompt)])
    return {**state, "analysis": response.content}

def news_agent(state: ResearchState) -> ResearchState:
    news = state["news"]
    ticker = state["ticker"]
    print(f"[News] Summarizing news for {ticker}...")
    if not news:
        return {**state, "news": []}
    headlines = "\n".join([f"- {n['headline']}" for n in news if n['headline']])
    prompt = f"""
    You are a financial news analyst. Summarize the following headlines for {ticker} 
    into 2-3 sentences capturing the key themes and sentiment.

    Headlines:
    {headlines}
    """
    response = llm.invoke([HumanMessage(content=prompt)])
    summarized = [{"headline": "AI News Summary", "summary": response.content, "source": "Claude"}] + news
    return {**state, "news": summarized}

def report_writer_agent(state: ResearchState) -> ResearchState:
    data = state["stock_data"]
    analysis = state["analysis"]
    news = state["news"]
    print(f"[Report Writer] Writing final report...")
    news_summary = news[0]["summary"] if news else "No recent news available."
    prompt = f"""
    You are a professional equity research report writer. Write a concise one-page 
    equity research report for {data.get('name')} ({data.get('ticker')}).

    Use this analysis: {analysis}
    Recent news context: {news_summary}

    Format the report with these sections:
    1. Executive Summary (2-3 sentences)
    2. Financial Highlights (bullet points with key metrics)
    3. Investment Analysis (3-4 paragraphs)
    4. Key Risks
    5. Conclusion with a clear Buy / Hold / Sell recommendation

    Be direct, professional, and data-driven.
    """
    response = llm.invoke([HumanMessage(content=prompt)])
    return {**state, "report": response.content}

def build_research_pipeline():
    graph = StateGraph(ResearchState)
    graph.add_node("researcher", researcher_agent)
    graph.add_node("analyst", analyst_agent)
    graph.add_node("news", news_agent)
    graph.add_node("report_writer", report_writer_agent)
    graph.set_entry_point("researcher")
    graph.add_edge("researcher", "analyst")
    graph.add_edge("analyst", "news")
    graph.add_edge("news", "report_writer")
    graph.add_edge("report_writer", END)
    return graph.compile()

research_pipeline = build_research_pipeline()