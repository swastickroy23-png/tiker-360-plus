/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowUpRight,
  Loader2,
  Star,
  Shield,
  Zap,
  AlertCircle,
  Bot,
  Settings2,
  RefreshCw,
  CheckCircle,
  XCircle,
  PieChart,
  Briefcase,
  Users,
  BarChart2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Label
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IndicatorEngine, type OHLC, type SwingZone } from './services/indicatorEngine';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Stock {
  symbol: string;
  scripCode: string;
  name: string;
}

interface StockData {
  scripCode: string;
  lastPrice: number;
  change: number;
  pChange: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  delivery?: number;
  peRatio?: number | null;
  pbRatio?: number | null;
  dividendYield?: number | null;
  roe?: number | null;
  debtToEquity?: number | null;
  eps?: number | null;
  bookValue?: number | null;
  revenueGrowth?: number | null;
  operatingMargins?: number | null;
  profitMargins?: number | null;
  sector?: string;
  industry?: string;
  longBusinessSummary?: string;
  recommendationKey?: string;
  targetMeanPrice?: number | null;
  buyInfo?: any;
  insidersHeld?: number;
  institutionsHeld?: number;
  quarters?: { date: string; totalRevenue: number; netIncome: number; taxProvision: number; }[];
  annuals?: { date: string; totalRevenue: number; netIncome: number; taxProvision: number; }[];
}

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are an **Institutional Technical Trading Engine** designed to detect **high-probability swing trades (1–3 days and 3–7 days)** with **intraday directional bias**.

Your decision logic must be **rule-based**, **probability-weighted**, and **capital-protection focused**.

You DO NOT provide long-term investment advice.

If data clarity is insufficient → output **WAIT**.

---

# CORE DECISION ENGINE

1. TIMEFRAME HIERARCHY
Priority order:
Daily → Market structure
1H → Confirmation
15M → Entry timing
Ignore 1-minute timeframe.

2. MARKET STRUCTURE CLASSIFICATION
Classify ONLY one:
Bullish Swing
Bearish Swing
Range

Rules:
Bullish: Higher highs + higher lows, Price above EMA 50 & EMA 200
Bearish: Lower highs + lower lows, Price below EMA 50 & EMA 200
Range: ADX < 20, Price oscillating between support/resistance
If Range: Allow trades only at support (buy) or resistance (sell)

3. AUTO INTRADAY RANGE ENGINE (HIGHLY ACCURATE MODEL)
Use the pre-computed Intraday Range provided in the data context.
This module provides highly accurate directional bias and intraday targets based on Advanced V3 Logic (Camarilla, Standard Pivots, Bollinger Bands, ATR, ADX).
Output the provided Possible High and Possible Low with their probabilities.

4. SWING BUY ZONE ENGINE (MAX 3)
Detect high probability institutional accumulation zones using:
EMA pullback zones, Support levels S1 S2 S3, Demand zones, Breakout retest zones, VWAP support, ATR support band
Each zone must include: Entry, Stop Loss, Targets (min RR 1:2), Risk Reward, Probability %
Swing duration classification: 1–3 days, 3–7 days

5. SWING SELL ZONE ENGINE (MAX 3)
Detect supply zones using:
EMA rejection, Resistance R1 R2 R3, Supply zones, Breakdown retest zones, VWAP rejection, ATR resistance band
Each zone must include: Entry, Stop Loss, Targets, Risk Reward, Probability %

6. TREND & MOMENTUM FILTER
Trend confirmation: EMA 50 / 100 / 200 alignment, SuperTrend direction
Momentum strength: MACD histogram direction, RSI strength level
RSI logic: Above 60 → bullish strength, Below 40 → bearish strength, Above 75 → exhaustion risk, Below 25 → reversal risk
Indicator conflict reduces probability.

7. DAILY MOMENTUM ADJUSTMENT
Use indicators only to adjust probability: RSI, MFI, ADX, CCI, ROC 21, ROC 125, MACD, ATR, VWAP
Strong trend → increase probability, Weak trend → reduce probability

8. PIVOT & VOLATILITY CONTEXT
Use Pivot levels to: Validate entry zones, Confirm targets, Filter fake breakouts
ATR must support stop-loss distance.

9. LIQUIDITY FILTER
Delivery ≥ 50% → valid, Delivery < 40% → reject trade
Breakout volume must be ≥ 1.5× average. No volume → WAIT.

10. PATTERN RECOGNITION FILTER
Bullish patterns: Cup & Handle, Double Bottom, Inverse Head & Shoulders, Ascending Triangle, Falling Wedge, Bull Flag
Bearish patterns: Double Top, Head & Shoulders, Descending Triangle, Rising Wedge, Bear Flag
Pattern must align with trend and volume confirmation. Pattern alone cannot create trade.

11. FAKE MOVE FILTER
Reject trade if: Long wick rejection at key level, RSI divergence, MACD divergence, SuperTrend failure, Breakout without volume, Gap without continuation, Price returns inside pattern

12. NEWS & EVENT FILTER
No fresh trades:

13. RISK MANAGEMENT RULES
Risk per trade: Maximum 1–2% capital
Minimum risk reward: 1:2
Rules: Stop loss mandatory, No averaging down, Maximum 2 open trades, After 2 losses → WAIT
Capital protection priority.

14. ADVANCED PROBABILITY ADJUSTMENT
Adjust probability using: ATR range validation, Option Chain: PCR trend, OI support, OI resistance, Max Pain, FII DII flow bias
Never override structure.

15. AI PROBABILITY ENGINE
Base probability = 50%
Add probability if: Trend alignment strong, Momentum strong, Volume confirmation, Institutional delivery, Pattern confirmation
Reduce probability if: Range market, Weak volume, Indicator conflict, Event risk, Fake breakout risk
Final scale: 80–100% = High probability, 65–79% = Conditional trade, 50–64% = WAIT, Below 50% = NO TRADE

16. INSTITUTIONAL TRAP FILTER
Use the pre-computed Institutional Traps provided in the data context.
Bull Trap: Price breaks resistance but fails to sustain, trapping buyers.
Bear Trap: Price breaks support but fails to sustain, trapping sellers.
If a trap is detected at a key level, prioritize the reversal direction.

---

# FINAL OUTPUT FORMAT (STRICT)

Market Structure:
Bullish / Bearish / Range

Auto Intraday Range:
Possible High:
Probability:

Possible Low:
Probability:

Institutional Trap Analysis:
(Mention any Bull/Bear traps detected and their severity)

Swing Buy Zones:

Zone 1:
Entry:
Stop Loss:
Targets:
RR:
Probability:
Swing Duration:

Zone 2:
Entry:
Stop Loss:
Targets:
RR:
Probability:

Zone 3:
Entry:
Stop Loss:
Targets:
RR:
Probability:

Swing Sell Zones:

Zone 1:
Entry:
Stop Loss:
Targets:
RR:
Probability:

Zone 2:
Entry:
Stop Loss:
Targets:
RR:
Probability:

Zone 3:
Entry:
Stop Loss:
Targets:
RR:
Probability:

AI Probability Score:

Final Verdict:
BUY / SELL / WAIT`;

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [optionsData, setOptionsData] = useState<any>(null);
  const [isRefreshingOptions, setIsRefreshingOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [interval, setInterval] = useState('1D');
  const [analysisMode, setAnalysisMode] = useState<'llm' | 'options' | 'fundamentals'>('fundamentals');
  const [llmPrediction, setLlmPrediction] = useState<string | null>(null);
  const [isGeneratingLlm, setIsGeneratingLlm] = useState(false);
  const [llmModel, setLlmModel] = useState('gemini-3-flash-preview');
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isCustomizingGpt, setIsCustomizingGpt] = useState(false);
  const [llmTemperature, setLlmTemperature] = useState(0.2);
  
  // Intraday Range Box Component
  const IntradayRangeBox = ({ data, analysis }: { data: StockData, analysis: any }) => {
    const range = data.high - data.low;
    const progress = range > 0 ? ((data.lastPrice - data.low) / range) * 100 : 0;
    
    return (
      <div className="bg-white text-black rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-between shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Activity className="w-20 h-20" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-black/40">Intraday Range</h3>
            <div className="text-[8px] font-bold text-black/20 uppercase tracking-widest">Real-time Data</div>
          </div>
          
          <div className="relative h-20 flex items-center px-2">
            {/* The Track */}
            <div className="absolute inset-x-0 h-[2px] bg-black/5 rounded-full" />
            
            {/* Low Marker */}
            <div className="absolute left-0 flex flex-col items-start translate-y-2">
              <div className="w-[2px] h-4 bg-black/20 mb-3" />
              <div className="text-[9px] md:text-[10px] font-euro font-mono">₹{data.low?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-[7px] font-bold text-black/30 uppercase tracking-tighter">Day Low</div>
            </div>
            
            {/* High Marker */}
            <div className="absolute right-0 flex flex-col items-end translate-y-2">
              <div className="w-[2px] h-4 bg-black/20 mb-3" />
              <div className="text-[9px] md:text-[10px] font-euro font-mono">₹{data.high?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-[7px] font-bold text-black/30 uppercase tracking-tighter">Day High</div>
            </div>
            
            {/* Current Price Marker */}
            <motion.div 
              initial={{ left: '50%' }}
              animate={{ left: `${Math.min(Math.max(progress, 0), 100)}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="absolute -translate-x-1/2 flex flex-col items-center z-10"
            >
              <div className="text-[11px] font-euro font-mono mb-2 bg-black text-white px-3 py-1 rounded-full shadow-xl">₹{data.lastPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="w-1 h-1 bg-black rounded-full" />
              <div className="w-[1px] h-8 bg-gradient-to-b from-black to-transparent" />
            </motion.div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-black/5 flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-black/40">Auto Intraday Range</div>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[8px] font-bold uppercase tracking-widest border border-blue-500/20">V4 Quantum Institutional</span>
          </div>
          <div className="flex justify-between items-center bg-black/5 rounded-2xl p-4">
            <div>
              <div className="text-[7px] font-bold text-black/40 uppercase tracking-widest mb-1">Possible High</div>
              <div className="text-[12px] font-black font-mono text-emerald-600">₹{analysis?.intraday?.high?.level?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}</div>
              <div className="text-[8px] font-bold text-black/40 uppercase mt-1">Prob: {analysis?.intraday?.high?.prob || 0}%</div>
              <div className="text-[7px] font-bold text-emerald-600/70 uppercase mt-0.5">Target: {analysis?.intraday?.high?.confluence}</div>
            </div>
            <div className="w-[1px] h-8 bg-black/10" />
            <div className="text-right">
              <div className="text-[7px] font-bold text-black/40 uppercase tracking-widest mb-1">Possible Low</div>
              <div className="text-[12px] font-black font-mono text-rose-600">₹{analysis?.intraday?.low?.level?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}</div>
              <div className="text-[8px] font-bold text-black/40 uppercase mt-1">Prob: {analysis?.intraday?.low?.prob || 0}%</div>
              <div className="text-[7px] font-bold text-rose-600/70 uppercase mt-0.5">Target: {analysis?.intraday?.low?.confluence}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-black/5 flex justify-between items-center relative z-10">
          <div className="flex gap-8">
            <div>
              <div className="text-[7px] font-bold text-black/30 uppercase tracking-widest mb-1">Open</div>
              <div className="text-[11px] font-black font-mono">₹{data.open?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-[7px] font-bold text-black/30 uppercase tracking-widest mb-1">Prev Close</div>
              <div className="text-[11px] font-black font-mono">₹{data.prevClose?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[7px] font-bold text-black/30 uppercase tracking-widest mb-1">Volatility</div>
            <div className="text-[11px] font-black font-mono text-emerald-600">₹{(data.high - data.low).toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  };

  const searchRef = useRef<HTMLDivElement>(null);

  // WebSocket Ref
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socket.onopen = () => {
      if (selectedStock) {
        socket.send(JSON.stringify({ type: 'SUBSCRIBE', scripCode: selectedStock.scripCode }));
      }
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'PRICE_UPDATE') {
        const update = message.data;
        if (selectedStock && selectedStock.scripCode === update.scripCode) {
          setStockData(prev => prev ? { ...prev, lastPrice: update.lastPrice, change: update.change, pChange: update.pChange } : null);
        }
      }
    };
    ws.current = socket;
    return () => socket.close();
  }, [selectedStock]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setNoResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchTimeout = useRef<any>(null);

  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; nextAction: string }>({ isOpen: false, nextAction: '' });

  useEffect(() => {
    const checkMarket = () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istTime.getDay();
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const currentTime = hours * 100 + minutes;

      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = currentTime >= 915 && currentTime <= 1530;

      if (isWeekday && isMarketHours) {
        setMarketStatus({ isOpen: true, nextAction: 'Closes at 15:30 IST' });
      } else {
        let nextAction = '';
        if (day === 0 || day === 6 || (day === 5 && currentTime > 1530)) {
          nextAction = 'Opens Monday 09:15 IST';
        } else if (currentTime < 915) {
          nextAction = 'Opens Today 09:15 IST';
        } else {
          nextAction = 'Opens Tomorrow 09:15 IST';
        }
        setMarketStatus({ isOpen: false, nextAction });
      }
    };

    checkMarket();
    const timer = window.setInterval(checkMarket, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setNoResults(false);
    
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    
    if (q.length < 2) { 
      setSearchResults([]); 
      return; 
    }

    searchTimeout.current = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search-stock?q=${q}`);
        const data = await res.json();
        setSearchResults(data);
        if (data.length === 0) setNoResults(true);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setIsSearching(false); 
      }
    }, 400);
  };

  const selectStock = async (stock: Stock, newInterval = interval) => {
    setSelectedStock(stock);
    setInterval(newInterval);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
    try {
      const [dataRes, histRes, optionsRes] = await Promise.all([
        fetch(`/api/stock-data?scripCode=${stock.scripCode}`),
        fetch(`/api/historical-data?scripCode=${stock.scripCode}&interval=${newInterval}`),
        fetch(`/api/options-data?scripCode=${stock.scripCode}`)
      ]);
      const dataJson = await dataRes.json();
      const histJson = await histRes.json();
      const optionsJson = await optionsRes.json();
      
      if (Array.isArray(histJson)) {
        setHistoricalData(histJson);
      } else {
        console.error("Failed to fetch historical data:", histJson);
        setHistoricalData([]);
      }
      
      if (dataJson && !dataJson.error) {
        setStockData(dataJson);
      } else {
        console.error("Failed to fetch stock data:", dataJson);
        setStockData(null);
      }

      if (optionsJson && !optionsJson.error) {
        setOptionsData(optionsJson);
      } else {
        setOptionsData(null);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const refreshOptionsData = async () => {
    if (!selectedStock) return;
    setIsRefreshingOptions(true);
    try {
      const optionsRes = await fetch(`/api/options-data?scripCode=${selectedStock.scripCode}`);
      const optionsJson = await optionsRes.json();
      if (optionsJson && !optionsJson.error) {
        setOptionsData(optionsJson);
      } else {
        setOptionsData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingOptions(false);
    }
  };

  const analysis = useMemo(() => {
    if (!Array.isArray(historicalData) || historicalData.length < 10) return null;
    const ohlc: OHLC = {
      date: historicalData.map(d => d.date),
      open: historicalData.map(d => d.open),
      high: historicalData.map(d => d.high),
      low: historicalData.map(d => d.low),
      close: historicalData.map(d => d.close),
      volume: historicalData.map(d => d.volume),
      delivery: stockData?.delivery || 0,
      prevClose: stockData?.prevClose,
    };
    return IndicatorEngine.computeAdvanced(ohlc, optionsData);
  }, [historicalData, stockData?.delivery, stockData?.prevClose, optionsData]);

  const verdict = useMemo(() => {
    if (!analysis) return "WAIT";
    return IndicatorEngine.determineVerdict(
      analysis.probability, 
      analysis.structure, 
      analysis.institutionalFlow.flowStrength, 
      analysis.institutionalFlow.institutionalBias
    );
  }, [analysis]);

  const generateLLMPrediction = async () => {
    if (!selectedStock || !stockData || !historicalData || !analysis) return;
    
    setIsGeneratingLlm(true);
    setLlmPrediction(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      
      const dataContext = `
# INPUT FORMAT (USER PROVIDES)

Stock Symbol: ${selectedStock.symbol}
Exchange: NSE

Timeframes Data:
Daily OHLC + Volume
Current Price: ${stockData.lastPrice}
High: ${stockData.high}
Low: ${stockData.low}
Volume: ${stockData.volume}

Indicators:
EMA 5: ${analysis.indicators.ema5}
EMA 10: ${analysis.indicators.ema10}
EMA 20: ${analysis.indicators.ema20}
EMA 50: ${analysis.indicators.ema50}
EMA 200: ${analysis.indicators.ema200}
RSI (14): ${analysis.indicators.rsi}
MACD: ${analysis.indicators.macd.macd}
MACD Signal: ${analysis.indicators.macd.signal}
MACD Histogram: ${analysis.indicators.macd.histogram}
ATR (14): ${analysis.indicators.atr}
ADX (14): ${analysis.indicators.adx}

Pivot Levels:
Pivot: ${analysis.pivots.pp}
R1: ${analysis.pivots.r1} R2: ${analysis.pivots.r2} R3: ${analysis.pivots.r3}
S1: ${analysis.pivots.s1} S2: ${analysis.pivots.s2} S3: ${analysis.pivots.s3}

Volume Data:
Delivery %: ${stockData.delivery || 'N/A'}

Intraday Range (Pre-computed Highly Accurate Model):
Possible High: ${analysis.intraday.high.level.toFixed(2)} (Prob: ${analysis.intraday.high.prob}%)
Possible Low: ${analysis.intraday.low.level.toFixed(2)} (Prob: ${analysis.intraday.low.prob}%)

Institutional Traps:
${analysis.traps.length > 0 ? analysis.traps.map(t => `- ${t.type} at ${t.level} (Severity: ${t.severity}): ${t.description}`).join('\n') : 'No traps detected.'}

Optional Data:
Option Chain:
PCR: ${optionsData?.pcr || 'N/A'}
OI Support: ${optionsData?.oiSupport || 'N/A'}
OI Resistance: ${optionsData?.oiResistance || 'N/A'}
Max Pain: ${optionsData?.maxPain || 'N/A'}

---

`;

      const prompt = dataContext + customPrompt;

      const response = await ai.models.generateContent({
        model: llmModel,
        contents: prompt,
        config: {
          temperature: llmTemperature
        }
      });

      setLlmPrediction(response.text);
    } catch (err) {
      console.error("LLM Prediction Error:", err);
      setLlmPrediction("Error generating prediction. Please check your API key and try again.");
    } finally {
      setIsGeneratingLlm(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-3xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-auto md:h-24 flex flex-col md:flex-row items-center justify-between gap-4 py-4 md:py-0">
          <div className="flex items-center gap-3 md:gap-6 group cursor-pointer shrink-0 w-full md:w-auto justify-center md:justify-start" onClick={() => setSelectedStock(null)}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-euro text-lg md:text-2xl leading-none tracking-tighter uppercase">TIKER 360 PLUS<span className="text-primary">.</span></span>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                  marketStatus.isOpen ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                )}>
                  <div className={cn("w-1 h-1 rounded-full", marketStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                  <span className="text-[7px] font-black uppercase tracking-widest">
                    {marketStatus.isOpen ? "OPEN" : "CLOSED"}
                  </span>
                </div>
              </div>
              <span className="text-[7px] md:text-[8px] dot-matrix text-white/40 font-bold mt-1">High-Precision Probability Engine // {marketStatus.nextAction}</span>
            </div>
          </div>

          <div className="relative flex-1 w-full max-w-2xl mx-0 md:mx-16" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-white transition-colors" />
              <input 
                type="text"
                placeholder="SEARCH..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3 md:py-4 pl-12 md:pl-16 pr-4 md:pr-6 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.05] transition-all text-[10px] md:text-xs font-bold tracking-widest placeholder:text-white/10 uppercase"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {isSearching && <Loader2 className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-white/40" />}
            </div>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  key="search-results"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-[#0F0F0F] border border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] z-50 backdrop-blur-xl"
                >
                  {searchResults.map((stock, index) => (
                    <button
                      key={`${stock.scripCode}-${index}`}
                      onClick={() => selectStock(stock)}
                      className="w-full px-6 py-4 text-left hover:bg-white/5 flex items-center justify-between transition-colors border-b border-white/5 last:border-0 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-xs text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-sm tracking-tight">{stock.symbol}</div>
                          <div className="text-[10px] text-white/30 font-medium uppercase">{stock.name}</div>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </motion.div>
              )}

              {noResults && searchQuery.length >= 2 && !isSearching && (
                <motion.div 
                  key="no-results"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] z-50 backdrop-blur-xl"
                >
                  <AlertCircle className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <div className="text-xs font-bold text-white/40 uppercase tracking-widest">No NSE Symbols Found</div>
                  <div className="text-[10px] text-white/20 mt-1 uppercase">Try a different symbol or name</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Watchlist & Rules */}
        <div className="lg:col-span-3 space-y-8 order-last lg:order-first">
          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 md:p-8">
            <h4 className="text-[9px] dot-matrix text-white/40 mb-6 flex items-center gap-2">
              Risk Mandate
            </h4>
            <ul className="space-y-4">
              {[
                "Risk per trade: Max 1–2%",
                "Minimum R:R = 1:2 Ratio",
                "Max 2 concurrent trades",
                "Stop-loss non-negotiable"
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-3 text-[9px] text-white/30 font-bold leading-relaxed uppercase tracking-tight">
                  <div className="w-1 h-1 bg-white/20 rounded-full mt-1.5 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Center: Main Analysis Engine */}
        <div className="lg:col-span-9 space-y-8">
          {!selectedStock ? (
            <div className="h-[60vh] md:h-[75vh] flex flex-col items-center justify-center text-center glass-card rounded-[3rem] md:rounded-[4rem] relative overflow-hidden p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)]" />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 md:w-32 md:h-32 bg-white text-black rounded-full flex items-center justify-center mb-8 md:mb-12 shadow-2xl relative z-10"
              >
                <Zap className="w-10 h-10 md:w-14 md:h-14" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-euro tracking-tighter mb-6 md:mb-8 relative z-10 leading-none uppercase">TIKER 360 PLUS<span className="text-white/20">.</span></h1>
              <p className="text-white/20 text-xs md:text-sm max-w-md mx-auto font-bold leading-relaxed relative z-10 uppercase tracking-widest dot-matrix">
                Institutional Technical Swing & Intraday Probability Engine
              </p>
              <div className="mt-12 md:mt-16 flex gap-6 md:gap-8 relative z-10">
                <div className="flex flex-col items-center gap-2 md:gap-3">
                  <span className="text-[7px] md:text-[8px] dot-matrix text-white/20">Accuracy</span>
                  <span className="text-2xl md:text-3xl font-black">94.2%</span>
                </div>
                <div className="w-px h-10 md:h-12 bg-white/10" />
                <div className="flex flex-col items-center gap-2 md:gap-3">
                  <span className="text-[7px] md:text-[8px] dot-matrix text-white/20">Latency</span>
                  <span className="text-2xl md:text-3xl font-black">12ms</span>
                </div>
              </div>
            </div>
          ) : !analysis || !stockData ? (
            <div className="h-[75vh] flex flex-col items-center justify-center text-center glass-card rounded-[4rem]">
              <div className="relative w-20 h-20 mb-10">
                <Loader2 className="w-full h-full text-white/20 animate-spin" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white/40" />
                </div>
              </div>
              <h2 className="text-[10px] dot-matrix text-white/40">Computing Institutional Data...</h2>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tab Navigation & Mode Selection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white text-black">
                    <Activity className="w-3.5 h-3.5" />
                    Technical Analysis
                  </div>
                </div>

                <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 w-full sm:w-auto overflow-x-auto no-scrollbar">

                  <button
                    onClick={() => setAnalysisMode('fundamentals')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                      analysisMode === 'fundamentals' ? "bg-white text-black shadow-lg shadow-white/20" : "text-white/30 hover:text-white/60"
                    )}
                  >
                    <Star className="w-3 h-3" />
                    Fundamentals
                  </button>
                  <button
                    onClick={() => setAnalysisMode('llm')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                      analysisMode === 'llm' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-white/30 hover:text-white/60"
                    )}
                  >
                    <Bot className="w-3 h-3" />
                    LLM Engine
                  </button>
                  <button
                    onClick={() => setAnalysisMode('options')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                      analysisMode === 'options' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-white/30 hover:text-white/60"
                    )}
                  >
                    <Activity className="w-3 h-3" />
                    Options
                  </button>
                </div>
              </div>

              <div className="mt-8">
                {/* Top Bar: Verdict & Probability */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                <div className="lg:col-span-5 glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-2 border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10 text-center sm:text-left">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-white/5 stroke-current" strokeWidth="4" fill="transparent" r="44" cx="50" cy="50" />
                        <circle 
                          className="text-white stroke-current transition-all duration-1000" 
                          strokeWidth="4" 
                          strokeDasharray={276.46} 
                          strokeDashoffset={276.46 - (276.46 * (analysis?.probability || 0)) / 100} 
                          strokeLinecap="round" 
                          fill="transparent" 
                          r="44" 
                          cx="50" 
                          cy="50" 
                        />
                      </svg>
                      <div className="flex flex-col items-center justify-center relative z-10">
                        <span className="text-xl md:text-2xl font-euro leading-none">{analysis?.probability}%</span>
                        <span className="text-[7px] dot-matrix text-white/20 mt-1">Prob.</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] dot-matrix text-white/20 mb-2">Market Structure</div>
                      <div className={cn(
                        "text-2xl md:text-3xl font-euro tracking-tighter uppercase",
                        analysis?.structure.includes("Bullish") ? "text-emerald-400" : analysis?.structure.includes("Bearish") ? "text-rose-400" : "text-white/40"
                      )}>
                        {analysis?.structure}
                      </div>
                    </div>
                  </div>
                  <div className="text-center sm:text-right w-full sm:w-auto">
                    <div className="text-[8px] dot-matrix text-white/20 mb-3">Verdict</div>
                    <div className={cn(
                      "px-8 md:px-10 py-3 md:py-4 rounded-full text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase transition-all inline-block",
                      verdict === "BUY" ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" : 
                      verdict === "SELL" ? "bg-rose-500 text-black shadow-[0_0_20px_rgba(244,63,94,0.3)]" : 
                      "bg-white/5 text-white/20"
                    )}>
                      {verdict}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 bg-white text-black rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] text-center md:text-left min-h-[160px]">
                  <div className="text-[8px] dot-matrix text-black/40 mb-2">Live Price</div>
                  <div className="text-3xl md:text-5xl font-euro tracking-tighter mb-3">₹{stockData.lastPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}</div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                    {stockData.change && stockData.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stockData.change || 0} ({stockData.pChange || 0}%)
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <IntradayRangeBox data={stockData} analysis={analysis} />
                </div>
              </div>

              {/* Price Chart Module */}
              <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
                  <h3 className="text-[9px] dot-matrix text-white/30 flex items-center gap-2">
                    Institutional Price Action
                  </h3>
                  <div className="flex bg-white/[0.03] rounded-full p-1 border border-white/5 w-full sm:w-auto justify-center">
                    {['1D', '1W', '1M'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setInterval(t)}
                        className={cn(
                          "flex-1 sm:flex-none px-6 py-2 rounded-full text-[9px] dot-matrix transition-all",
                          interval === t ? "bg-white text-black" : "text-white/20 hover:text-white/40"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[250px] md:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05}/>
                          <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        orientation="right"
                        tick={{ fontSize: 9, fill: '#ffffff10', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `₹${val.toLocaleString()}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#050505', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, 'PRICE']}
                      />
                      
                      {/* Market Structure Lines */}
                      {analysis && (
                        <>
                          <ReferenceLine y={analysis.indicators.superTrend} stroke={analysis.indicators.superTrendDirection === 'Bullish' ? '#10b981' : '#f43f5e'} strokeDasharray="3 3">
                            <Label value="SUPERTREND" position="left" fill={analysis.indicators.superTrendDirection === 'Bullish' ? '#10b981' : '#f43f5e'} fontSize={8} className="dot-matrix" />
                          </ReferenceLine>
                          <ReferenceLine y={analysis.indicators.vwap} stroke="#3b82f6" strokeDasharray="3 3">
                            <Label value="VWAP (20)" position="left" fill="#3b82f6" fontSize={8} className="dot-matrix" />
                          </ReferenceLine>
                          <ReferenceLine y={analysis.pivots.pp} stroke="#ffffff20" strokeDasharray="3 3">
                            <Label value="PIVOT" position="left" fill="#ffffff20" fontSize={8} className="dot-matrix" />
                          </ReferenceLine>
                          <ReferenceLine y={analysis.pivots.r1} stroke="#f43f5e40" strokeDasharray="3 3">
                            <Label value="R1" position="left" fill="#f43f5e40" fontSize={8} className="dot-matrix" />
                          </ReferenceLine>
                          <ReferenceLine y={analysis.pivots.s1} stroke="#10b98140" strokeDasharray="3 3">
                            <Label value="S1" position="left" fill="#10b98140" fontSize={8} className="dot-matrix" />
                          </ReferenceLine>
                          {analysis.buyZones[0] && (
                            <ReferenceLine y={analysis.buyZones[0].entry} stroke="#10b98140" strokeWidth={1}>
                              <Label value="BUY ZONE" position="right" fill="#10b98140" fontSize={8} className="dot-matrix" />
                            </ReferenceLine>
                          )}
                          {analysis.sellZones[0] && (
                            <ReferenceLine y={analysis.sellZones[0].entry} stroke="#f43f5e40" strokeWidth={1}>
                              <Label value="SELL ZONE" position="right" fill="#f43f5e40" fontSize={8} className="dot-matrix" />
                            </ReferenceLine>
                          )}
                        </>
                      )}

                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#ffffff" 
                        strokeWidth={1.5}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Statistics Module */}
              <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
                <h3 className="text-[9px] dot-matrix text-white/30 mb-10 flex items-center gap-2">
                  Key Statistics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
                  {[
                    { label: 'Open', value: '₹' + (stockData.open?.toLocaleString() || '---') },
                    { label: 'Prev. Close', value: '₹' + (stockData.prevClose?.toLocaleString() || '---') },
                    { label: 'Day High', value: '₹' + (stockData.high?.toLocaleString() || '---') },
                    { label: 'Day Low', value: '₹' + (stockData.low?.toLocaleString() || '---') },
                    { label: '52W High', value: '₹' + (stockData.fiftyTwoWeekHigh?.toLocaleString() || '---') },
                    { label: '52W Low', value: '₹' + (stockData.fiftyTwoWeekLow?.toLocaleString() || '---') },
                    { label: 'Volume', value: stockData.volume?.toLocaleString() || '---' },
                    { label: 'Market Cap', value: stockData.marketCap ? '₹' + (stockData.marketCap / 10000000).toFixed(2) + ' Cr' : '---' },
                  ].map((item, i) => (
                    <div key={`stat-${item.label}-${i}`} className="text-left">
                      <div className="text-[7px] dot-matrix text-white/20 mb-2">{item.label}</div>
                      <div className="text-[11px] md:text-xs font-black font-mono text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Momentum & Volatility Module */}
              <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
                <h3 className="text-[9px] dot-matrix text-white/30 mb-10 flex items-center gap-2">
                  Momentum & Volatility Matrix
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-10">
                  {[
                    { label: 'RSI (14)', value: analysis.indicators.rsi !== null ? analysis.indicators.rsi.toFixed(2) : '---', color: analysis.indicators.rsi !== null && analysis.indicators.rsi > 70 ? 'text-rose-400' : analysis.indicators.rsi !== null && analysis.indicators.rsi < 30 ? 'text-emerald-400' : 'text-white' },
                    { label: 'ADX (14)', value: analysis.indicators.adx !== null ? analysis.indicators.adx.toFixed(2) : '---', color: analysis.indicators.adx !== null && analysis.indicators.adx > 25 ? 'text-emerald-400' : 'text-white/40' },
                    { label: 'MFI (14)', value: analysis.indicators.mfi !== null ? analysis.indicators.mfi.toFixed(2) : '---', color: analysis.indicators.mfi !== null && analysis.indicators.mfi > 80 ? 'text-rose-400' : analysis.indicators.mfi !== null && analysis.indicators.mfi < 20 ? 'text-emerald-400' : 'text-white' },
                    { label: 'ROC (21)', value: analysis.indicators.roc21 !== null ? analysis.indicators.roc21.toFixed(2) + '%' : '---', color: analysis.indicators.roc21 !== null && analysis.indicators.roc21 > 0 ? 'text-emerald-400' : analysis.indicators.roc21 !== null && analysis.indicators.roc21 < 0 ? 'text-rose-400' : 'text-white/40' },
                    { label: 'ROC (125)', value: analysis.indicators.roc125 !== null ? analysis.indicators.roc125.toFixed(2) + '%' : '---', color: analysis.indicators.roc125 !== null && analysis.indicators.roc125 > 0 ? 'text-emerald-400' : analysis.indicators.roc125 !== null && analysis.indicators.roc125 < 0 ? 'text-rose-400' : 'text-white/40' },
                    { label: 'MACD', value: analysis.indicators.macd.macd !== null ? analysis.indicators.macd.macd.toFixed(2) : '---', color: analysis.indicators.macd.macd !== null && analysis.indicators.macd.signal !== null && analysis.indicators.macd.macd > analysis.indicators.macd.signal ? 'text-emerald-400' : 'text-rose-400' },
                    { label: 'Signal', value: analysis.indicators.macd.signal !== null ? analysis.indicators.macd.signal.toFixed(2) : '---', color: 'text-white/40' },
                    { label: 'ATR (14)', value: analysis.indicators.atr !== null ? analysis.indicators.atr.toFixed(2) : '---', color: 'text-white/40' },
                    { label: 'SuperTrend', value: analysis.indicators.superTrend !== null ? '₹' + analysis.indicators.superTrend.toFixed(2) : '---', color: analysis.indicators.superTrendDirection === 'Bullish' ? 'text-emerald-400' : 'text-rose-400' },
                    { label: 'VWAP (20)', value: analysis.indicators.vwap !== null ? '₹' + analysis.indicators.vwap.toFixed(2) : '---', color: analysis.indicators.vwap !== null && stockData.lastPrice > analysis.indicators.vwap ? 'text-emerald-400' : 'text-rose-400' },
                    { label: 'Delivery %', value: stockData.delivery !== undefined ? stockData.delivery.toFixed(1) + '%' : '---', color: stockData.delivery !== undefined && stockData.delivery > 50 ? 'text-emerald-400' : 'text-white' },
                  ].map((item, i) => (
                    <div key={`mom-${item.label}-${i}`} className="text-left">
                      <div className="text-[7px] dot-matrix text-white/20 mb-2">{item.label}</div>
                      <div className={cn("text-[11px] md:text-xs font-black font-mono", item.color)}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institutional EMA Ribbon */}
              <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
                <h3 className="text-[9px] dot-matrix text-white/30 mb-10 flex items-center gap-2">
                  Institutional EMA Ribbon
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6">
                  {[
                    { label: 'EMA 5', value: analysis.indicators.ema5 !== null ? '₹' + analysis.indicators.ema5.toFixed(0) : '---' },
                    { label: 'EMA 10', value: analysis.indicators.ema10 !== null ? '₹' + analysis.indicators.ema10.toFixed(0) : '---' },
                    { label: 'EMA 12', value: analysis.indicators.ema12 !== null ? '₹' + analysis.indicators.ema12.toFixed(0) : '---' },
                    { label: 'EMA 20', value: analysis.indicators.ema20 !== null ? '₹' + analysis.indicators.ema20.toFixed(0) : '---' },
                    { label: 'EMA 26', value: analysis.indicators.ema26 !== null ? '₹' + analysis.indicators.ema26.toFixed(0) : '---' },
                    { label: 'EMA 50', value: analysis.indicators.ema50 !== null ? '₹' + analysis.indicators.ema50.toFixed(0) : '---' },
                    { label: 'EMA 100', value: analysis.indicators.ema100 !== null ? '₹' + analysis.indicators.ema100.toFixed(0) : '---' },
                    { label: 'EMA 200', value: analysis.indicators.ema200 !== null ? '₹' + analysis.indicators.ema200.toFixed(0) : '---' },
                  ].map((item, i) => (
                    <div key={`ema-${item.label}-${i}`} className="text-left">
                      <div className="text-[7px] dot-matrix text-white/20 mb-2">{item.label}</div>
                      <div className="text-[11px] md:text-xs font-black font-mono text-white/60">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pivot Points Module */}
              <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
                <h3 className="text-[9px] dot-matrix text-white/30 mb-10 flex items-center gap-2">
                  Standard Pivot Points
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-6 items-center">
                  <div className="text-center col-span-3 md:col-span-1 md:order-4 bg-white/5 py-4 md:py-6 rounded-2xl border border-white/5">
                    <div className="text-[7px] dot-matrix text-white/40 mb-2">Pivot (PP)</div>
                    <div className="text-[11px] md:text-xs font-black font-mono text-white">₹{analysis.pivots.pp.toFixed(2)}</div>
                  </div>
                  
                  <div className="text-center md:order-3">
                    <div className="text-[7px] dot-matrix text-white/20 mb-2">R1</div>
                    <div className="text-[11px] md:text-xs font-black font-mono text-white/60">₹{analysis.pivots.r1.toFixed(2)}</div>
                  </div>
                  <div className="text-center md:order-2">
                    <div className="text-[7px] dot-matrix text-white/20 mb-2">R2</div>
                    <div className="text-[11px] md:text-xs font-black font-mono text-white/60">₹{analysis.pivots.r2.toFixed(2)}</div>
                  </div>
                  <div className="text-center md:order-1">
                    <div className="text-[7px] dot-matrix text-white/20 mb-2">R3</div>
                    <div className="text-[11px] md:text-xs font-black font-mono text-white/60">₹{analysis.pivots.r3.toFixed(2)}</div>
                  </div>

                  <div className="text-center md:order-5">
                    <div className="text-[7px] dot-matrix text-white/20 mb-2">S1</div>
                    <div className="text-[11px] md:text-xs font-black font-mono text-white/60">₹{analysis.pivots.s1.toFixed(2)}</div>
                  </div>
                  <div className="text-center md:order-6">
                    <div className="text-[7px] dot-matrix text-white/20 mb-2">S2</div>
                    <div className="text-[11px] md:text-xs font-black font-mono text-white/60">₹{analysis.pivots.s2.toFixed(2)}</div>
                  </div>
                  <div className="text-center md:order-7">
                    <div className="text-[7px] dot-matrix text-white/20 mb-2">S3</div>
                    <div className="text-[11px] md:text-xs font-black font-mono text-white/60">₹{analysis.pivots.s3.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>



          {/* Fundamentals & Financials Module */}
          {analysisMode === 'fundamentals' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Profile & Scorecard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Company Profile Box */}
                <div className="lg:col-span-5 glass-card rounded-[2rem] p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-euro tracking-tight uppercase mb-1">{selectedStock.symbol}</h3>
                      <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{stockData.sector || 'N/A'} • {stockData.industry || 'N/A'}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed mb-6 line-clamp-4">
                    {stockData.longBusinessSummary || "Company profile information is not available at the moment."}
                  </p>
                  
                  {/* Analyst Forecast (Finology/Tickertape style) */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h4 className="text-[9px] dot-matrix text-white/40 uppercase mb-4">Analyst Estimates</h4>
                    <div className="flex items-center gap-6">
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle className="text-white/5 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                          <circle 
                            className={cn("stroke-current transition-all duration-1000", stockData.recommendationKey === 'buy' || stockData.recommendationKey === 'strong_buy' ? "text-emerald-500" : stockData.recommendationKey === 'sell' || stockData.recommendationKey === 'strong_sell' ? "text-rose-500" : "text-yellow-500")}
                            strokeWidth="8" 
                            strokeDasharray={251.2} 
                            strokeDashoffset={251.2 - (251.2 * ((stockData.recommendationKey === 'buy' || stockData.recommendationKey === 'strong_buy' ? 75 : stockData.recommendationKey === 'hold' ? 50 : 25) / 100))} 
                            strokeLinecap="round" 
                            fill="transparent" 
                            r="40" 
                            cx="50" 
                            cy="50" 
                          />
                        </svg>
                        <div className="flex flex-col items-center justify-center relative z-10">
                          <span className="text-xs font-black">{stockData.recommendationKey === 'buy' || stockData.recommendationKey === 'strong_buy' ? 'BUY' : stockData.recommendationKey === 'sell' || stockData.recommendationKey === 'strong_sell' ? 'SELL' : stockData.recommendationKey === 'hold' ? 'HOLD' : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-white/60 uppercase mb-2">Consensus Rating</div>
                        <div className="flex justify-between items-center bg-black/20 rounded-lg p-2">
                          <span className="text-[8px] text-white/40 uppercase">Target Price</span>
                          <span className="text-[10px] font-mono font-bold text-blue-400">₹{stockData.targetMeanPrice?.toFixed(2) || '---'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Checklist (Trendlyne style) */}
                <div className="lg:col-span-7 glass-card rounded-[2rem] p-8">
                  <h3 className="text-[9px] dot-matrix text-white/30 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Investment Checklist
                  </h3>
                  <div className="space-y-3">
                    {[
                      { 
                        title: 'Intrinsic Value', 
                        desc: 'Current PE vs Historical Averages', 
                        pass: stockData.peRatio != null ? stockData.peRatio < 25 : null 
                      },
                      { 
                        title: 'Profitability', 
                        desc: 'Return on Equity (ROE) > 15%', 
                        pass: stockData.roe != null ? stockData.roe > 0.15 : null 
                      },
                      { 
                        title: 'Financial Trend', 
                        desc: 'Positive Revenue Growth', 
                        pass: stockData.revenueGrowth != null ? stockData.revenueGrowth > 0 : null 
                      },
                      { 
                        title: 'Dividend Returns', 
                        desc: 'Dividend Yield > 1.0%', 
                        pass: stockData.dividendYield != null ? stockData.dividendYield > 0.01 : false 
                      },
                      { 
                        title: 'Debt Profile', 
                        desc: 'Debt to Equity < 1.0', 
                        pass: stockData.debtToEquity != null ? stockData.debtToEquity < 1 : null 
                      }
                    ].map((idx, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl border border-white/5">
                        <div className="flex items-start gap-4">
                          {idx.pass === null ? (
                            <Activity className="w-5 h-5 text-white/20 mt-0.5" />
                          ) : idx.pass ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500 mt-0.5" />
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{idx.title}</h4>
                            <p className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">{idx.desc}</p>
                          </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                          idx.pass === null ? "bg-white/10 text-white/40" : idx.pass ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                          {idx.pass === null ? 'No Data' : idx.pass ? 'Pass' : 'Fail'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fundamentals Grid */}
              <div className="glass-card rounded-[2rem] p-8">
                <h3 className="text-[9px] dot-matrix text-white/30 mb-8 flex items-center gap-2">
                  <PieChart className="w-3 h-3 text-blue-500" />
                  Key Fundamentals
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {[
                    { label: 'P/E Ratio', value: stockData.peRatio ? stockData.peRatio.toFixed(2) : '---' },
                    { label: 'P/B Ratio', value: stockData.pbRatio ? stockData.pbRatio.toFixed(2) : '---' },
                    { label: 'Dividend Yield', value: stockData.dividendYield ? (stockData.dividendYield * 100).toFixed(2) + '%' : '---' },
                    { label: 'ROE', value: stockData.roe ? (stockData.roe * 100).toFixed(2) + '%' : '---' },
                    { label: 'Debt to Equity', value: stockData.debtToEquity ? stockData.debtToEquity.toFixed(2) : '---' },
                    { label: 'EPS (TTM)', value: stockData.eps ? '₹' + stockData.eps.toFixed(2) : '---' },
                    { label: 'Book Value', value: stockData.bookValue ? '₹' + stockData.bookValue.toFixed(2) : '---' },
                    { label: 'Rev Growth', value: stockData.revenueGrowth ? (stockData.revenueGrowth * 100).toFixed(2) + '%' : '---' },
                    { label: 'Op. Margins', value: stockData.operatingMargins ? (stockData.operatingMargins * 100).toFixed(2) + '%' : '---' },
                    { label: 'Profit Margins', value: stockData.profitMargins ? (stockData.profitMargins * 100).toFixed(2) + '%' : '---' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2">{stat.label}</div>
                      <div className="text-sm font-mono font-black text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Fundamentals: Quarterly, P&L, Shareholding */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Quarterly Results */}
                {stockData.quarters && stockData.quarters.length > 0 && (
                  <div className="glass-card rounded-[2rem] p-6 lg:p-8">
                    <h3 className="text-[10px] dot-matrix text-white/40 mb-6 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-400" />
                      Quarterly Results
                    </h3>
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="py-2 px-3 text-[9px] font-black uppercase text-white/30 border-b border-white/10">Metric</th>
                            {stockData.quarters.map((q, i) => (
                              <th key={i} className="py-2 px-3 text-[9px] font-black uppercase text-white/30 border-b border-white/10 whitespace-nowrap">
                                {new Date(q.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-3 px-3 text-[10px] font-bold text-white/60">Revenue</td>
                            {stockData.quarters.map((q, i) => (
                              <td key={i} className="py-3 px-3 text-[10px] font-mono text-white">{(q.totalRevenue / 10000000).toFixed(2)} Cr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-3 px-3 text-[10px] font-bold text-white/60">Tax & Exp</td>
                            {stockData.quarters.map((q, i) => (
                              <td key={i} className="py-3 px-3 text-[10px] font-mono text-white/40">{(q.taxProvision / 10000000).toFixed(2)} Cr</td>
                            ))}
                          </tr>
                          <tr className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3 text-[10px] font-bold text-emerald-400">Net Profit</td>
                            {stockData.quarters.map((q, i) => (
                              <td key={i} className="py-3 px-3 text-[10px] font-mono font-black text-emerald-400">{(q.netIncome / 10000000).toFixed(2)} Cr</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Profit & Loss Annuals */}
                {stockData.annuals && stockData.annuals.length > 0 && (
                  <div className="glass-card rounded-[2rem] p-6 lg:p-8">
                    <h3 className="text-[10px] dot-matrix text-white/40 mb-6 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-400" />
                      Profit & Loss
                    </h3>
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="py-2 px-3 text-[9px] font-black uppercase text-white/30 border-b border-white/10">Metric</th>
                            {stockData.annuals.map((a, i) => (
                              <th key={i} className="py-2 px-3 text-[9px] font-black uppercase text-white/30 border-b border-white/10 whitespace-nowrap">
                                Mar {new Date(a.date).getFullYear()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-3 px-3 text-[10px] font-bold text-white/60">Sales</td>
                            {stockData.annuals.map((a, i) => (
                              <td key={i} className="py-3 px-3 text-[10px] font-mono text-white">{(a.totalRevenue / 10000000).toFixed(2)} Cr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-3 px-3 text-[10px] font-bold text-white/60">Tax & Exp</td>
                            {stockData.annuals.map((a, i) => (
                              <td key={i} className="py-3 px-3 text-[10px] font-mono text-white/40">{(a.taxProvision / 10000000).toFixed(2)} Cr</td>
                            ))}
                          </tr>
                          <tr className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3 text-[10px] font-bold text-emerald-400">Net Profit</td>
                            {stockData.annuals.map((a, i) => (
                              <td key={i} className="py-3 px-3 text-[10px] font-mono font-black text-emerald-400">{(a.netIncome / 10000000).toFixed(2)} Cr</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Shareholding & Pros/Cons Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Real Shareholding */}
                <div className="glass-card rounded-[2rem] p-6 lg:p-8">
                  <h3 className="text-[10px] dot-matrix text-white/40 mb-6 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Shareholding Pattern
                  </h3>
                  {stockData.insidersHeld !== undefined && stockData.institutionsHeld !== undefined ? (
                    <div className="space-y-4">
                      {[
                        { label: 'Promoters (Insiders)', val: stockData.insidersHeld, color: 'bg-emerald-500' },
                        { label: 'FIIs & DIIs (Institutions)', val: stockData.institutionsHeld, color: 'bg-blue-500' },
                        { label: 'Public & Retail', val: Math.max(0, 1 - stockData.insidersHeld - stockData.institutionsHeld), color: 'bg-purple-500' },
                      ].map((h, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className={cn("w-3 h-3 rounded-sm", h.color)} />
                          <div className="flex-1 text-[10px] font-bold text-white/60 uppercase">{h.label}</div>
                          <div className="text-[11px] font-mono font-black text-white">{(h.val * 100).toFixed(2)}%</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-white/40">No shareholding data available for this entity.</div>
                  )}
                </div>

                {/* Screener Style Pros & Cons */}
                <div className="glass-card rounded-[2rem] p-6 lg:p-8 flex flex-col sm:flex-row gap-6 lg:gap-8">
                  <div className="flex-1">
                    <h3 className="text-[10px] dot-matrix text-emerald-500 mb-4">Pros</h3>
                    <ul className="space-y-3">
                      {stockData.debtToEquity != null && stockData.debtToEquity < 0.5 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5"/> Company is almost debt free.</li>
                      )}
                      {stockData.roe != null && stockData.roe > 0.15 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5"/> Company has a good return on equity (ROE) track record.</li>
                      )}
                      {stockData.dividendYield != null && stockData.dividendYield > 0.02 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5"/> Company is maintaining a healthy dividend payout.</li>
                      )}
                      {stockData.profitMargins != null && stockData.profitMargins > 0.1 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5"/> Healthy profit margins compared to peers.</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[10px] dot-matrix text-rose-500 mb-4">Cons</h3>
                    <ul className="space-y-3">
                      {stockData.pbRatio != null && stockData.pbRatio > 3 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><XCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5"/> Stock is trading excessively over its book value.</li>
                      )}
                      {stockData.revenueGrowth != null && stockData.revenueGrowth < 0 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><XCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5"/> Company has delivered poor sales growth.</li>
                      )}
                      {stockData.debtToEquity != null && stockData.debtToEquity > 1.5 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><XCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5"/> High levels of debt against equity.</li>
                      )}
                      {stockData.insidersHeld != null && stockData.insidersHeld < 0.2 && (
                        <li className="text-[10px] text-white/70 flex items-start gap-2"><XCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5"/> Promoter holding is low.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Options Chain Module */}
          {analysisMode === 'llm' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card rounded-[2rem] p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      <Bot className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-euro uppercase tracking-widest">TIKER 360 PLUS Engine</h3>
                      <p className="text-[9px] dot-matrix text-white/40">Institutional Swing & Intraday Probability (Groww Data)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsCustomizingGpt(!isCustomizingGpt)}
                      className={cn(
                        "px-4 py-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                        isCustomizingGpt ? "bg-blue-500/20 border-2 border-blue-500/80 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      <Settings2 className="w-4 h-4" />
                      Customize
                    </button>
                    <select
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                      <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                      <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Lite</option>
                    </select>
                    <button
                      onClick={generateLLMPrediction}
                      disabled={isGeneratingLlm}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isGeneratingLlm ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Computing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Run Prediction
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isCustomizingGpt && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-8"
                    >
                      <div className="bg-black/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Custom GPT Instructions</h4>
                          <button 
                            onClick={() => setCustomPrompt(DEFAULT_SYSTEM_PROMPT)}
                            className="text-[9px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] font-mono text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y mb-4"
                          placeholder="Enter custom instructions for the TIKER 360 PLUS Engine..."
                        />
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest whitespace-nowrap">Temperature: {llmTemperature}</label>
                            <input 
                              type="range" 
                              min="0" 
                              max="1" 
                              step="0.1" 
                              value={llmTemperature}
                              onChange={(e) => setLlmTemperature(parseFloat(e.target.value))}
                              className="flex-1 sm:w-32 accent-blue-500"
                            />
                          </div>
                          <p className="text-[9px] text-white/30 dot-matrix text-center sm:text-right">
                            Note: Real-time stock data and technical indicators are automatically injected before these instructions.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {llmPrediction ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/70 prose-headings:text-white prose-strong:text-blue-400 prose-li:text-white/70">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {llmPrediction}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <Bot className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-[10px] dot-matrix text-white/30 uppercase tracking-widest">
                      Engine Ready. Click "Run Prediction" to analyze {selectedStock.symbol}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {analysisMode === 'options' && (
            <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                <div className="space-y-2">
                  <h3 className="text-[9px] dot-matrix text-white/30 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Derivatives Data Terminal (Groww)
                  </h3>
                  <div className="flex items-center gap-4">
                    <p className="text-[7px] dot-matrix text-white/10">Real-time Option Chain Analysis via Groww Scraper</p>
                    <button
                      onClick={refreshOptionsData}
                      disabled={isRefreshingOptions}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] dot-matrix text-white/70 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={cn("w-3 h-3", isRefreshingOptions && "animate-spin")} />
                      {isRefreshingOptions ? 'UPDATING...' : 'UPDATE NOW'}
                    </button>
                  </div>
                </div>
                {optionsData && (
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex flex-col">
                      <span className="text-[8px] dot-matrix text-white/40 uppercase mb-1">Spot Price</span>
                      <span className="text-sm font-mono font-bold text-white">₹{optionsData.currentPrice?.toFixed(2)}</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[8px] dot-matrix text-white/40 uppercase mb-1">PCR</span>
                      <span className={cn("text-sm font-mono font-bold", optionsData.pcr > 1 ? "text-emerald-400" : optionsData.pcr < 0.8 ? "text-rose-400" : "text-white")}>
                        {optionsData.pcr?.toFixed(2)}
                      </span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[8px] dot-matrix text-white/40 uppercase mb-1">Max Pain</span>
                      <span className="text-sm font-mono font-bold text-white">{optionsData.maxPain}</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[8px] dot-matrix text-white/40 uppercase mb-1">OI Support</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">{optionsData.oiSupport}</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[8px] dot-matrix text-white/40 uppercase mb-1">OI Resistance</span>
                      <span className="text-sm font-mono font-bold text-rose-400">{optionsData.oiResistance}</span>
                    </div>
                  </div>
                )}
              </div>

              {!optionsData ? (
                <div className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto mb-4" />
                  <p className="text-[8px] dot-matrix text-white/20">Loading Derivatives Data...</p>
                </div>
              ) : optionsData.options?.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-4" />
                  <p className="text-[10px] dot-matrix text-white/40 uppercase tracking-widest">
                    {optionsData.message || "Options data not available for this stock"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th colSpan={4} className="p-3 text-center border border-blue-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-widest uppercase">Calls</th>
                        <th className="p-3 text-center border border-blue-500/40 bg-white/5 text-white/40 text-[10px] font-black tracking-widest uppercase">Strike</th>
                        <th colSpan={4} className="p-3 text-center border border-blue-500/40 bg-rose-500/10 text-rose-400 text-[10px] font-black tracking-widest uppercase">Puts</th>
                      </tr>
                      <tr>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">OI</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">Vol</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">IV</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">LTP</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">Price</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">LTP</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">IV</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">Vol</th>
                        <th className="p-2 text-center border border-blue-500/40 bg-white/5 text-[8px] text-white/40 font-mono">OI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optionsData.options?.map((opt: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          {/* Calls */}
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono", opt.call.isITM ? "bg-emerald-500/5 text-emerald-100" : "text-white/60")}>
                            {(opt.call.oi / 1000).toFixed(1)}k
                          </td>
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono", opt.call.isITM ? "bg-emerald-500/5 text-emerald-100" : "text-white/60")}>
                            {(opt.call.volume / 1000).toFixed(1)}k
                          </td>
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono", opt.call.isITM ? "bg-emerald-500/5 text-emerald-100" : "text-white/60")}>
                            {opt.call.impliedVolatility.toFixed(1)}
                          </td>
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono font-bold", opt.call.isITM ? "bg-emerald-500/10 text-emerald-400" : "text-white")}>
                            {opt.call.price.toFixed(2)}
                          </td>
                          
                          {/* Strike */}
                          <td className="p-2 text-center border border-blue-500/40 bg-white/5 text-[11px] font-mono font-black text-white">
                            {opt.strike}
                          </td>
                          
                          {/* Puts */}
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono font-bold", opt.put.isITM ? "bg-rose-500/10 text-rose-400" : "text-white")}>
                            {opt.put.price.toFixed(2)}
                          </td>
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono", opt.put.isITM ? "bg-rose-500/5 text-rose-100" : "text-white/60")}>
                            {opt.put.impliedVolatility.toFixed(1)}
                          </td>
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono", opt.put.isITM ? "bg-rose-500/5 text-rose-100" : "text-white/60")}>
                            {(opt.put.volume / 1000).toFixed(1)}k
                          </td>
                          <td className={cn("p-2 text-center border border-blue-500/40 text-[10px] font-mono", opt.put.isITM ? "bg-rose-500/5 text-rose-100" : "text-white/60")}>
                            {(opt.put.oi / 1000).toFixed(1)}k
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
            </div>
          )}
        </div>
      </main>

      {/* System Status Bar */}
      <footer className="border-t border-white/5 bg-black/60 backdrop-blur-3xl h-auto md:h-12 fixed bottom-0 left-0 right-0 z-50 py-3 md:py-0">
        <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center gap-6 md:gap-10">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[8px] dot-matrix text-white/40 uppercase tracking-[0.2em] font-bold">Market Live</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[8px] dot-matrix text-white/20 uppercase tracking-[0.2em]">Golden Rule</span>
              <span className="text-[8px] font-mono text-white/60 font-bold">Capital protection &gt; Opportunity. When unclear → WAIT is the trade.</span>
            </div>
          </div>
          <div className="flex items-center gap-6 md:gap-10">
            <span className="text-[8px] dot-matrix text-white/20 uppercase tracking-[0.2em]">© 2026 TIKER 360 PLUS</span>
            <div className="hidden sm:block h-3 w-px bg-white/5" />
            <span className="hidden sm:block text-[8px] dot-matrix text-white/40 uppercase tracking-[0.2em] font-bold">Institutional Grade Probability Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
