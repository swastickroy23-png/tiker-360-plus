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
  BarChart2,
  BookOpen,
  LineChart,
  Maximize,
  Target,
  MessageSquare,
  X,
  Send
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
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { IndicatorEngine, type OHLC, type SwingZone } from './services/indicatorEngine';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
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

const DEFAULT_SYSTEM_PROMPT = `You are a **Market Statistical Probabilities Engine** designed to provide **educational analysis** of historical and current market data, with an emphasis on **capital preservation**.

Your output logic must be **rule-based**, **objective**, and **educational in nature**.

**CRITICAL COMPLIANCE DIRECTIVE:**
You are NOT a SEBI-registered advisory. You MUST NOT provide specific buy/sell limits, entry points, specific stop-losses, or target prices.
Your analysis must strictly be framed as "Statistical Bounds", "Historical Support/Resistance levels", and "Data-Driven Probabilities" for educational purposes.
Do NOT use words like "Entry", "Stop Loss", "Targets". Use "Upper Boundary", "Lower Boundary", "Resistance Zone", "Support Zone".

If data clarity is insufficient → output **INCONCLUSIVE DATA**.

---

# CORE DECISION ENGINE

1. TIMEFRAME HIERARCHY
Priority order:
Daily → Market structure
1H → Confirmation
15M → Entry timing
Ignore 1-minute timeframe.

2. STATISTICAL BIAS CLASSIFICATION
Classify ONLY one:
Bullish Bias
Bearish Bias
Neutral Range

Rules:
Bullish: Higher highs + higher lows, Price above EMA 50 & EMA 200
Bearish: Lower highs + lower lows, Price below EMA 50 & EMA 200
Neutral: ADX < 20, Price oscillating between support/resistance
If Neutral: Statistically significant events occur at support or resistance boundaries

3. AUTO INTRADAY BOUNDS (STATISTICAL MODEL)
Use the pre-computed Intraday Range provided in the data context.
This module provides directional bias based on Advanced V3 Logic (Camarilla, Standard Pivots, Bollinger Bands, ATR, ADX).
Output the provided Upper Bound and Lower Bound with their probabilities.

4. SWING SUPPORT ZONES (MAX 3)
Detect high probability historically-mapped accumulation zones using:
EMA pullback zones, Support levels S1 S2 S3, Demand zones, Breakout retest zones, VWAP support, ATR support band
Frame them carefully as "Historical Support Regions".

5. SWING RESISTANCE ZONES (MAX 3)
Detect supply zones using:
EMA rejection, Resistance R1 R2 R3, Supply zones, Breakdown retest zones, VWAP rejection, ATR resistance band
Frame them carefully as "Historical Resistance Regions".

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

**DISCLAIMER**: The following analysis is based on statistical projections and historical modeling for educational purposes only. It is NOT investment advice or a recommendation to buy/sell. We are not a regulatory financial advisor.

Market Structure:
Bullish / Bearish / Range-bound

Statistical Volatility Bounds:
Upper Bound:
Probability Match:

Lower Bound:
Probability Match:

Institutional Trap Analysis:
(Mention any Bull/Bear traps detected contextually)

Historical Support Regions:

Region 1:
Price Area:
Confluence logic:
Probability:

Region 2:
Price Area:
Confluence logic:
Probability:

Historical Resistance Regions:

Region 1:
Price Area:
Confluence logic:
Probability:

Region 2:
Price Area:
Confluence logic:
Probability:

Risk Management Educational Note: 
(Provide a 1-sentence tip on capital protection for this structure)
`;

const ACADEMY_MODULES: Record<string, { title: string; content: string }> = {
  structure: {
    title: "Market Structure",
    content: "### The Core of Price Action\nMarkets do not move in straight lines. They move in a series of zig-zags. \n\n**Bullish Structure**: Characterized by Higher Highs (HH) and Higher Lows (HL). This pattern often reflects accumulation phases.\n\n**Bearish Structure**: Characterized by Lower Highs (LH) and Lower Lows (LL). This pattern often reflects distribution phases.\n\n**Range / Consolidation**: Sideways movement where supply and demand are in equilibrium. Breakouts from these zones are statistically significant events.\n\n**Analytical Note**: Market analysts typically prioritize the primary structure. If the daily timeframe exhibits HH and HL, the overall bias is considered bullish regardless of short-term volatility."
  },
  rsi: {
    title: "Relative Strength Index (RSI)",
    content: "### Momentum Indicator\n**Formula**: \n$RSI = 100 - [100 / (1 + RS)]$ \n*Where $RS = \\\\text{Avg Gain} / \\\\text{Avg Loss}$*\n\nRSI is an oscillator that measures the speed and change of price movements, moving between 0 and 100.\n\n*   **Overbought (>70)**: High buying velocity, potential exhaustion.\n*   **Oversold (<30)**: Excessive selling velocity, potential reversal.\n\n**Institutional Divergence**:\nIf price makes a *Higher High*, but the RSI makes a *Lower High*, momentum is secretly dying. This is called **Bearish Divergence**."
  },
  atr: {
    title: "Average True Range (ATR)",
    content: "### Volatility Measurement\n**Formula**: \n$ATR = \\\\frac{1}{n} \\\\sum_{i=1}^{n} TR_i$\n*Where $TR = \\\\max[(H - L), |H - C_{prev}|, |L - C_{prev}|]$*\n\nUnlike other indicators, ATR does not dictate direction. It strictly measures volatility and historical price displacement.\n\n**Analytical Context:**\nIf a security moves an average of ₹10 a day (ATR = 10), and a risk threshold is placed just ₹2 away, it is statistically likely to be breached by normal market noise.\n\n**Mathematical Application**:\nQuantitative models often utilize a multiplier (e.g., **1.5x or 2x the ATR**) to define statistical boundaries for price action, accounting for standard fluctuations without invalidating the primary trend."
  },
  maxpain: {
    title: "Options Max Pain",
    content: "### The Option Writer's Magnet\n'Max Pain' is the specific strike price where the highest number of open options contracts (both calls and puts) expire completely worthless.\n\n**The Theory**:\nBecause large financial institutions (Option Writers) sell the majority of options, they manipulate the underlying stock price as expiry approaches to pin it exactly at the Max Pain level. This ensures they pay out the minimum amount of money to retail traders who bought the options. It acts as a powerful magnetic force on expiry days."
  },
  pcr: {
    title: "Put-Call Ratio (PCR)",
    content: "### The Ultimate Sentiment Indicator\n**Formula**: \n$PCR = \\\\frac{\\\\text{Total Put Open Interest}}{\\\\text{Total Call Open Interest}}$\n\nThe PCR is calculated by dividing the total number of traded Put options by the total number of traded Call options.\n\n*   **PCR > 1.0**: Bearish sentiment. Traders are buying more puts than calls.\n*   **PCR < 0.7**: Bullish sentiment. Traders are heavily buying calls for upside.\n\n**The Contrarian Trap**:\nWhen PCR gets *too high* (e.g., > 1.5), it means retail is in extreme panic. Institutions often use this extreme panic to buy the bottom, causing vicious short squeezes. Look at extreme PCR as a leading reversal signal."
  },
  vwap: {
    title: "VWAP (Volume Weighted Average Price)",
    content: "### The Data Benchmark\n**Formula**: \n$VWAP = \\\\frac{\\\\sum (\\\\text{Price} \\\\times \\\\text{Volume})}{\\\\sum \\\\text{Volume}}$\n\nVWAP calculates the weighted average price of a security throughout the trading session based on both volume and price. It is a critical benchmark for algorithmic data analysis.\n\n**Interpretation**:\nQuantitative models observe VWAP to gauge current pricing relative to the day's volume.\n*   **Above VWAP**: Bullish momentum. Price is executing above the volume-weighted average.\n*   **Below VWAP**: Bearish momentum. Price is executing below the volume-weighted average.\n\n*Statistically, price action that remains below its daily VWAP is considered to be under bearish pressure.*"
  },
  macd: {
     title: "MACD",
     content: "### Moving Average Convergence Divergence\n**Formula**: \n$MACD = EMA_{12} - EMA_{26}$\n\nA trend-following momentum indicator that shows the relationship between two moving averages of a stock's price.\n\n**Key Components**:\n1.  **MACD Line**: The 12-period EMA minus the 26-period EMA.\n2.  **Signal Line**: A 9-period EMA of the MACD line.\n3.  **Histogram**: the difference between the MACD and the Signal line.\n\n**How to Read**:\nWhen the MACD line crosses *above* the signal line, it's a bullish crossover. When it crosses *below*, it's bearish. Watch the histogram for early signs of momentum slowing down before the crossover even happens."
  },
  ema: {
     title: "Exponential Moving Averages",
     content: "### Dynamic Support & Resistance\n**Formula**: \n$EMA_t = (Price_t \\times K) + (EMA_{t-1} \\times (1-K))$\n*Where $K = 2 / (n+1)$*\n\nUnlike Simple Moving Averages (SMA), EMAs give more weight to recent prices, making them react faster to price changes.\n\n**The Golden Cross & Death Cross**:\n*   **Golden Cross**: When a short-term moving average (like the 50 EMA) crosses *above* a long-term moving average (like the 200 EMA), signaling a definitive bull market.\n*   **Death Cross**: When the 50 EMA crosses *below* the 200 EMA, signaling a long-term bear market."
  },
  delivery: {
     title: "Delivery Percentage",
     content: "### Spotting Real Institutional Buying\nIn the Indian markets (NSE/BSE), total volume includes intraday speculation (where shares are bought and sold on the same day). \n\n**Delivery Volume** is the number of shares actually purchased and taken into demat accounts.\n\n*   **High Delivery % (> 50-60%)**: Indicates institutions and large investors are accumulating the stock to hold it. This shows extremely high conviction.\n*   **Low Delivery % (< 30%)**: The stock price is moving purely on intraday speculation and algos. High risk of reversal as there are no real holders."
  },
  oi: {
     title: "Open Interest (OI) Base",
     content: "### Following the Option Sellers\nIn options trading, 90% of buyers lose money due to theta decay. Therefore, we track the *Option Sellers* (Writers) who have unlimited risk.\n\n*   **Huge Call OI**: This acts as a massive wall of Resistance. Call writers will defend this level fiercely, causing the stock to drop if it nears it.\n*   **Huge Put OI**: This acts as a massive floor of Support. Put writers don't want the stock falling below this level.\n\nIf you see a stock break past the highest Call OI strike, Call Writers will panic buy to cover their positions, triggering a massive upside 'Short Squeeze'."
  },
  pivots: {
     title: "Pivot Points",
     content: "### Algorithmic Support & Resistance\n**Formula**: \n$PP = (H + L + C) / 3$\n\nPivot points are computed from the previous trading period's High, Low, and Close. Algorithms program these mathematical levels to automatically execute trades around them.\n\n*   **Central Pivot Point (PP)**: The focal point of the day. If a stock opens above PP, the bias is bullish.\n*   **R1, R2, R3**: Target resistance levels built from the Pivot.\n*   **S1, S2, S3**: Target support levels built from the Pivot.\n\nWhen standard indicators lag, pivot points act as immediate leading indicators of reaction zones."
  },
  flow: {
     title: "Institutional Flow",
     content: "### The Big Picture Bias\nInstitutional flow is a combined metric. You don't just look at price; you look at volume, options data, and technical averages all at once.\n\nWhen all metrics align (e.g., Price is making Higher Highs, Delivery % is soaring, Put Writers are adding OI, and Price is above VWAP), you have highly **Bullish Institutional Flow**. Trading strictly with the flow dramatically increases your win rate compared to retail traders randomly guessing tops or bottoms."
  },
  pe: {
    title: "Price-to-Earnings (P/E) Ratio",
    content: "### Valuing a Company\n**Formula**: \n$P/E = \\\\frac{\\\\text{Market Price per Share}}{\\\\text{Earnings per Share (EPS)}}$\n\nThe P/E ratio relates a company's share price to its earnings per share (EPS). \n\n*   **High P/E**: Could mean a stock's price is high relative to earnings and possibly overvalued. Conversely, it could mean investors are expecting exceptionally high growth rates.\n*   **Low P/E**: Might indicate that the current stock price is low relative to earnings (undervalued value pick), or that the company has poor future prospects.\n\nAlways compare a stock's P/E to its historical average and its sector peers, never in isolation."
  },
  roe: {
    title: "Return on Equity (ROE)",
    content: "### Measuring Management Efficiency\n**Formula**: \n$ROE = \\\\frac{\\\\text{Net Income}}{\\\\text{Shareholders' Equity}}$\n\nROE is calculated by dividing net income by shareholders' equity. It measures how effectively management is using a company's assets to create actual cash profits.\n\nIt tells you exactly how many rupees of profit the company generates with each rupee of shareholder money provided to them.\n\n*   A strong company consistently delivers ROE safely above **15%**.\n*   *Warning*: If a company's debt is incredibly high, ROE can look artificially inflated."
  },
  dividend: {
    title: "Dividend Yield",
    content: "### The Passive Income Metric\n**Formula**: \n$\\\\text{Div. Yield} = \\\\frac{\\\\text{Annual Dividend per Share}}{\\\\text{Price per Share}} \\\\times 100$\n\nA financial ratio that represents how much a company pays out in dividends each year relative to its stock price. \n\n**Beware of Dividend Traps**:\nAn abnormally high dividend yield (e.g., > 10%) is often a red flag. It usually happens simply because the stock price has crashed violently, making the ratio look large temporarily."
  },
  debt: {
    title: "Debt-to-Equity (D/E) Ratio",
    content: "### Analyzing Financial Leverage\n**Formula**: \n$D/E = \\\\frac{\\\\text{Total Liabilities}}{\\\\text{Total Shareholders' Equity}}$\n\nThis structural ratio compares a company's total liabilities to its shareholder equity. It evaluates how much debt a company is using to finance its assets relative to its equity.\n\n*   **Ratio > 1.0**: Relies heavily on debt. Common in utilities or manufacturing.\n*   **Low D/E (< 0.5)**: Financially sound, bulletproof company."
  },
  pb: {
    title: "Price-to-Book (P/B) Ratio",
    content: "### Value Investing Benchmark\n**Formula**: \n$P/B = \\\\frac{\\\\text{Market Price per Share}}{\\\\text{Book Value per Share}}$\n\nP/B compares a firm's market capitalization to its book value. It essentially tells you how much the market is willing to pay for the company's net assets.\n\n*   **Low P/B (< 1.0)**: Potential undervalued asset.\n*   **High P/B**: Tech and high-growth companies often have high P/B due to intangible assets and future prospects."
  },
  fibo: {
     title: "Fibonacci Retracements",
     content: "### The Golden Ratio in Markets\nFibonacci retracement levels are horizontal lines that indicate where support and resistance are likely to occur. They are based on Fibonacci numbers, identifying the percentage of a prior move that has been retraced.\n\n**The Secret Rule**:\n*   **0.382 & 0.618 Levels**: These are the golden zones. In a healthy bull run, prices will constantly correct precisely down to the 0.618 level and find massive institutional buying pressure before shooting to new highs.\n* If a stock breaks far below its 0.618 retracement, the original trend is statistically considered invalidated."
  },
  bbands: {
     title: "Bollinger Bands",
     content: "### Volatility Mean Reversion\n**Formula**: \n$Upper = SMA + (2 \\\\times \\\\sigma)$ \n$Lower = SMA - (2 \\\\times \\\\sigma)$\n\nA technical analysis tool defined by a set of trendlines plotted two standard deviations (positively and negatively) away from a simple moving average (SMA) of a security's price.\n\n*   **The Squeeze**: When the bands come very close together, it indicates exceptionally low volatility. This is the calm before the storm—a massive, explosive breakout is imminent.\n*   **Riding the Band**: In extremely strong trends, price will successfully 'ride' the upper or lower band without pulling back to the moving average."
  },
  insthold: {
     title: "Institutional Holding %",
     content: "### Tracking the Smart Money\nThis defines how much of the company is actively owned by Mutual Funds, Pension Funds, Hedge Funds, and Foreign Institutional Investors.\n\n**Why it is a Cheat Code:**\n*   **Above 40-50%**: Institutions believe in the core utility and growth of the stock. It reduces extreme retail volatility.\n*   **Increasing Q-o-Q**: If mutual funds are actively increasing their stake quarter over quarter, they have insider models predicting massive earnings growth. Follow the smart money."
  },
  margins: {
     title: "Profit Margins",
     content: "### Operating & Net Profit Margins\nRevenue (Sales) means nothing if it doesn't translate to actual profits.\n\n*   **Operating Margin**: Shows how much profit a company makes on a rupee of sales after paying for variable costs of production. (A superb metric for comparing raw business efficiency against competitors).\n*   **Margin Expansion**: If a company's revenue is flat, but their margins are increasing, their stock price will still rocket. Watch for cost-cutting or pricing power dominance."
  },
  eps: {
     title: "Earnings Per Share (EPS)",
     content: "### The Ultimate Stock Driver\n**Formula**: \n$EPS = \\\\frac{\\\\text{Net Income} - \\\\text{Preferred Dividends}}{\\\\text{Weighted Avg Shares Outstanding}}$\n\nEPS is the portion of a company's profit allocated to each individual outstanding share of common stock. It serves as a definitive indicator of a company's profitability.\n\n**The Catalyst**:\nInstitutional models live and die by EPS. \n*   When a company reports an EPS that *beats* analyst estimates (an Earnings Surprise), the stock violently gaps up.\n*   A consistently growing EPS year-over-year is the single most reliable predictor of long-term sustainable stock price appreciation."
  },
  adx: {
    title: "ADX (Average Directional Index)",
    content: "### Measuring Trend Strength\n**Formula**: \n$ADX = 100 \\\\times \\\\frac{\\\\text{EMA of } |+DI - -DI|}{\\\\text{EMA of } |+DI + -DI|}$\n\nADX is used to quantify trend strength. It does not indicate trend direction, only how strong the current move is.\n\n*   **Below 20**: Weak Trend / Ranging. Statistical edge is low.\n*   **Above 25**: Strong Trend. High probability of continuation.\n*   **Above 40**: Very Strong Trend.\n*   **Above 50**: Extremely Strong Trend (caution: potential blow-off top)."
  },
  mfi: {
    title: "Money Flow Index (MFI)",
    content: "### The Volume-Weighted RSI\n**Formula**: \n$MFI = 100 - [100 / (1 + \\\\frac{\\\\text{Positive Money Flow}}{\\\\text{Negative Money Flow}})]$\n\nMFI uses both price and volume to measure buying and selling pressure. It is often called the 'Volume-Weighted RSI'.\n\n**Institutional Insight**:\nBecause MFI includes volume, it is much harder to manipulate than RSI. If price is rising but MFI is falling, it means institutions are secretly exiting their positions while retail is still buying the rally."
  },
  traps: {
    title: "Institutional Traps",
    content: "### Bull & Bear traps\n**Bull Trap**: Occurs when price breaks above a major resistance level, inviting retail buyers, only to violently reverse and stay below the level. This 'traps' the buyers in underwater positions.\n\n**Bear Trap**: Occurs when price dips below major support, forcing retail to panic sell or short, only for price to snap back and rally.\n\n**How to spot**: Look for long wicks at key levels accompanied by a rapid decrease in volume on the breakout attempt."
  },
  blocks: {
    title: "Order Blocks & FVG",
    content: "### Smart Money Footprints\n**Order Blocks (OB)**: Specific price areas where institutional buyers or sellers have placed massive limit orders. When price returns to these zones, it often reacts violently.\n\n**Fair Value Gaps (FVG)**: Occurs when there is an imbalance between buyers and sellers, leading to a rapid move that leaves a 'gap' in price action. Markets have a statistical tendency to return and 'fill' these gaps to restore equilibrium."
  },
  roc: {
    title: "Price ROC (Rate of Change)",
    content: "### Momentum Measurement\n**Formula**: \n$ROC = \\\\frac{Price_{current} - Price_{n}}{Price_{n}} \\\\times 100$\n\nROC is a pure momentum oscillator that measures the percentage change in price between the current period and a period 'n' days ago.\n\n**The Velocity Filter**:\n*   **Positive ROC**: Momentum is accelerating upwards.\n*   **Negative ROC**: Momentum is decelerating downwards.\n*   **ROC 125**: Often used as a long-term momentum filter to distinguish between a simple bounce and a true trend reversal."
  },
  cci: {
    title: "CCI (Commodity Channel Index)",
    content: "### Trend & Cycle Indicator\n**Formula**: \n$CCI = \\\\frac{\\\\text{Typical Price} - \\\\text{SMA of Typical Price}}{0.015 \\\\times \\\\text{Mean Deviation}}$\n\nCCI measures the current price level relative to an average price level over a given period of time.\n\n**Market Extremes**:\n*   **Above +100**: Indicates strong trend strength (Bullish).\n*   **Below -100**: Indicates strong trend weakness (Bearish).\n*   **Turning from extremes**: Often signals a cycle peak or bottom is being formed."
  }
};

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
  const [chartInterval, setChartInterval] = useState('1D');
  const [analysisMode, setAnalysisMode] = useState<'llm' | 'options' | 'fundamentals' | 'learning'>('fundamentals');
  const [llmPrediction, setLlmPrediction] = useState<string | null>(null);
  const [isGeneratingLlm, setIsGeneratingLlm] = useState(false);
  const [llmModel, setLlmModel] = useState('gemini-3-flash-preview');
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isCustomizingGpt, setIsCustomizingGpt] = useState(false);
  const [llmTemperature, setLlmTemperature] = useState(0.2);
  
  // Mandatory Disclaimer State
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tiker_disclaimer_accepted') === 'true';
    }
    return false;
  });

  const acceptDisclaimer = () => {
    localStorage.setItem('tiker_disclaimer_accepted', 'true');
    setHasAcceptedDisclaimer(true);
  };
  
  const [marketOverview, setMarketOverview] = useState<any[]>([]);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Academy Modal State
  const [selectedAcademyTopic, setSelectedAcademyTopic] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketOverview = async () => {
      try {
        const res = await fetch("/api/market-overview");
        const data = await res.json();
        setMarketOverview(data);
      } catch (err) {
        console.error("Failed to fetch market overview", err);
      }
    };
    
    fetchMarketOverview();
    const marketInterval = window.setInterval(fetchMarketOverview, 10000); // refresh every 10 secs
    return () => clearInterval(marketInterval);
  }, []);

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
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-black/40">Day Statistics</h3>
            <div className="text-[8px] font-bold text-black/20 uppercase tracking-widest">Historical Model Data</div>
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
          <div className="flex flex-col gap-1 relative group">
            <div className="flex items-center gap-2">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-black/40">Statistical Volatility Band</div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[8px] font-bold uppercase tracking-widest border border-blue-500/20">Educational Mode</span>
            </div>
            <div className="text-[8px] text-black/50 italic max-w-sm mt-1 mb-2">Not a trading call. Algorithmic projection based purely on historically mapped Standard Deviations & ATR for educational analysis.</div>
          </div>
          
          <div className="flex justify-between items-center bg-black/5 rounded-2xl p-4">
            <div>
              <div className="text-[7px] font-bold text-black/40 uppercase tracking-widest mb-1">Upper Statistical Bound</div>
              <div className="text-[12px] font-black font-mono text-emerald-600">₹{analysis?.intraday?.high?.level?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}</div>
              <div className="text-[8px] font-bold text-black/40 uppercase mt-1">Confluence Match: {analysis?.intraday?.high?.prob || 0}%</div>
              <div className="text-[7px] font-bold text-emerald-600/70 uppercase mt-0.5">Resistance Data: {analysis?.intraday?.high?.confluence}</div>
            </div>
            <div className="w-[1px] h-8 bg-black/10" />
            <div className="text-right">
              <div className="text-[7px] font-bold text-black/40 uppercase tracking-widest mb-1">Lower Statistical Bound</div>
              <div className="text-[12px] font-black font-mono text-rose-600">₹{analysis?.intraday?.low?.level?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}</div>
              <div className="text-[8px] font-bold text-black/40 uppercase mt-1">Confluence Match: {analysis?.intraday?.low?.prob || 0}%</div>
              <div className="text-[7px] font-bold text-rose-600/70 uppercase mt-0.5">Support Data: {analysis?.intraday?.low?.confluence}</div>
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

  const selectStock = async (stock: Stock, newInterval = chartInterval) => {
    setSelectedStock(stock);
    setChartInterval(newInterval);
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

Intraday Statistical Bounds (Pre-computed Educational Model):
Upper Bound: ${analysis.intraday.high.level.toFixed(2)} (Prob: ${analysis.intraday.high.prob}%)
Lower Bound: ${analysis.intraday.low.level.toFixed(2)} (Prob: ${analysis.intraday.low.prob}%)

Historical Structural Patterns:
${analysis.traps.length > 0 ? analysis.traps.map(t => `- ${t.type} at ${t.level} (Severity: ${t.severity}): ${t.description}`).join('\n') : 'No significant patterns detected.'}

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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
        } else {
          setChatMessages(prev => [...prev, { role: 'model', content: "Please provide a valid Gemini API key to use the Tiker 360 Plus Assistant." }]);
          setIsChatLoading(false);
          return;
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const disclaimer = `CRITICAL REGULATION: You are a "Tiker 360 Plus AI Educational Assistant". You must ALWAYS act strictly as an educational entity. You are NOT a SEBI-registered advisor. Under absolutely no circumstances can you provide specific entry targets, specific stop losses, "buy" or "sell" recommendations, or actionable investment advice. Always reframe queries into statistical bounds, historical support/resistance analysis, or technical indicator explanations.\n\n`;
      const contextStr = selectedStock 
        ? `${disclaimer}The user is currently studying the data for ${selectedStock.name} (${selectedStock.symbol}). Provide objective, historical insights regarding technical setups, volatility, and options without advising action.\n\n`
        : `${disclaimer}Provide professional, objective, institutional-grade insights into stock markets, historical technical analysis, and educational trading concepts.\n\n`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: contextStr + userMessage,
      });

      setChatMessages(prev => [...prev, { role: 'model', content: response.text || "Sorry, I couldn't process that request." }]);
    } catch (e) {
      console.error("Chat error", e);
      setChatMessages(prev => [...prev, { role: 'model', content: "An error occurred while communicating with the AI Engine." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current && isChatOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

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
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                    marketStatus.isOpen ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                  )}>
                    <div className={cn("w-1 h-1 rounded-full", marketStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                    <span className="text-[7px] font-black uppercase tracking-widest">
                      {marketStatus.isOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </div>
                  <span className="hidden lg:block text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">Educational Platform</span>
                </div>
              </div>
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

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Center: Main Analysis Engine */}
        <div className="w-full space-y-8">
          {!selectedStock ? (
            <div className="min-h-[60vh] md:min-h-[75vh] flex flex-col items-center justify-center text-center glass-card rounded-[3rem] md:rounded-[4rem] relative overflow-hidden py-16 px-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)]" />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 md:w-32 md:h-32 bg-white text-black rounded-full flex items-center justify-center mb-8 md:mb-12 shadow-2xl relative z-10"
              >
                <Zap className="w-10 h-10 md:w-14 md:h-14" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-euro tracking-tighter mb-6 md:mb-8 relative z-10 leading-none uppercase">TIKER 360 PLUS<span className="text-white/20">.</span></h1>

              {marketOverview.length > 0 && (
                <div className="mt-16 relative z-10 w-full max-w-2xl px-4 animate-in fade-in duration-1000">
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <div className={cn("w-1.5 h-1.5 rounded-full", marketStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Live Market Indices</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {marketOverview.map((idx, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors cursor-pointer" onClick={() => selectStock({ symbol: idx.symbol, scripCode: idx.symbol, name: idx.name })}>
                        <h4 className="text-[9px] font-black uppercase text-white/50 tracking-widest mb-2 line-clamp-1 truncate w-full">{idx.name}</h4>
                        <div className="text-sm font-mono font-black mb-1">
                          {idx.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className={cn(
                          "text-[9px] font-bold flex items-center gap-1",
                          idx.change >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {idx.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          {Math.abs(idx.change).toFixed(2)} ({Math.abs(idx.pChange).toFixed(2)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !analysis || !stockData ? (
            <div className="h-[75vh] flex flex-col items-center justify-center text-center glass-card rounded-[4rem]">
              <div className="relative w-20 h-20 mb-10">
                <Loader2 className="w-full h-full text-white/20 animate-spin" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white/40" />
                </div>
              </div>
              <h2 className="text-[10px] dot-matrix text-white/40">Computing Statistical Model Data...</h2>
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
                  <button
                    onClick={() => setAnalysisMode('learning')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                      analysisMode === 'learning' ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-white/30 hover:text-white/60"
                    )}
                  >
                    <BookOpen className="w-3 h-3" />
                    Learning
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
                      <div className="text-[8px] dot-matrix text-white/20 mb-2">Statistical Bias</div>
                      <div className={cn(
                        "text-2xl md:text-3xl font-euro tracking-tighter uppercase",
                        analysis?.structure.includes("Bullish") ? "text-emerald-400" : analysis?.structure.includes("Bearish") ? "text-rose-400" : "text-white/40"
                      )}>
                        {analysis?.structure.replace("Swing", "Bias")}
                      </div>
                    </div>
                  </div>
                  <div className="text-center sm:text-right w-full sm:w-auto">
                    <div className="text-[8px] dot-matrix text-white/20 mb-3">Model Confluence</div>
                    <div className={cn(
                      "px-8 md:px-10 py-3 md:py-4 rounded-full text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase transition-all inline-block",
                      verdict.includes("POSITIVE") || verdict.includes("BULLISH") ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" : 
                      verdict.includes("NEGATIVE") || verdict.includes("BEARISH") ? "bg-rose-500 text-black shadow-[0_0_20px_rgba(244,63,94,0.3)]" : 
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
                    Statistical Price Action Model
                  </h3>
                  <div className="flex bg-white/[0.03] rounded-full p-1 border border-white/5 w-full sm:w-auto justify-center">
                    {['1D', '1W', '1M'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setChartInterval(t)}
                        className={cn(
                          "flex-1 sm:flex-none px-6 py-2 rounded-full text-[9px] dot-matrix transition-all",
                          chartInterval === t ? "bg-white text-black" : "text-white/20 hover:text-white/40"
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
                              <Label value="HISTORICAL SUPPORT" position="right" fill="#10b98140" fontSize={8} className="dot-matrix" />
                            </ReferenceLine>
                          )}
                          {analysis.sellZones[0] && (
                            <ReferenceLine y={analysis.sellZones[0].entry} stroke="#f43f5e40" strokeWidth={1}>
                              <Label value="HISTORICAL RESISTANCE" position="right" fill="#f43f5e40" fontSize={8} className="dot-matrix" />
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

              {/* Statistical EMA Ribbon */}
              <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
                <h3 className="text-[9px] dot-matrix text-white/30 mb-10 flex items-center gap-2">
                  Quantitative EMA Ribbon
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
                  
                  {/* Consensus Data Matrix */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h4 className="text-[9px] dot-matrix text-white/40 uppercase mb-4">Market Consensus Data</h4>
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
                          <span className="text-[8px] font-black">{stockData.recommendationKey === 'buy' || stockData.recommendationKey === 'strong_buy' ? 'BULLISH' : stockData.recommendationKey === 'sell' || stockData.recommendationKey === 'strong_sell' ? 'BEARISH' : stockData.recommendationKey === 'hold' ? 'NEUTRAL' : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-white/60 uppercase mb-2">Consensus Bias</div>
                        <div className="flex justify-between items-center bg-black/20 rounded-lg p-2">
                          <span className="text-[8px] text-white/40 uppercase">Projected Resistance</span>
                          <span className="text-[10px] font-mono font-bold text-blue-400">₹{stockData.targetMeanPrice?.toFixed(2) || '---'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistical Data Matrix */}
                <div className="lg:col-span-7 glass-card rounded-[2rem] p-8">
                  <h3 className="text-[9px] dot-matrix text-white/30 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Statistical Data Matrix
                  </h3>
                  <div className="space-y-3">
                    {[
                      { 
                        title: 'Intrinsic Value Mapping', 
                        desc: 'Current PE vs Historical Averages', 
                        pass: stockData.peRatio != null ? stockData.peRatio < 25 : null 
                      },
                      { 
                        title: 'Profitability Ratio', 
                        desc: 'Return on Equity (ROE) > 15%', 
                        pass: stockData.roe != null ? stockData.roe > 0.15 : null 
                      },
                      { 
                        title: 'Financial Momentum', 
                        desc: 'Positive Revenue Direction', 
                        pass: stockData.revenueGrowth != null ? stockData.revenueGrowth > 0 : null 
                      },
                      { 
                        title: 'Dividend Statistics', 
                        desc: 'Dividend Yield > 1.0%', 
                        pass: stockData.dividendYield != null ? stockData.dividendYield > 0.01 : false 
                      },
                      { 
                        title: 'Debt Assessment', 
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
                          {idx.pass === null ? 'No Data' : idx.pass ? 'Meets Criteria' : 'Below Criteria'}
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
                      <p className="text-[9px] dot-matrix text-white/40">Educational Data Analytics & Probability (Groww Data)</p>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
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

          {/* Learning Module */}
          {analysisMode === 'learning' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="glass-card rounded-[2rem] p-8 md:p-10 border-2 border-purple-500/30">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center border-2 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <BookOpen className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-euro uppercase tracking-widest">Trading Academy</h3>
                        <p className="text-[9px] dot-matrix text-white/40 mt-1">Master quantitative concepts and indicators</p>
                      </div>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {/* Card 1: Statistical Pattern Structure */}
                     <div onClick={() => setSelectedAcademyTopic('structure')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400"/> Pricing Structure</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The foundation of technical data. Markets move in trends or ranges. Historical patterns show accumulation at support and distribution at resistance.</p>
                        <div className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">Applies to: {selectedStock?.symbol} ({analysis?.structure})</div>
                     </div>

                      {/* Card 2: RSI */}
                      <div onClick={() => setSelectedAcademyTopic('rsi')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400"/> RSI</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $100 - [100/(1+RS)]$. Measures speed & change of price movements. 70+ = Exhaustion, 30- = Oversold.</p>
                         <div className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded inline-block">Current RSI: {analysis?.indicators.rsi.toFixed(2)}</div>
                      </div>

                     {/* Card 3: ATR */}
                     <div onClick={() => setSelectedAcademyTopic('atr')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Maximize className="w-4 h-4 text-amber-400"/> ATR</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Average True Range measures market volatility. Quantitative models use ATR to define risk thresholds (e.g., 1.5x ATR) to account for standard market noise.</p>
                        <div className="text-[8px] font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded inline-block">Current ATR: ₹{analysis?.indicators.atr.toFixed(2)}</div>
                     </div>

                     {/* Card 4: Max Pain (Options) */}
                     <div onClick={() => setSelectedAcademyTopic('maxpain')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-rose-400"/> Max Pain</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The strike price where the highest number of options expire worthless. Option writers often try to pin the price here at expiry.</p>
                        <div className="text-[8px] font-mono text-rose-400 bg-rose-400/10 px-2 py-1 rounded inline-block">Current Max Pain: {optionsData && optionsData.maxPain ? optionsData.maxPain : 'N/A'}</div>
                     </div>

                      {/* Card 5: PCR (Put-Call Ratio) */}
                      <div onClick={() => setSelectedAcademyTopic('pcr')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><PieChart className="w-4 h-4 text-purple-400"/> Put-Call Ratio</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $\sum Put OI / \sum Call OI$. Sentiment gauge: {'>'} 1 = Bearish bias usually, but extremes act as contrarian signals.</p>
                         <div className="text-[8px] font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded inline-block">Current PCR: {optionsData && optionsData.pcr ? optionsData.pcr.toFixed(2) : 'N/A'}</div>
                      </div>

                     {/* Card 6: VWAP */}
                     <div onClick={() => setSelectedAcademyTopic('vwap')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400"/> VWAP</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Volume Weighted Average Price. Price above VWAP signifies bullish institutional volume. Price below VWAP = Bearish.</p>
                        <div className="text-[8px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded inline-block">Institutions use VWAP for entries</div>
                     </div>

                     {/* Card 7: MACD */}
                     <div onClick={() => setSelectedAcademyTopic('macd')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-emerald-400"/> MACD</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Moving Average Convergence Divergence. Used to spot changes in strength, direction, momentum, and duration of a trend. Look for crossovers.</p>
                        <div className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">MACD Histogram: {analysis && "macd" in analysis.indicators && analysis.indicators.macd && typeof analysis.indicators.macd === 'object' && "histogram" in analysis.indicators.macd ? Number(analysis.indicators.macd.histogram).toFixed(2) : 'N/A'}</div>
                     </div>

                     {/* Card 8: Exponential Moving Averages (EMA) */}
                     <div onClick={() => setSelectedAcademyTopic('ema')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-orange-400"/> EMA 50 & 200</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Dynamic support/resistance. The 50 EMA acts as medium-term trend, and 200 EMA as long-term. "Golden Cross" (50 crosses above 200) indicates major bull trend.</p>
                        <div className="text-[8px] font-mono text-orange-400 bg-orange-400/10 px-2 py-1 rounded inline-block">50 EMA: ₹{analysis && "ema50" in analysis.indicators ? Number(analysis.indicators.ema50).toFixed(2) : '--'} | 200: ₹{analysis && "ema200" in analysis.indicators ? Number(analysis.indicators.ema200).toFixed(2) : '--'}</div>
                     </div>

                     {/* Card 9: Delivery Percentage */}
                     <div onClick={() => setSelectedAcademyTopic('delivery')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400"/> Delivery %</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The percentage of shares actually taken into demat accounts versus intraday speculation. High delivery ({">"} 50%) indicates strong institutional conviction.</p>
                        <div className="text-[8px] font-mono text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded inline-block">Current Delivery: {stockData && "delivery" in stockData ? Number(stockData.delivery).toFixed(2) + '%' : 'N/A'}</div>
                     </div>

                     {/* Card 10: OI Analysis */}
                     <div onClick={() => setSelectedAcademyTopic('oi')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-pink-400"/> Open Interest Base</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Tracks active option contracts. Huge put OI acts as strong support, while massive call OI acts as a ceiling/resistance placed by big institutional writers.</p>
                        <div className="text-[8px] font-mono text-pink-400 bg-pink-400/10 px-2 py-1 rounded inline-block">OI Sup: {optionsData?.oiSupport || 'N/A'} | OI Res: {optionsData?.oiResistance || 'N/A'}</div>
                     </div>

                     {/* Card 11: Pivot Points */}
                     <div onClick={() => setSelectedAcademyTopic('pivots')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-yellow-400"/> Pivot Points</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Mathematical levels predicting future support and resistance. Institutions use daily and weekly pivots to place limit orders and take profits automatically.</p>
                        <div className="text-[8px] font-mono text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded inline-block">Central Pivot: ₹{analysis?.pivots?.pp ? analysis.pivots.pp.toFixed(2) : 'N/A'}</div>
                     </div>

                     {/* Card 12: SuperTrend / Flow */}
                     <div onClick={() => setSelectedAcademyTopic('flow')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-300"/> Institutional Flow</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Overall synthesis of moving averages, volatility, and volume. Indicates if smart money is accumulating, distributing, or stepping aside.</p>
                        <div className="text-[8px] font-mono text-emerald-300 bg-emerald-300/10 px-2 py-1 rounded inline-block">Flow Bias: {analysis && "institutionalFlow" in analysis && analysis.institutionalFlow && typeof analysis.institutionalFlow === 'object' && "institutionalBias" in analysis.institutionalFlow ? String(analysis.institutionalFlow.institutionalBias) : 'Neutral'}</div>
                     </div>
                      {/* Card 13: P/E Ratio */}
                      <div onClick={() => setSelectedAcademyTopic('pe')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><PieChart className="w-4 h-4 text-blue-300"/> P/E Ratio</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $Price / EPS$. Valuation metric. High P/E suggest high growth expectations or overvaluation.</p>
                         <div className="text-[8px] font-mono text-blue-300 bg-blue-300/10 px-2 py-1 rounded inline-block">Current P/E: {stockData?.peRatio ? stockData.peRatio.toFixed(2) : 'N/A'}</div>
                      </div>

                      {/* Card 14: ROE */}
                      <div onClick={() => setSelectedAcademyTopic('roe')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-green-300"/> ROE</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $Net Income / Equity$. Efficiency ratio. Measures profit generated per rupee of shareholder capital.</p>
                         <div className="text-[8px] font-mono text-green-300 bg-green-300/10 px-2 py-1 rounded inline-block">Current ROE: {stockData?.roe ? (stockData.roe * 100).toFixed(2) + '%' : 'N/A'}</div>
                      </div>

                      {/* Card 15: Dividend Yield */}
                      <div onClick={() => setSelectedAcademyTopic('dividend')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-amber-300"/> Dividend Yield</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $DPS / Price$. Represents the return on investment through dividends alone, excluding stock price appreciation.</p>
                         <div className="text-[8px] font-mono text-amber-300 bg-amber-300/10 px-2 py-1 rounded inline-block">Yield: {stockData?.dividendYield ? (stockData.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</div>
                      </div>

                      {/* Card 16: Debt to Equity */}
                      <div onClick={() => setSelectedAcademyTopic('debt')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-300"/> D/E Ratio</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $Liabilities / Equity$. Financial leverage gauge. Higher ratio = higher risk in volatility cycles.</p>
                         <div className="text-[8px] font-mono text-rose-300 bg-rose-300/10 px-2 py-1 rounded inline-block">D/E Ratio: {stockData?.debtToEquity ? stockData.debtToEquity.toFixed(2) : 'N/A'}</div>
                      </div>

                      {/* Card 17: Price-to-Book (P/B) Ratio */}
                      <div onClick={() => setSelectedAcademyTopic('pb')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-300"/> P/B Ratio</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $Price / Book Value$. Compares market value to tangible asset value. {">"} 1.0 means paying premium over assets.</p>
                         <div className="text-[8px] font-mono text-cyan-300 bg-cyan-300/10 px-2 py-1 rounded inline-block">P/B: {stockData?.pbRatio ? stockData.pbRatio.toFixed(2) : 'N/A'}</div>
                      </div>

                     {/* Card 18: Institutional Holding */}
                     <div onClick={() => setSelectedAcademyTopic('insthold')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-purple-300"/> Institutional Play</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The amount of the company owned by large hedge funds and mutual funds. Heavy institutional ownership stabilizes the stock against retail panic.</p>
                        <div className="text-[8px] font-mono text-purple-300 bg-purple-300/10 px-2 py-1 rounded inline-block">Smart Money Held: {stockData?.institutionsHeld ? (stockData.institutionsHeld * 100).toFixed(1) + '%' : 'N/A'}</div>
                     </div>

                     {/* Card 19: Profit Margins */}
                     <div onClick={() => setSelectedAcademyTopic('margins')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-300"/> Profit Margins</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The core indicator of pricing power and operational efficiency. Expanding profit margins naturally force the stock price higher over time.</p>
                        <div className="text-[8px] font-mono text-emerald-300 bg-emerald-300/10 px-2 py-1 rounded inline-block">Operating: {stockData?.operatingMargins ? (stockData.operatingMargins * 100).toFixed(1) + '%' : 'N/A'}</div>
                     </div>

                      {/* Card 20: Earnings Per Share (EPS) */}
                      <div onClick={() => setSelectedAcademyTopic('eps')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                         <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-amber-300"/> EPS Tracker</h4>
                         <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $Net Income / Shares$. Core indicator of profitability allocated to each share of common stock.</p>
                         <div className="text-[8px] font-mono text-amber-300 bg-amber-300/10 px-2 py-1 rounded inline-block">Trailing EPS: ₹{stockData?.eps ? stockData.eps.toFixed(2) : 'N/A'}</div>
                      </div>

                     {/* Card 21: Bollinger Bands */}
                     <div onClick={() => setSelectedAcademyTopic('bbands')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-teal-300"/> Bollinger Bands</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Volatility bands placed above and below a moving average. A 'Bollinger Squeeze' indicates that a massive explosive move is imminent.</p>
                        <div className="text-[8px] font-mono text-teal-300 bg-teal-300/10 px-2 py-1 rounded inline-block">Algorithmic Volatility Tracker</div>
                     </div>

                     {/* Card 22: Fibonacci Retracements */}
                     <div onClick={() => setSelectedAcademyTopic('fibo')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400"/> Fibonacci Zones</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The Golden Ratio 0.618 is statistically the most high-probability retracement bounce zone for institutional limit buy orders during a bull market.</p>
                        <div className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded inline-block">Precision Reaction Levels</div>
                     </div>

                     {/* Card 23: ADX */}
                     <div onClick={() => setSelectedAcademyTopic('adx')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-orange-400"/> ADX Trend Strength</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: {"$100 \\times \\text{EMA}(|DI|)$"}. Measures the strength of the trend regardless of direction. {">"} 25 = Strong trend.</p>
                        <div className="text-[8px] font-mono text-orange-400 bg-orange-400/10 px-2 py-1 rounded inline-block">Current ADX: {analysis?.indicators.adx ? analysis.indicators.adx.toFixed(1) : 'N/A'}</div>
                     </div>

                     {/* Card 24: MFI */}
                     <div onClick={() => setSelectedAcademyTopic('mfi')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400"/> Money Flow Index</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The Volume-Weighted RSI. Identifies institutional accumulation vs retail momentum. Harder to manipulate than standard RSI.</p>
                        <div className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">Current MFI: {analysis?.indicators.mfi ? analysis.indicators.mfi.toFixed(1) : 'N/A'}</div>
                     </div>

                     {/* Card 25: Institutional Traps */}
                     <div onClick={() => setSelectedAcademyTopic('traps')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-rose-400"/> Institutional Traps</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Detection of Bull and Bear Traps (Fake Breakouts). Spotting where retail is 'trapped' by institutional stop-loss hunting.</p>
                        <div className="text-[8px] font-mono text-rose-400 bg-rose-400/10 px-2 py-1 rounded inline-block">Traps Detected: {analysis?.traps.length || 0}</div>
                     </div>

                     {/* Card 26: Order Blocks */}
                     <div onClick={() => setSelectedAcademyTopic('blocks')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-400"/> Order Blocks / FVG</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Smart Money footprints. Price gaps (FVG) and consolidation zones (OB) that acts as high-probability magnets for institutional orders.</p>
                        <div className="text-[8px] font-mono text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded inline-block">Institutional Price Anchors</div>
                     </div>

                     {/* Card 27: ROC */}
                     <div onClick={() => setSelectedAcademyTopic('roc')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400"/> Rate of Change</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: {"$[(Price_{now} - Price_{prev})/Price_{prev}] \\times 100$"}. Pure momentum oscillator. ROC 125 tracks long-term cyclical velocity.</p>
                        <div className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">Momentum Velocity Tracker</div>
                     </div>

                     {/* Card 28: CCI */}
                     <div onClick={() => setSelectedAcademyTopic('cci')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-yellow-400"/> CCI Index</h4>
                        <p className="text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Commodity Channel Index. Identifies cyclic trends. Values above +100 indicate strong bullish momentum, below -100 indicate bearish.</p>
                        <div className="text-[8px] font-mono text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded inline-block">Cyclical Strength Engine</div>
                     </div>

                  </div>
               </div>
            </div>
          )}
            </div>
          )}
        </div>
      </main>

      {/* System Status Bar */}
      <footer className="border-t border-white/5 bg-black/80 backdrop-blur-3xl h-auto md:h-12 fixed bottom-0 left-0 right-0 z-50 py-3 md:py-0">
        <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center gap-6 md:gap-10">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[8px] dot-matrix text-white/40 uppercase tracking-[0.2em] font-bold">Market Live</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[8px] dot-matrix text-white/20 uppercase tracking-[0.2em]">Golden Rule</span>
              <span className="text-[8px] font-mono text-white/60 font-bold">Capital protection &gt; Opportunity. Educational analysis only.</span>
            </div>
          </div>
          <div className="flex items-center gap-6 md:gap-10">
            <div className="hidden lg:flex items-center gap-2 text-[7px] text-rose-500 uppercase font-bold tracking-widest bg-rose-500/10 px-2 py-1 rounded">
              <Shield className="w-3 h-3" />
              <span>Not a SEBI registered advisor. No buy/sell calls.</span>
            </div>
            <span className="text-[8px] dot-matrix text-white/20 uppercase tracking-[0.2em]">© 2026 TIKER 360 PLUS</span>
            <div className="hidden sm:block h-3 w-px bg-white/5" />
            <span className="hidden sm:block text-[8px] dot-matrix text-white/40 uppercase tracking-[0.2em] font-bold">Institutional Data Analytics</span>
          </div>
        </div>
      </footer>

      {/* Academy Modal */}
      <AnimatePresence>
        {selectedAcademyTopic && ACADEMY_MODULES[selectedAcademyTopic] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAcademyTopic(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-purple-500/30 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col no-scrollbar relative"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5 p-6 md:p-8 flex items-center justify-between z-10">
                 <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
                   <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                     <BookOpen className="w-4 h-4 text-purple-400" />
                   </div>
                   {ACADEMY_MODULES[selectedAcademyTopic].title}
                 </h2>
                 <button onClick={() => setSelectedAcademyTopic(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              
              {/* Content Body */}
              <div className="p-6 md:p-8 pt-4">
                 <div className="markdown-body prose-invert text-sm md:text-base leading-relaxed text-white/80">
                   <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                     {ACADEMY_MODULES[selectedAcademyTopic].content}
                   </ReactMarkdown>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chatbot */}
      <div className="fixed bottom-16 right-6 z-[100] flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-4 w-[340px] h-[450px] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="flex bg-blue-600/10 items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Tiker Assistant</h4>
                    <p className="text-[8px] dot-matrix text-white/50 uppercase">Online</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <Activity className="w-8 h-8 mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Ask about technical analysis or {selectedStock?.symbol || 'data indicators'}</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white rounded-tr-sm" 
                        : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                    )}>
                       <div className="markdown-body text-[11px] prose-invert">
                         <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                       </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex w-full justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                       <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                       <span className="text-[10px] text-white/60">Computing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-white/5 bg-black/40">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1 focus-within:border-blue-500/50 transition-colors">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask standard query..."
                    className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-[11px] text-white placeholder-white/30 font-mono"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 z-50",
            isChatOpen ? "bg-rose-600 hover:bg-rose-500 rotate-90" : "bg-blue-600 hover:bg-blue-500"
          )}
        >
          {isChatOpen ? <X className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Mandatory Regulatory Disclaimer Modal */}
      <AnimatePresence>
        {!hasAcceptedDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full glass-card border-rose-500/30 p-8 md:p-12 text-center"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
                <Shield className="w-10 h-10 text-rose-500" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Regulatory Disclaimer</h1>
              <div className="text-white/60 text-xs leading-relaxed space-y-4 mb-10 text-left max-h-[300px] overflow-y-auto pr-4 no-scrollbar">
                <p>
                  <strong>1. Non-Registration with SEBI:</strong> Tiker 360 Plus Analytics is strictly an <strong>EDUCATIONAL AND ANALYTICS PLATFORM</strong>. We are NOT a SEBI-registered Investment Advisor (RIA) or Research Analyst.
                </p>
                <p>
                  <strong>2. No Financial Advice:</strong> All information, data, and analytical models provided on this platform are for educational purposes only. Nothing on this website constitutes an offer to buy/sell, a solicitation, or a recommendation to invest in any securities or financial products.
                </p>
                <p>
                  <strong>3. Risk Disclosure:</strong> Trading and investing in stock markets involves significant risk of loss. Past performance (including historical Support/Resistance levels) is not indicative of future results.
                </p>
                <p>
                  <strong>4. User Responsibility:</strong> You are solely responsible for your own investment decisions. We strongly recommend consulting with a qualified and SEBI-registered financial advisor before making any financial commitments.
                </p>
                <p>
                  <strong>5. Accuracy of Data:</strong> While we strive for accuracy, analytical models and third-party data may contain errors or delays. Use this platform as a learning tool, not a decision-making engine.
                </p>
              </div>
              <button 
                onClick={acceptDisclaimer}
                className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                I Understand & Accept
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
