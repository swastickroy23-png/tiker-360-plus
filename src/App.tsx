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
  Send,
  Settings
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

import { BLOG_POSTS, type BlogPost } from './constants/blogPosts';
import { ScannersDashboard } from './components/ScannersDashboard';
import { OptionsCalculator } from './components/OptionsCalculator';
import { VolatilityBand } from './components/VolatilityBand';

import { AcademyDashboard } from './components/AcademyDashboard';
import { WatchlistDashboard } from './components/WatchlistDashboard';

import { SettingsModal } from './components/SettingsModal';
import { TechnicalChart } from './components/TechnicalChart';
import { Heatmap } from './components/Heatmap';

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

const DEFAULT_SYSTEM_PROMPT = `
# IDENTITY
You are "ORBIT", the predictive core of Tiker 360 Plus. You represent the most advanced synthesis of quantitative data and natural language intelligence.
`;

const ACADEMY_MODULES: Record<string, { title: string; content: string; visual?: string }> = {
  structure: {
    title: "Market Structure",
    content: "### The Core of Price Action\nMarkets do not move in straight lines. They move in a series of zig-zags. \n\n**Bullish Structure**: Characterized by Higher Highs (HH) and Higher Lows (HL). This pattern often reflects accumulation phases.\n\n**Bearish Structure**: Characterized by Lower Highs (LH) and Lower Lows (LL). This pattern often reflects distribution phases.\n\n**Range / Consolidation**: Sideways movement where supply and demand are in equilibrium. Breakouts from these zones are statistically significant events.\n\n**Analytical Note**: Market analysts typically prioritize the primary structure. If the daily timeframe exhibits HH and HL, the overall bias is considered bullish regardless of short-term volatility."
  },
  strat_bullish: {
    title: "Bullish Options Strategies",
    visual: "strategy_bullish",
    content: "### Capturing Upside Momentum\nBullish strategies are used when you expect the underlying asset to rise. They range from simple buying to complex capped-risk spreads.\n\n#### 📈 Strategic Playbook\n*   **Long Call**: Direct bet on upside. Unlimited profit potential with risk limited to premium paid.\n*   **Bull Call Spread**: Buying an ITM/ATM call and selling an OTM call. Capped risk and capped profit, with reduced cost.\n*   **Bull Put Spread**: Selling an OTM put and buying a further OTM put. An income strategy for neutral-to-bullish bias.\n*   **Ratio Call Spread**: Selling more OTM calls than you buy. Profits if the market rises slightly but stays below a ceiling.\n*   **Call Ratio Back Spread**: Buying more OTM calls than you sell. Profits from explosive upside moves with low cost.\n*   **Bull Call Ladder**: Adding another sold OTM call to a Bull Call Spread to further reduce cost, but adding risk if the price spikes too high.\n\n**Analytical Tip**: Use Bullish spreads when IV is high to benefit from theta decay, and Long Calls when IV is low to benefit from volatility expansion."
  },
  long_call: {
    title: "Long Call (Directional Leverage)",
    visual: "strat_long_call",
    content: "### The Power of Leverage\nBuying a call option gives you the right to buy the underlying at a specific price. It is the purest form of bullish speculation.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: High Delta, High Gamma.\n*   **Risk**: Limited to Premium Paid.\n*   **Reward**: Theoretically Unlimited.\n*   **Ideal Environment**: Low IV with a sharp upward catalyst.\n\n**Strategic Edge**: Use OTM calls for low-probability high-reward 'lottery' plays, and ITM calls for high-probability 'delta' proxy trading."
  },
  bull_call_spread: {
    title: "Bull Call Spread (Vertical)",
    visual: "strat_bull_call_spread",
    content: "### Capped Risk, Capped Reward\nA combination of buying a call and selling a higher-strike call. This offsets the cost of the trade.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Delta positive, Theta neutral.\n*   **Risk**: Low (Limited to net debit).\n*   **Reward**: Limited (Difference between strikes - net debit).\n*   **Ideal Environment**: Steady, grinding bull market.\n\n**Strategic Edge**: By selling the OTM call, you effectively pay less for your bullish position and hedge against minor time decay."
  },
  bull_put_spread: {
    title: "Bull Put Spread (Credit)",
    visual: "strat_bull_put_spread",
    content: "### Generating Income from Bull Bias\nSelling a put and buying a lower-strike put as protection. You profit if the stock stays above your sold strike.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Theta positive, Delta positive.\n*   **Risk**: Limited to strike gap.\n*   **Reward**: Limited to credit received.\n*   **Ideal Environment**: High IV Rank falling into a sideways/bullish move.\n\n**Strategic Edge**: The 'House' strategy. You make money even if the stock stays flat, moves slightly up, or even slightly down (as long as it stays above your strike)."
  },
  ratio_call_spread: {
    title: "Ratio Call Spread",
    visual: "strat_ratio_call_spread",
    content: "### The Precision Squeeze\nBuying one call and selling two (or more) further OTM calls. Profitable if the stock rises to the sold strike but stays below it.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Theta positive (slightly), Vega negative.\n*   **Risk**: Unlimited (if price explodes past the sold strikes).\n*   **Reward**: Maximum at the sold strike.\n*   **Ideal Environment**: Target-based bull moves with expected exhaustion.\n\n**Strategic Edge**: Use this when you have a very specific upside target. It often allows for a 'Free' trade if the credit from sold calls covers the cost of the long call."
  },
  call_ratio_back_spread: {
    title: "Call Ratio Back Spread",
    visual: "strat_call_ratio_back",
    content: "### Explosive Upside Protection\nSelling one call and buying two (or more) further OTM calls. Primarily used when you expect a massive move.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Positive Gamma, Positive Vega.\n*   **Risk**: Limited (max loss occurs if price ends exactly at the sold strike).\n*   **Reward**: Unlimited profit on the upside.\n*   **Ideal Environment**: Before massive news or breakout after long consolidation.\n\n**Strategic Edge**: Unlike a long call, if the market crashes, you may still keep a small credit or have zero loss, essentially providing a 'one-way' bet."
  },
  bull_call_ladder: {
    title: "Bull Call Ladder",
    visual: "strat_bull_call_ladder",
    content: "### Super-Hedged Momentum\nA bull call spread with an additional sold far-OTM call to further reduce cost or create a credit.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Negative Vega, Positive Theta.\n*   **Risk**: High (Unlimited on high-side spikes).\n*   **Reward**: Capped at the middle strike.\n*   **Ideal Environment**: Grinding bull trend with a hard resistance ceiling.\n\n**Strategic Edge**: Perfect for 'Free' bullish exposures during high IV environments where you don't expect a vertical melt-up."
  },
  strat_bearish: {
    title: "Bearish Options Strategies",
    visual: "strategy_bearish",
    content: "### Profiting from Market Downside\nBearish strategies capitalize on falling prices. They are essential for hedging portfolios or direct bearish speculation.\n\n#### 📉 Strategic Playbook\n*   **Long Put**: The simplest bearish play. Buying a put gives you the right to sell at the strike price.\n*   **Bear Put Spread**: Buying an ITM/ATM put and selling an OTM put. Best for steady, predictable downtrends.\n*   **Bear Call Spread**: Selling an OTM call and buying a further OTM call. Income generation in a bearish or sideways market.\n*   **Ratio Put Spread**: Selling more puts than you buy. Use only when you are slightly bearish and willing to own the stock at much lower prices.\n*   **Put Ratio Back Spread**: Buying more puts than you sell. The ultimate 'Crash' protection for explosive downside moves.\n\n**Analytical Tip**: Bearish moves happen faster than bullish moves due to fear-driven selling. Spreads help manage the higher volatility often associated with downtrends."
  },
  long_put: {
    title: "Long Put (Crash Protection)",
    visual: "strat_long_put",
    content: "### Profiting from Fear\nBuying a put option gives you the right to sell the underlying. Profit increases as price drops.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: High Delta, High Vega.\n*   **Risk**: Limited to Premium Paid.\n*   **Reward**: Multi-fold gain if price crashes.\n*   **Ideal Environment**: Low IV before a bearish catalyst.\n\n**Strategic Edge**: Puts are like 'Insurance'. During market panics, IV expansion often supercharges put profits beyond the price move itself."
  },
  bear_put_spread: {
    title: "Bear Put Spread (Hedged Short)",
    visual: "strat_bear_put_spread",
    content: "### Controlled Bearish Speculation\nBuying an ITM Put and selling an OTM Put. This caps your risk and profit while lowering the break-even point.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Delta negative.\n*   **Ideal Environment**: Grinding downward trend.\n\n**Strategic Edge**: Best used when you have a specific target on the downside and want to avoid paying full price for expensive puts."
  },
  bear_call_spread: {
    title: "Bear Call Spread (Credit)",
    visual: "strat_bear_call_spread",
    content: "### Income in Bearish Markets\nSelling a call and buying a higher-strike call for protection. Profit if stock stays below your strike.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Theta positive, Vega negative.\n*   **Risk**: Limited to strike gap.\n*   **Ideal Environment**: High IV Rank in a bearish/sideways market.\n\n**Strategic Edge**: Excellent for 'rent-collecting' from retail traders who are over-optimistic on a stock's recovery."
  },
  ratio_put_spread: {
    title: "Ratio Put Spread",
    visual: "strat_ratio_put_spread",
    content: "### Bottom Fishing with Alpha\nBuying one put and selling two further-OTM puts. Profitable if stock drops to a support but not below it.\n\n#### 📊 Strategy Profile\n*   **Strategic Edge**: Often used to 'acquire' stocks at a massive discount (at the lower strike) while getting paid to wait."
  },
  put_ratio_back_spread: {
    title: "Put Ratio Back Spread",
    visual: "strat_put_ratio_back",
    content: "### The Black Swan Protection\nSelling one put and buying two OTM puts. Profit is unlimited if price crashes violently.\n\n#### 📊 Strategy Profile\n*   **Ideal Environment**: Extreme bubble or before a known crash catalyst.\n\n**Strategic Edge**: If market stays flat or rallies, you may still keep a small credit. You only lose if price stays stagnant near the sold strike."
  },
  strat_neutral: {
    title: "Neutral & Income Strategies",
    visual: "strategy_neutral",
    content: "### Mastering the Sideways Market\nNeutral strategies profit from time decay (Theta) and decreasing volatility (Vega) when the market stays within a range.\n\n#### 🏠 The 'House' Playbook\n*   **Short Straddle**: Selling both ATM Call and Put. Maximum profit if the stock finishes exactly at the strike. High risk.\n*   **Short Strangle**: Selling OTM Call and Put. Safer than straddle, wider profit zone.\n*   **Long Call Butterfly**: A combination of a Bull Call Spread and a Bear Call Spread. Profitable if price ends at the middle strike.\n*   **Short Iron Condor**: Selling a Put Spread and a Call Spread. The professional's choice for range-bound markets with limited risk.\n*   **Short Iron Butterfly**: Limited-risk version of a Short Straddle using wing spreads to cap losses.\n*   **Long Calendar**: Buying a long-term option and selling a short-term option at the same strike. Profits from higher theta decay in the near-term.\n\n**Analytical Tip**: These strategies are most effective when Implied Volatility (IV) is high and expected to 'Crush' or revert to mean."
  },
  short_straddle: {
    title: "Short Straddle",
    visual: "strat_short_straddle",
    content: "### The Ultimate Theta Farm\nSelling both an ATM Call and an ATM Put. You profit from the market going absolutely nowhere.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: High Positive Theta, High Negative Vega.\n*   **Risk**: Unlimited on both sides.\n*   **Ideal Environment**: Post-event IV Crush.\n\n**Strategic Edge**: The most aggressive income strategy. Statistically, markets stay in a range 70% of the time, making this a high-probability professional play."
  },
  short_strangle: {
    title: "Short Strangle",
    visual: "strat_short_strangle",
    content: "### Selling a 'Safe zone'\nSelling an OTM Call and an OTM Put. Wider profit window than a straddle but lower premium received.\n\n#### 📊 Strategy Profile\n*   **Risk**: Unlimited but gives more margin for error.\n\n**Strategic Edge**: Best used during range-bound expiry cycles where you define support (Put strike) and resistance (Call strike)."
  },
  long_call_butterfly: {
    title: "Long Call Butterfly",
    visual: "strat_butterfly",
    content: "### Pinning the Price\nBuying one call, selling two middle calls, and buying one higher-strike call. A neutral trade with defined risk.\n\n#### 📊 Strategy Profile\n*   **Reward**: Maximum if price ends exactly at the middle strike.\n\n**Strategic Edge**: Extremely high ROI if you can 'pin' the price of an index on expiry day."
  },
  short_iron_condor: {
    title: "Short Iron Condor",
    visual: "strat_iron_condor",
    content: "### The Professional Standard\nA combination of a Bull Put Spread and a Bear Call Spread. Limited risk on both sides.\n\n#### 📊 Strategy Profile\n*   **Ideal Environment**: High IV environment with expected range-bound move.\n\n**Strategic Edge**: The most balanced income strategy. Allows you to profit from time decay while sleeping well at night due to defined risk."
  },
  short_iron_butterfly: {
    title: "Short Iron Butterfly",
    visual: "strat_iron_butterfly",
    content: "### Aggressive Defined-Risk Neutral\nSelling an ATM cross (Straddle) and buying far-OTM wings to cap the risk.\n\n#### 📊 Strategy Profile\n*   **Strategic Edge**: High Theta decay focused on a single point, but with a safety net for sudden spikes."
  },
  long_calendar: {
    title: "Long Calendar Spread",
    visual: "strat_calendar",
    content: "### Time Arbitrage\nSelling a near-term option and buying a further-term option at the same strike. Profit from different decay rates.\n\n#### 📊 Strategy Profile\n*   **Greek Focus**: Positive Vega, Positive Theta.\n*   **Ideal Environment**: Low IV moving into higher IV (Event-prep).\n\n**Strategic Edge**: Profitable in neutral markets, but truly shines when IV rises for the further month while you collect decay from the near month."
  },
  strat_volatile: {
    title: "Volatility & Event Strategies",
    visual: "strategy_volatile",
    content: "### Trading the Expansion\nThese strategies do not care about direction; they only care about 'Movement'. Used for earnings, budgets, or major policy shifts.\n\n#### 🌪️ Movement Playbook\n*   **Long Straddle**: Buying both ATM Call and Put. You win if the market moves big in either direction.\n*   **Long Strangle**: Buying OTM Call and Put. Cheaper than a straddle, requires a larger move to be profitable.\n*   **Long Iron Butterfly**: Buying a middle-strike butterfly. Profits from a move outside the wings.\n*   **Long Iron Condor**: The inverse of Short Iron Condor; profitable on a breakout from the range.\n*   **Short Call Butterfly**: A bet that the market will NOT end at a specific price.\n*   **Put Diagonal Spread**: Complex spread involving different strikes and different expiries to capture volatility anomalies.\n\n**Analytical Tip**: Enter these trades when IV is historically low *before* a known catalyst. Success depends on the realized move being larger than what the market 'priced in'."
  },
  long_straddle: {
    title: "Long Straddle (Event Long)",
    visual: "strat_long_straddle",
    content: "### Betting on Chaos\nBuying both an ATM Call and an ATM Put. You win if the price moves significantly in either direction.\n\n#### 📊 Strategy Profile\n*   **Risk**: Limited to Premium Paid.\n*   **Reward**: Massive on a blowout move.\n\n**Strategic Edge**: Used before Earnings or Policy announcements where the 'market is pricing in' a small move, but you expect a shock."
  },
  long_strangle: {
    title: "Long Strangle",
    visual: "strat_long_strangle",
    content: "### Lower-Cost Chaos bet\nBuying OTM Call and OTM Put. Cheaper than a straddle but requires a much larger move to profit.\n\n**Strategic Edge**: Great for 'Long-Volatility' plays when you expect a major catalyst, but don't want to pay the heavy ATM premium."
  },
  long_iron_butterfly: {
    title: "Long Iron Butterfly",
    visual: "strat_long_iron_butterfly",
    content: "### Inverse Pinning\nBuying the wings and selling the center. You profit if price moves AWAY from the middle strike.\n\n**Strategic Edge**: Used when you believe price will NOT stay in the current range."
  },
  long_iron_condor: {
    title: "Long Iron Condor",
    visual: "strat_long_iron_condor",
    content: "### Breakout Range Bet\nProfitable if the price escapes a defined range. Lower risk than a long straddle but capped reward."
  },
  short_call_butterfly: {
    title: "Short Call Butterfly",
    visual: "strat_short_butterfly",
    content: "### Anti-Pinning\nSelling the wings and buying the center. Profits if the market moves away from the middle strike."
  },
  put_diagonal_spread: {
    title: "Put Diagonal Spread",
    visual: "strat_diagonal",
    content: "### Multi-Layer Volatility Trade\nBuying long-term puts and selling short-term puts at different strikes. Profitable in a slow-grinding down move with IV expansion."
  },

  futures_strategies: {
    title: "Futures Trading Mastery",
    visual: "strategy_futures",
    content: "### Strategic Futures Execution\nFutures trading requires a deep understanding of leverage and contract decay (basis).\n\n#### 📈 Core Trading Frameworks\n*   **Trend Following**: Identifying HH/HL structures on the 15m/1h timeframe. Institutional buyers typically add to positions on 'Pullbacks' to the 20 EMA.\n*   **ORB (Opening Range Breakout)**: Buying the high of the first 15-minute candle. This captures the massive institutional volume at market open.\n*   **VWAP Mean Reversion**: When price deviates significantly from VWAP, it has a statistical tendency to return to the volume-weighted average.\n\n**Risk Management**: Always use a stop-loss based on **ATR (Average True Range)** to account for market noise while keeping your directional thesis intact."
  },
  institutional_strategies: {
    title: "Advanced Quant & Institutional",
    visual: "strategy_institutional",
    content: "### The Quantitative Paradigm\nHow high-frequency trading (HFT) desks manage institutional risk.\n\n*   **Delta Neutrality**: Constantly adjusting holdings so the net Delta is zero. The portfolio is insensitive to price moves and relies purely on Alpha generation from other Greeks.\n*   **Gamma Scalping**: Buying long-term options and 'scalping' shorter-term future fluctuations against them to pay for the daily Theta decay.\n*   **Calendar Spreads**: Profiting from the difference in time decay between different expiry months. A 3-month option loses value slower than a 1-week option.\n\n**Institutional Edge**: These strategies require high-speed execution and precision math, typically automated via Python-based algorithmic engines."
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
  },
  candlestick_single: {
    title: "Single Candlestick Patterns",
    visual: "candle_single",
    content: "### Understanding Individual Price Bars\nSingle candlesticks provide immediate clues about the battle between bulls and bears within a specific timeframe.\n\n#### Visual Guide: Basic Types\n`  [  ]  ` (Bullish) - Green body, open at bottom, close at top.\n`  [##]  ` (Bearish) - Red body, open at top, close at bottom.\n`   --   ` (Doji) - Open and Close are the same.\n\n#### Detailed Patterns\n*   **Hammer** 🔨: Small body at top, long lower wick (2x body). Found at bottom of downtrend. *Signal: Buyers rejecting lower prices.*\n*   **Shooting Star** ☄️: Small body at bottom, long upper wick. Found at top of uptrend. *Signal: Sellers rejecting higher prices.*\n*   **Spinning Top**: Small body with long wicks on both sides. *Signal: Complete indecision.*\n*   **Marubozu**: Solid block with no shadows. *Signal: Total dominance.*"
  },
  candlestick_double: {
    title: "Double Candlestick Patterns",
    visual: "candle_double",
    content: "### Relational Price Action\nThese patterns involve two consecutive bars, usually signaling a shift in sentiment.\n\n#### Visual Setup: Engulfing\n`  [ ] [####] ` -> Bullish Engulfing (Green swallows Red)\n` [###] [  ] ` -> Bearish Engulfing (Red swallows Green)\n\n#### Key Patterns\n*   **Bullish Engulfing**: A large green candle completely 'swallows' the previous small red candle. High probability signal at support.\n*   **Piercing Pattern**: A green candle opens below the previous low but closes more than 50% into the previous red candle's body.\n*   **Tweezer Bottom**: Two consecutive candles with identical lows, showing a definitive floor.\n*   **Tweezer Top**: Two consecutive candles with identical highs, showing a definitive ceiling."
  },
  candlestick_triple: {
    title: "Triple Candlestick Patterns",
    visual: "candle_triple",
    content: "### High-Conviction Confirmations\nPatterns involving three bars provide greater statistical confirmation of a trend reversal.\n\n#### Visual Setup: Star Patterns\n` [###]  -  [   ] ` -> Morning Star (Red -> Doji -> Green)\n` [   ]  -  [###] ` -> Evening Star (Green -> Doji -> Red)\n\n#### Key Patterns\n*   **Morning Star**: A large red candle, followed by a small-bodied candle (indecision), followed by a large green candle. The sun is rising.\n*   **Three White Soldiers**: Three consecutive large green candles with small wicks. Strong breakout momentum.\n*   **Three Black Crows**: Three consecutive large red candles. Heavy institutional distribution."
  },
  candlestick_continuation: {
    title: "Continuation Patterns",
    visual: "candle_continuation",
    content: "### Staying in the Trend\nThese patterns suggest the market is just taking a 'breather' before continuing the primary move.\n\n#### Visual: Rising Three Methods\n` [   ] ` (Big Green)\n`  [-]  ` (Small Red)\n`  [-]  ` (Small Red)\n`  [-]  ` (Small Red)\n` [   ] ` (Big Green - Breakout)\n\n*   **Rising Three Methods**: A long green candle followed by three small red candles (staying within the first candle's range) and then another long green candle.\n*   **Falling Three Methods**: Inverse of the above. Red -> Small Greens -> Red."
  },
  candlestick_indecision: {
    title: "Indecision & Neutral Patterns",
    visual: "candle_indecision",
    content: "### Market in Equilibrium\nWhen these form, the 'edge' is low. It is often best to step aside.\n\n*   **Standard Doji**: Pure balance between buyers and sellers.\n*   **High Wave Candle**: Very long upper and lower wicks with a tiny body. Extreme confusion.\n*   **Dragonfly Doji**: ⊥ (Hammer Doji) - Strong rejection of lower prices.\n*   **Gravestone Doji**: ⊤ (Shooting Star Doji) - Strong rejection of higher prices."
  },
  candlestick_advanced: {
    title: "Special & Advanced Patterns",
    visual: "candle_advanced",
    content: "### Professional Setup Patterns\nAdvanced traders look for these more complex structures.\n\n*   **Inside Bar**: ⊏ (Small candle inside Big candle) - Volatility 'squeeze'.\n*   **Bullish Harami**: A small green candle 'inside' a large red candle. Decelerating bearish momentum.\n*   **Kicker Pattern**: A green candle gaps UP and opens above the previous red candle's open. Powerful institutional signature.\n*   **Belt Hold**: A candle that opens at its high/low and has no wick on one end. Immediate pressure signal."
  },
  pattern_reversal: {
    title: "Reversal Chart Patterns",
    visual: "chart_reversal",
    content: "### Spotting Trend Changes\nReversal patterns signal that the current trend is exhausted and a new move in the opposite direction is beginning.\n\n#### Bullish Reversals (Buy Signals)\n*   **Double Bottom (W Pattern)**: Price hits a floor twice. A breakout above the 'neckline' confirms the trend change.\n*   **Inverse Head & Shoulders**: Three troughs, with the middle one (head) being the deepest. The most reliable reversal structural setup.\n*   **Falling Wedge**: Price contracts downwards. Institutional accumulation is occurring within a tight range.\n\n#### Bearish Reversals (Sell Signals)\n*   **Double Top (M Pattern)**: Price hits a ceiling twice. Sellers are defending the level aggressively.\n*   **Head & Shoulders**: A peak, a higher peak, and a lower peak. Signifies the end of a bull run.\n*   **Rising Wedge**: Price contracts downwards. Momentum is dying as buyers get exhausted."
  },
  pattern_continuation: {
    title: "Continuation Patterns",
    visual: "chart_continuation",
    content: "### Riding the Primary Trend\nThese patterns suggest the market is just taking a temporary rest before exploding further in the original direction.\n\n#### Bullish Continuation\n*   **Bull Flag**: A sharp upward move (pole) followed by a tight downward channel. Signifies a minor profit-taking before the next leg up.\n*   **Ascending Triangle**: A flat top with rising lows. Buyers are aggressively pushing against a resistance level.\n\n#### Bearish Continuation\n*   **Bear Flag**: A sharp downward move followed by a tight upward rising channel.\n*   **Descending Triangle**: A flat bottom with lower highs. Sellers are constantly pushing price into a floor until it snaps."
  },
  pattern_neutral: {
    title: "Neutral & Indecision Patterns",
    visual: "chart_neutral",
    content: "### Non-Directional Squeezes\nThese patterns don't favor bulls or bears initially. They represent a balanced battle that will result in a violent breakout to *either* side.\n\n*   **Symmetrical Triangle**: Both highs and lows are contracting towards a single point. Volatility is being 'coiled' like a spring.\n*   **Rectangle (Consolidation)**: Price is bouncing between two horizontal levels. High probability 'Box Breakout' setup.\n*   **Wolfe Wave**: A unique five-wave supply/demand structure that predicts a specific price target once the wave is complete."
  },
  pattern_breakout: {
    title: "High Probability Breakouts",
    visual: "chart_breakout",
    content: "### Trading the Expansion\nInstitutional traders wait for these specific setups to enter large positions as volatility expands.\n\n*   **Triangle Breakout**: Trading the first impulsive candle that closes outside a triangle's boundary.\n*   **Range Breakout**: Buying/Selling the breakout of a long-term box (Rectangle).\n*   **Channel Breakout**: When price snaps out of a diagonal trend channel, it often leads to a 'parabolic' move.\n\n**Key Rule**: Always wait for a candle CLOSE outside the level to avoid 'Institutional Traps' (Fake breakouts)."
  },
  pattern_advanced: {
    title: "Advanced & Institutional Patterns",
    visual: "chart_advanced",
    content: "### The Professional Edge\nComplex structures used by hedge funds and algos to find deep value entries.\n\n*   **Wolfe Wave**: A unique five-wave supply/demand structure that predicts a specific price target once the wave is complete.\n*   **Harmonic Patterns (Gartley/Bat/Butterfly)**: Mathematical geometry based on Fibonacci ratios to find precise reversal coordinates.\n*   **Institutional Order Blocks**: Identifying where banks have 'leftover' unfilled orders that price will inevitably return to."
  },
  pattern_double_top_bottom: {
    title: "Double Top & Bottom",
    visual: "chart_double_top_bottom",
    content: "### The Classic Reversal structures\nOne of the most frequent and reliable reversal patterns in all liquid markets.\n\n#### 📈 Double Bottom (W Pattern)\n*   **Structure**: Price drops to a level (Support), rallies, drops back to the same level, and finally breaks above the recent high (Neckline).\n*   **Psychology**: Sellers failed twice to push price lower. Institutional accumulation is complete.\n\n#### 📉 Double Top (M Pattern)\n*   **Structure**: Price hits a ceiling (Resistance) twice, failing to break out, then drops below the middle low (Neckline).\n*   **Psychology**: Buyers are exhausted. Sellers are defending the level with massive supply."
  },
  pattern_head_shoulders: {
    title: "Head & Shoulders",
    visual: "chart_head_shoulders",
    content: "### The Ultimate Trend Exhaustion\nConsidered the 'holy grail' of reversal patterns due to its high statistical accuracy.\n\n#### 📉 Standard Head & Shoulders\n*   **Left Shoulder**: Initial peak and correction.\n*   **Head**: A higher peak (the final blow-off top).\n*   **Right Shoulder**: A lower peak, showing buyers can no longer reach the previous high.\n*   **Neckline**: The support line connecting the lows. Breakout below this is the sell signal.\n\n#### 📈 Inverse Head & Shoulders\n*   Identical structure but flipped. A definitive signal that a long-term bear market is ending."
  },
  pattern_flags_pennants: {
    title: "Flags & Pennants",
    visual: "chart_flags_pennants",
    content: "### High Velocity Continuation\nFlags and pennants represent a short 'pause' in a very strong trend (the Flagpole).\n\n*   **Bull Flag**: A sharp vertical move up, followed by a tight parallel downward channel. High probability of another vertical move up.\n*   **Bear Flag**: Vertical move down, followed by a tight upward channel.\n*   **Pennants**: Similar to flags, but the consolidation is a small symmetrical triangle.\n\n**Strategy**: Enter on the breakout of the flag/pennant in the direction of the pole. The target is usually the height of the pole."
  },
  pattern_wedges_deep: {
    title: "Rising & Falling Wedges",
    visual: "chart_wedges_deep",
    content: "### The Squeeze of Pressure\nWedges are directional contraction patterns. Unlike triangles, both lines are sloped in the same direction.\n\n*   **Falling Wedge**: Contracting price while sloping down. Ironically, this is **Bullish**. It shows sellers are losing momentum even as price drops.\n*   **Rising Wedge**: Contracting price while sloping up. This is **Bearish**. Buyers are struggling to maintain higher prices.\n\n**Note**: Wedges can act as both reversals (at the end of a long trend) or continuations."
  },
  pattern_cup_handle_deep: {
    title: "Cup and Handle",
    visual: "chart_cup_handle_deep",
    content: "### Long-Term Value Accumulation\nA bullish continuation pattern that marks a consolidation period followed by a breakout.\n\n*   **The Cup**: A 'U' shaped rounding bottom. Shows a gradual shift from selling to buying.\n*   **The Handle**: A small downward or sideways drift at the end of the cup. This is the final 'shakeout' of weak hands.\n*   **Breakout**: Occurs when price cross the high of the cup.\n\n**Analytical Edge**: The deeper the cup and the higher the volume on the breakout, the more significant the move."
  },
  pattern_rectangles_deep: {
    title: "Rectangles & Box Zones",
    visual: "chart_rectangles_deep",
    content: "### Institutional Range Trading\nRectangles (or Darvas Boxes) occur when price is trapped between parallel support and resistance.\n\n*   **Horizontal Channel**: Price moves sideways. Big players are either accumulating (at the bottom) or distributing (at the top) in large blocks.\n*   **The Squeeze**: The longer the price remains in a rectangle, the more explosive the eventual breakout will be.\n\n**Execution**: Trade the 'Box Breakout' with a close outside the range, confirmed by a surge in volume."
  }
};

const PatternVisualizer = ({ type }: { type: string }) => {
  switch (type) {
    case 'candle_double':
      return (
        <div className="space-y-4 mb-6">
          <div className="flex justify-around items-end h-36 bg-white/5 rounded-2xl p-4 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1 h-full items-center">
                  <div className="relative w-4 h-full flex flex-col items-center justify-center">
                    <div className="w-0.5 h-full bg-rose-500/20" />
                    <div className="absolute top-1/3 w-4 h-1/3 bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.2)]" />
                  </div>
                  <div className="relative w-4 h-full flex flex-col items-center justify-center">
                    <div className="w-0.5 h-full bg-emerald-500/20" />
                    <div className="absolute top-1/4 w-4 h-1/2 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  </div>
               </div>
              <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Engulfing</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1 h-full items-center">
                  <div className="relative w-4 h-full flex flex-col items-center justify-center">
                    <div className="w-0.5 h-full bg-rose-500/20" />
                    <div className="absolute top-1/4 w-4 h-1/2 bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.2)]" />
                  </div>
                  <div className="relative w-4 h-full flex flex-col items-center justify-center">
                    <div className="w-0.5 h-full bg-emerald-500/20" />
                    <div className="absolute top-[45%] w-4 h-1/2 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  </div>
               </div>
              <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Piercing</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1 h-full items-end pb-2">
                  <div className="relative w-4 h-8 flex flex-col items-center justify-center">
                    <div className="w-0.5 h-[150%] bg-rose-500/40" />
                    <div className="w-4 h-full bg-rose-500 border border-rose-400 rounded-sm" />
                  </div>
                  <div className="relative w-4 h-8 flex flex-col items-center justify-center">
                    <div className="w-0.5 h-[150%] bg-emerald-500/40" />
                    <div className="w-4 h-full bg-emerald-500 border border-emerald-400 rounded-sm" />
                  </div>
               </div>
              <span className="text-[7px] text-white/50 font-bold uppercase tracking-tight">Tweezers</span>
            </div>
          </div>
        </div>
      );
    case 'candle_triple':
      return (
        <div className="space-y-4 mb-6">
          <div className="flex justify-around items-end h-36 bg-white/5 rounded-2xl p-4 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1 h-full items-center">
                  <div className="relative w-3 h-full flex flex-col items-center justify-center">
                    <div className="absolute top-1/4 w-3 h-1/2 bg-rose-500 border border-rose-400 rounded-sm" />
                  </div>
                  <div className="relative w-3 h-full flex flex-col items-center justify-center">
                    <div className="absolute inset-y-1/2 w-3 h-0.5 bg-white border border-white/40" />
                  </div>
                  <div className="relative w-3 h-full flex flex-col items-center justify-center">
                    <div className="absolute top-1/4 w-3 h-1/2 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  </div>
               </div>
              <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Morning Star</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1 h-full items-center">
                  <div className="relative w-3 h-6 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.2)]" />
                  <div className="relative w-3 h-8 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.3)] translate-y-[-4px]" />
                  <div className="relative w-3 h-10 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.4)] translate-y-[-8px]" />
               </div>
              <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">3 Soldiers</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1 h-full items-center">
                  <div className="relative w-3 h-6 bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_5px_rgba(244,63,94,0.2)]" />
                  <div className="relative w-3 h-8 bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_5px_rgba(244,63,94,0.3)] translate-y-[4px]" />
                  <div className="relative w-3 h-10 bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_5px_rgba(244,63,94,0.4)] translate-y-[8px]" />
               </div>
              <span className="text-[7px] text-rose-400 font-bold uppercase tracking-tight">3 Crows</span>
            </div>
          </div>
        </div>
      );
    case 'candle_continuation':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col items-center gap-2 bg-white/5 rounded-2xl p-4 border border-white/10 h-36 justify-end relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="flex gap-1 h-full items-end">
                <div className="relative w-3 h-[70%] bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                <div className="relative w-2 h-[30%] bg-rose-500/60 border border-rose-400/40" />
                <div className="relative w-2 h-[25%] bg-rose-500/60 border border-rose-400/40" />
                <div className="relative w-2 h-[30%] bg-rose-500/60 border border-rose-400/40" />
                <div className="relative w-3 h-[85%] bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
             </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Rising 3 Methods</span>
          </div>
          <div className="flex flex-col items-center gap-2 bg-white/5 rounded-2xl p-4 border border-white/10 h-36 justify-end relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="flex gap-1 h-full items-start">
                <div className="relative w-3 h-[70%] bg-rose-500 border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.2)]" />
                <div className="relative w-2 h-[30%] bg-emerald-500/60 border border-emerald-400/40" />
                <div className="relative w-2 h-[25%] bg-emerald-500/60 border border-emerald-400/40" />
                <div className="relative w-2 h-[30%] bg-emerald-500/60 border border-emerald-400/40" />
                <div className="relative w-3 h-[85%] bg-rose-500 border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
             </div>
            <span className="text-[7px] text-rose-400 font-bold uppercase tracking-tight">Falling 3 Methods</span>
          </div>
        </div>
      );
    case 'candle_indecision':
      return (
        <div className="flex justify-around items-end h-36 bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-white/60" />
              <div className="absolute inset-y-1/2 w-4 h-0.5 bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
            </div>
            <span className="text-[7px] text-white/50 font-bold uppercase tracking-tight">Classic Doji</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-white/60" />
              <div className="absolute inset-y-1/2 w-4 h-4 bg-white/10 border border-white/40 rounded shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
            </div>
            <span className="text-[7px] text-white/50 font-bold uppercase tracking-tight">High Wave</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-emerald-500/40" />
              <div className="absolute top-0 w-4 h-0.5 bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Dragonfly</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-rose-500/40" />
              <div className="absolute bottom-0 w-4 h-0.5 bg-rose-400 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
            </div>
            <span className="text-[7px] text-rose-400 font-bold uppercase tracking-tight">Gravestone</span>
          </div>
        </div>
      );
    case 'candle_advanced':
      return (
        <div className="flex justify-around items-end h-36 bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <div className="flex flex-col items-center gap-2">
             <div className="flex gap-1 h-full items-center">
                <div className="w-4 h-12 bg-emerald-600 border border-emerald-400 rounded-sm" />
                <div className="w-2 h-4 bg-emerald-500 border border-emerald-400 rounded-sm" />
             </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Inside Bar</span>
          </div>
          <div className="flex flex-col items-center gap-2">
             <div className="flex gap-1 h-full items-center">
                <div className="w-4 h-12 bg-rose-600 border border-rose-400 rounded-sm" />
                <div className="w-2 h-6 bg-emerald-600 border border-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
             </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Harami</span>
          </div>
          <div className="flex flex-col items-center gap-2">
             <div className="flex gap-1 h-full items-end pb-2">
                <div className="w-4 h-10 bg-rose-600 border border-rose-400 rounded-sm" />
                <div className="w-4 h-8 bg-emerald-600 border border-emerald-400 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.4)] translate-y-[-10px]" />
             </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Kicker</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-16 flex flex-col items-center justify-center">
              <div className="w-4 h-full bg-emerald-700 border-l-2 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
            </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">Belt Hold</span>
          </div>
        </div>
      );
    case 'candle_single':
      return (
        <div className="flex justify-around items-end h-36 bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-emerald-500/40" />
              <div className="absolute top-1/4 w-4 h-1/2 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tighter">Bullish</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-rose-500/40" />
              <div className="absolute top-1/4 w-4 h-1/2 bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
            </div>
            <span className="text-[7px] text-rose-400 font-bold uppercase tracking-tighter">Bearish</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-white/40" />
              <div className="absolute inset-y-1/2 w-4 h-0.5 bg-white border border-white/40" />
            </div>
            <span className="text-[7px] text-white/60 font-bold uppercase tracking-tighter">Doji</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-[80%] bg-emerald-500/40" />
              <div className="absolute top-0 w-4 h-1/4 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tighter">Hammer</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-4 h-24 flex flex-col items-center justify-center">
              <div className="w-0.5 h-[80%] bg-rose-500/40" />
              <div className="absolute bottom-0 w-4 h-1/4 bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
            </div>
            <span className="text-[7px] text-rose-400 font-bold uppercase tracking-tighter">Shoot Star</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-3 h-24 flex flex-col items-center justify-center">
              <div className="w-3 h-4/5 bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            </div>
            <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tighter">Marubozu</span>
          </div>
        </div>
      );
    case 'strategy_futures':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
              <div className="absolute top-2 left-2 flex items-center gap-1">
                 <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                 <span className="text-[7px] text-emerald-400/80 uppercase font-black tracking-widest">Bullish Momentum</span>
              </div>
              <svg className="w-full h-16 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)] mt-2" viewBox="0 0 100 40">
                 <defs>
                    <linearGradient id="bullGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                       <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                    </linearGradient>
                 </defs>
                 <path d="M 5 35 L 20 28 L 35 32 L 55 12 L 70 18 L 95 5" fill="none" stroke="url(#bullGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M 5 35 L 20 28 L 35 32 L 55 12 L 70 18 L 95 5 L 95 40 L 5 40 Z" fill="url(#bullGradient)" fillOpacity="0.05" />
                 <circle cx="95" cy="5" r="2.5" fill="#10b981" />
              </svg>
           </div>
           <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
              <div className="absolute top-2 left-2 flex items-center gap-1">
                 <TrendingDown className="w-2.5 h-2.5 text-rose-400" />
                 <span className="text-[7px] text-rose-400/80 uppercase font-black tracking-widest">Bearish Pressure</span>
              </div>
              <svg className="w-full h-16 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)] mt-2" viewBox="0 0 100 40">
                 <defs>
                    <linearGradient id="bearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                       <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                       <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
                    </linearGradient>
                 </defs>
                 <path d="M 5 5 L 20 12 L 35 8 L 55 28 L 70 24 L 95 35" fill="none" stroke="url(#bearGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M 5 5 L 20 12 L 35 8 L 55 28 L 70 24 L 95 35 L 95 0 L 5 0 Z" fill="url(#bearGradient)" fillOpacity="0.05" />
                 <circle cx="95" cy="35" r="2.5" fill="#f43f5e" />
              </svg>
           </div>
        </div>
      );
    case 'strategy_bullish':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
           <div className="flex gap-4 items-end h-28 relative">
              <motion.div 
                initial={{ height: "40%" }}
                animate={{ height: ["40%", "70%", "50%"] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-[10px] text-emerald-400 font-bold"
              >ATM</motion.div>
              <div className="w-2 bg-emerald-500/10 h-full rounded-t-sm" />
              <div className="w-24 h-full bg-emerald-500 border border-emerald-400 rounded-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] flex flex-col items-center justify-center gap-1 group-hover:scale-105 transition-transform">
                 <TrendingUp className="w-10 h-10 text-white animate-pulse" />
                 <span className="text-[10px] text-white font-black tracking-tighter uppercase">Bull Edge</span>
              </div>
           </div>
           <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Bullish Spreads & Calls</span>
              <span className="text-[7px] text-white/30 uppercase font-bold text-center">Optimized for High Probability Upside Extraction</span>
           </div>
        </div>
      );
    case 'strategy_bearish':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f43f5e 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
           <div className="flex gap-4 items-start h-28 relative pt-4">
              <div className="w-24 h-full bg-rose-500 border border-rose-400 rounded-sm shadow-[0_0_25px_rgba(244,63,94,0.5)] flex flex-col items-center justify-center gap-1 group-hover:scale-105 transition-transform">
                 <TrendingDown className="w-10 h-10 text-white" />
                 <span className="text-[10px] text-white font-black tracking-tighter uppercase">Bear Shield</span>
              </div>
              <div className="w-2 bg-rose-500/10 h-full rounded-b-sm" />
              <motion.div 
                initial={{ height: "40%" }}
                animate={{ height: ["40%", "20%", "30%"] }} 
                transition={{ duration: 1.8, repeat: Infinity }}
                className="w-12 bg-rose-500/10 border border-rose-500/20 rounded flex items-center justify-center text-[10px] text-rose-400 font-bold self-end"
              >Hedge</motion.div>
           </div>
           <div className="flex flex-col items-center gap-1 mt-4">
              <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Bearish Spreads & Puts</span>
              <span className="text-[7px] text-white/30 uppercase font-bold text-center">High Velocity Profit Extraction on Corrections</span>
           </div>
        </div>
      );
    case 'strategy_neutral':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
           <div className="flex items-center gap-10">
              <div className="flex flex-col items-center gap-3">
                 <div className="w-20 h-20 rounded-full border-4 border-dashed border-indigo-500/20 flex items-center justify-center relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-10 h-10 text-indigo-400" />
                    </motion.div>
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl" />
                 </div>
                 <span className="text-[8px] text-indigo-400 font-black tracking-widest uppercase italic">Theta Farm</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                 <div className="flex items-center gap-2">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    <span className="text-3xl font-black text-white tracking-widest uppercase">Income</span>
                 </div>
                 <div className="flex flex-col text-[7px] text-white/40 font-bold uppercase tracking-[0.2em] space-y-1">
                    <div className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-indigo-500/50" /> Delta Neutral Setups </div>
                    <div className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-indigo-500/50" /> Time Decay Exploitation</div>
                 </div>
              </div>
           </div>
        </div>
      );
    case 'strategy_volatile':
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-white/5 rounded-2xl p-6 border border-white/10 mb-6 relative overflow-hidden group">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/40 via-transparent to-transparent animate-pulse" />
           <div className="absolute top-2 left-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[6px] text-amber-400 font-black uppercase tracking-[0.3em]">IV Expansion Event</span>
           </div>
           <div className="flex gap-6 items-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
              >
                <Maximize className="w-16 h-16 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
              </motion.div>
              <div className="flex flex-col">
                 <span className="text-3xl font-black text-amber-400 tracking-tighter italic font-euro uppercase">Movement</span>
                 <span className="text-[9px] text-white/50 font-black tracking-widest uppercase">Magnitude-Based Profit</span>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20 text-center group-hover:bg-amber-500/20 transition-all">
                 <div className="text-[10px] font-black text-amber-400 italic tracking-widest uppercase">Straddle</div>
                 <div className="text-[6px] text-white/30 uppercase mt-0.5 tracking-tighter">Budget / Results</div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20 text-center group-hover:bg-amber-500/20 transition-all">
                 <div className="text-[10px] font-black text-amber-400 italic tracking-widest uppercase">Strangle</div>
                 <div className="text-[6px] text-white/30 uppercase mt-0.5 tracking-tighter">News Surprises</div>
              </div>
           </div>
        </div>
      );
    case 'strat_long_call':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <defs>
                 <linearGradient id="bullLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                 </linearGradient>
              </defs>
              <line x1="0" y1="80" x2="200" y2="80" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <line x1="100" y1="0" x2="100" y2="100" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="4 4" />
              <path d="M 20 90 L 100 90 L 180 10" fill="none" stroke="url(#bullLine)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="100" cy="90" r="4" fill="#10b981" className="animate-pulse" />
              <text x="110" y="95" fill="#10b981" fontSize="7" fontWeight="black" className="uppercase tracking-widest">Strike Pivot</text>
              <text x="160" y="25" fill="#10b981" fontSize="11" fontWeight="black" className="italic drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">EXPONENTIAL ↑</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-tighter block">Long Call (Directional Base)</span>
              <span className="text-[8px] text-emerald-400/60 uppercase font-bold text-center tracking-[0.2em]">Unlimited Delta Exposure</span>
           </div>
        </div>
      );
    case 'strat_bull_put_spread':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="50" x2="200" y2="50" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 85 L 60 85 L 120 35 L 180 35" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <text x="145" y="30" fill="#10b981" fontSize="8" fontWeight="black">MAX CREDIT</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Bull Put Spread</span>
              <span className="text-[8px] text-emerald-400/60 uppercase font-bold text-center">Income focused | High Probability</span>
           </div>
        </div>
      );
    case 'strat_ratio_call_spread':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="80" x2="200" y2="80" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 90 L 80 90 L 130 15 L 180 60" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <text x="135" y="10" fill="#10b981" fontSize="8" fontWeight="black">PEAK PROFIT</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Ratio Call Spread</span>
              <span className="text-[8px] text-emerald-400/60 uppercase font-bold text-center">Target-Specific Precision | Optimized Cost</span>
           </div>
        </div>
      );
    case 'strat_call_ratio_back':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="60" x2="200" y2="60" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 55 L 80 55 L 120 90 L 200 10" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <text x="160" y="30" fill="#10b981" fontSize="10" fontWeight="black">EXPANDING PROFIT ↑</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Call Ratio Back Spread</span>
              <span className="text-[8px] text-emerald-400/60 uppercase font-bold text-center">Vertical Explosion Protection | Black Swan Upside</span>
           </div>
        </div>
      );
    case 'strat_bull_call_ladder':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="60" x2="200" y2="60" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 85 L 60 85 L 120 35 L 150 35 L 180 85" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Bull Call Ladder</span>
              <span className="text-[8px] text-emerald-400/60 uppercase font-bold text-center">Cost-Offset Momentum Beta</span>
           </div>
        </div>
      );
    case 'strat_bear_put_spread':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="35" x2="200" y2="35" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 35 L 60 35 L 120 85 L 180 85" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              <text x="145" y="80" fill="#f43f5e" fontSize="8" fontWeight="black">MAX PROFIT</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Bear Put Spread</span>
              <span className="text-[8px] text-rose-400/60 uppercase font-bold text-center">Controlled Downside Beta extraction</span>
           </div>
        </div>
      );
    case 'strat_bear_call_spread':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="70" x2="200" y2="70" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 85 L 80 85 L 140 35 L 180 35" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              <text x="145" y="30" fill="#f43f5e" fontSize="8" fontWeight="black">MAX CREDIT</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Bear Call Spread</span>
              <span className="text-[8px] text-rose-400/60 uppercase font-bold text-center">High-Probability Income in Bear cycles</span>
           </div>
        </div>
      );
    case 'strat_ratio_put_spread':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="40" x2="200" y2="40" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 60 L 70 15 L 130 90 L 180 90" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              <text x="65" y="10" fill="#f43f5e" fontSize="8" fontWeight="black">PEAK PROFIT</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Ratio Put Spread</span>
              <span className="text-[8px] text-rose-400/60 uppercase font-bold text-center">Smart Accumulation | Bottom Alpha</span>
           </div>
        </div>
      );
    case 'strat_put_ratio_back':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="70" x2="200" y2="70" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 10 L 80 90 L 130 55 L 180 55" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              <text x="25" y="30" fill="#f43f5e" fontSize="10" fontWeight="black">CRASH PROFIT ↑</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Put Ratio Back Spread</span>
              <span className="text-[8px] text-rose-400/60 uppercase font-bold text-center">The Black Swan Hedge | Magnitude Master</span>
           </div>
        </div>
      );
    case 'strat_butterfly':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="85" x2="200" y2="85" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 40 90 L 100 20 L 160 90" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
              <text x="100" y="15" fill="#6366f1" fontSize="10" fontWeight="black" textAnchor="middle">THE PIN</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Butterfly Spread</span>
              <span className="text-[8px] text-indigo-400/60 uppercase font-bold text-center">Low-Capital Pinning | Precise Extraction</span>
           </div>
        </div>
      );
    case 'strat_calendar':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="70" x2="200" y2="70" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 40 85 Q 100 -20 160 85" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
              <text x="100" y="25" fill="#6366f1" fontSize="10" fontWeight="black" textAnchor="middle">VEGA GAIN</text>
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Calendar Spread</span>
              <span className="text-[8px] text-indigo-400/60 uppercase font-bold text-center">Time Arbitrage | Volatility Expansion Play</span>
           </div>
        </div>
      );
    case 'strat_long_strangle':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="80" x2="200" y2="80" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 10 L 80 80 L 120 80 L 180 10" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Long Strangle Profile</span>
              <span className="text-[8px] text-amber-500/60 uppercase font-bold text-center">Budget Volatility Bet | magnitude focus</span>
           </div>
        </div>
      );
    case 'strat_long_iron_butterfly':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="30" x2="200" y2="30" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 40 10 L 70 10 L 100 80 L 130 10 L 160 10" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Long Iron Butterfly</span>
              <span className="text-[8px] text-amber-500/60 uppercase font-bold text-center">Inverse Pinning | Breakout Speculation</span>
           </div>
        </div>
      );
    case 'strat_long_iron_condor':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="30" x2="200" y2="30" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 10 L 50 10 L 80 80 L 120 80 L 150 10 L 180 10" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Long Iron Condor</span>
              <span className="text-[8px] text-amber-500/60 uppercase font-bold text-center">Defined-Risk Range Breakout</span>
           </div>
        </div>
      );
    case 'strat_short_butterfly':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="30" x2="200" y2="30" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 40 10 L 100 80 L 160 10" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Short Butterfly</span>
              <span className="text-[8px] text-amber-500/60 uppercase font-bold text-center">Anti-Pinning Strategy</span>
           </div>
        </div>
      );
    case 'strat_diagonal':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="60" x2="200" y2="60" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
              <path d="M 20 90 C 60 70, 100 0, 180 90" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
           </svg>
           <div className="text-center">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Diagonal Spread</span>
              <span className="text-[8px] text-amber-500/60 uppercase font-bold text-center">Multi-Temporal Volatility play</span>
           </div>
        </div>
      );
    case 'strat_bull_call_spread':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="70" x2="200" y2="70" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 20 85 L 80 85 L 140 35 L 180 35" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="145" y="30" fill="#10b981" fontSize="9" fontWeight="black" className="uppercase tracking-widest">Max Profit Pin</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Bull Call Spread</span>
              <span className="text-[8px] text-emerald-400/60 uppercase font-bold text-center">Defined Risk | Scalable Momentum</span>
           </div>
        </div>
      );
    case 'strat_iron_condor':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-20" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="60" x2="200" y2="60" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 20 90 L 50 90 L 80 20 L 120 20 L 150 90 L 180 90" fill="none" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
              <text x="100" y="15" fill="#6366f1" fontSize="10" fontWeight="black" textAnchor="middle" className="uppercase tracking-[0.2em]">Stability Zone</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Short Iron Condor</span>
              <span className="text-[8px] text-indigo-400/60 uppercase font-bold text-center">Institution-Grade Theta Extraction</span>
           </div>
        </div>
      );
    case 'strat_long_straddle':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="90" x2="200" y2="90" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 20 10 L 100 90 L 180 10" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
              <text x="100" y="100" fill="#f59e0b" fontSize="7" fontWeight="black" textAnchor="middle" className="uppercase opacity-50">ATM Strike</text>
              <text x="30" y="30" fill="#f59e0b" fontSize="9" fontWeight="black" className="italic uppercase">Panic ↑</text>
              <text x="140" y="30" fill="#f59e0b" fontSize="9" fontWeight="black" className="italic uppercase">Greed ↑</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Long Straddle (Event volatility)</span>
              <span className="text-[8px] text-amber-500/60 uppercase font-bold text-center tracking-[0.2em]">Net Vega + Gamma focused</span>
           </div>
        </div>
      );
    case 'strat_short_straddle':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-30" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="50" x2="200" y2="50" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 20 90 L 100 10 L 180 90" fill="none" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" className="drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
              <text x="100" y="5" fill="#6366f1" fontSize="11" fontWeight="black" textAnchor="middle" className="uppercase italic">Max Extraction Pin</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Short Straddle (Income Core)</span>
              <span className="text-[8px] text-indigo-400/60 uppercase font-bold text-center tracking-[0.3em]">Advanced Theta Decay Harvesting</span>
           </div>
        </div>
      );
    case 'strat_long_put':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-rose-500/10 to-transparent pointer-events-none" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="80" x2="200" y2="80" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 20 10 L 100 90 L 180 90" fill="none" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
              <text x="35" y="25" fill="#f43f5e" fontSize="11" fontWeight="black" className="italic uppercase">Panic Alpha ↑</text>
              <text x="100" y="98" fill="#f43f5e" fontSize="7" fontWeight="black" textAnchor="middle" className="uppercase tracking-widest opacity-50">Activation Strike</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Long Put (Bearish Base)</span>
              <span className="text-[8px] text-rose-400/60 uppercase font-bold text-center tracking-[0.2em]">Downside Volatility Expansion Play</span>
           </div>
        </div>
      );
    case 'strat_short_strangle':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-20" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="60" x2="200" y2="60" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 20 90 L 70 20 L 130 20 L 180 90" fill="none" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
              <text x="100" y="15" fill="#6366f1" fontSize="10" fontWeight="black" textAnchor="middle" className="uppercase tracking-[0.4em]">Income Range</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Short Strangle (Margin Safe)</span>
              <span className="text-[8px] text-indigo-400/60 uppercase font-bold text-center">Statistical Probability Advantage</span>
           </div>
        </div>
      );
    case 'strat_iron_butterfly':
      return (
        <div className="flex flex-col items-center gap-4 mb-6 bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-30" />
           <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 100">
              <line x1="0" y1="70" x2="200" y2="70" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 40 85 L 70 85 L 100 20 L 130 85 L 160 85" fill="none" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <text x="100" y="15" fill="#6366f1" fontSize="11" fontWeight="black" textAnchor="middle" className="uppercase italic">Peak Theta Pin</text>
           </svg>
           <div className="text-center relative z-10">
              <span className="text-xs text-white uppercase font-black tracking-widest block">Short Iron Butterfly</span>
              <span className="text-[8px] text-indigo-400/60 uppercase font-bold text-center">aggressive Pin Trading | Gamma Optimized</span>
           </div>
        </div>
      );
    case 'strategy_institutional':
      return (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6 relative overflow-hidden group">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, #fff 1px, transparent 1px), linear-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                    <Bot className="w-5 h-5 text-purple-400" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">ALGO-DESK v3</span>
                    <span className="text-[7px] text-purple-400/60 font-bold uppercase">Institutional Quant Layer</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] text-emerald-400 font-black uppercase">Market Neutral</span>
              </div>
           </div>
           <div className="grid grid-cols-1 gap-3">
              {[
                { label: "GAMMA SCALPING", status: "DELTA: 0.00", color: "text-blue-400" },
                { label: "CALENDAR SPREADS", status: "VEGA: LONG", color: "text-purple-400" },
                { label: "DIAGONAL ALPHA", status: "THETA: MAX", color: "text-emerald-400" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                   <span className="text-[9px] font-black text-white/70 tracking-widest">{item.label}</span>
                   <span className={cn("text-[8px] font-mono font-bold", item.color)}>{item.status}</span>
                </div>
              ))}
           </div>
        </div>
      );
    case 'chart_reversal':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Head & Shoulders</div>
             <svg className="w-full h-16 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]" viewBox="0 0 100 40">
                <path d="M 5 35 L 25 15 L 35 25 L 50 5 L 65 25 L 75 15 L 95 35" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="28" x2="90" y2="28" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.5" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Double Top/Bot</div>
             <svg className="w-full h-16 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]" viewBox="0 0 100 40">
                <path d="M 10 30 L 30 10 L 50 25 L 70 10 L 90 30" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 1" />
                <path d="M 10 10 L 30 30 L 50 15 L 70 30 L 90 10" fill="none" stroke="#10b981" strokeWidth="2" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Rounding Bot</div>
             <svg className="w-full h-16 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" viewBox="0 0 100 40">
                <path d="M 10 15 C 10 45, 90 45, 90 15 L 98 5" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Rising/Fall Wedge</div>
             <svg className="w-full h-16 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]" viewBox="0 0 100 40">
                <line x1="5" y1="35" x2="85" y2="15" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <line x1="5" y1="10" x2="85" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <path d="M 5 30 L 25 10 L 45 35 L 65 15 L 85 30 L 95 40" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinejoin="round" />
             </svg>
          </div>
        </div>
      );
    case 'chart_continuation':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Bull Flag</div>
             <svg className="w-full h-16 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" viewBox="0 0 100 40">
                <path d="M 10 38 L 30 5" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                <path d="M 30 5 L 45 15 L 40 20 L 55 25 L 50 30 L 70 35" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 50 30 L 95 0" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Pennant</div>
             <svg className="w-full h-16 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" viewBox="0 0 100 40">
                <path d="M 10 38 L 35 15" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                <path d="M 35 15 L 55 25 L 70 18 L 80 22 L 65 20 L 95 0" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="35" y1="15" x2="80" y2="25" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <line x1="35" y1="35" x2="80" y2="25" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Asc. Triangle</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" viewBox="0 0 100 40">
                <line x1="30" y1="5" x2="85" y2="5" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M 10 35 L 30 25 L 50 5 L 60 20 L 80 5 L 95 0" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Desc. Triangle</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]" viewBox="0 0 100 40">
                <line x1="30" y1="35" x2="85" y2="35" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M 10 5 L 30 15 L 50 35 L 60 20 L 80 35 L 95 40" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
        </div>
      );
    case 'chart_neutral':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Sym. Triangle</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]" viewBox="0 0 100 40">
                <line x1="10" y1="5" x2="85" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <line x1="10" y1="35" x2="85" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <path d="M 5 20 L 15 10 L 25 30 L 35 15 L 45 25 L 55 18 L 65 22 L 75 20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Rectangle</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]" viewBox="0 0 100 40">
                <line x1="10" y1="10" x2="90" y2="10" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <line x1="10" y1="30" x2="90" y2="30" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <path d="M 5 15 L 15 10 L 25 30 L 35 10 L 45 30 L 55 10 L 65 30 L 75 10" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
        </div>
      );
    case 'chart_breakout':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Triangle Break</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]" viewBox="0 0 100 40">
                <line x1="10" y1="5" x2="80" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <line x1="10" y1="35" x2="80" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <path d="M 5 20 L 15 10 L 25 30 L 35 15 L 45 25 L 55 18 L 85 5" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Channel Break</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]" viewBox="0 0 100 40">
                <line x1="10" y1="10" x2="85" y2="30" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
                <line x1="15" y1="5" x2="90" y2="25" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
                <path d="M 5 15 L 15 10 L 25 20 L 35 10 L 45 25 L 55 15 L 75 35 L 90 40" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
        </div>
      );
    case 'chart_advanced':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Wolfe Wave</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(168,85,247,0.2)]" viewBox="0 0 100 40">
                <path d="M 5 35 L 25 5 L 45 30 L 65 10 L 85 45 L 98 20" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="5" y1="35" x2="65" y2="10" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.4" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Harmonics</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(168,85,247,0.2)]" viewBox="0 0 100 40">
                <path d="M 10 35 L 25 10 L 40 30 L 60 5 L 85 40" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 10 35 L 40 30 L 85 40 Z" fill="#a855f7" fillOpacity="0.1" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
             <div className="text-[7px] text-white/30 uppercase font-black absolute top-2 left-2 tracking-widest">Order Block</div>
             <svg className="w-full h-14 drop-shadow-[0_0_8px_rgba(168,85,247,0.2)]" viewBox="0 0 100 40">
                <rect x="25" y="10" width="50" height="20" fill="#a855f7" fillOpacity="0.1" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2 2" />
                <path d="M 5 35 L 20 15 L 40 12 L 60 25 L 80 18 L 95 5" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
             </svg>
          </div>
        </div>
      );
    case 'chart_double_top_bottom':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="text-[7px] text-rose-400/60 uppercase font-black absolute top-2 left-2">Double Top (M)</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <path d="M 10 30 L 30 10 L 50 25 L 70 10 L 90 30" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="25" x2="90" y2="25" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.3" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="text-[7px] text-emerald-400/60 uppercase font-black absolute top-2 left-2">Double Bottom (W)</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <path d="M 10 10 L 30 30 L 50 15 L 70 30 L 90 10" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="15" x2="90" y2="15" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.3" />
             </svg>
          </div>
        </div>
      );
    case 'chart_head_shoulders':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center h-36">
             <div className="text-[7px] text-rose-400 uppercase font-black mb-2">Head & Shoulders</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <path d="M 5 35 L 25 15 L 35 25 L 50 5 L 65 25 L 75 15 L 95 35" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="28" x2="90" y2="28" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.3" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center h-36">
             <div className="text-[7px] text-emerald-400 uppercase font-black mb-2">Inverse H&S</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <path d="M 5 5 L 25 25 L 35 15 L 50 35 L 65 15 L 75 25 L 95 5" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="12" x2="90" y2="12" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.3" />
             </svg>
          </div>
        </div>
      );
    case 'chart_cup_handle_deep':
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 relative overflow-hidden group">
           <div className="text-[8px] text-purple-400 font-black uppercase absolute top-3 left-4 tracking-widest">Bullish Cup & Handle</div>
           <svg className="w-full h-24" viewBox="0 0 100 40">
              <path d="M 10 10 C 10 45, 70 45, 70 10" fill="none" stroke="#a855f7" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 70 10 C 70 25, 90 25, 90 10 L 95 0" fill="none" stroke="#a855f7" strokeWidth="3.5" strokeLinecap="round" />
              <motion.circle 
                animate={{ cx: [10, 40, 70, 80, 95], cy: [10, 35, 10, 18, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                r="1.5" fill="#a855f7"
              />
           </svg>
        </div>
      );
    case 'chart_flags_pennants':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center h-36">
             <div className="text-[7px] text-emerald-400 uppercase font-black mb-2">Bull Flag</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <path d="M 10 38 L 35 5" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                <path d="M 35 5 L 60 15 L 55 25 L 30 15 Z" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
                <path d="M 55 20 L 90 0" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center h-36">
             <div className="text-[7px] text-emerald-400 uppercase font-black mb-2">Pennant</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <path d="M 10 38 L 40 15" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                <path d="M 40 15 L 70 25 L 40 35 Z" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
                <path d="M 60 25 L 95 5" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
             </svg>
          </div>
        </div>
      );
    case 'chart_wedges_deep':
      return (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center h-36">
             <div className="text-[7px] text-emerald-400 uppercase font-black mb-2">Falling Wedge</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <line x1="10" y1="35" x2="80" y2="15" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <line x1="10" y1="10" x2="80" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <path d="M 15 30 L 30 15 L 45 32 L 60 18 L 75 28 L 95 10" fill="none" stroke="#10b981" strokeWidth="2.5" />
             </svg>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center h-36">
             <div className="text-[7px] text-rose-400 uppercase font-black mb-2">Rising Wedge</div>
             <svg className="w-full h-16" viewBox="0 0 100 40">
                <line x1="10" y1="10" x2="80" y2="30" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <line x1="10" y1="35" x2="80" y2="25" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                <path d="M 15 15 L 30 30 L 45 18 L 60 32 L 75 22 L 95 40" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
             </svg>
          </div>
        </div>
      );
    case 'chart_rectangles_deep':
      return (
        <div className="flex flex-col items-center justify-center h-36 bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 group">
           <svg className="w-full h-20" viewBox="0 0 100 40">
              <rect x="15" y="10" width="70" height="20" fill="#6366f1" fillOpacity="0.05" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
              <path d="M 5 25 L 15 15 L 25 30 L 35 10 L 45 30 L 55 10 L 65 30 L 75 10 L 85 30 L 98 0" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <text x="50" y="22" fill="#6366f1" fontSize="6" fontWeight="black" textAnchor="middle" className="uppercase opacity-40">The Box Zone</text>
           </svg>
           <span className="text-[8px] text-indigo-400 font-black uppercase mt-2">Darvas Box / Rectangle</span>
        </div>
      );
    default:
      return null;
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
  const [analysisMode, setAnalysisMode] = useState<'llm' | 'options' | 'fundamentals' | 'learning' | 'blog' | 'scanners' | 'watchlist' | 'heatmap'>('fundamentals');
  const [llmPrediction, setLlmPrediction] = useState<string | null>(null);
  const [engineQuestion, setEngineQuestion] = useState('');
  const [isGeneratingLlm, setIsGeneratingLlm] = useState(false);
  const [llmModel, setLlmModel] = useState('gemini-3-flash-preview');
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isCustomizingGpt, setIsCustomizingGpt] = useState(false);
  const [llmTemperature, setLlmTemperature] = useState(0.2);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [orbitApiKey, setOrbitApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orbit_api_key') || '';
    }
    return '';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && orbitApiKey) {
      localStorage.setItem('orbit_api_key', orbitApiKey);
    }
  }, [orbitApiKey]);
  
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
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await fetch("/api/watchlist?userId=guest_user");
        if (res.ok) {
          const symbols = await res.json();
          setWatchlistSymbols(symbols);
        }
      } catch (e) {
        console.error("Watchlist fetch error", e);
      }
    };
    fetchWatchlist();
  }, []);

  const toggleWatchlist = async (scripCode: string) => {
    const isWatched = watchlistSymbols.includes(scripCode);
    const endpoint = isWatched ? "/api/watchlist/remove" : "/api/watchlist/add";
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest_user', scripCode })
      });
      if (res.ok) {
        const newSymbols = await res.json();
        setWatchlistSymbols(newSymbols);
      }
    } catch (e) {
      console.error("Toggle watchlist error", e);
    }
  };

  useEffect(() => {
    let timeoutId: number;
    let isMounted = true;

    const fetchMarketOverview = async () => {
      if (document.hidden || !isMounted) {
        timeoutId = window.setTimeout(fetchMarketOverview, 60000); // Check every 60s
        return;
      }

      try {
        const res = await fetch("/api/market-overview");
        if (!res.ok) {
          if (res.status === 429) {
            console.warn("Market overview rate limited (429). Retrying in 2 minutes.");
            if (isMounted) {
              timeoutId = window.setTimeout(fetchMarketOverview, 120000); // 2 min backoff
            }
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          if (Array.isArray(data)) {
            setMarketOverview(data);
          } else {
            console.warn("Market overview data is not an array", data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch market overview", err);
      } finally {
        if (isMounted) {
          timeoutId = window.setTimeout(fetchMarketOverview, 60000); // normal 60s interval
        }
      }
    };
    
    fetchMarketOverview();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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
        
        <div className="mt-8 pt-6 border-t border-black/5 flex justify-between items-center relative z-10">
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
        if (!res.ok) {
          throw new Error(`Search failed with status: ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
          if (data.length === 0) setNoResults(true);
        } else {
          console.error("Search results were not an array:", data);
          setSearchResults([]);
        }
      } catch (err) { 
        console.error("Search Error:", err); 
      } finally { 
        setIsSearching(false); 
      }
    }, 400);
  };

  const selectStock = async (stock: Stock, newInterval = chartInterval) => {
    setSelectedStock(stock);
    setAnalysisMode('fundamentals');
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

      if (!dataRes.ok || !histRes.ok) {
        throw new Error(`Failed to fetch critical stock data. Status: ${dataRes.status}/${histRes.ok ? 'ok' : histRes.status}`);
      }

      const dataJson = await dataRes.json();
      const histJson = await histRes.json();
      
      let optionsJson = null;
      if (optionsRes.ok) {
        optionsJson = await optionsRes.json();
      } else {
        console.warn("Options data fetch failed with status:", optionsRes.status);
      }
      
      if (Array.isArray(histJson)) {
        setHistoricalData(histJson);
      } else {
        console.error("Historical data is not an array:", histJson);
        setHistoricalData([]);
      }
      
      if (dataJson && !dataJson.error) {
        setStockData(dataJson);
      } else {
        console.error("Stock data error:", dataJson);
        setStockData(null);
      }

      if (optionsJson && !optionsJson.error) {
        setOptionsData(optionsJson);
      } else {
        setOptionsData(null);
      }
    } catch (err) { 
      console.error("Stock Selection Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const refreshOptionsData = async () => {
    if (!selectedStock) return;
    setIsRefreshingOptions(true);
    try {
      const optionsRes = await fetch(`/api/options-data?scripCode=${selectedStock.scripCode}`);
      if (!optionsRes.ok) {
        throw new Error(`Options refresh failed with status: ${optionsRes.status}`);
      }
      const optionsJson = await optionsRes.json();
      if (optionsJson && !optionsJson.error) {
        setOptionsData(optionsJson);
      } else {
        console.error("Options Refresh Error Content:", optionsJson);
        setOptionsData(null);
      }
    } catch (err) {
      console.error("Options Refresh Error:", err);
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
    if (!selectedStock && !engineQuestion.trim()) return;
    
    setIsGeneratingLlm(true);
    setLlmPrediction(null);
    
    try {
      const apiKey = orbitApiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setLlmPrediction("Please provide a Gemini API key in the ORBIT Engine settings.");
        setIsGeneratingLlm(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      let dataContext = '';
      if (selectedStock && stockData && historicalData && analysis) {
        dataContext = `
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
      }
      
      const prompt = dataContext + customPrompt + (engineQuestion ? `\n\nUser Question: ${engineQuestion}` : '');

      if (aiProvider === 'ollama') {
        const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: prompt,
            stream: false,
            options: {
              temperature: llmTemperature
            }
          })
        });
        
        if (!ollamaResponse.ok) throw new Error("Failed to connect to Ollama");
        const json = await ollamaResponse.json();
        setLlmPrediction(json.response);
      } else {
        const response = await ai.models.generateContent({
          model: llmModel,
          contents: prompt,
          config: {
            temperature: llmTemperature,
            tools: [{ googleSearch: {} }]
          }
        });

        setLlmPrediction(response.text);
      }
    } catch (err) {
      console.error("LLM Prediction Error:", err);
      setLlmPrediction(aiProvider === 'ollama' ? "Error connecting to local Ollama. Ensure it's running and CORS is enabled." : "Error generating prediction. Please check your API key and try again.");
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
      const disclaimer = `CRITICAL REGULATION: You are a "Tiker 360 Plus AI Educational Assistant" and general-purpose intelligence. You can answer any type of question and use web search. For finance: You must ALWAYS act strictly as an educational entity. You are NOT a SEBI-registered advisor. Under absolutely no circumstances can you provide specific entry targets, specific stop losses, "buy" or "sell" recommendations, or actionable investment advice.\n\n`;
      const contextStr = selectedStock 
        ? `${disclaimer}The user is currently studying the data for ${selectedStock.name} (${selectedStock.symbol}).`
        : disclaimer;

      if (aiProvider === 'ollama') {
        const ollamaMessages = [
          { role: 'system', content: contextStr },
          ...chatMessages.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content })),
          { role: 'user', content: userMessage }
        ];

        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            messages: ollamaMessages,
            stream: false
          })
        });

        if (!response.ok) throw new Error("Failed to connect to Ollama");
        const json = await response.json();
        setChatMessages(prev => [...prev, { role: 'model', content: json.message?.content || '' }]);
      } else {
        const apiKey = orbitApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          setChatMessages(prev => [...prev, { role: 'model', content: "Please provide a Gemini API key in the ORBIT Engine settings to use the Tiker 360 Plus Assistant." }]);
          setIsChatLoading(false);
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const geminiContents = chatMessages.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
        geminiContents.push({ role: 'user', parts: [{ text: userMessage }] });

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: geminiContents,
          config: {
            systemInstruction: contextStr,
            tools: [{ googleSearch: {} }]
          }
        });

        setChatMessages(prev => [...prev, { role: 'model', content: response.text || "Sorry, I couldn't process that request." }]);
      }
    } catch (e) {
      console.error("Chat error", e);
      setChatMessages(prev => [...prev, { role: 'model', content: aiProvider === 'ollama' ? "Error connecting to local Ollama. Ensure it's running and CORS is enabled via OLLAMA_ORIGINS=\"*\"." : "An error occurred while communicating with the AI Engine." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current && isChatOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const renderSearchBar = (isHero = false) => (
    <div className={cn("relative flex-1 w-full", isHero ? "max-w-2xl mx-auto z-50 mt-8 mb-4" : "max-w-2xl mx-0 md:mx-16")} ref={searchRef}>
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
              <div
                key={`${stock.scripCode}-${index}`}
                className="w-full px-6 py-4 text-left hover:bg-white/5 flex items-center justify-between transition-colors border-b border-white/5 last:border-0 group relative overflow-hidden"
              >
                <button 
                  className="absolute inset-0 z-0"
                  onClick={() => selectStock(stock)}
                />
                <div className="flex items-center gap-4 relative z-10 pointer-events-none">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-xs text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {stock.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight">{stock.symbol}</div>
                    <div className="text-[10px] text-white/30 font-medium uppercase">{stock.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle watchlist
                      toggleWatchlist(stock.scripCode);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Star className={cn("w-4 h-4", watchlistSymbols.includes(stock.scripCode) ? "fill-amber-400 text-amber-400" : "text-white/20")} />
                  </button>
                  <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
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
  );

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
                </div>
              </div>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-8 ml-8">
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('fundamentals'); }}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                !selectedStock && analysisMode !== 'blog' && analysisMode !== 'scanners' && analysisMode !== 'learning' ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              Terminal
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('llm'); }}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'llm' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              ORBIT ENGINE
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('watchlist'); }}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'watchlist' ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              Watchlist
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('heatmap'); }}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'heatmap' ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              Heatmap
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('scanners'); }}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'scanners' ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              Scanners
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('learning'); }}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'learning' ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              Academy
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('blog'); }}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'blog' ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              Blog
            </button>
          </nav>

          <nav className="flex xl:hidden items-center justify-center gap-6 w-full py-2 border-t border-white/5 overflow-x-auto whitespace-nowrap px-4">
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('fundamentals'); }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                !selectedStock && analysisMode !== 'blog' && analysisMode !== 'scanners' && analysisMode !== 'learning' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              Terminal
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('llm'); }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'llm' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              ORBIT ENGINE
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('watchlist'); }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'watchlist' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              Watchlist
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('heatmap'); }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'heatmap' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              Heatmap
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('scanners'); }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'scanners' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              Scanners
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('learning'); }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'learning' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              Academy
            </button>
            <button 
              onClick={() => { setSelectedStock(null); setAnalysisMode('blog'); }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                analysisMode === 'blog' ? "text-blue-400" : "text-white/40 hover:text-white"
              )}
            >
              Blog
            </button>
          </nav>

          {selectedStock ? renderSearchBar(false) : <div className="hidden md:block flex-1 w-full max-w-2xl mx-0 md:mx-16"></div>}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden md:flex w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center transition-colors shrink-0 border border-white/10 ml-4"
          >
            <Settings className="w-5 h-5 text-white/70 hover:text-white" />
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Center: Main Analysis Engine */}
        <div className="w-full space-y-8">
          {!selectedStock ? (
            analysisMode === 'llm' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass-card rounded-[2rem] p-8 max-w-4xl mx-auto mt-12">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Bot className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-euro uppercase tracking-widest">ORBIT Engine</h3>
                        <p className="text-[9px] dot-matrix text-white/40">General Intelligence & Quantum Data Models</p>
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
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                        <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Lite</option>
                      </select>
                      <button
                        onClick={generateLLMPrediction}
                        disabled={isGeneratingLlm || !engineQuestion.trim()}
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
                            Run ORBIT
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
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Custom ORBIT Instructions</h4>
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
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] md:text-xs font-mono text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[150px]"
                            placeholder="Add custom system instructions or context..."
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col sm:flex-row gap-2 mb-8">
                    <input
                      type="text"
                      value={engineQuestion}
                      onChange={(e) => setEngineQuestion(e.target.value)}
                      placeholder="Ask any question about the market or anything else..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') generateLLMPrediction();
                      }}
                    />
                    <button
                      onClick={generateLLMPrediction}
                      disabled={isGeneratingLlm || !engineQuestion.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-blue-600/20 whitespace-nowrap"
                    >
                      Ask Question
                    </button>
                  </div>

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
                        ORBIT Ready. Ask a question to begin.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : analysisMode === 'blog' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center text-center mb-12">
                   <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                     <TrendingUp className="w-8 h-8 text-blue-500" />
                   </div>
                   <h1 className="text-3xl md:text-5xl font-euro tracking-tighter uppercase mb-4">Quant Journal<span className="text-blue-500">.</span></h1>
                   <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em]">Institutional Insights & Market Research</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {BLOG_POSTS.map((post) => (
                    <motion.div 
                      key={post.id}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedBlogPost(post)}
                      className="group cursor-pointer bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden hover:bg-white/[0.05] transition-all hover:border-blue-500/30 shadow-2xl"
                    >
                      <div className="p-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full border border-blue-500/20">{post.category}</span>
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{post.date}</span>
                        </div>
                        <h3 className="text-lg font-black uppercase leading-tight mb-4 group-hover:text-blue-400 transition-colors">{post.title}</h3>
                        <p className="text-[11px] text-white/50 leading-relaxed mb-8 flex-1">{post.excerpt}</p>
                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">
                               {post.author[0]}
                             </div>
                             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{post.author}</span>
                          </div>
                          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{post.readTime}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : analysisMode === 'scanners' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh] md:min-h-[75vh]">
                <ScannersDashboard />
              </div>
            ) : analysisMode === 'learning' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh] md:min-h-[75vh]">
                <AcademyDashboard setSelectedAcademyTopic={setSelectedAcademyTopic} />
              </div>
            ) : analysisMode === 'heatmap' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh] md:min-h-[75vh]">
                <Heatmap />
              </div>
            ) : analysisMode === 'watchlist' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh] md:min-h-[75vh]">
                <WatchlistDashboard 
                  userId="guest_user" 
                  watchlistSymbols={watchlistSymbols}
                  onSelectStock={selectStock} 
                  onRemove={toggleWatchlist}
                  onAdd={toggleWatchlist}
                />
              </div>
            ) : (
              <div className="min-h-[60vh] md:min-h-[75vh] flex flex-col items-center justify-center text-center glass-card rounded-[3rem] md:rounded-[4rem] relative cursor-default overflow-hidden py-16 px-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)]" />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 md:w-32 md:h-32 bg-white text-black rounded-full flex items-center justify-center mb-8 md:mb-12 shadow-2xl relative z-10"
              >
                <Zap className="w-10 h-10 md:w-14 md:h-14" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-euro tracking-tighter mb-6 md:mb-8 relative z-10 leading-none uppercase">TIKER 360 PLUS<span className="text-white/20">.</span></h1>

              {!selectedStock && renderSearchBar(true)}

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
          )
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
                    ORBIT ENGINE
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
                  <button
                    onClick={() => setAnalysisMode('scanners')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                      analysisMode === 'scanners' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-white/30 hover:text-white/60"
                    )}
                  >
                    <Search className="w-3 h-3" />
                    Scanners
                  </button>
                </div>
              </div>

              <div className="mt-8">
                {/* Top Bar: Verdict & Probability */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                <div className="lg:col-span-5 bg-white text-black rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] text-center md:text-left min-h-[160px]">
                  <div className="text-[8px] dot-matrix text-black/40 mb-2">Live Price</div>
                  <div className="text-3xl md:text-5xl font-euro tracking-tighter mb-3">₹{stockData.lastPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}</div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                    {stockData.change && stockData.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stockData.change || 0} ({stockData.pChange || 0}%)
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <IntradayRangeBox data={stockData} analysis={analysis} />
                  <VolatilityBand currentPrice={stockData.lastPrice} atrValue={analysis.indicators.atr} />
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
                <TechnicalChart 
                  data={historicalData} 
                  symbol={selectedStock.symbol} 
                  analysis={analysis} 
                />
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
                    <div className="flex items-start gap-4">
                      <div>
                        <h3 className="text-xl font-euro tracking-tight uppercase mb-1">{selectedStock.symbol}</h3>
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{stockData.sector || 'N/A'} • {stockData.industry || 'N/A'}</p>
                      </div>
                      <button 
                        onClick={() => toggleWatchlist(selectedStock.scripCode)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
                      >
                        <Star className={cn("w-4 h-4", watchlistSymbols.includes(selectedStock.scripCode) ? "fill-amber-400 text-amber-400" : "text-white/20")} />
                      </button>
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
                      <h3 className="text-sm font-euro uppercase tracking-widest">ORBIT Engine</h3>
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
                          Run ORBIT
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

                <div className="flex flex-col sm:flex-row gap-2 mb-8">
                  <input
                    type="text"
                    value={engineQuestion}
                    onChange={(e) => setEngineQuestion(e.target.value)}
                    placeholder="Ask any question about the stock or anything else..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') generateLLMPrediction();
                    }}
                  />
                  <button
                    onClick={generateLLMPrediction}
                    disabled={isGeneratingLlm || !engineQuestion.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-blue-600/20 whitespace-nowrap"
                  >
                    Ask Question
                  </button>
                </div>

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
                      Engine Ready. Click "Run ORBIT" to analyze {selectedStock.symbol}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {analysisMode === 'options' && (
            <div className="space-y-8">
              <OptionsCalculator />
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
            </div>
          )}

          {/* Scanners module */}
          {analysisMode === 'scanners' && (
            <ScannersDashboard />
          )}

          {/* Learning Module */}
          {analysisMode === 'learning' && (
            <AcademyDashboard 
              setSelectedAcademyTopic={setSelectedAcademyTopic}
              selectedStock={selectedStock}
              analysis={analysis}
              optionsData={optionsData}
              stockData={stockData}
            />
          )}
            </div>
          )}
        </div>
      </main>

      {/* System Status Bar */}
      <footer className="border-t border-white/5 bg-black/80 backdrop-blur-3xl h-auto md:h-12 fixed bottom-0 left-0 right-0 z-50 py-3 md:py-0">
        <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center gap-6 md:gap-10">
            <span className="text-[8px] dot-matrix text-white/20 uppercase tracking-[0.2em]">© 2026 TIKER 360 PLUS</span>
            <div className="hidden sm:block h-3 w-px bg-white/5" />
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
                 {ACADEMY_MODULES[selectedAcademyTopic].visual && (
                   <PatternVisualizer type={ACADEMY_MODULES[selectedAcademyTopic].visual as string} />
                 )}
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
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">ORBIT Engine</h4>
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

      {/* Blog Post Modal */}
      <AnimatePresence>
        {selectedBlogPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBlogPost(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/10 rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col"
            >
              {/* Header */}
              <div className="p-8 md:p-12 pb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 px-4 py-1.5 rounded-full border border-blue-500/20">{selectedBlogPost.category}</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{selectedBlogPost.date}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white leading-none mb-4">{selectedBlogPost.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black">
                      {selectedBlogPost.author[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{selectedBlogPost.author}</span>
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Senior Research Analyst</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBlogPost(null)}
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all text-white/40 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-12 no-scrollbar">
                <div className="markdown-body prose-invert prose-p:text-white/70 prose-headings:text-white prose-strong:text-blue-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {selectedBlogPost.content}
                  </ReactMarkdown>
                </div>
                
                <div className="mt-16 pt-12 border-t border-white/5 text-center">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-8">End of Research Journal</p>
                  <button 
                    onClick={() => setSelectedBlogPost(null)}
                    className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                  >
                    Back to Feed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiProvider={aiProvider}
        setAiProvider={setAiProvider}
        ollamaUrl={ollamaUrl}
        setOllamaUrl={setOllamaUrl}
        ollamaModel={ollamaModel}
        setOllamaModel={setOllamaModel}
        llmModel={llmModel}
        setLlmModel={setLlmModel}
        llmTemperature={llmTemperature}
        setLlmTemperature={setLlmTemperature}
        orbitApiKey={orbitApiKey}
        setOrbitApiKey={setOrbitApiKey}
      />
    </div>
  );
}
