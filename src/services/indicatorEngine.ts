import { 
  EMA, 
  RSI, 
  MACD, 
  ATR, 
  ADX,
  MFI,
  ROC,
  CCI,
  BollingerBands
} from 'technicalindicators';

export interface OHLC {
  date?: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  delivery?: number;
  prevClose?: number;
}

export interface SwingZone {
  entry: number; // Retained for drawing the line on the chart, but termed 'level' logically
  stopLoss: number; // Ignored largely in UI now
  targets: number[];
  rr: string;
  probability: number;
  type: string;
  reason: string;
}

export interface OptionsData {
  pcr?: number;
  oiSupport?: number;
  oiResistance?: number;
  maxPain?: number;
}

export interface TrapInfo {
  type: 'Bull Trap' | 'Bear Trap' | 'None';
  level: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  action: string;
}

export class IndicatorEngine {
  static computeAdvanced(data: OHLC, optionsData?: OptionsData | null) {
    const { close, high, low, volume } = data;
    
    // Validate data length
    if (!close || close.length < 5) {
      throw new Error("Insufficient data for analysis");
    }

    // Clean data synchronously to ensure arrays have the same length
    const cleanOpen: number[] = [];
    const cleanHigh: number[] = [];
    const cleanLow: number[] = [];
    const cleanClose: number[] = [];
    const cleanVolume: number[] = [];

    for (let i = 0; i < close.length; i++) {
      if (
        data.open[i] != null && !isNaN(data.open[i]) &&
        high[i] != null && !isNaN(high[i]) &&
        low[i] != null && !isNaN(low[i]) &&
        close[i] != null && !isNaN(close[i]) &&
        volume[i] != null && !isNaN(volume[i])
      ) {
        cleanOpen.push(data.open[i]);
        cleanHigh.push(high[i]);
        cleanLow.push(low[i]);
        cleanClose.push(close[i]);
        cleanVolume.push(volume[i]);
      }
    }

    if (cleanClose.length < 5) {
      throw new Error("Insufficient valid data for analysis");
    }

    const lastPrice = cleanClose[cleanClose.length - 1];

    // Core Filters
    const ema5 = EMA.calculate({ period: 5, values: cleanClose });
    const ema10 = EMA.calculate({ period: 10, values: cleanClose });
    const ema12 = EMA.calculate({ period: 12, values: cleanClose });
    const ema20 = EMA.calculate({ period: 20, values: cleanClose });
    const ema26 = EMA.calculate({ period: 26, values: cleanClose });
    const ema50 = EMA.calculate({ period: 50, values: cleanClose });
    const ema100 = EMA.calculate({ period: 100, values: cleanClose });
    const ema200 = EMA.calculate({ period: 200, values: cleanClose });
    
    const rsi14 = RSI.calculate({ period: 14, values: cleanClose });
    const adx14 = ADX.calculate({ period: 14, high: cleanHigh, low: cleanLow, close: cleanClose });
    const atr14 = ATR.calculate({ period: 14, high: cleanHigh, low: cleanLow, close: cleanClose });
    const mfi14 = MFI.calculate({ period: 14, high: cleanHigh, low: cleanLow, close: cleanClose, volume: cleanVolume });
    const roc21 = ROC.calculate({ period: 21, values: cleanClose });
    const roc125 = ROC.calculate({ period: 125, values: cleanClose });
    const cci20 = CCI.calculate({ period: 20, high: cleanHigh, low: cleanLow, close: cleanClose });
    const macd = MACD.calculate({ fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false, values: cleanClose });
    const bb20 = BollingerBands.calculate({ period: 20, stdDev: 2, values: cleanClose });
    
    // Highly Accurate Rolling VWAP (MVWAP - 20 Period)
    const vwapPeriod = 20;
    const customVwap: number[] = [];
    for (let i = 0; i < cleanClose.length; i++) {
      const startIdx = Math.max(0, i - vwapPeriod + 1);
      let sumTypVol = 0;
      let sumVol = 0;
      for (let j = startIdx; j <= i; j++) {
        const typPrice = (cleanHigh[j] + cleanLow[j] + cleanClose[j]) / 3;
        sumTypVol += typPrice * cleanVolume[j];
        sumVol += cleanVolume[j];
      }
      customVwap.push(sumVol === 0 ? cleanClose[i] : sumTypVol / sumVol);
    }

    // Safely get last values
    const getVal = (arr: any[]) => arr && arr.length > 0 ? arr[arr.length - 1] : 0;
    const safeNum = (val: any, fallback: number | null) => (typeof val === 'number' && !isNaN(val)) ? val : fallback;

    const lastEma200 = ema200 && ema200.length > 0 ? safeNum(ema200[ema200.length - 1], null) : null;
    const lastEma100 = ema100 && ema100.length > 0 ? safeNum(ema100[ema100.length - 1], null) : null;
    const lastEma50 = ema50 && ema50.length > 0 ? safeNum(ema50[ema50.length - 1], null) : null;
    const lastEma26 = ema26 && ema26.length > 0 ? safeNum(ema26[ema26.length - 1], null) : null;
    const lastEma20 = ema20 && ema20.length > 0 ? safeNum(ema20[ema20.length - 1], null) : null;
    const lastEma12 = ema12 && ema12.length > 0 ? safeNum(ema12[ema12.length - 1], null) : null;
    const lastEma10 = ema10 && ema10.length > 0 ? safeNum(ema10[ema10.length - 1], null) : null;
    const lastEma5 = ema5 && ema5.length > 0 ? safeNum(ema5[ema5.length - 1], null) : null;
    
    const lastRsi = rsi14 && rsi14.length > 0 ? safeNum(rsi14[rsi14.length - 1], null) : null;
    const lastAtr = atr14 && atr14.length > 0 ? safeNum(atr14[atr14.length - 1], null) : null;
    const lastAdxObj = adx14 && adx14.length > 0 ? adx14[adx14.length - 1] : null;
    const lastAdx = safeNum(lastAdxObj ? (lastAdxObj as any).adx : null, null);
    const lastMfi = mfi14 && mfi14.length > 0 ? safeNum(mfi14[mfi14.length - 1], null) : null;
    const lastRoc21 = roc21 && roc21.length > 0 ? safeNum(roc21[roc21.length - 1], null) : null;
    const lastRoc125 = roc125 && roc125.length > 0 ? safeNum(roc125[roc125.length - 1], null) : null;
    
    const lastMacdObj = macd && macd.length > 0 ? macd[macd.length - 1] : null;
    const lastMacd = {
      MACD: safeNum(lastMacdObj ? (lastMacdObj as any).MACD : null, null),
      signal: safeNum(lastMacdObj ? (lastMacdObj as any).signal : null, null),
      histogram: safeNum(lastMacdObj ? (lastMacdObj as any).histogram : null, null)
    };
    
    const lastBb = bb20 && bb20.length > 0 ? bb20[bb20.length - 1] : { upper: lastPrice * 1.05, lower: lastPrice * 0.95, middle: lastPrice };
    const lastVwap = customVwap.length > 0 ? safeNum(customVwap[customVwap.length - 1], null) : null;

    // SuperTrend (10, 3) Calculation - Highly Accurate TradingView Logic
    const stPeriod = 10;
    const stMultiplier = 3;
    const atr10 = ATR.calculate({ period: stPeriod, high: cleanHigh, low: cleanLow, close: cleanClose });
    const paddedAtr10 = new Array(cleanClose.length - atr10.length).fill(0).concat(atr10);
    
    const superTrend: number[] = [];
    const stDirection: ('Bullish' | 'Bearish')[] = [];
    
    let prevTrendUp = 0;
    let prevTrendDown = 0;
    let prevTrend = 1; // 1 for Bullish, -1 for Bearish

    for (let i = 0; i < cleanClose.length; i++) {
      if (i < stPeriod) {
        superTrend.push(0);
        stDirection.push('Bullish');
        continue;
      }
      
      const hl2 = (cleanHigh[i] + cleanLow[i]) / 2;
      const atr = paddedAtr10[i];
      
      const up = hl2 - (stMultiplier * atr);
      const dn = hl2 + (stMultiplier * atr);
      
      let trendUp = up;
      let trendDown = dn;
      
      if (i > stPeriod) {
        trendUp = cleanClose[i - 1] > prevTrendUp ? Math.max(up, prevTrendUp) : up;
        trendDown = cleanClose[i - 1] < prevTrendDown ? Math.min(dn, prevTrendDown) : dn;
      }
      
      let trend = prevTrend;
      if (trend === -1 && cleanClose[i] > prevTrendDown) {
        trend = 1;
      } else if (trend === 1 && cleanClose[i] < prevTrendUp) {
        trend = -1;
      }
      
      const currentSt = trend === 1 ? trendUp : trendDown;
      const currentDir = trend === 1 ? 'Bullish' : 'Bearish';
      
      superTrend.push(currentSt);
      stDirection.push(currentDir);
      
      prevTrendUp = trendUp;
      prevTrendDown = trendDown;
      prevTrend = trend;
    }
    
    const lastSuperTrend = superTrend.length > 0 ? superTrend[superTrend.length - 1] : null;
    const lastStDirection = stDirection.length > 0 ? stDirection[stDirection.length - 1] : 'Bullish';

    // Market Structure
    let structure = "Range / No-Trade";
    if (lastEma200 !== null && lastEma50 !== null) {
      if (lastPrice > lastEma50 && lastEma50 > lastEma200) structure = "Bullish Swing";
      else if (lastPrice < lastEma50 && lastEma50 < lastEma200) structure = "Bearish Swing";
    } else if (lastEma50 !== null && lastEma20 !== null) {
      if (lastPrice > lastEma20 && lastEma20 > lastEma50) structure = "Bullish Swing";
      else if (lastPrice < lastEma20 && lastEma20 < lastEma50) structure = "Bearish Swing";
    }

    // Determine the correct previous completed candle for Pivot Points
    let prevIndex = cleanClose.length - 2; // Default to the candle before the last one
    
    if (data.date && data.date.length >= 2) {
      const lastDate = new Date(data.date[data.date.length - 1]);
      const prevDate = new Date(data.date[data.date.length - 2]);
      const diffDays = (lastDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
      
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      
      if (diffDays <= 4) {
        // Daily chart (diff is 1 day, or up to 4 days over long weekends)
        const todayStr = `${istTime.getFullYear()}-${String(istTime.getMonth() + 1).padStart(2, '0')}-${String(istTime.getDate()).padStart(2, '0')}`;
        const lastCandleDateStr = typeof data.date[data.date.length - 1] === 'string' 
          ? (data.date[data.date.length - 1] as string).substring(0, 10) 
          : lastDate.toISOString().substring(0, 10);
        
        if (lastCandleDateStr < todayStr) {
          // Last candle is strictly in the past -> it's complete
          prevIndex = cleanClose.length - 1;
        } else if (lastCandleDateStr === todayStr) {
          // Last candle is today -> check if market is closed (after 3:30 PM IST)
          const hours = istTime.getHours();
          const minutes = istTime.getMinutes();
          if (hours > 15 || (hours === 15 && minutes >= 30)) {
            prevIndex = cleanClose.length - 1; // Market closed, today is complete
          } else {
            prevIndex = cleanClose.length - 2; // Market open, today is incomplete
          }
        } else {
           prevIndex = cleanClose.length - 2;
        }
      } else if (diffDays >= 5 && diffDays <= 10) {
        // Weekly chart (lastDate is usually Monday)
        const fridayOfLastCandle = new Date(lastDate);
        fridayOfLastCandle.setDate(fridayOfLastCandle.getDate() + 4);
        fridayOfLastCandle.setHours(15, 30, 0, 0); // Market close on Friday
        
        if (istTime.getTime() > fridayOfLastCandle.getTime()) {
          // The week has ended
          prevIndex = cleanClose.length - 1;
        } else {
          // The week is ongoing
          prevIndex = cleanClose.length - 2;
        }
      } else {
        // Monthly chart
        const lastDayOfMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        lastDayOfMonth.setHours(15, 30, 0, 0);
        
        if (istTime.getTime() > lastDayOfMonth.getTime()) {
          // The month has ended
          prevIndex = cleanClose.length - 1;
        } else {
          // The month is ongoing
          prevIndex = cleanClose.length - 2;
        }
      }
    }
    
    // Ensure prevIndex is within bounds
    prevIndex = Math.max(0, Math.min(prevIndex, cleanClose.length - 1));

    // Intraday Range (ATR Based) & Pivot Points
    const prevHigh = cleanHigh[prevIndex];
    const prevLow = cleanLow[prevIndex];
    const prevClose = cleanClose[prevIndex];
    const prevRange = prevHigh - prevLow;
    
    const pivot = (prevHigh + prevLow + prevClose) / 3;
    const r1 = (2 * pivot) - prevLow;
    const s1 = (2 * pivot) - prevHigh;
    const r2 = pivot + (prevHigh - prevLow);
    const s2 = pivot - (prevHigh - prevLow);
    const r3 = prevHigh + 2 * (pivot - prevLow);
    const s3 = prevLow - 2 * (prevHigh - pivot);

    // Camarilla Pivots (Highly accurate for intraday institutional levels)
    const camH4 = prevClose + (prevRange * 1.1 / 2);
    const camH3 = prevClose + (prevRange * 1.1 / 4);
    const camL3 = prevClose - (prevRange * 1.1 / 4);
    const camL4 = prevClose - (prevRange * 1.1 / 2);

    // Volume Analysis
    const avgVolume20 = cleanVolume.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, cleanVolume.length);
    const volumeRatio = cleanVolume[cleanVolume.length - 1] / (avgVolume20 || 1);
    const isVolumeSpike = volumeRatio > 1.5;
    const volumeTrend = cleanVolume[cleanVolume.length - 1] > cleanVolume[cleanVolume.length - 2] ? "Increasing" : "Decreasing";

    const delivery = data.delivery || 0;

    // Advanced Intraday Range Calculation (V4 - Quantum Institutional Model)
    // 1. Base Volatility (ATR) scaled by Trend Strength (ADX)
    let atrMultiplierHigh = 0.5 + ((lastAdx || 20) / 100); 
    let atrMultiplierLow = 0.5 + ((lastAdx || 20) / 100);

    if (lastEma20 !== null) {
      if (lastPrice > lastEma20 && lastRsi !== null && lastRsi > 50) {
        atrMultiplierHigh += 0.3;
        atrMultiplierLow -= 0.2;
      } else if (lastPrice < lastEma20 && lastRsi !== null && lastRsi < 50) {
        atrMultiplierHigh -= 0.2;
        atrMultiplierLow += 0.3;
      }
    }

    let intradayHigh = lastPrice + ((lastAtr || 0) * atrMultiplierHigh);
    let intradayLow = lastPrice - ((lastAtr || 0) * atrMultiplierLow);

    // Fibonacci Extensions
    const fibExtHigh1 = prevHigh + prevRange * 0.382;
    const fibExtHigh2 = prevHigh + prevRange * 0.618;
    const fibExtHigh3 = prevHigh + prevRange * 1.272;
    const fibExtLow1 = prevLow - prevRange * 0.382;
    const fibExtLow2 = prevLow - prevRange * 0.618;
    const fibExtLow3 = prevLow - prevRange * 1.272;

    // Gap Logic
    const currentOpen = cleanOpen[cleanOpen.length - 1];
    const gap = currentOpen - prevClose;
    const isGapUp = gap > ((lastAtr || prevRange) * 0.3);
    const isGapDown = gap < -((lastAtr || prevRange) * 0.3);

    // 2. Camarilla, Standard Pivot, Fib & Options Confluence
    const highTargetsMap = [
      { name: 'Standard R1', value: r1 },
      { name: 'Standard R2', value: r2 },
      { name: 'Camarilla H3', value: camH3 },
      { name: 'Camarilla H4', value: camH4 },
      { name: 'Bollinger Upper', value: lastBb.upper },
      { name: 'Fib Ext 0.618', value: fibExtHigh2 },
      { name: 'Fib Ext 1.272', value: fibExtHigh3 }
    ];
    if (optionsData && optionsData.oiResistance) highTargetsMap.push({ name: 'OI Resistance', value: optionsData.oiResistance });
    if (isGapDown) highTargetsMap.push({ name: 'Gap Fill Resistance', value: prevClose });

    let highConfluence = "ATR Projection";
    const validHighTargets = highTargetsMap.filter(t => t.value > lastPrice);
    if (validHighTargets.length > 0) {
      const closest = validHighTargets.reduce((prev, curr) => Math.abs(curr.value - intradayHigh) < Math.abs(prev.value - intradayHigh) ? curr : prev);
      intradayHigh = (intradayHigh + closest.value) / 2; // Blend ATR projection with nearest institutional level
      highConfluence = closest.name;
    }

    const lowTargetsMap = [
      { name: 'Standard S1', value: s1 },
      { name: 'Standard S2', value: s2 },
      { name: 'Camarilla L3', value: camL3 },
      { name: 'Camarilla L4', value: camL4 },
      { name: 'Bollinger Lower', value: lastBb.lower },
      { name: 'Fib Ext 0.618', value: fibExtLow2 },
      { name: 'Fib Ext 1.272', value: fibExtLow3 }
    ];
    if (optionsData && optionsData.oiSupport) lowTargetsMap.push({ name: 'OI Support', value: optionsData.oiSupport });
    if (isGapUp) lowTargetsMap.push({ name: 'Gap Fill Support', value: prevClose });

    let lowConfluence = "ATR Projection";
    const validLowTargets = lowTargetsMap.filter(t => t.value < lastPrice);
    if (validLowTargets.length > 0) {
      const closest = validLowTargets.reduce((prev, curr) => Math.abs(curr.value - intradayLow) < Math.abs(prev.value - intradayLow) ? curr : prev);
      intradayLow = (intradayLow + closest.value) / 2;
      lowConfluence = closest.name;
    }

    // 3. Dynamic Probabilities (MFI, ADX, MACD, Volume, Options, Gaps)
    let highProb = 50;
    let lowProb = 50;

    // Gap Momentum
    if (isGapUp) { highProb += 5; lowProb -= 5; }
    if (isGapDown) { highProb -= 5; lowProb += 5; }

    // Options PCR
    if (optionsData && optionsData.pcr) {
      if (optionsData.pcr > 1.2) { highProb += 10; lowProb -= 5; }
      else if (optionsData.pcr < 0.8) { highProb -= 5; lowProb += 10; }
    }

    // Trend & Momentum
    if (lastEma20 !== null) {
      if (lastPrice > lastEma20) { highProb += 10; lowProb -= 10; }
      else { highProb -= 10; lowProb += 10; }
    }

    // Money Flow (More accurate than RSI for intraday volume-price action)
    if (lastMfi !== null) {
      if (lastMfi > 60) { highProb += 10; lowProb -= 5; }
      else if (lastMfi < 40) { highProb -= 5; lowProb += 10; }
    }

    // Trend Strength Multiplier
    if (lastAdx !== null && lastAdx > 25 && lastEma20 !== null) {
      if (lastPrice > lastEma20) highProb += 15;
      else lowProb += 15;
    }

    // MACD Momentum
    if (lastMacd.histogram !== null) {
      if (lastMacd.histogram > 0) highProb += 5;
      else lowProb += 5;
    }

    // Institutional Volume
    if (isVolumeSpike) {
      if (lastPrice > prevClose) highProb += 12;
      else lowProb += 12;
    }

    // Squeeze / Expansion check (Bollinger Band Width)
    const bbWidth = (lastBb.upper - lastBb.lower) / lastBb.middle;
    if (bbWidth < 0.05) {
      // Squeeze - breakout imminent, lower probabilities of staying in tight range
      highProb = Math.min(highProb, 65);
      lowProb = Math.min(lowProb, 65);
    }

    highProb = Math.max(10, Math.min(Math.round(highProb), 96));
    lowProb = Math.max(10, Math.min(Math.round(lowProb), 96));

    // AI Probability Engine
    let probability = 50; // Base Probability
    if (structure === "Bullish Swing" || structure === "Bearish Swing") probability += 15; // Strong alignment
    else probability -= 10; // Weak structure
    
    if (lastRsi !== null) {
      if (lastRsi > 40 && lastRsi < 60) probability += 5;
      if (lastRsi < 30 || lastRsi > 70) probability -= 5; // Exhaustion
    }
    if (lastAdx !== null && lastAdx > 25) probability += 10; // Trend strength
    if (isVolumeSpike) probability += 10; // Institutional participation
    if (delivery < 40) probability -= 20; // Trade invalid / weak delivery

    probability = Math.max(0, Math.min(probability, 98));

    // Institutional Swing Zones (Order Blocks & Dynamic Levels)
    const getUniqueLevels = (levels: {name: string, value: number | undefined | null}[], isBuy: boolean) => {
      const unique: {name: string, value: number}[] = [];
      for (const lvl of levels) {
        if (lvl.value === null || lvl.value === undefined || isNaN(lvl.value)) continue;
        if (unique.length === 0) {
          unique.push({ name: lvl.name, value: lvl.value });
        } else {
          // Ensure levels are at least 1% apart to avoid overlapping zones
          const isFarEnough = unique.every(u => Math.abs(u.value - lvl.value!) / lvl.value! > 0.01);
          if (isFarEnough) unique.push({ name: lvl.name, value: lvl.value });
        }
        if (unique.length >= 3) break;
      }
      return unique;
    };

    // Detect Fair Value Gaps (FVG) / Order Blocks from last 10 candles
    let bullishOB = null;
    let bearishOB = null;
    if (cleanClose.length > 10) {
      for (let i = cleanClose.length - 2; i >= cleanClose.length - 10; i--) {
        // Bullish FVG: Low of candle 3 > High of candle 1
        if (cleanLow[i] > cleanHigh[i-2]) {
          bullishOB = cleanHigh[i-2]; // The origin of the gap
          break;
        }
      }
      for (let i = cleanClose.length - 2; i >= cleanClose.length - 10; i--) {
        // Bearish FVG: High of candle 3 < Low of candle 1
        if (cleanHigh[i] < cleanLow[i-2]) {
          bearishOB = cleanLow[i-2];
          break;
        }
      }
    }

    const rawBuyLevels = [
      { name: 'Bullish Order Block (FVG)', value: bullishOB },
      { name: 'Options OI Support', value: optionsData?.oiSupport },
      { name: 'Camarilla L3', value: camL3 },
      { name: 'VWAP (20) Support', value: lastVwap },
      { name: 'EMA 20 Pullback', value: lastEma20 },
      { name: 'Standard S1', value: s1 },
      { name: 'EMA 50 Support', value: lastEma50 },
      { name: 'Camarilla L4', value: camL4 },
      { name: 'Standard S2', value: s2 },
      { name: 'Bollinger Lower', value: lastBb.lower },
      { name: 'EMA 200 Deep Value', value: lastEma200 }
    ].filter(l => l.value && l.value < lastPrice).sort((a, b) => (b.value as number) - (a.value as number));

    const buyLevels = getUniqueLevels(rawBuyLevels, true);

    // Fallbacks if not enough technical levels found
    while (buyLevels.length < 3) {
      const lastVal = buyLevels.length > 0 ? buyLevels[buyLevels.length - 1].value : lastPrice;
      buyLevels.push({ name: 'Discount Zone', value: lastVal * 0.98 });
    }

    const buyZones: SwingZone[] = buyLevels.map((lvl, i) => {
      const entry = lvl.value;
      const stopLoss = entry * 0.97; // 3% SL
      const target1 = entry + (entry - stopLoss) * 2; // 1:2 RR
      const target2 = entry + (entry - stopLoss) * 3; // 1:3 RR
      return {
        entry,
        stopLoss,
        targets: [target1, target2],
        rr: "1:2.5",
        probability: Math.max(10, Math.min(99, probability + (i === 0 ? 5 : i === 1 ? 10 : 15))),
        type: i === 0 ? "1–3 Days" : "3–7 Days",
        reason: `${i === 0 ? 'Aggressive Entry' : i === 1 ? 'High Probability' : 'Deep Discount'} (${lvl.name})`
      };
    });

    const rawSellLevels = [
      { name: 'Bearish Order Block (FVG)', value: bearishOB },
      { name: 'Options OI Resistance', value: optionsData?.oiResistance },
      { name: 'Camarilla H3', value: camH3 },
      { name: 'VWAP (20) Rejection', value: lastVwap },
      { name: 'EMA 20 Rejection', value: lastEma20 },
      { name: 'Standard R1', value: r1 },
      { name: 'EMA 50 Resistance', value: lastEma50 },
      { name: 'Camarilla H4', value: camH4 },
      { name: 'Standard R2', value: r2 },
      { name: 'Bollinger Upper', value: lastBb.upper },
      { name: 'EMA 200 Resistance', value: lastEma200 }
    ].filter(l => l.value && l.value > lastPrice).sort((a, b) => (a.value as number) - (b.value as number));

    const sellLevels = getUniqueLevels(rawSellLevels, false);

    while (sellLevels.length < 3) {
      const lastVal = sellLevels.length > 0 ? sellLevels[sellLevels.length - 1].value : lastPrice;
      sellLevels.push({ name: 'Premium Zone', value: lastVal * 1.02 });
    }

    const sellZones: SwingZone[] = sellLevels.map((lvl, i) => {
      const entry = lvl.value;
      const stopLoss = entry * 1.03; // 3% SL
      const target1 = entry - (stopLoss - entry) * 2;
      const target2 = entry - (stopLoss - entry) * 3;
      return {
        entry,
        stopLoss,
        targets: [target1, target2],
        rr: "1:2.5",
        probability: Math.max(10, Math.min(99, probability + (i === 0 ? 5 : i === 1 ? 10 : 15))),
        type: i === 0 ? "1–3 Days" : "3–7 Days",
        reason: `${i === 0 ? 'Aggressive Entry' : i === 1 ? 'High Probability' : 'Extreme Premium'} (${lvl.name})`
      };
    });

    // Institutional Flow Analysis (V5 Smart Money Flow)
    const currentCandle = { 
      open: cleanOpen[cleanOpen.length-1], 
      high: cleanHigh[cleanHigh.length-1], 
      low: cleanLow[cleanLow.length-1], 
      close: cleanClose[cleanClose.length-1] 
    };
    const bodySize = Math.abs(currentCandle.close - currentCandle.open);
    const upperWick = currentCandle.high - Math.max(currentCandle.open, currentCandle.close);
    const lowerWick = Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
    
    const isPinBarBullish = lowerWick > bodySize * 2 && upperWick < bodySize;
    const isPinBarBearish = upperWick > bodySize * 2 && lowerWick < bodySize;
    
    const highDelivery = delivery > 60;
    const extremeDelivery = delivery > 75;

    // Enhanced Trap Filter Logic (V2.0)
    const traps: TrapInfo[] = [];
    
    // Bull Trap Detection (Fake Breakouts)
    const bullTrapLevels = [
      { name: 'Resistance R1', val: r1 },
      { name: 'Resistance R2', val: r2 },
      { name: 'Camarilla H3', val: camH3 },
      { name: 'Camarilla H4', val: camH4 },
      { name: 'EMA 200', val: lastEma200 },
      { name: 'Bollinger Upper', val: lastBb.upper }
    ];

    bullTrapLevels.forEach(lvl => {
      if (lvl.val && currentCandle.high > lvl.val && currentCandle.close < lvl.val) {
        const isHighSeverity = isVolumeSpike || upperWick > bodySize * 1.5;
        traps.push({
          type: 'Bull Trap',
          level: lvl.name,
          severity: isHighSeverity ? 'High' : 'Medium',
          description: `Price pierced ${lvl.name} but failed to sustain. ${upperWick > bodySize ? 'Strong rejection wick detected.' : 'Institutional selling pressure.'}`,
          action: isHighSeverity ? 'Exit Longs / Aggressive Short' : 'Avoid Longs'
        });
      }
    });

    // Bear Trap Detection (Fake Breakdowns)
    const bearTrapLevels = [
      { name: 'Support S1', val: s1 },
      { name: 'Support S2', val: s2 },
      { name: 'Camarilla L3', val: camL3 },
      { name: 'Camarilla L4', val: camL4 },
      { name: 'EMA 200', val: lastEma200 },
      { name: 'Bollinger Lower', val: lastBb.lower }
    ];

    bearTrapLevels.forEach(lvl => {
      if (lvl.val && currentCandle.low < lvl.val && currentCandle.close > lvl.val) {
        const isHighSeverity = isVolumeSpike || lowerWick > bodySize * 1.5;
        traps.push({
          type: 'Bear Trap',
          level: lvl.name,
          severity: isHighSeverity ? 'High' : 'Medium',
          description: `Price dipped below ${lvl.name} but recovered. ${lowerWick > bodySize ? 'Strong absorption wick detected.' : 'Smart money buying detected.'}`,
          action: isHighSeverity ? 'Exit Shorts / Aggressive Long' : 'Avoid Shorts'
        });
      }
    });

    // Deduplicate traps by type (keep highest severity or first)
    const uniqueTraps: TrapInfo[] = [];
    const seenTypes = new Set<string>();
    traps.sort((a, b) => (a.severity === 'High' ? -1 : 1)).forEach(t => {
      const key = `${t.type}-${t.level}`;
      if (!seenTypes.has(key)) {
        uniqueTraps.push(t);
        seenTypes.add(key);
      }
    });

    let accumulationType = "Neutral";
    let institutionalBias = "Neutral";
    let flowStrength = 5;
    let smartMoneySignal = "Hold";

    if (isVolumeSpike && currentCandle.close > currentCandle.open && highDelivery) {
      accumulationType = "Aggressive Institutional Buying";
      institutionalBias = "Strong Bullish";
      flowStrength = extremeDelivery ? 10 : 8;
      smartMoneySignal = "Heavy Accumulation";
    } else if (isVolumeSpike && currentCandle.close < currentCandle.open && highDelivery) {
      accumulationType = "Institutional Dumping";
      institutionalBias = "Strong Bearish";
      flowStrength = extremeDelivery ? 10 : 8;
      smartMoneySignal = "Heavy Distribution";
    } else if (isPinBarBullish && isVolumeSpike) {
      accumulationType = "Smart Money Absorption (Bottom)";
      institutionalBias = "Bullish Reversal";
      flowStrength = 9;
      smartMoneySignal = "Volume Absorption";
    } else if (isPinBarBearish && isVolumeSpike) {
      accumulationType = "Smart Money Distribution (Top)";
      institutionalBias = "Bearish Reversal";
      flowStrength = 9;
      smartMoneySignal = "Volume Reversal";
    } else if (isVolumeSpike && lastEma20 !== null && lastPrice > lastEma20) {
      accumulationType = "Volume Spike Accumulation";
      institutionalBias = "Bullish";
      flowStrength = 7;
      smartMoneySignal = "Expansion";
    } else if (isVolumeSpike && lastEma20 !== null && lastPrice < lastEma20) {
      accumulationType = "Distribution / Profit Booking";
      institutionalBias = "Bearish";
      flowStrength = 7;
      smartMoneySignal = "Contraction";
    } else if (lastEma50 !== null && lastPrice > lastEma50 && volumeTrend === "Increasing") {
      accumulationType = "Absorption";
      institutionalBias = "Bullish";
      flowStrength = 6;
      smartMoneySignal = "Sustained";
    }

    return {
      structure,
      intraday: {
        high: { level: intradayHigh, prob: highProb, confluence: highConfluence },
        low: { level: intradayLow, prob: lowProb, confluence: lowConfluence }
      },
      pivots: {
        pp: pivot,
        r1, r2, r3,
        s1, s2, s3
      },
      buyZones,
      sellZones,
      probability: Math.min(probability, 98),
      volumeAnalysis: {
        avgVolume20,
        volumeRatio,
        isVolumeSpike,
        volumeTrend
      },
      institutionalFlow: {
        delivery,
        accumulationType,
        institutionalBias,
        flowStrength,
        smartMoneySignal
      },
      traps: uniqueTraps,
      indicators: {
        rsi: lastRsi,
        adx: lastAdx,
        atr: lastAtr,
        mfi: lastMfi,
        roc21: lastRoc21,
        roc125: lastRoc125,
        ema5: lastEma5,
        ema10: lastEma10,
        ema12: lastEma12,
        ema20: lastEma20,
        ema26: lastEma26,
        ema50: lastEma50,
        ema100: lastEma100,
        ema200: lastEma200,
        vwap: lastVwap,
        superTrend: lastSuperTrend,
        superTrendDirection: lastStDirection,
        macd: {
          macd: lastMacd.MACD,
          signal: lastMacd.signal,
          histogram: lastMacd.histogram
        }
      }
    };
  }

  static determineVerdict(prob: number, structure: string, flowStrength: number, institutionalBias: string) {
    if (prob >= 85 && structure === "Bullish Swing" && flowStrength >= 7 && institutionalBias.includes("Bullish")) return "HIGH POSITIVE CONFLUENCE";
    if (prob >= 85 && structure === "Bearish Swing" && flowStrength >= 7 && institutionalBias.includes("Bearish")) return "HIGH NEGATIVE CONFLUENCE";
    
    if (prob >= 70) return structure === "Bullish Swing" ? "POSITIVE CONFLUENCE" : structure === "Bearish Swing" ? "NEGATIVE CONFLUENCE" : "NEUTRAL / WAIT";
    if (prob >= 60 && institutionalBias.includes("Bullish")) return "MODERATE BULLISH BIAS";
    if (prob >= 60 && institutionalBias.includes("Bearish")) return "MODERATE BEARISH BIAS";
    
    return "NEUTRAL / WAIT";
  }
}
