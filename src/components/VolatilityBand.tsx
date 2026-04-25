import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface VolatilityBandProps {
  currentPrice: number;
  atrValue: number | null;
}

export const VolatilityBand: React.FC<VolatilityBandProps> = ({ currentPrice, atrValue }) => {
  const [multiplier, setMultiplier] = useState(1.5);
  const [atrPeriod, setAtrPeriod] = useState(14); // Educational input

  const safeAtr = atrValue || currentPrice * 0.015; // default 1.5% if null
  // Calculate bounds mathematically
  const upperBound = currentPrice + (safeAtr * multiplier);
  const lowerBound = currentPrice - (safeAtr * multiplier);

  return (
    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 shadow-xl mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-white/50" />
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Historical Volatility Range</div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-widest font-bold text-white/50">ATR Period</span>
            <input 
              type="number" 
              value={atrPeriod}
              onChange={(e) => setAtrPeriod(Math.max(1, Number(e.target.value)))}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 w-16 text-xs text-center font-mono focus:outline-none focus:border-white/30"
              title="This is an educational parameter demonstrating the typical period selected. (Requires backend connection for real-time recalculation of the base ATR)"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-widest font-bold text-white/50">SD Multiplier</span>
            <select 
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-white/30"
            >
              <option value={1.0}>1.0x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x</option>
              <option value={2.5}>2.5x</option>
              <option value={3.0}>3.0x</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="text-[8px] text-white/40 italic mb-6">Mathematical projection based on standard deviations and Average True Range (ATR). Purely for quantitative research and educational analysis.</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
          <div className="text-[7px] font-bold text-white/40 uppercase tracking-widest mb-1">Upper Mathematical Bound</div>
          <div className="text-[14px] font-black font-mono text-white/90">₹{upperBound.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-[7px] font-bold text-white/30 uppercase mt-2">Calc: +{multiplier} ATR</div>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
          <div className="text-[7px] font-bold text-white/40 uppercase tracking-widest mb-1">Lower Mathematical Bound</div>
          <div className="text-[14px] font-black font-mono text-white/90">₹{lowerBound.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-[7px] font-bold text-white/30 uppercase mt-2">Calc: -{multiplier} ATR</div>
        </div>
      </div>
    </div>
  );
};
