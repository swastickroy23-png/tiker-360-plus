import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';
import { Loader2 } from 'lucide-react';

interface StockData {
  scripCode: string;
  pChange: number;
  lastPrice: number;
}

const NIFTY_50_SYMBOLS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
  "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "HINDUNILVR.NS", "LT.NS",
  "BAJFINANCE.NS", "AXISBANK.NS", "KOTAKBANK.NS", "ASIANPAINT.NS",
  "TATAMOTORS.NS", "WIPRO.NS", "HCLTECH.NS", "MARUTI.NS", "SUNPHARMA.NS",
  "ONGC.NS", "ADANIENT.NS", "JSWSTEEL.NS", "TITAN.NS", "ULTRACEMCO.NS",
  "GRASIM.NS", "HINDALCO.NS", "NESTLEIND.NS", "POWERGRID.NS", "SBILIFE.NS",
  "TATASTEEL.NS", "TECHM.NS", "DIVISLAB.NS", "M&M.NS", "BPCL.NS",
  "BAJAJFINSV.NS", "COALINDIA.NS", "DRREDDY.NS", "APOLLOHOSP.NS",
  "CIPLA.NS", "EICHERMOT.NS", "HEROMOTOCO.NS", "HDFCLIFE.NS",
  "TATACONSUM.NS", "BRITANNIA.NS", "INDUSINDBK.NS",
  "IOC.NS", "UPL.NS", "SHREECEM.NS"
];

export const Heatmap = () => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'watchlist' | 'nifty50'>('nifty50');

  useEffect(() => {
    const fetchData = async () => {
       setLoading(true);
       let symbols = [];
       if (view === 'nifty50') {
           symbols = NIFTY_50_SYMBOLS;
       } else {
           const res = await fetch('/api/watchlist?userId=guest_user');
           symbols = await res.json();
       }
       
       const resData = await fetch('/api/watchlist-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      setData(await resData.json());
      setLoading(false);
    };
    fetchData();
  }, [view]);

  const chartData = data.map(d => ({
    name: d.scripCode.replace('.NS', ''),
    size: 1, // Equal size for now
    value: d.pChange
  }));

  const CustomizedContent = ({ x, y, width, height, name, value }: any) => {
    const isPositive = value >= 0;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: isPositive ? '#10b981' : '#f43f5e',
            stroke: '#000',
            strokeWidth: 2,
            strokeOpacity: 0.5,
          }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={width < 30 ? 8 : 12}
          className="font-bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 20}
          textAnchor="middle"
          fill="#fff"
          fontSize={width < 30 ? 6 : 10}
        >
          {typeof value === 'number' ? `${value.toFixed(2)}%` : ''}
        </text>
      </g>
    );
  };

  if (loading) return (
      <div className="h-[500px] w-full flex items-center justify-center p-4 bg-white/5 rounded-3xl border border-white/10">
        <Loader2 className="w-12 h-12 text-white/20 animate-spin" />
      </div>
  );

  return (
    <div className="h-[500px] w-full p-4 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-4">
      <div className="flex gap-2">
        <button onClick={() => setView('nifty50')} className={`px-4 py-2 rounded-full text-xs font-bold ${view === 'nifty50' ? 'bg-blue-600' : 'bg-white/10'}`}>Nifty 50</button>
        <button onClick={() => setView('watchlist')} className={`px-4 py-2 rounded-full text-xs font-bold ${view === 'watchlist' ? 'bg-blue-600' : 'bg-white/10'}`}>Watchlist</button>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={chartData}
          dataKey="size"
          stroke="#fff"
          fill="#8884d8"
          content={<CustomizedContent />}
        />
      </ResponsiveContainer>
    </div>
  );
};
