export type MarketStructure = 'Bullish Swing' | 'Bearish Swing' | 'Range / No-Trade';
export type Verdict = 'BUY' | 'SELL' | 'WAIT';

export interface Zone {
  entry: string;
  stopLoss: string;
  targets: string;
  riskReward: string;
  probability: number;
  type?: string;
}

export interface AnalysisResult {
  ticker: string;
  marketStructure: MarketStructure;
  intradayHigh: { level: string; probability: number };
  intradayLow: { level: string; probability: number };
  buyZones: Zone[];
  sellZones: Zone[];
  aiProbabilityScore: number;
  verdict: Verdict;
}

// Simple deterministic random number generator based on string seed
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export async function analyzeTicker(ticker: string): Promise<AnalysisResult> {
  // Simulate network/processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const normalizedTicker = ticker.trim().toUpperCase();
  const rand = seededRandom(normalizedTicker);
  
  // Generate a base price between 50 and 5000
  const basePrice = 50 + (rand() % 4950);
  
  const structures: MarketStructure[] = ['Bullish Swing', 'Bearish Swing', 'Range / No-Trade'];
  const marketStructure = structures[rand() % 3];
  
  let verdict: Verdict = 'WAIT';
  let aiProbabilityScore = 50 + (rand() % 50); // 50 to 99

  if (marketStructure === 'Bullish Swing') {
    verdict = aiProbabilityScore >= 65 ? 'BUY' : 'WAIT';
  } else if (marketStructure === 'Bearish Swing') {
    verdict = aiProbabilityScore >= 65 ? 'SELL' : 'WAIT';
  } else {
    verdict = 'WAIT';
    aiProbabilityScore = 40 + (rand() % 24); // 40 to 64
  }

  const atr = basePrice * 0.02; // 2% ATR

  const intradayHigh = {
    level: (basePrice + atr * 1.5).toFixed(2),
    probability: 60 + (rand() % 30)
  };

  const intradayLow = {
    level: (basePrice - atr * 1.5).toFixed(2),
    probability: 60 + (rand() % 30)
  };

  const buyZones: Zone[] = [
    {
      entry: (basePrice * 0.99).toFixed(2),
      stopLoss: (basePrice * 0.97).toFixed(2),
      targets: `${(basePrice * 1.03).toFixed(2)} / ${(basePrice * 1.05).toFixed(2)}`,
      riskReward: '1:2.5',
      probability: 75 + (rand() % 15),
      type: '3-7 Days'
    },
    {
      entry: (basePrice * 0.97).toFixed(2),
      stopLoss: (basePrice * 0.95).toFixed(2),
      targets: `${(basePrice * 1.01).toFixed(2)} / ${(basePrice * 1.04).toFixed(2)}`,
      riskReward: '1:2',
      probability: 65 + (rand() % 15)
    },
    {
      entry: (basePrice * 0.94).toFixed(2),
      stopLoss: (basePrice * 0.92).toFixed(2),
      targets: `${(basePrice * 0.98).toFixed(2)} / ${(basePrice * 1.02).toFixed(2)}`,
      riskReward: '1:3',
      probability: 55 + (rand() % 15)
    }
  ];

  const sellZones: Zone[] = [
    {
      entry: (basePrice * 1.01).toFixed(2),
      stopLoss: (basePrice * 1.03).toFixed(2),
      targets: `${(basePrice * 0.97).toFixed(2)} / ${(basePrice * 0.95).toFixed(2)}`,
      riskReward: '1:2.5',
      probability: 75 + (rand() % 15)
    },
    {
      entry: (basePrice * 1.03).toFixed(2),
      stopLoss: (basePrice * 1.05).toFixed(2),
      targets: `${(basePrice * 0.99).toFixed(2)} / ${(basePrice * 0.96).toFixed(2)}`,
      riskReward: '1:2',
      probability: 65 + (rand() % 15)
    },
    {
      entry: (basePrice * 1.06).toFixed(2),
      stopLoss: (basePrice * 1.08).toFixed(2),
      targets: `${(basePrice * 1.02).toFixed(2)} / ${(basePrice * 0.98).toFixed(2)}`,
      riskReward: '1:3',
      probability: 55 + (rand() % 15)
    }
  ];

  return {
    ticker: normalizedTicker,
    marketStructure,
    intradayHigh,
    intradayLow,
    buyZones,
    sellZones,
    aiProbabilityScore,
    verdict
  };
}
