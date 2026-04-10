from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    ticker = Column(String, primary_key=True)
    name = Column(String)
    sector = Column(String)
    industry = Column(String)
    market_cap = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)

class FinancialSnapshot(Base):
    __tablename__ = "financial_snapshots"
    ticker = Column(String, primary_key=True)
    pe_ratio = Column(Float)
    pb_ratio = Column(Float)
    revenue = Column(Float)
    net_income = Column(Float)
    ebitda = Column(Float)
    debt_to_equity = Column(Float)
    roe = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)

class NewsItem(Base):
    __tablename__ = "news"
    id = Column(String, primary_key=True)
    ticker = Column(String)
    headline = Column(Text)
    summary = Column(Text)
    published_at = Column(DateTime)
    source = Column(String)