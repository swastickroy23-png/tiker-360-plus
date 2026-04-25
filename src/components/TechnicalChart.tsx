import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  Line,
  ComposedChart,
  ReferenceLine,
  Label,
  ReferenceArea
} from 'recharts';
import { 
  TrendingUp, 
  Pencil, 
  Type, 
  Trash2, 
  Settings2, 
  Layers,
  ChevronDown,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BollingerBands, 
  IchimokuCloud, 
  SMA 
} from 'technicalindicators';

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Drawing {
  id: string;
  type: 'line' | 'text';
  start: { date: string; price: number };
  end?: { date: string; price: number };
  text?: string;
  color: string;
}

interface TechnicalChartProps {
  data: HistoricalData[];
  symbol: string;
  analysis?: any;
}

export const TechnicalChart = ({ data, symbol, analysis }: TechnicalChartProps) => {
  const [showBB, setShowBB] = useState(false);
  const [showIchimoku, setShowIchimoku] = useState(false);
  const [showFib, setShowFib] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'none' | 'line' | 'text'>('none');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<Partial<Drawing> | null>(null);
  
  const chartRef = useRef<any>(null);

  // Load drawings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`drawings_${symbol}`);
    if (saved) {
      try {
        setDrawings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load drawings", e);
      }
    }
  }, [symbol]);

  // Save drawings to localStorage
  useEffect(() => {
    localStorage.setItem(`drawings_${symbol}`, JSON.stringify(drawings));
  }, [drawings, symbol]);

  // Indicator Calculations
  const chartData = useMemo(() => {
    if (!data || data.length < 52) return data;

    const closes = data.map(d => d.close);
    const high = data.map(d => d.high);
    const low = data.map(d => d.low);

    // Bollinger Bands
    const bb = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });
    
    // Ichimoku Cloud (9, 26, 52)
    const ichimoku = IchimokuCloud.calculate({
      conversionPeriod: 9,
      basePeriod: 26,
      spanPeriod: 52,
      displacement: 26,
      high,
      low
    });

    return data.map((d, i) => {
      const bbIndex = i - (20 - 1);
      const ichiIndex = i - (26 - 1); // This is simplified for the displacement
      
      const res: any = { ...d };
      
      if (bbIndex >= 0 && bb[bbIndex]) {
        res.bbUpper = bb[bbIndex].upper;
        res.bbLower = bb[bbIndex].lower;
        res.bbMiddle = bb[bbIndex].middle;
      }

      if (ichiIndex >= 0 && ichimoku[ichiIndex]) {
        res.tenkan = ichimoku[ichiIndex].conversion;
        res.kijun = ichimoku[ichiIndex].base;
        res.spanA = ichimoku[ichiIndex].spanA;
        res.spanB = ichimoku[ichiIndex].spanB;
      }

      return res;
    });
  }, [data]);

  // Fibonacci Levels calculation based on data range
  const fibLevels = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const maxHigh = Math.max(...highs);
    const minLow = Math.min(...lows);
    const range = maxHigh - minLow;

    return [
      { label: '0%', value: maxHigh, color: '#f43f5e' },
      { label: '23.6%', value: maxHigh - range * 0.236, color: '#fb923c' },
      { label: '38.2%', value: maxHigh - range * 0.382, color: '#fbbf24' },
      { label: '50%', value: maxHigh - range * 0.5, color: '#10b981' },
      { label: '61.8%', value: maxHigh - range * 0.618, color: '#3b82f6' },
      { label: '78.6%', value: maxHigh - range * 0.786, color: '#8b5cf6' },
      { label: '100%', value: minLow, color: '#f43f5e' }
    ];
  }, [data]);

  // Event Handlers for Drawing
  const handleMouseDown = (e: any) => {
    if (!e || !e.activeLabel || !e.activePayload || drawingMode === 'none') return;

    const date = e.activeLabel;
    const price = e.activePayload[0].value;

    if (drawingMode === 'line') {
      setActiveDrawing({
        id: Math.random().toString(36).substr(2, 9),
        type: 'line',
        start: { date, price },
        color: '#3b82f6'
      });
    } else if (drawingMode === 'text') {
      const text = prompt("Enter annotation text:");
      if (text) {
        setDrawings(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          type: 'text',
          start: { date, price },
          text,
          color: '#ffffff'
        }]);
      }
      setDrawingMode('none');
    }
  };

  const handleMouseMove = (e: any) => {
    if (!activeDrawing || !e || !e.activeLabel || !e.activePayload) return;

    const date = e.activeLabel;
    const price = e.activePayload[0].value;

    if (activeDrawing.type === 'line') {
      setActiveDrawing(prev => ({ ...prev, end: { date, price } }));
    }
  };

  const handleMouseUp = () => {
    if (activeDrawing && activeDrawing.end) {
      setDrawings(prev => [...prev, activeDrawing as Drawing]);
      setActiveDrawing(null);
      setDrawingMode('none');
    }
  };

  const clearDrawings = () => {
    if (confirm("Clear all drawings?")) {
      setDrawings([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowBB(!showBB)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
              showBB ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
          >
            BOLLINGER
          </button>
          <button 
            onClick={() => setShowIchimoku(!showIchimoku)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
              showIchimoku ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
          >
            ICHIMOKU
          </button>
          <button 
            onClick={() => setShowFib(!showFib)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
              showFib ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
          >
            FIBONACCI
          </button>
        </div>

        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <button 
            onClick={() => setDrawingMode(drawingMode === 'line' ? 'none' : 'line')}
            className={`p-2 rounded-xl transition-all ${drawingMode === 'line' ? 'bg-white text-black' : 'hover:bg-white/5 text-white/40'}`}
            title="Trendline"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDrawingMode(drawingMode === 'text' ? 'none' : 'text')}
            className={`p-2 rounded-xl transition-all ${drawingMode === 'text' ? 'bg-white text-black' : 'hover:bg-white/5 text-white/40'}`}
            title="Text Annotation"
          >
            <Type className="w-4 h-4" />
          </button>
          <button 
            onClick={clearDrawings}
            className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500/40 hover:text-rose-500 transition-all"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-[250px] md:h-[450px] w-full relative">
        {drawingMode !== 'none' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl flex items-center gap-2">
            <Zap className="w-3 h-3 animate-pulse" />
            Drawing Mode Active: Click to start
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05}/>
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIchimoku" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
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
              formatter={(value: number) => [`₹${value.toFixed(2)}`, '']}
            />

            {/* Analysis Indicators */}
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
              </>
            )}
            
            {/* Bollinger Bands */}
            {showBB && (
              <>
                <Line type="monotone" dataKey="bbUpper" stroke="#3b82f660" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="bbLower" stroke="#3b82f660" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="bbMiddle" stroke="#3b82f680" strokeWidth={1} dot={false} />
              </>
            )}

            {/* Ichimoku Cloud */}
            {showIchimoku && (
              <>
                <Line type="monotone" dataKey="tenkan" stroke="#f43f5e" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="kijun" stroke="#3b82f6" strokeWidth={1} dot={false} />
                <Area type="monotone" dataKey="spanA" stroke="#10b981" fill="url(#colorIchimoku)" fillOpacity={0.1} strokeWidth={0.5} dot={false} />
                <Area type="monotone" dataKey="spanB" stroke="#f43f5e" fill="url(#colorIchimoku)" fillOpacity={0.1} strokeWidth={0.5} dot={false} />
              </>
            )}

            {/* Fibonacci Levels */}
            {showFib && fibLevels.map((lvl) => (
              <ReferenceLine 
                key={`fib-${lvl.label}`}
                y={lvl.value} 
                stroke={lvl.color} 
                strokeDasharray="3 3"
                strokeWidth={1}
              >
                <Label value={lvl.label} position="left" fill={lvl.color} fontSize={8} className="dot-matrix" />
              </ReferenceLine>
            ))}

            {/* Persistent Drawings: Lines */}
            {drawings.filter(d => d.type === 'line').map((d) => (
              <ReferenceLine 
                key={d.id}
                segment={[
                  { x: d.start.date, y: d.start.price },
                  { x: d.end?.date, y: d.end?.price }
                ]}
                stroke={d.color}
                strokeWidth={2}
              />
            ))}

            {/* Active Drawing: Line */}
            {activeDrawing && activeDrawing.type === 'line' && activeDrawing.start && activeDrawing.end && (
              <ReferenceLine 
                segment={[
                  { x: activeDrawing.start.date, y: activeDrawing.start.price },
                  { x: activeDrawing.end.date, y: activeDrawing.end.price }
                ]}
                stroke="#ffffff50"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            )}

            {/* Annotations: Text */}
            {drawings.filter(d => d.type === 'text').map((d) => (
              <ReferenceLine 
                key={d.id}
                x={d.start.date}
                stroke="transparent"
              >
                <Label 
                  value={d.text || ''} 
                  position="top" 
                  offset={10}
                  fill={d.color} 
                  fontSize={10} 
                  className="font-bold uppercase tracking-widest"
                />
              </ReferenceLine>
            ))}

            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="#ffffff" 
              strokeWidth={1.5}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
