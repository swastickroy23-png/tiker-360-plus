import React, { useState } from 'react';
import { Activity, Beaker, PieChart, TrendingUp, AlertCircle, Search, Filter, TrendingDown, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ScannerCard {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FUNDAMENTAL_SCANNERS: ScannerCard[] = [
  {
    title: "Piotroski Score (8-9)",
    description: "Companies with Piotroski score of 8-9 which reflects strength of a firm's financial position (Profitability, Leverage, Operating Efficiency).",
    icon: <Search className="w-5 h-5 text-blue-400" />
  },
  {
    title: "High ROCE & Low P/E (Magic Formula)",
    description: "Based on the famous Magic Formula. Identifies companies with high Return on Capital Employed trading at a low Price-to-Earnings ratio.",
    icon: <PieChart className="w-5 h-5 text-emerald-400" />
  },
  {
    title: "Debt-Free Giants (>500cr Mkt Cap)",
    description: "Large capitalisation companies operating with zero debt. Highlights financial stability and lower bankruptcy risk.",
    icon: <Activity className="w-5 h-5 text-purple-400" />
  },
  {
    title: "Highest Dividend Yield",
    description: "Stocks that have been consistently paying out dividends, sorted on the highest yield percentage.",
    icon: <TrendingUp className="w-5 h-5 text-amber-400" />
  },
  {
    title: "Low P/B & Profitable",
    description: "Stocks trading below their book value (P/B < 1.0) but generating positive net profits, indicating potential value undervaluation.",
    icon: <Filter className="w-5 h-5 text-rose-400" />
  },
  {
    title: "Consistent Profit Growth (3yr)",
    description: "Companies exhibiting >20% annual net profit growth consistently over the last 3 financial years.",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />
  },
  {
    title: "Graham Number Value Stocks",
    description: "Stocks trading significantly below their Graham Number (√(22.5 * BVPS * EPS)), indicating deep value.",
    icon: <Filter className="w-5 h-5 text-amber-500" />
  },
  {
    title: "Cash-Rich Mid Caps",
    description: "Mid-cap companies where cash & equivalents exceed 20% of their total market capitalization.",
    icon: <Activity className="w-5 h-5 text-blue-500" />
  },
  {
    title: "Owner-Operated / High Promoter",
    description: "Companies where promoters hold >70% stake with zero pledged shares, showing strong skin in the game.",
    icon: <Zap className="w-5 h-5 text-purple-500" />
  }
];

const TECHNICAL_SCANNERS: ScannerCard[] = [
  {
    title: "Golden Crossover (50 EMA > 200 EMA)",
    description: "When the 50-day moving average moves above the 200-day moving average from below, indicating structural momentum shift.",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />
  },
  {
    title: "RSI Oversold (< 30)",
    description: "Stocks with Relative Strength Index (RSI) of less than 30, statistically indicating high downside deviation.",
    icon: <Activity className="w-5 h-5 text-blue-400" />
  },
  {
    title: "Volume Breakout (3x 10-week avg)",
    description: "Companies where weekly trading volume has increased by more than 3x the 10-week average alongside positive price action.",
    icon: <Beaker className="w-5 h-5 text-purple-400" />
  },
  {
    title: "Darvas Box Proximity (near 52w high)",
    description: "Within 10% of 52-week High, 100% of 52-week Low, high relative volume. Highlights structural accumulation.",
    icon: <Filter className="w-5 h-5 text-amber-400" />
  },
  {
    title: "Near 200 EMA Support",
    description: "Technically sound stocks currently trading within 2% of their long-term 200-day Exponential Moving Average.",
    icon: <TrendingDown className="w-5 h-5 text-blue-400" />
  },
  {
    title: "MACD Bullish Cross",
    description: "When the MACD line crosses above the signal line on the daily timeframe, suggesting an early momentum reversal.",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />
  },
  {
    title: "MTF Momentum Breakout",
    description: "Stocks hitting fresh 20-day highs on Daily, Weekly, and Monthly timeframes simultaneously.",
    icon: <Zap className="w-5 h-5 text-amber-400" />
  },
  {
    title: "SuperTrend Flip (Daily)",
    description: "Stocks where the SuperTrend (10, 3) has just flipped from bearish to bullish on the daily chart.",
    icon: <Activity className="w-5 h-5 text-emerald-500" />
  },
  {
    title: "Inside Bar Breakout",
    description: "High volume breakout above the range of an 'Inside Bar' formed in the previous session.",
    icon: <Beaker className="w-5 h-5 text-indigo-400" />
  }
];

const FNO_SCANNERS: ScannerCard[] = [
  {
    title: "Aggressive Long Buildup",
    description: "Futures contracts exhibiting simultaneous rise in underlying price and corresponding Open Interest (OI) > 5%.",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />
  },
  {
    title: "Short Covering Rally",
    description: "Derivatives where underlying spot price is increasing while Open Interest is dropping. Highlights exiting shorts.",
    icon: <Activity className="w-5 h-5 text-purple-400" />
  },
  {
    title: "Implied Volatility (IV) Spikes",
    description: "Options chains where IV percentile currently runs > 85%, indicating expected near-term extreme variance.",
    icon: <Beaker className="w-5 h-5 text-rose-400" />
  },
  {
    title: "Put-Call Ratio (PCR) Extremes",
    description: "Contracts indicating highly overbought conditions (PCR < 0.6) or heavily oversold structural positioning (PCR > 1.4).",
    icon: <Filter className="w-5 h-5 text-blue-400" />
  },
  {
    title: "Extreme Intraday OI Change",
    description: "Futures showing >15% change in Open Interest in a single session, indicating aggressive thematic positioning.",
    icon: <Activity className="w-5 h-5 text-amber-400" />
  },
  {
    title: "High Option Pain Shift",
    description: "Weekly options where the 'Max Pain' level has migrated significantly, suggesting institutional hedge adjustments.",
    icon: <Zap className="w-5 h-5 text-purple-400" />
  },
  {
    title: "IV Crush Candidates",
    description: "High IV percentile (>90) counters near corporate actions where a volatility collapse is mathematically probable.",
    icon: <TrendingDown className="w-5 h-5 text-rose-500" />
  },
  {
    title: "Gamma Squeeze Potential",
    description: "Stocks with extreme Call OI concentration at a single OTM strike representing >30% of total series OI.",
    icon: <Zap className="w-5 h-5 text-amber-500" />
  },
  {
    title: "Calendar Spread Arb",
    description: "Scanning for >15% IV discrepancy between front-month and near-month ATM options.",
    icon: <Activity className="w-5 h-5 text-blue-400" />
  }
];

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

export const ScannersDashboard = () => {
  const [activeTab, setActiveTab] = useState<'fundamentals' | 'technicals' | 'fno' | 'custom'>('fundamentals');
  const [runningScan, setRunningScan] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<{ title: string; data: any[] } | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  const handleRunScan = async (title: string) => {
    setRunningScan(title);
    setScanResults(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scanner-results?title=${encodeURIComponent(title)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const json = await response.json();
      
      setScanResults({
        title,
        data: json.data || []
      });
    } catch (error) {
      console.error("Scan error:", error);
      // Fallback if API fails
      setScanResults({
        title,
        data: []
      });
    } finally {
      setRunningScan(null);
    }
  };

  const handleRunCustomScan = () => {
    if (!customQuery.trim()) return;
    handleRunScan("Custom Scan: " + customQuery.substring(0, 20) + (customQuery.length > 20 ? "..." : ""));
  };

  const scanners = activeTab === 'fundamentals' 
    ? FUNDAMENTAL_SCANNERS 
    : activeTab === 'technicals' 
      ? TECHNICAL_SCANNERS 
      : activeTab === 'fno'
        ? FNO_SCANNERS
        : [];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Compliance Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Regulatory Notice</h4>
          <p className="text-xs text-blue-200/70 leading-relaxed">
            Data is based on EOD feeds. Scans are mathematical filters and do not constitute financial advice. This tool is purely for quantitative research and educational purposes.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-euro tracking-tighter uppercase">Market Scanners</h2>
          <p className="text-sm dot-matrix text-white/40">Mathematical Research & Screening Tool</p>
        </div>
        
        <div className="flex bg-white/5 rounded-full p-1 border border-white/10 overflow-x-auto whitespace-nowrap max-w-full">
          <button
            onClick={() => setActiveTab('fundamentals')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
              activeTab === 'fundamentals' ? "bg-white text-black" : "text-white/40 hover:text-white/80"
            )}
          >
            Fundamental Scans
          </button>
          <button
            onClick={() => setActiveTab('technicals')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
              activeTab === 'technicals' ? "bg-white text-black" : "text-white/40 hover:text-white/80"
            )}
          >
            Technical Scans
          </button>
          <button
            onClick={() => setActiveTab('fno')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
              activeTab === 'fno' ? "bg-white text-black" : "text-white/40 hover:text-white/80"
            )}
          >
            FnO Scans
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
              activeTab === 'custom' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-blue-400/50 hover:text-blue-400"
            )}
          >
            Create Custom Filter
          </button>
        </div>
      </div>

      {activeTab === 'custom' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10 flex flex-col gap-6"
        >
          <div>
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Filter className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Build Custom Scanner Query</h3>
            <p className="text-sm dot-matrix text-white/50 leading-relaxed mb-6">Create your own programmatic filters using logical operators (AND, OR, &gt;, &lt;, =) against mathematical data points. Example: "Market Capitalization &gt; 500 AND PE Ratio &lt; 15".</p>
          </div>
          
          <div className="relative">
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm font-mono text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
              placeholder="Enter your query...&#10;Example:&#10;Price to Earning < 15 AND&#10;Return on capital employed > 20%"
            />
          </div>

          <button 
            onClick={handleRunCustomScan}
            disabled={runningScan !== null || !customQuery.trim()}
            className="w-full md:w-auto self-end px-12 py-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-black text-xs uppercase tracking-[0.2em] transition-colors border border-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {runningScan ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-400 border-t-white rounded-full animate-spin" />
                Querying...
              </>
            ) : (
              "Execute Custom Filter"
            )}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scanners.map((scanner, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={scanner.title} 
              className="bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all rounded-3xl p-6 md:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                  {scanner.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{scanner.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-8">{scanner.description}</p>
              </div>
              
              <button 
                onClick={() => handleRunScan(scanner.title)}
                disabled={runningScan === scanner.title}
                className="w-full py-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] transition-colors border border-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningScan === scanner.title ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-white rounded-full animate-spin" />
                    Querying Database...
                  </>
                ) : (
                  "Run Scan"
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {scanResults && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 mt-4 overflow-hidden relative"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4">
              <div>
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Scan Output Generated
                </h3>
                <h4 className="text-xl font-euro uppercase text-white">{scanResults.title}</h4>
                <p className="text-[10px] dot-matrix text-white/40 mt-2">Real Price Data from Yahoo Finance API</p>
              </div>
              <button 
                onClick={() => setScanResults(null)}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-[10px] font-black uppercase text-white/30 border-b border-white/10">Symbol</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase text-white/30 border-b border-white/10">Company Name</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase text-white/30 border-b border-white/10 text-right">Price</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase text-white/30 border-b border-white/10 text-right">% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.data.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors">
                      <td className="py-4 px-4">
                        <span className="bg-white/5 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">
                          {item.symbol}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-white/70">{item.name}</td>
                      <td className="py-4 px-4 text-sm font-mono text-white text-right">₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-4 text-right">
                        <div className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded",
                          item.change >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                        )}>
                          {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(item.change).toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
