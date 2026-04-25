import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Activity, 
  BarChart2, 
  Trash2, 
  Search, 
  ArrowUpRight,
  Shield,
  Zap,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StockData {
  symbol: string;
  scripCode: string;
  name: string;
  lastPrice: number;
  change: number;
  pChange: number;
  volume: number;
  high: number;
  low: number;
  prevClose: number;
}

interface WatchlistDashboardProps {
  userId: string;
  watchlistSymbols: string[];
  onSelectStock: (stock: { symbol: string; scripCode: string; name: string }) => void;
  onRemove: (scripCode: string) => void;
  onAdd: (scripCode: string) => void;
}

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

export const WatchlistDashboard = ({ userId, watchlistSymbols, onSelectStock, onRemove, onAdd }: WatchlistDashboardProps) => {
  const [watchlistData, setWatchlistData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addSymbol, setAddSymbol] = useState('');

  const fetchWatchlistData = async (symbols: string[]) => {
    if (symbols.length === 0) {
      setWatchlistData([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      if (!res.ok) throw new Error("Failed to fetch watchlist data");
      const data = await res.json();
      setWatchlistData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load real-time data for your watchlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchWatchlistData(watchlistSymbols);

    const interval = setInterval(() => {
      if (watchlistSymbols.length > 0) {
        fetchWatchlistData(watchlistSymbols);
      }
    }, 30000); // 30s refresh

    return () => clearInterval(interval);
  }, [watchlistSymbols]);

  const handleRemove = async (e: React.MouseEvent, scripCode: string) => {
    e.stopPropagation();
    onRemove(scripCode);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSymbol) return;
    onAdd(addSymbol.toUpperCase());
    setAddSymbol('');
  };

  if (loading && watchlistData.length === 0 && watchlistSymbols.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[3rem] border border-white/10">
        <Loader2 className="w-12 h-12 text-white/20 animate-spin mb-4" />
        <p className="text-[10px] dot-matrix text-white/40 uppercase tracking-widest">Syncing Watchlist Data...</p>
      </div>
    );
  }

  if (watchlistSymbols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[3rem] border border-white/10 text-center px-6">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Star className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-2xl font-euro tracking-tighter uppercase mb-2">Watchlist Empty</h2>
        <p className="text-xs text-white/40 max-w-xs mx-auto mb-8 leading-relaxed">
          Start tracking your favorite stocks by adding them below.
        </p>
        <form onSubmit={handleAdd} className="flex gap-2 w-full max-w-xs">
          <input 
            type="text"
            value={addSymbol}
            onChange={(e) => setAddSymbol(e.target.value)}
            placeholder="Enter Ticker (e.g. RELIANCE)"
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors">
            Add
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-euro tracking-tighter uppercase">My Watchlist</h2>
          <p className="text-sm dot-matrix text-white/40">Personalized Alpha Tracking Station</p>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="text"
              value={addSymbol}
              onChange={(e) => setAddSymbol(e.target.value)}
              placeholder="Add Ticker..."
              className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-blue-500 w-32"
            />
            <button type="submit" className="bg-white text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors">
              Add
            </button>
          </form>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Live Feeds Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {watchlistData.map((stock) => (
            <motion.div
              layout
              key={stock.scripCode}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              onClick={() => onSelectStock({ symbol: stock.symbol, scripCode: stock.scripCode, name: stock.name })}
              className="group cursor-pointer bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.07] transition-all hover:border-white/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                <Shield className="w-24 h-24" />
              </div>

              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-sm text-blue-500 border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {stock.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xl font-euro tracking-widest leading-none mb-1">{stock.symbol}</h3>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] truncate max-w-[120px]">{stock.name}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleRemove(e, stock.scripCode)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Last Traded Price</span>
                    <div className="text-3xl font-euro tracking-tight leading-none">
                      ₹{stock.lastPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className={cn(
                    "flex flex-col items-end px-4 py-2 rounded-2xl border",
                    stock.change >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  )}>
                    <div className="flex items-center gap-2 font-black text-sm italic">
                      {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(stock.change).toFixed(2)}
                    </div>
                    <span className="text-[10px] font-black">({stock.pChange?.toFixed(2)}%)</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest block mb-1">Volume</span>
                      <span className="text-[10px] font-mono font-black text-white/70">{(stock.volume / 100000).toFixed(1)}L</span>
                   </div>
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest block mb-1">Intraday Range</span>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-white/20" 
                           style={{ width: `${((stock.lastPrice - stock.low) / (stock.high - stock.low || 1)) * 100}%` }}
                         />
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-4 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-black uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
};
