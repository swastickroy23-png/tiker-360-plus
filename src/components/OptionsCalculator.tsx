import React, { useState, useMemo } from 'react';
import { Calculator, AlertCircle } from 'lucide-react';

// Basic approximation functions for BS Model (for educational demonstration)
function normDist(x: number) {
  // Approximation of the cumulative normal distribution function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

function calcBS(S: number, K: number, t: number, r: number, v: number) {
  if (t <= 0 || v <= 0) return { call: Math.max(0, S - K), put: Math.max(0, K - S), d1: 0, d2: 0 };
  
  const d1 = (Math.log(S / K) + (r + (v * v) / 2.0) * t) / (v * Math.sqrt(t));
  const d2 = d1 - v * Math.sqrt(t);
  
  const call = S * normDist(d1) - K * Math.exp(-r * t) * normDist(d2);
  const put = K * Math.exp(-r * t) * normDist(-d2) - S * normDist(-d1);
  
  return { call, put, d1, d2 };
}

function calcGreeks(S: number, K: number, t: number, r: number, v: number, d1: number, d2: number) {
  const normPdf = (x: number) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  
  const callDelta = normDist(d1);
  const putDelta = callDelta - 1;
  
  const gamma = normPdf(d1) / (S * v * Math.sqrt(t));
  const vega = S * normPdf(d1) * Math.sqrt(t) / 100; // per 1% change
  
  const callTheta = (-S * normPdf(d1) * v / (2 * Math.sqrt(t)) - r * K * Math.exp(-r * t) * normDist(d2)) / 365;
  const putTheta = (-S * normPdf(d1) * v / (2 * Math.sqrt(t)) + r * K * Math.exp(-r * t) * normDist(-d2)) / 365;
  
  return { callDelta, putDelta, gamma, vega, callTheta, putTheta };
}

export const OptionsCalculator = () => {
  const [S, setS] = useState(24000); // Underlying Price
  const [K, setK] = useState(24000); // Strike Price
  const [dte, setDte] = useState(30); // Days to expiry
  const [v, setV] = useState(15); // Implied Volatility %
  const [r, setR] = useState(6); // Risk-free rate %

  const results = useMemo(() => {
    // Convert to standard units
    const tYears = Math.max(dte, 0.001) / 365;
    const vDec = Math.max(v, 0.1) / 100;
    const rDec = r / 100;

    const bs = calcBS(S, K, tYears, rDec, vDec);
    const greeks = calcGreeks(S, K, tYears, rDec, vDec, bs.d1, bs.d2);

    return { ...bs, ...greeks };
  }, [S, K, dte, v, r]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Compliance Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Theoretical Data Notice</h4>
          <p className="text-xs text-blue-200/70 leading-relaxed">
            The mathematical outputs calculated below are based strictly on the Black-Scholes pricing model. This is an educational tool for exploring theoretical options pricing and Greek values. It does not constitute financial advice.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-euro tracking-tighter uppercase flex items-center gap-3">
            <Calculator className="w-8 h-8 text-white/50" />
            Options Pricing Model
          </h2>
          <p className="text-sm dot-matrix text-white/40">Custom Theoretical Calculator (Educational Tool)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Inputs (Left Column) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10">
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Model Inputs</h3>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/70">Underlying Price (₹)</label>
              <input 
                type="number" 
                value={S} 
                onChange={e => setS(Number(e.target.value))}
                className="bg-black border border-white/20 rounded-xl px-4 py-3 text-lg font-mono w-full focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/70">Strike Price (K)</label>
              <input 
                type="number" 
                value={K} 
                onChange={e => setK(Number(e.target.value))}
                className="bg-black border border-white/20 rounded-xl px-4 py-3 text-lg font-mono w-full focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/70">Days to Expiry (DTE)</label>
              <input 
                type="number" 
                value={dte} 
                onChange={e => setDte(Number(e.target.value))}
                className="bg-black border border-white/20 rounded-xl px-4 py-3 text-lg font-mono w-full focus:outline-none focus:border-blue-500 transition-colors"
                min="0"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/70">Implied Volatility (IV %)</label>
              <input 
                type="number" 
                value={v} 
                onChange={e => setV(Number(e.target.value))}
                className="bg-black border border-white/20 rounded-xl px-4 py-3 text-lg font-mono w-full focus:outline-none focus:border-blue-500 transition-colors"
                min="0.1"
                step="0.1"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/70">Risk-Free Rate (%)</label>
              <input 
                type="number" 
                value={r} 
                onChange={e => setR(Number(e.target.value))}
                className="bg-black border border-white/20 rounded-xl px-4 py-3 text-lg font-mono w-full focus:outline-none focus:border-blue-500 transition-colors"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Mathematical Outputs (Right Column) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col">
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Theoretical Outputs</h3>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-black/50 border border-green-500/20 rounded-2xl p-6">
              <div className="text-[10px] font-bold text-green-400/70 uppercase tracking-widest mb-2">Theoretical Call</div>
              <div className="text-3xl font-euro font-bold text-green-400">₹{results.call.toFixed(2)}</div>
            </div>
            <div className="bg-black/50 border border-red-500/20 rounded-2xl p-6">
              <div className="text-[10px] font-bold text-red-400/70 uppercase tracking-widest mb-2">Theoretical Put</div>
              <div className="text-3xl font-euro font-bold text-red-400">₹{results.put.toFixed(2)}</div>
            </div>
          </div>

          <h4 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Greeks (Math Data)</h4>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Call Delta</span>
              <span className="font-mono text-sm">{results.callDelta.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Put Delta</span>
              <span className="font-mono text-sm">{results.putDelta.toFixed(4)}</span>
            </div>
            
            <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Gamma</span>
              <span className="font-mono text-sm">{results.gamma.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Vega</span>
              <span className="font-mono text-sm">{results.vega.toFixed(4)}</span>
            </div>

            <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Call Theta</span>
              <span className="font-mono text-sm">{results.callTheta.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Put Theta</span>
              <span className="font-mono text-sm">{results.putTheta.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
