import { useState } from "react";

const STOCKS = ["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","SPY","QQQ","AMD","INTC","JPM","BAC","GS","V","MA","JNJ","PFE","XOM","CVX"];

const mockStockData = {
  AAPL:{price:211.45,beta:1.21,cap:"3.2T",div:0.44,iv:28.3,week52lo:164.08,week52hi:237.23,sector:"Tech"},
  MSFT:{price:415.20,beta:0.90,cap:"3.1T",div:0.75,iv:24.1,week52lo:344.79,week52hi:468.35,sector:"Tech"},
  NVDA:{price:875.60,beta:1.98,cap:"2.2T",div:0.01,iv:52.8,week52lo:460.30,week52hi:974.00,sector:"Tech"},
  AMZN:{price:198.30,beta:1.32,cap:"2.1T",div:0.00,iv:31.5,week52lo:151.61,week52hi:229.87,sector:"Consumer"},
  GOOGL:{price:175.80,beta:1.05,cap:"2.2T",div:0.00,iv:27.4,week52lo:130.67,week52hi:207.05,sector:"Tech"},
  META:{price:562.10,beta:1.28,cap:"1.4T",div:0.50,iv:35.2,week52lo:392.47,week52hi:638.40,sector:"Tech"},
  TSLA:{price:248.50,beta:2.31,cap:"794B",div:0.00,iv:68.4,week52lo:138.80,week52hi:488.54,sector:"Auto"},
  SPY:{price:554.80,beta:1.00,cap:"ETF",div:1.32,iv:17.2,week52lo:448.29,week52hi:613.23,sector:"ETF"},
  QQQ:{price:472.30,beta:1.10,cap:"ETF",div:0.58,iv:22.3,week52lo:360.56,week52hi:538.28,sector:"ETF"},
  AMD:{price:118.40,beta:1.87,cap:"192B",div:0.00,iv:48.6,week52lo:96.45,week52hi:227.30,sector:"Tech"},
  INTC:{price:22.10,beta:1.12,cap:"94B",div:0.00,iv:41.2,week52lo:18.51,week52hi:51.28,sector:"Tech"},
  JPM:{price:234.60,beta:0.98,cap:"668B",div:1.25,iv:22.8,week52lo:183.06,week52hi:263.80,sector:"Finance"},
  BAC:{price:43.20,beta:1.35,cap:"340B",div:0.24,iv:26.4,week52lo:33.05,week52hi:47.48,sector:"Finance"},
  GS:{price:538.40,beta:1.20,cap:"182B",div:3.00,iv:24.6,week52lo:396.68,week52hi:600.05,sector:"Finance"},
  V:{price:327.80,beta:0.95,cap:"665B",div:0.90,iv:19.3,week52lo:260.04,week52hi:354.14,sector:"Finance"},
  MA:{price:524.30,beta:1.00,cap:"488B",div:0.66,iv:20.1,week52lo:417.08,week52hi:573.69,sector:"Finance"},
  JNJ:{price:158.20,beta:0.55,cap:"379B",div:1.24,iv:15.8,week52lo:143.13,week52hi:168.85,sector:"Health"},
  PFE:{price:26.40,beta:0.62,cap:"150B",div:0.42,iv:28.5,week52lo:21.17,week52hi:31.32,sector:"Health"},
  XOM:{price:113.80,beta:0.98,cap:"455B",div:0.99,iv:21.4,week52lo:95.77,week52hi:123.75,sector:"Energy"},
  CVX:{price:155.30,beta:0.92,cap:"288B",div:1.63,iv:19.8,week52lo:135.37,week52hi:170.27,sector:"Energy"},
};

function generateStrikes(price, type) {
  const strikes = [];
  for (let i = -6; i <= 6; i++) {
    const strike = Math.round(price * (1 + i * 0.025) * 2) / 2;
    const otmPct = type === "PUT" ? ((price - strike) / price * 100) : ((strike - price) / price * 100);
    const isOTM = otmPct >= 0;
    const delta = type === "PUT"
      ? -(0.5 * Math.exp(-Math.abs(otmPct) * 0.08)).toFixed(2)
      : (0.5 * Math.exp(-Math.abs(otmPct) * 0.08)).toFixed(2);
    const iv = parseFloat((20 + Math.abs(otmPct) * 1.5 + Math.random() * 3).toFixed(1));
    const premium = parseFloat((price * 0.02 * Math.exp(-Math.abs(otmPct) * 0.06) * (1 + Math.random() * 0.2)).toFixed(2));
    const annReturn = parseFloat(((premium / strike) * (365 / 30) * 100).toFixed(1));
    if (strike > 0) strikes.push({ strike, delta, iv, premium, annReturn, otmPct: otmPct.toFixed(1), isOTM, dte: 30 });
  }
  return strikes;
}

function scoreOption(stock, opt, type) {
  let s = 0;
  if (stock.beta < 1.2) s += 20; else if (stock.beta < 1.5) s += 10;
  if (stock.div > 0) s += 10;
  const pos52 = (stock.price - stock.week52lo) / (stock.week52hi - stock.week52lo);
  if (type === "PUT" && pos52 > 0.4) s += 10;
  if (type === "CALL" && pos52 < 0.7) s += 10;
  if (Math.abs(parseFloat(opt.delta)) >= 0.25 && Math.abs(parseFloat(opt.delta)) <= 0.40) s += 20;
  if (opt.iv >= 20 && opt.iv <= 45) s += 15;
  if (opt.annReturn >= 15 && opt.annReturn <= 40) s += 15;
  if (opt.isOTM) s += 10;
  return Math.min(s, 100);
}

const C = {
  green: "#00e5a0", amber: "#f5a623", red: "#ff4d4d", blue: "#4d9fff",
  bg: "#090d14", surface: "#0f1520", border: "#1e2d42", text: "#c8d8eb", muted: "#4a637d"
};

const Tag = ({ color, children }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>{children}</span>
);

const ScoreBadge = ({ score }) => {
  const color = score >= 70 ? C.green : score >= 45 ? C.amber : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color, fontFamily: "monospace" }}>{score}</div>
      <div style={{ width: 60, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
};

export default function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [input, setInput] = useState("AAPL");
  const [optType, setOptType] = useState("PUT");
  const [tab, setTab] = useState("analyze");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [screenResults, setScreenResults] = useState([]);
  const [screenLoading, setScreenLoading] = useState(false);
  const [screenDone, setScreenDone] = useState(false);
  const [error, setError] = useState("");

  const stock = mockStockData[ticker] || mockStockData["AAPL"];
  const strikes = generateStrikes(stock.price, optType);
  const scored = strikes.map(s => ({ ...s, score: scoreOption(stock, s, optType) })).sort((a, b) => b.score - a.score);
  const best = scored[0];
  const pos52 = ((stock.price - stock.week52lo) / (stock.week52hi - stock.week52lo) * 100).toFixed(0);

  const handleAnalyze = () => {
    const t = input.toUpperCase().trim();
    if (mockStockData[t]) { setTicker(t); setAiAnalysis(""); setScreenDone(false); setError(""); }
    else setError(`"${t}" not found. Try: ${Object.keys(mockStockData).join(", ")}`);
  };

  const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const callClaude = async (prompt, maxTokens = 800) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || "";
  };

  const runAI = async () => {
    if (!ANTHROPIC_KEY) { setError("Add VITE_ANTHROPIC_API_KEY to your Vercel environment variables."); return; }
    setAiLoading(true); setAiAnalysis(""); setError("");
    try {
      const text = await callClaude(
        `You are an expert options trader. Analyze ${ticker} for ${optType} options selling.
Stock: Price $${stock.price}, Beta ${stock.beta}, Market Cap ${stock.cap}, Div $${stock.div}/qtr, IV ${stock.iv}%, 52wk $${stock.week52lo}-$${stock.week52hi}, Sector ${stock.sector}.
Best strike: $${best?.strike} (${best?.otmPct}% OTM), Premium $${best?.premium}, Delta ${best?.delta}, Ann Return ${best?.annReturn}%.
Provide: 1) 2-sentence market outlook for ${ticker}. 2) Whether this ${optType} trade makes sense now and why. 3) Key risks. 4) One actionable trade setup. Be concise and direct.`
      );
      setAiAnalysis(text);
    } catch (e) { setError("AI error: " + e.message); }
    setAiLoading(false);
  };

  const runScreener = async () => {
    setScreenLoading(true); setScreenDone(false); setScreenResults([]); setAiAnalysis(""); setError("");
    const results = STOCKS.map(sym => {
      const s = mockStockData[sym];
      const opts = generateStrikes(s.price, optType);
      const b = opts.map(o => ({ ...o, score: scoreOption(s, o, optType) })).sort((a, b) => b.score - a.score)[0];
      return { sym, ...s, best: b, overallScore: b ? scoreOption(s, b, optType) : 0 };
    }).sort((a, b) => b.overallScore - a.overallScore).slice(0, 10);
    setScreenResults(results);
    if (ANTHROPIC_KEY) {
      try {
        const top3 = results.slice(0, 3).map(r => `${r.sym} ($${r.best?.strike} strike, score ${r.overallScore}/100)`).join(", ");
        const text = await callClaude(
          `Top 3 ${optType} selling candidates: ${top3}. Give 2 sentences of market context for why these score well for ${optType === "PUT" ? "cash-secured put" : "covered call"} selling right now. Be direct.`, 300
        );
        setAiAnalysis(text);
      } catch (e) {}
    }
    setScreenLoading(false); setScreenDone(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono',monospace", overflowX: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(${C.border}18 1px,transparent 1px),linear-gradient(90deg,${C.border}18 1px,transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: C.surface, position: "relative", zIndex: 1 }}>
        <div style={{ width: 30, height: 30, borderRadius: 6, background: `linear-gradient(135deg,${C.green},#00a3ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>OptionEdge</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2 }}>AI-POWERED OPTIONS ANALYZER</div>
        </div>
        <div style={{ flex: 1 }} />
        <Tag color={C.green}>20 STOCKS</Tag>
        <Tag color={C.blue}>CLAUDE AI</Tag>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px", position: "relative", zIndex: 1 }}>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 2, background: C.surface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {[["analyze", "📊 Stock"], ["screen", "🔍 Screener"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: tab === k ? C.green : "transparent", color: tab === k ? "#000" : C.muted, fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 2, background: C.surface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {["PUT", "CALL"].map(t => (
              <button key={t} onClick={() => { setOptType(t); setAiAnalysis(""); setScreenDone(false); setScreenResults([]); }} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: optType === t ? (t === "PUT" ? C.amber : C.blue) : "transparent", color: optType === t ? "#000" : C.muted, fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>
                {t === "PUT" ? "📉 PUTS" : "📈 CALLS"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: C.red + "18", border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: C.red }}>{error}</div>
        )}

        {tab === "analyze" && <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={input} onChange={e => setInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && handleAnalyze()} placeholder="Ticker (AAPL, TSLA...)" style={{ flex: 1, padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", fontSize: 13, outline: "none" }} />
            <button onClick={handleAnalyze} style={{ padding: "10px 20px", background: C.green, color: "#000", border: "none", borderRadius: 8, fontWeight: 800, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>ANALYZE</button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
            {["AAPL","MSFT","NVDA","AMZN","SPY","TSLA","META","AMD","JPM","GS"].map(t => (
              <button key={t} onClick={() => { setInput(t); setTicker(t); setAiAnalysis(""); setError(""); }} style={{ padding: "3px 10px", background: ticker === t ? C.green + "22" : C.surface, border: `1px solid ${ticker === t ? C.green : C.border}`, borderRadius: 5, color: ticker === t ? C.green : C.muted, fontFamily: "inherit", fontSize: 11, cursor: "pointer", fontWeight: ticker === t ? 700 : 400 }}>{t}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { l: "PRICE", v: `$${stock.price}`, c: C.green },
              { l: "BETA", v: stock.beta, c: stock.beta > 1.5 ? C.red : stock.beta > 1.2 ? C.amber : C.green },
              { l: "IV RANK", v: `${stock.iv}%`, c: stock.iv > 40 ? C.green : stock.iv > 25 ? C.amber : C.muted },
              { l: "52WK POS", v: `${pos52}%`, c: "#fff" }
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 5 }}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 8 }}>
              <span>52W LOW ${stock.week52lo}</span>
              <span style={{ color: C.green, fontWeight: 700 }}>{ticker} · {stock.sector} · {stock.cap}</span>
              <span>52W HIGH ${stock.week52hi}</span>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 3, position: "relative" }}>
              <div style={{ position: "absolute", left: `${pos52}%`, top: -4, width: 12, height: 12, borderRadius: "50%", background: C.green, transform: "translateX(-50%)", border: `2px solid ${C.bg}` }} />
              <div style={{ width: `${pos52}%`, height: "100%", background: `linear-gradient(90deg,${C.red}44,${C.green}44)`, borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{optType} CHAIN — {ticker} — 30 DTE</span>
              <Tag color={optType === "PUT" ? C.amber : C.blue}>{optType === "PUT" ? "CASH-SECURED PUT" : "COVERED CALL"}</Tag>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {["SCORE","STRIKE","OTM%","DELTA","IV%","PREMIUM","ANN RTN","TAG"].map(h => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: C.muted, fontWeight: 700, letterSpacing: 1, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scored.map((opt, i) => (
                    <tr key={opt.strike} style={{ borderBottom: `1px solid ${C.border}22`, background: i === 0 ? C.green + "08" : "transparent" }}>
                      <td style={{ padding: "9px 12px" }}><ScoreBadge score={opt.score} /></td>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#fff" }}>${opt.strike}</td>
                      <td style={{ padding: "9px 12px", color: opt.isOTM ? C.green : C.red }}>{opt.isOTM ? "-" : "+"}{Math.abs(opt.otmPct)}%</td>
                      <td style={{ padding: "9px 12px", color: C.muted }}>{opt.delta}</td>
                      <td style={{ padding: "9px 12px", color: opt.iv > 35 ? C.amber : C.text }}>{opt.iv}%</td>
                      <td style={{ padding: "9px 12px", color: C.green, fontWeight: 700 }}>${opt.premium}</td>
                      <td style={{ padding: "9px 12px", color: opt.annReturn >= 20 ? C.green : C.text, fontWeight: 700 }}>{opt.annReturn}%</td>
                      <td style={{ padding: "9px 12px" }}>
                        {i === 0 && <Tag color={C.green}>⭐ BEST</Tag>}
                        {i === 1 && <Tag color={C.amber}>ALT</Tag>}
                        {!opt.isOTM && <Tag color={C.red}>ITM</Tag>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>🤖 AI TRADE ANALYSIS</span>
              <button onClick={runAI} disabled={aiLoading} style={{ padding: "7px 18px", background: aiLoading ? C.muted : C.blue, color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontFamily: "inherit", fontSize: 11, cursor: aiLoading ? "not-allowed" : "pointer" }}>
                {aiLoading ? "ANALYZING..." : "RUN ANALYSIS"}
              </button>
            </div>
            <div style={{ padding: 18 }}>
              {!aiAnalysis && !aiLoading && <div style={{ color: C.muted, fontSize: 12 }}>Click "Run Analysis" for Claude AI's assessment of this {optType} opportunity on {ticker}.</div>}
              {aiLoading && (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                  <span style={{ color: C.muted, fontSize: 12, marginLeft: 4 }}>Analyzing market conditions...</span>
                </div>
              )}
              {aiAnalysis && <div style={{ color: C.text, fontSize: 12, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>}
            </div>
          </div>
        </>}

        {tab === "screen" && <>
          <button onClick={runScreener} disabled={screenLoading} style={{ padding: "11px 24px", background: screenLoading ? C.muted : C.green, color: "#000", border: "none", borderRadius: 8, fontWeight: 800, fontFamily: "inherit", fontSize: 13, cursor: screenLoading ? "not-allowed" : "pointer", marginBottom: 20 }}>
            {screenLoading ? `⚡ SCANNING ${STOCKS.length} STOCKS...` : `🔍 SCREEN TOP ${optType} OPPORTUNITIES`}
          </button>

          {!screenDone && !screenLoading && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center", color: C.muted }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
              <div style={{ fontSize: 13 }}>Scan {STOCKS.length} stocks for top 10 {optType} selling opportunities</div>
            </div>
          )}

          {screenLoading && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>SCANNING MARKETS...</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 14 }}>
                {[0,1,2,3,4].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}

          {screenDone && screenResults.length > 0 && <>
            {aiAnalysis && (
              <div style={{ background: C.green + "0f", border: `1px solid ${C.green}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 16, fontSize: 12, color: C.text, lineHeight: 1.8 }}>
                <span style={{ color: C.green, fontWeight: 700 }}>🤖 AI CONTEXT: </span>{aiAnalysis}
              </div>
            )}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>TOP 10 {optType} OPPORTUNITIES</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {["#","STOCK","SCORE","PRICE","STRIKE","OTM%","PREMIUM","ANN RTN","BETA","IV","SECTOR"].map(h => (
                        <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: C.muted, fontWeight: 700, letterSpacing: 1, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {screenResults.map((r, i) => (
                      <tr key={r.sym}
                        onClick={() => { setTicker(r.sym); setInput(r.sym); setTab("analyze"); setAiAnalysis(""); }}
                        style={{ borderBottom: `1px solid ${C.border}22`, cursor: "pointer", background: i === 0 ? C.green + "10" : "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.background = C.green + "08"}
                        onMouseLeave={e => e.currentTarget.style.background = i === 0 ? C.green + "10" : "transparent"}>
                        <td style={{ padding: "9px 12px", color: C.muted, fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 800, color: i === 0 ? C.green : "#fff" }}>{r.sym}{i === 0 ? " ⭐" : ""}</td>
                        <td style={{ padding: "9px 12px" }}><ScoreBadge score={r.overallScore} /></td>
                        <td style={{ padding: "9px 12px" }}>${r.price}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: "#fff" }}>${r.best?.strike}</td>
                        <td style={{ padding: "9px 12px", color: C.green }}>{r.best?.otmPct}%</td>
                        <td style={{ padding: "9px 12px", color: C.green, fontWeight: 700 }}>${r.best?.premium}</td>
                        <td style={{ padding: "9px 12px", color: r.best?.annReturn >= 20 ? C.green : C.text, fontWeight: 700 }}>{r.best?.annReturn}%</td>
                        <td style={{ padding: "9px 12px", color: r.beta > 1.5 ? C.red : C.text }}>{r.beta}</td>
                        <td style={{ padding: "9px 12px", color: r.iv > 35 ? C.amber : C.muted }}>{r.iv}%</td>
                        <td style={{ padding: "9px 12px" }}><Tag color={C.muted}>{r.sector}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "8px 18px", borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted }}>Click any row to analyze in detail →</div>
            </div>
          </>}
        </>}

        <div style={{ marginTop: 24, padding: "14px 18px", borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted, lineHeight: 1.7 }}>
          ⚠️ OptionEdge is for educational purposes only. Options trading involves substantial risk of loss. Past performance does not guarantee future results. Always consult a qualified financial advisor.
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }
        * { box-sizing: border-box; }
        input::placeholder { color: ${C.muted}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      `}</style>
    </div>
  );
}
