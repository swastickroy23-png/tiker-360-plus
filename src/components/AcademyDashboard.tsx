import React from 'react';
import { Activity, LineChart, Maximize, Target, PieChart, Zap, BarChart2, Briefcase, Users, TrendingUp, TrendingDown, ArrowUpRight, Shield, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface AcademyDashboardProps {
  setSelectedAcademyTopic: (topic: string) => void;
  selectedStock?: any;
  analysis?: any;
  optionsData?: any;
  stockData?: any;
}

export const AcademyDashboard: React.FC<AcademyDashboardProps> = ({ 
  setSelectedAcademyTopic, 
  selectedStock, 
  analysis, 
  optionsData,
  stockData 
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full mb-8">
       <div className="glass-card rounded-[2rem] p-6 sm:p-8 md:p-10 border-2 border-purple-500/30">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center border-2 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm md:text-lg font-euro uppercase tracking-widest text-white">Trading Academy</h3>
                <p className="text-[9px] md:text-[10px] dot-matrix text-white/40 mt-1">Master quantitative concepts and indicators</p>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {/* Card 1: Statistical Pattern Structure */}
             <div onClick={() => setSelectedAcademyTopic('structure')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400"/> Pricing Structure</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The foundation of technical data. Markets move in trends or ranges. Historical patterns show accumulation at support and distribution at resistance.</p>
                {selectedStock && analysis?.structure && <div className="text-[8px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">Applies to: {selectedStock.symbol} ({analysis.structure})</div>}
             </div>

              {/* Card 2: RSI */}
              <div onClick={() => setSelectedAcademyTopic('rsi')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><LineChart className="w-4 h-4 text-blue-400"/> RSI</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: $100 - [100/(1+RS)]$. Measures speed & change of price movements. 70+ = Exhaustion, 30- = Oversold.</p>
                 {analysis?.indicators?.rsi && <div className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded inline-block">Current RSI: {analysis.indicators.rsi.toFixed(2)}</div>}
              </div>

             {/* Card 3: ATR */}
             <div onClick={() => setSelectedAcademyTopic('atr')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Maximize className="w-4 h-4 text-amber-400"/> ATR</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Average True Range measures market volatility. Quantitative models use ATR to define risk thresholds to account for standard market noise.</p>
                {analysis?.indicators?.atr && <div className="text-[8px] font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded inline-block">Current ATR: ₹{analysis.indicators.atr.toFixed(2)}</div>}
             </div>

             {/* Card 4: Max Pain (Options) */}
             <div onClick={() => setSelectedAcademyTopic('maxpain')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-rose-400"/> Max Pain</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The strike price where the highest number of options expire worthless. Option writers often try to pin the price here at expiry.</p>
                {optionsData?.maxPain && <div className="text-[8px] font-mono text-rose-400 bg-rose-400/10 px-2 py-1 rounded inline-block">Current Max Pain: {optionsData.maxPain}</div>}
             </div>

              {/* Card 5: PCR (Put-Call Ratio) */}
              <div onClick={() => setSelectedAcademyTopic('pcr')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><PieChart className="w-4 h-4 text-purple-400"/> Put-Call Ratio</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Formula: Put OI / Call OI. Sentiment gauge. Extremes act as contrarian signals.</p>
                 {optionsData?.pcr && <div className="text-[8px] font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded inline-block">Current PCR: {optionsData.pcr.toFixed(2)}</div>}
              </div>

             {/* Card 6: VWAP */}
             <div onClick={() => setSelectedAcademyTopic('vwap')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400"/> VWAP</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Volume Weighted Average Price. Price above VWAP signifies bullish institutional volume. Price below VWAP = Bearish.</p>
             </div>

             {/* Card 7: MACD */}
             <div onClick={() => setSelectedAcademyTopic('macd')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-emerald-400"/> MACD</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Moving Average Convergence Divergence. Used to spot changes in strength, direction, momentum, and duration of a trend. Look for crossovers.</p>
             </div>

             {/* Card 8: Exponential Moving Averages (EMA) */}
             <div onClick={() => setSelectedAcademyTopic('ema')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-orange-400"/> EMA 50 & 200</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Dynamic support/resistance. The 50 EMA acts as medium-term trend, and 200 EMA as long-term. "Golden Cross" indicates major bull trend.</p>
             </div>

             {/* Card 9: Delivery Percentage */}
             <div onClick={() => setSelectedAcademyTopic('delivery')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400"/> Delivery %</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The percentage of shares actually taken into demat accounts versus intraday speculation. High delivery ({">"} 50%) indicates strong institutional conviction.</p>
                {stockData?.delivery && <div className="text-[8px] font-mono text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded inline-block">Current Delivery: {Number(stockData.delivery).toFixed(2)}%</div>}
             </div>

             {/* Card 10: OI Analysis */}
             <div onClick={() => setSelectedAcademyTopic('oi')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-pink-400"/> Open Interest Base</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Tracks active option contracts. Huge put OI acts as strong support, while massive call OI acts as a ceiling/resistance placed by big institutional writers.</p>
             </div>

             {/* Card 11: Pivot Points */}
             <div onClick={() => setSelectedAcademyTopic('pivots')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-yellow-400"/> Pivot Points</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Mathematical levels predicting future support and resistance. Institutions use daily and weekly pivots to place limit orders and take profits automatically.</p>
             </div>

             {/* Card 12: SuperTrend / Flow */}
             <div onClick={() => setSelectedAcademyTopic('flow')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-300"/> Institutional Flow</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Overall synthesis of moving averages, volatility, and volume. Indicates if smart money is accumulating, distributing, or stepping aside.</p>
             </div>
             
              {/* Card 13: P/E Ratio */}
              <div onClick={() => setSelectedAcademyTopic('pe')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><PieChart className="w-4 h-4 text-blue-300"/> P/E Ratio</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Valuation metric. High P/E suggest high growth expectations or overvaluation.</p>
                 {stockData?.peRatio && <div className="text-[8px] font-mono text-blue-300 bg-blue-300/10 px-2 py-1 rounded inline-block">Current P/E: {stockData.peRatio.toFixed(2)}</div>}
              </div>

              {/* Card 14: ROE */}
              <div onClick={() => setSelectedAcademyTopic('roe')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-green-300"/> ROE</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Efficiency ratio. Measures profit generated per rupee of shareholder capital.</p>
                 {stockData?.roe && <div className="text-[8px] font-mono text-green-300 bg-green-300/10 px-2 py-1 rounded inline-block">Current ROE: {(stockData.roe * 100).toFixed(2)}%</div>}
              </div>

              {/* Card 15: Dividend Yield */}
              <div onClick={() => setSelectedAcademyTopic('dividend')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-amber-300"/> Dividend Yield</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Represents the return on investment through dividends alone, excluding stock price appreciation.</p>
              </div>

              {/* Card 16: Debt to Equity */}
              <div onClick={() => setSelectedAcademyTopic('debt')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-300"/> D/E Ratio</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Financial leverage gauge. Higher ratio = higher risk in volatility cycles.</p>
              </div>

              {/* Card 17: Price-to-Book (P/B) Ratio */}
              <div onClick={() => setSelectedAcademyTopic('pb')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-300"/> P/B Ratio</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Compares market value to tangible asset value. {">"} 1.0 means paying premium over assets.</p>
              </div>

             {/* Card 18: Institutional Holding */}
             <div onClick={() => setSelectedAcademyTopic('insthold')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-purple-300"/> Institutional Play</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Heavy institutional ownership stabilizes the stock against retail panic.</p>
             </div>

             {/* Card 19: ADX */}
             <div onClick={() => setSelectedAcademyTopic('adx')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-orange-400"/> ADX Trend Strength</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Measures the strength of the trend regardless of direction. {">"} 25 = Strong trend.</p>
             </div>

             {/* Card 20: MFI */}
             <div onClick={() => setSelectedAcademyTopic('mfi')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400"/> Money Flow Index</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">The Volume-Weighted RSI. Identifies institutional accumulation vs retail momentum.</p>
             </div>

             {/* Card 21: Institutional Traps */}
             <div onClick={() => setSelectedAcademyTopic('traps')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-rose-400"/> Institutional Traps</h4>
                <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed mb-4 min-h-[60px]">Detection of Bull and Bear Traps (Fake Breakouts). Spotting where retail is 'trapped'.</p>
             </div>
          </div>
           
           {/* Candlestick Mastery Section */}
           <div className="mt-16">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40">
                 <BarChart2 className="w-4 h-4 text-emerald-400" />
               </div>
               <div>
                 <h3 className="text-xs md:text-sm font-euro uppercase tracking-widest text-white">Candlestick Mastery</h3>
                 <p className="text-[8px] md:text-[9px] dot-matrix text-white/30 mt-0.5">Master the art of reading price bars and sentiment</p>
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
               <div onClick={() => setSelectedAcademyTopic('candlestick_single')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-emerald-400"><Zap className="w-4 h-4 text-emerald-400"/> Single Candles</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Doji, Hammer, Shooting Star, and basic bar psychology. The building blocks of price action.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('candlestick_double')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-emerald-400"><Activity className="w-4 h-4 text-emerald-400"/> Double Patterns</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Engulfing, Piercing, and Tweezer patterns. High probability setups at structural key levels.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('candlestick_triple')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-emerald-400"><Target className="w-4 h-4 text-emerald-400"/> Triple Patterns</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Morning Star, Evening Star, and Soldiers. Definitive institutional reversal signals.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('candlestick_continuation')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-emerald-400"><TrendingUp className="w-4 h-4 text-emerald-400"/> Continuation</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Rising/Falling Three Methods. Spotting where the trend 'rests' before exploding further.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('candlestick_indecision')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-emerald-400"><Users className="w-4 h-4 text-emerald-400"/> Indecision</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">High Wave candles and neutral zones. Learn when the market is in 'no-man's land'.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('candlestick_advanced')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-emerald-400"><Shield className="w-4 h-4 text-emerald-400"/> Advanced Patterns</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Inside Bars, Harami, and Kickers. Mastering the hidden footprints of institutional big players.</p>
               </div>
             </div>
           </div>

           {/* F&O Strategy Playbooks Section */}
           <div className="mt-16">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/40">
                 <Shield className="w-4 h-4 text-rose-400" />
               </div>
               <div>
                 <h3 className="text-xs md:text-sm font-euro uppercase tracking-widest text-white">Advanced Strategy Playbooks</h3>
                 <p className="text-[8px] md:text-[9px] dot-matrix text-white/30 mt-0.5">Professional derivative trading frameworks and Greek-optimized setups</p>
               </div>
             </div>

             {/* Bullish Strategies */}
             <div className="mb-12">
               <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 w-fit">
                 <TrendingUp className="w-4 h-4 text-emerald-400" />
                 <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Bullish Strategies</h4>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                 {[
                   { name: 'Long Call', id: 'long_call', desc: 'Direct upside bet' },
                   { name: 'Bull Call Spread', id: 'bull_call_spread', desc: 'Risk-controlled buy' },
                   { name: 'Bull Put Spread', id: 'bull_put_spread', desc: 'Income generation' },
                   { name: 'Ratio Call Spread', id: 'ratio_call_spread', desc: 'Optimized credit' },
                   { name: 'Call Ratio Back', id: 'call_ratio_back_spread', desc: 'Rocket protection' },
                   { name: 'Bull Call Ladder', id: 'bull_call_ladder', desc: 'Cost-offset buy' },
                 ].map((strat) => (
                   <div key={strat.id} onClick={() => setSelectedAcademyTopic(strat.id)} className="cursor-pointer bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                     <h5 className="text-[9px] font-black uppercase text-white mb-1 group-hover:text-emerald-400">{strat.name}</h5>
                     <p className="text-[7px] text-white/40 leading-tight uppercase tracking-tighter">{strat.desc}</p>
                   </div>
                 ))}
               </div>
             </div>

             {/* Bearish Strategies */}
             <div className="mb-12">
               <div className="flex items-center gap-3 mb-6 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 w-fit">
                 <TrendingDown className="w-4 h-4 text-rose-400" />
                 <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Bearish Strategies</h4>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                 {[
                   { name: 'Long Put', id: 'long_put', desc: 'Downside breakout' },
                   { name: 'Bear Put Spread', id: 'bear_put_spread', desc: 'Hedgy downtrend' },
                   { name: 'Bear Call Spread', id: 'bear_call_spread', desc: 'Credit generation' },
                   { name: 'Ratio Put Spread', id: 'ratio_put_spread', desc: 'Slow melt profit' },
                   { name: 'Put Ratio Back', id: 'put_ratio_back_spread', desc: 'Crash catcher' },
                 ].map((strat) => (
                   <div key={strat.id} onClick={() => setSelectedAcademyTopic(strat.id)} className="cursor-pointer bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-rose-500/5 hover:border-rose-500/30 transition-all group">
                     <h5 className="text-[9px] font-black uppercase text-white mb-1 group-hover:text-rose-400">{strat.name}</h5>
                     <p className="text-[7px] text-white/40 leading-tight uppercase tracking-tighter">{strat.desc}</p>
                   </div>
                 ))}
               </div>
             </div>

             {/* Neutral Strategies */}
             <div className="mb-12">
               <div className="flex items-center gap-3 mb-6 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 w-fit">
                 <Target className="w-4 h-4 text-blue-400" />
                 <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Neutral Strategies</h4>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                 {[
                   { name: 'Short Straddle', id: 'short_straddle', desc: 'Maximum Theta' },
                   { name: 'Short Strangle', id: 'short_strangle', desc: 'Range collection' },
                   { name: 'Call Butterfly', id: 'long_call_butterfly', desc: 'Pinning trade' },
                   { name: 'Iron Condor', id: 'short_iron_condor', desc: 'Professional safe' },
                   { name: 'Iron Butterfly', id: 'short_iron_butterfly', desc: 'Limited risk pin' },
                   { name: 'Long Calendar', id: 'long_calendar', desc: 'Time arbitrage' },
                 ].map((strat) => (
                   <div key={strat.id} onClick={() => setSelectedAcademyTopic(strat.id)} className="cursor-pointer bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group">
                     <h5 className="text-[9px] font-black uppercase text-white mb-1 group-hover:text-blue-400">{strat.name}</h5>
                     <p className="text-[7px] text-white/40 leading-tight uppercase tracking-tighter">{strat.desc}</p>
                   </div>
                 ))}
               </div>
             </div>

             {/* Volatile Strategies */}
             <div className="mb-12">
               <div className="flex items-center gap-3 mb-6 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 w-fit">
                 <Zap className="w-4 h-4 text-amber-400" />
                 <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Volatile Strategies</h4>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                 {[
                   { name: 'Long Straddle', id: 'long_straddle', desc: 'Event explosive' },
                   { name: 'Long Strangle', id: 'long_strangle', desc: 'Budget break' },
                   { name: 'Iron Butterfly', id: 'long_iron_butterfly', desc: 'Outward break' },
                   { name: 'Iron Condor', id: 'long_iron_condor', desc: 'Range escape' },
                   { name: 'Call Butterfly', id: 'short_call_butterfly', desc: 'Center exit' },
                   { name: 'Diagonal Spread', id: 'put_diagonal_spread', desc: 'Multi-layer' },
                 ].map((strat) => (
                   <div key={strat.id} onClick={() => setSelectedAcademyTopic(strat.id)} className="cursor-pointer bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all group">
                     <h5 className="text-[9px] font-black uppercase text-white mb-1 group-hover:text-amber-400">{strat.name}</h5>
                     <p className="text-[7px] text-white/40 leading-tight uppercase tracking-tighter">{strat.desc}</p>
                   </div>
                 ))}
               </div>
             </div>
              
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-6 border-t border-white/10 pt-8">
               <div onClick={() => setSelectedAcademyTopic('futures_strategies')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-rose-500/5 hover:border-rose-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-rose-400"><Activity className="w-4 h-4 text-rose-400"/> Futures Trading</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Trend-based long/short, ORB, and VWAP strategies for leveraged futures trading.</p>
               </div>
               
               <div onClick={() => setSelectedAcademyTopic('institutional_strategies')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-purple-500/5 hover:border-purple-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-purple-400"><Maximize className="w-4 h-4 text-purple-400"/> Advanced Quant</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Delta Neutral, Gamma Scalping, and Calendar/Diagonal spreads for institutions.</p>
               </div>

               <div className="bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-center">
                 <h4 className="text-[10px] font-black uppercase text-white mb-1">💡 Professional Edge</h4>
                 <p className="text-[8px] text-white/70 leading-tight uppercase tracking-tighter">Check IV Percentile before execution. High IV requires selling; Low IV favors buying.</p>
               </div>
             </div>
           </div>

           {/* Chart Pattern Library Section */}
           <div className="mt-16">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/40">
                 <LineChart className="w-4 h-4 text-indigo-400" />
               </div>
               <div>
                 <h3 className="text-xs md:text-sm font-euro uppercase tracking-widest text-white">Chart Pattern Library</h3>
                 <p className="text-[8px] md:text-[9px] dot-matrix text-white/30 mt-0.5">Master major price structures and classical geometry</p>
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
               <div onClick={() => setSelectedAcademyTopic('pattern_reversal')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><TrendingDown className="w-4 h-4 text-indigo-400"/> Reversal Hub</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Double Bottom/Top, H&S, and Wedges. Spot when the trend is finally dying.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('pattern_continuation')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><TrendingUp className="w-4 h-4 text-indigo-400"/> Continuation</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Flags, Pennants, and Triangles. How to securely add to winning positions during a trend.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('pattern_head_shoulders')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><Activity className="w-4 h-4 text-indigo-400"/> Head & Shoulders</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">The definitive trend exhaustion reversal pattern. Precision entries on neckline breaks.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('pattern_double_top_bottom')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><Target className="w-4 h-4 text-indigo-400"/> Double Top/Bottom</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Classical W and M patterns. Identifying institutional floor and ceiling defensiveness.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('pattern_flags_pennants')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><Zap className="w-4 h-4 text-indigo-400"/> Flags & Pennants</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">High-velocity continuation structures. Capturing the second leg of explosive moves.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('pattern_cup_handle_deep')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><Maximize className="w-4 h-4 text-indigo-400"/> Cup and Handle</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">The institutional accumulation masterpiece. Multi-month breakout structures.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('pattern_wedges_deep')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><TrendingDown className="w-4 h-4 text-indigo-400"/> Wedges (Deep)</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Measuring directional contraction and pressure building. Spotting the 'coil' before impact.</p>
               </div>

               <div onClick={() => setSelectedAcademyTopic('pattern_rectangles_deep')} className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all group">
                 <h4 className="text-[11px] md:text-xs font-black uppercase text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400"><Briefcase className="w-4 h-4 text-indigo-400"/> Boxes & Channels</h4>
                 <p className="text-[9px] md:text-[10px] text-white/60 leading-relaxed min-h-[50px]">Horizontal price traps. Trading the ultimate breakout from institutional consolidation.</p>
               </div>

               <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-center">
                 <h4 className="text-[10px] font-black uppercase text-white mb-1">🔥 Trader's Focus</h4>
                 <p className="text-[8px] text-white/70 leading-tight">Master Double Top/Bottom and Flags first—these are the highest accuracy signals for intraday trading.</p>
               </div>
             </div>
           </div>

        </div>
     </div>
  );
};
