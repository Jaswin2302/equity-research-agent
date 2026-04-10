import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import "./App.css";

const API = "http://localhost:8000";

const formatNumber = (n) => {
  if (!n) return "N/A";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};

const getRecommendation = (report) => {
  if (!report) return null;
  const text = report.toUpperCase();
  if (text.includes("BUY")) return "buy";
  if (text.includes("SELL")) return "sell";
  return "hold";
};

const LoadingSteps = () => {
  const steps = [
    "Fetching live market data...",
    "Running researcher agent...",
    "Analyzing financials...",
    "Summarizing news sentiment...",
    "Writing equity report...",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <div className="loading-text">Generating Research Report</div>
      <div className="loading-step">{steps[step]}</div>
    </div>
  );
};

export default function App() {
  const [ticker, setTicker] = useState("");
  const [stockData, setStockData] = useState(null);
  const [report, setReport] = useState(null);
  const [news, setNews] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("report");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const runResearch = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setStockData(null);
    setReport(null);
    setNews([]);
    setPriceHistory([]);
    setChatMessages([]);

    try {
      const [researchRes, historyRes] = await Promise.all([
        axios.post(`${API}/research`, { ticker: ticker.toUpperCase() }),
        axios.get(`${API}/stock/${ticker.toUpperCase()}/history?period=1y`),
      ]);

      setStockData(researchRes.data.stock_data);
      setReport(researchRes.data.report);
      setNews(researchRes.data.news || []);

      const history = historyRes.data.history.map((h) => ({
        date: h.Date?.slice(0, 10),
        price: parseFloat(h.Close?.toFixed(2)),
      }));
      setPriceHistory(history);
    } catch (err) {
      alert("Error fetching data. Check your ticker and try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !ticker) return;
    const question = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API}/chat`, {
        ticker: ticker.toUpperCase(),
        question,
      });
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error getting response. Try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const rec = getRecommendation(report);

  return (
    <div className="app">
      <nav className="navbar">
        <div>
          <div className="navbar-brand">⬡ EQUITAS</div>
          <div className="navbar-subtitle">AI-Powered Equity Research Terminal</div>
        </div>
        {stockData && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="ticker-badge">{stockData.ticker}</span>
            {rec && (
              <span className={`recommendation ${rec}`}>
                {rec.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </nav>

      <div className="main-content">
        <div className="search-section">
          <div className="search-title">Institutional Research. Instant.</div>
          <div className="search-subtitle">
            Enter any ticker to generate a full AI equity research report
          </div>
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="AAPL, TSLA, NVDA, JPM..."
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && runResearch()}
            />
            <button
              className="btn-primary"
              onClick={runResearch}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Run Research"}
            </button>
          </div>
        </div>

        {loading && <LoadingSteps />}

        {stockData && !loading && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Market Cap</div>
                <div className="stat-value">{formatNumber(stockData.market_cap)}</div>
                <div className="stat-sub">{stockData.sector}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Revenue (TTM)</div>
                <div className="stat-value">{formatNumber(stockData.revenue)}</div>
                <div className="stat-sub">{stockData.industry}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Net Income</div>
                <div className="stat-value">{formatNumber(stockData.net_income)}</div>
                <div className="stat-sub">Trailing 12 Months</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">P/E Ratio</div>
                <div className="stat-value">{stockData.pe_ratio?.toFixed(1) || "N/A"}</div>
                <div className="stat-sub">Price / Earnings</div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <div className="card-title">12-Month Price History</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                    <XAxis dataKey="date" tick={{ fill: "#4a5568", fontSize: 10 }} tickLine={false} interval={30} />
                    <YAxis tick={{ fill: "#4a5568", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0d1117", border: "1px solid #1e2433", borderRadius: "8px", color: "#e2e8f0" }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#00d4aa" strokeWidth={2} fill="url(#priceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-title">Key Metrics</div>
                <table className="comp-table">
                  <tbody>
                    {[
                      ["P/E Ratio", stockData.pe_ratio?.toFixed(2)],
                      ["P/B Ratio", stockData.pb_ratio?.toFixed(2)],
                      ["EV/EBITDA", stockData.ebitda ? formatNumber(stockData.ebitda) : "N/A"],
                      ["Debt / Equity", stockData.debt_to_equity?.toFixed(2)],
                      ["Return on Equity", stockData.roe ? `${(stockData.roe * 100).toFixed(1)}%` : "N/A"],
                      ["EBITDA", formatNumber(stockData.ebitda)],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ color: "#4a5568" }}>{label}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{value || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-full">
              <div style={{ display: "flex", gap: "24px", marginBottom: "24px", borderBottom: "1px solid #1e2433", paddingBottom: "16px" }}>
                {["report", "news", "chat"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: activeTab === tab ? "#00d4aa" : "#4a5568",
                      borderBottom: activeTab === tab ? "2px solid #00d4aa" : "2px solid transparent",
                      paddingBottom: "8px",
                    }}
                  >
                    {tab === "report" ? "AI Report" : tab === "news" ? "News" : "Ask Analyst"}
                  </button>
                ))}
              </div>

              {activeTab === "report" && (
                <div className="report-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                </div>
              )}

              {activeTab === "news" && (
                <div>
                  {news.slice(0, 8).map((item, i) => (
                    <div className="news-item" key={i}>
                      <div className="news-headline">{item.headline}</div>
                      {item.summary && <div className="news-summary">{item.summary}</div>}
                      {item.source && <div className="news-source">{item.source}</div>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "chat" && (
                <div className="chat-section">
                  <div className="chat-messages">
                    {chatMessages.length === 0 && (
                      <div style={{ color: "#4a5568", fontSize: "14px" }}>
                        Ask anything about {stockData.name}...
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`chat-message ${msg.role}`}>
                        <div className="message-label">
                          {msg.role === "user" ? "You" : "AI Analyst"}
                        </div>
                        <div className="message-bubble">{msg.content}</div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="chat-message assistant">
                        <div className="message-label">AI Analyst</div>
                        <div className="message-bubble">Analyzing...</div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="chat-input-row">
                    <input
                      className="chat-input"
                      placeholder="Is AAPL overvalued? What are the key risks?"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    />
                    <button className="btn-primary" onClick={sendChat} disabled={chatLoading}>
                      Ask
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!stockData && !loading && (
          <div className="empty-state">
            <div className="empty-title">No ticker selected</div>
            <div className="empty-subtitle">
              Search any stock above to generate an institutional-grade research report
            </div>
          </div>
        )}
      </div>
    </div>
  );
}