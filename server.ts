import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import fs from "fs/promises";
import axios from "axios";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

dotenv.config();

// Simple JSON Database
const DB_FILE = path.join(process.cwd(), 'database.json');

interface Database {
  users: any[];
  watchlists: any[];
}

async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({ users: [], watchlists: [] }));
  }
}

async function readDB(): Promise<Database> {
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeDB(data: Database) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(cors());
  app.use(express.json());

  // Initialize JSON Database
  await initDB();

  // WebSocket Server for Live MarketFeed
  const wss = new WebSocketServer({ server, path: '/ws' });
  const activeSubscriptions = new Map<WebSocket, string>();

  wss.on("connection", (ws) => {
    console.log("Client connected to MarketFeed");
    
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "SUBSCRIBE" && data.scripCode) {
          activeSubscriptions.set(ws, data.scripCode);
        }
      } catch (e) {
        console.error("WS Message Error", e);
      }
    });

    const interval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        const scripCode = activeSubscriptions.get(ws);
        if (scripCode) {
          try {
            const quote: any = await yahooFinance.quote(scripCode);
            ws.send(JSON.stringify({
              type: "PRICE_UPDATE",
              data: {
                scripCode,
                lastPrice: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                pChange: quote.regularMarketChangePercent,
                timestamp: new Date().toISOString()
              }
            }));
          } catch (e) {
            // Ignore fetch errors to keep WS alive
          }
        }
      }
    }, 3000);

    ws.on("close", () => {
      clearInterval(interval);
      activeSubscriptions.delete(ws);
      console.log("Client disconnected from MarketFeed");
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Endpoints
  app.get("/api/market-overview", async (req, res) => {
    try {
      const symbols = ['^NSEI', '^NSEBANK', '^CNXFIN', '^BSESN'];
      const quotes = await yahooFinance.quote(symbols);
      const results = quotes.map((q: any) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        pChange: q.regularMarketChangePercent
      }));
      res.json(results);
    } catch (err) {
      console.error("Market Overview Error:", err);
      res.status(500).json({ error: "Failed to fetch market overview" });
    }
  });

  app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    try {
      const db = await readDB();
      if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ error: "User already exists" });
      }
      const newUser = { id: Date.now().toString(), email, password };
      db.users.push(newUser);
      await writeDB(db);
      res.json({ user: { id: newUser.id, email } });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const db = await readDB();
      const user = db.users.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Watchlist Endpoints
  app.get("/api/watchlist", async (req, res) => {
    const userId = req.query.userId as string;
    try {
      const db = await readDB();
      const userWatchlist = db.watchlists.filter(w => w.userId === userId).map(w => w.scripCode);
      res.json(userWatchlist);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/watchlist/add", async (req, res) => {
    const { userId, scripCode } = req.body;
    try {
      const db = await readDB();
      if (!db.watchlists.find(w => w.userId === userId && w.scripCode === scripCode)) {
        db.watchlists.push({ userId, scripCode });
        await writeDB(db);
      }
      const userWatchlist = db.watchlists.filter(w => w.userId === userId).map(w => w.scripCode);
      res.json(userWatchlist);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/watchlist/remove", async (req, res) => {
    const { userId, scripCode } = req.body;
    try {
      const db = await readDB();
      db.watchlists = db.watchlists.filter(w => !(w.userId === userId && w.scripCode === scripCode));
      await writeDB(db);
      const userWatchlist = db.watchlists.filter(w => w.userId === userId).map(w => w.scripCode);
      res.json(userWatchlist);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Stock Search (Real NSE Data via Yahoo Finance)
  app.get("/api/search-stock", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.json([]);
    
    try {
      const queryUpper = q.toUpperCase();
      const indices = [
        { symbol: '^NSEI', scripCode: '^NSEI', name: 'NIFTY 50' },
        { symbol: '^NSEBANK', scripCode: '^NSEBANK', name: 'NIFTY BANK' },
        { symbol: '^CNXFIN', scripCode: '^CNXFIN', name: 'FINNIFTY' },
        { symbol: '^BSESN', scripCode: '^BSESN', name: 'SENSEX' },
      ];
      
      const matchedIndices = indices.filter(idx => 
        idx.name.includes(queryUpper) || 
        idx.symbol.includes(queryUpper) || 
        queryUpper.includes(idx.name.split(' ')[0])
      );

      // Search for the raw query first
      const results: any = await yahooFinance.search(q);
      
      // Filter for NSE stocks (NSI exchange or .NS suffix)
      const nseStocks = results.quotes
        .filter((item: any) => {
          const isNse = item.exchange === 'NSI' || (item.symbol && item.symbol.endsWith('.NS'));
          return isNse && item.symbol;
        })
        .map((item: any) => ({
          symbol: item.symbol ? item.symbol.replace('.NS', '') : '',
          scripCode: item.symbol,
          name: item.longname || item.shortname || item.symbol
        }));

      // Deduplicate by symbol
      const uniqueNseStocks: any[] = Array.from(new Map(nseStocks.map((item: any) => [item.scripCode, item])).values());

      let finalResults: any[] = [...matchedIndices];

      // If no NSE stocks found, try searching with .NS suffix as fallback
      if (uniqueNseStocks.length === 0 && !q.includes('.NS') && matchedIndices.length === 0) {
        const fallbackResults: any = await yahooFinance.search(`${q}.NS`);
        const fallbackNseStocks = fallbackResults.quotes
          .filter((item: any) => item.symbol && item.symbol.endsWith('.NS'))
          .map((item: any) => ({
            symbol: item.symbol.replace('.NS', ''),
            scripCode: item.symbol,
            name: item.longname || item.shortname || item.symbol
          }));
        const uniqueFallback: any[] = Array.from(new Map(fallbackNseStocks.map((item: any) => [item.scripCode, item])).values());
        finalResults = [...finalResults, ...uniqueFallback];
      } else {
        finalResults = [...finalResults, ...uniqueNseStocks];
      }

      // Deduplicate final results by scripCode
      const uniqueFinal = Array.from(new Map(finalResults.map(item => [item.scripCode, item])).values());

      res.json(uniqueFinal.slice(0, 6));
    } catch (error) {
      console.error("Search Error:", error);
      res.json([]);
    }
  });

  app.get("/api/stock-data", async (req, res) => {
    const { scripCode } = req.query;
    if (!scripCode || typeof scripCode !== 'string') return res.status(400).json({ error: "Invalid scripCode" });

    try {
      const quote: any = await yahooFinance.quote(scripCode);
      
      let summary: any = {};
      try {
        summary = await yahooFinance.quoteSummary(scripCode, {
          modules: [
            'summaryDetail', 
            'financialData', 
            'defaultKeyStatistics', 
            'assetProfile', 
            'recommendationTrend', 
            'majorHoldersBreakdown',
            'incomeStatementHistory',
            'incomeStatementHistoryQuarterly',
            'cashflowStatementHistory'
          ]
        });
      } catch(err) {
        console.error("Quote Summary Error:", err);
      }

      const fd = summary?.financialData || {};
      const sd = summary?.summaryDetail || {};
      const dks = summary?.defaultKeyStatistics || {};
      const prof = summary?.assetProfile || {};
      const rec = summary?.recommendationTrend?.trend?.[0] || {};
      const holds = summary?.majorHoldersBreakdown || {};

      const yearlyIncome = summary?.incomeStatementHistory?.incomeStatementHistory || [];
      const quarterlyIncome = summary?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
      const cashflow = summary?.cashflowStatementHistory?.cashflowStatements || [];

      res.json({
        scripCode,
        lastPrice: quote.regularMarketPrice || fd.currentPrice,
        change: quote.regularMarketChange,
        pChange: quote.regularMarketChangePercent,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        open: quote.regularMarketOpen,
        prevClose: quote.regularMarketPreviousClose,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        delivery: 45 + Math.random() * 20, // Mock delivery %
        
        // Fundamentals
        peRatio: sd.trailingPE || dks.trailingPE || quote.trailingPE || null,
        pbRatio: dks.priceToBook || null,
        dividendYield: sd.dividendYield || null,
        roe: fd.returnOnEquity || null,
        debtToEquity: fd.debtToEquity || null,
        eps: dks.trailingEps || quote.epsTrailingTwelveMonths || null,
        bookValue: dks.bookValue || quote.bookValue || null,
        
        // Health
        revenueGrowth: fd.revenueGrowth || null,
        operatingMargins: fd.operatingMargins || null,
        profitMargins: fd.profitMargins || null,
        
        // Profile
        sector: prof.sector || 'N/A',
        industry: prof.industry || 'N/A',
        longBusinessSummary: prof.longBusinessSummary || '',
        
        // Ownership
        insidersHeld: holds.insidersPercentHeld || 0,
        institutionsHeld: holds.institutionsPercentHeld || 0,
        
        // Recommendations
        recommendationKey: fd.recommendationKey || 'none',
        targetMeanPrice: fd.targetMeanPrice || null,
        buyInfo: rec,

        // High Level Quarters & Annuals
        quarters: quarterlyIncome.map((q: any) => ({
           date: q.endDate,
           totalRevenue: q.totalRevenue || 0,
           taxProvision: q.incomeTaxExpense || 0,
           netIncome: q.netIncome || 0
        })).reverse(),
        
        annuals: yearlyIncome.map((y: any) => ({
           date: y.endDate,
           totalRevenue: y.totalRevenue || 0,
           taxProvision: y.incomeTaxExpense || 0,
           netIncome: y.netIncome || 0
        })).reverse()
      });
    } catch (error) {
      console.error("Quote Error:", error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  app.get("/api/historical-data", async (req, res) => {
    const { scripCode, interval = "1D" } = req.query;
    if (!scripCode || typeof scripCode !== 'string') return res.status(400).json({ error: "Invalid scripCode" });
    
    try {
      const period1Date = new Date();
      const period2Date = new Date();
      let yfInterval: '1d' | '1wk' | '1mo' = '1d';
      
      if (interval === "1D") {
        period1Date.setFullYear(period1Date.getFullYear() - 3); // 3 years = ~750 days (enough for EMA 200 warmup)
        yfInterval = '1d';
      } else if (interval === "1W") {
        period1Date.setFullYear(period1Date.getFullYear() - 6); // 6 years = ~312 weeks (enough for EMA 200 warmup)
        yfInterval = '1wk';
      } else if (interval === "1M") {
        period1Date.setFullYear(period1Date.getFullYear() - 20); // 20 years = 240 months (enough for EMA 200 warmup)
        yfInterval = '1mo';
      } else {
        // Fallback for unexpected interval
        period1Date.setFullYear(period1Date.getFullYear() - 3);
        yfInterval = '1d';
      }

      console.log(`Fetching historical data for ${scripCode} with interval ${yfInterval} since ${period1Date.toISOString()} to ${period2Date.toISOString()}`);

      const result: any = await yahooFinance.chart(scripCode, {
        period1: period1Date,
        period2: period2Date,
        interval: yfInterval,
      });

      if (!result || !result.quotes) {
        throw new Error("No data returned from Yahoo Finance");
      }

      const formattedData = result.quotes.map(d => ({
        date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : new Date(d.date).toISOString().split('T')[0],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      })).filter(d => d.open !== null && d.close !== null);

      const uniqueData = Array.from(new Map(formattedData.map(item => [item.date, item])).values());

      if (uniqueData.length === 0) {
        throw new Error("No valid quotes found after filtering");
      }

      res.json(uniqueData);
    } catch (error: any) {
      console.error("Historical Data Error Details:", error);
      res.status(500).json({ 
        error: "Failed to fetch historical data", 
        details: error.message || String(error)
      });
    }
  });

  // AI Analysis endpoint removed (now handled client-side via Gemini)

  app.get("/api/options-data", async (req, res) => {
    const { scripCode } = req.query;
    if (!scripCode || typeof scripCode !== 'string') return res.status(400).json({ error: "Invalid scripCode" });

    try {
      const symbol = scripCode.toUpperCase();
      let cleanSymbol = symbol.replace(/\.NS$/, '').replace(/\.BO$/, '');

      // Map Yahoo Finance index symbols to Groww search terms
      if (cleanSymbol === '^NSEI') cleanSymbol = 'NIFTY';
      else if (cleanSymbol === '^NSEBANK') cleanSymbol = 'BANKNIFTY';
      else if (cleanSymbol === '^CNXFIN') cleanSymbol = 'FINNIFTY';
      else if (cleanSymbol === '^BSESN') cleanSymbol = 'SENSEX';

      console.log(`Fetching real Groww option chain for ${cleanSymbol}`);

      const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'x-app-id': 'growwWeb',
        'origin': 'https://groww.in',
        'referer': 'https://groww.in/'
      };

      let searchId = '';
      
      // Known Groww search IDs for indices
      if (cleanSymbol === 'NIFTY') searchId = 'nifty';
      else if (cleanSymbol === 'BANKNIFTY') searchId = 'banknifty';
      else if (cleanSymbol === 'FINNIFTY') searchId = 'finnifty';
      else if (cleanSymbol === 'SENSEX') searchId = 'sensex';
      else if (cleanSymbol === 'MIDCPNIFTY') searchId = 'midcpnifty';
      else {
        // 1. Get search_id for stocks
        const searchUrl = `https://groww.in/v1/api/search/v3/query/global/st_p_query?page=0&query=${cleanSymbol}&size=1&web=true`;
        const searchRes = await axios.get(searchUrl, { headers });
        
        searchId = searchRes.data?.data?.content?.[0]?.search_id;
        if (!searchId) {
          throw new Error(`Could not find Groww search_id for ${cleanSymbol}`);
        }
      }

      // 2. Fetch option chain
      const growwUrl = `https://groww.in/v1/api/option_chain_service/v1/option_chain/derivatives/${searchId}`;
      const response = await axios.get(growwUrl, { headers });

      const data = response.data;
      if (!data || !data.optionChain || !data.optionChain.optionChains) {
        // Stock doesn't have options
        return res.json({
          underlying: symbol,
          currentPrice: data?.livePrice?.value || data?.livePrice?.ltp || 0,
          expiries: [],
          options: [],
          pcr: 0,
          oiSupport: 0,
          oiResistance: 0,
          maxPain: 0,
          message: "Options data not available for this stock"
        });
      }

      const currentPrice = data.livePrice?.value || data.livePrice?.ltp || 0;
      const rawOptions = data.optionChain.optionChains || [];
      
      const options = rawOptions.map((opt: any) => {
        const call = opt.callOption || {};
        const put = opt.putOption || {};
        // Groww strikePrice is multiplied by 100
        const strike = (call.strikePrice || put.strikePrice || 0) / 100;

        return {
          strike,
          call: {
            price: call.ltp || 0,
            change: call.dayChange || 0,
            pChange: call.dayChangePerc || 0,
            volume: call.volume || 0,
            oi: call.openInterest || 0,
            impliedVolatility: call.impliedVolatility || 0,
            isITM: strike < currentPrice
          },
          put: {
            price: put.ltp || 0,
            change: put.dayChange || 0,
            pChange: put.dayChangePerc || 0,
            volume: put.volume || 0,
            oi: put.openInterest || 0,
            impliedVolatility: put.impliedVolatility || 0,
            isITM: strike > currentPrice
          }
        };
      });

      // Sort by strike
      options.sort((a: any, b: any) => a.strike - b.strike);

      // Filter to show ~10 strikes around ATM for better UI performance, or keep all if needed
      // The frontend might prefer a subset
      const atmIndex = options.findIndex((o: any) => o.strike >= currentPrice);
      const start = Math.max(0, atmIndex - 10);
      const end = Math.min(options.length, atmIndex + 11);
      const filteredOptions = options.slice(start, end);

      // Calculate PCR, OI Support, OI Resistance
      let totalCallOI = 0;
      let totalPutOI = 0;
      let maxCallOI = 0;
      let maxPutOI = 0;
      let oiResistance = 0;
      let oiSupport = 0;

      options.forEach((opt: any) => {
        totalCallOI += opt.call.oi;
        totalPutOI += opt.put.oi;
        
        if (opt.call.oi > maxCallOI) {
          maxCallOI = opt.call.oi;
          oiResistance = opt.strike;
        }
        
        if (opt.put.oi > maxPutOI) {
          maxPutOI = opt.put.oi;
          oiSupport = opt.strike;
        }
      });

      const pcr = totalCallOI > 0 ? (totalPutOI / totalCallOI) : 0;

      // Max Pain Calculation (Simplified)
      let minPainValue = Infinity;
      let maxPainStrike = 0;

      // Only check strikes in the filtered range for performance
      filteredOptions.forEach((painStrikeOpt: any) => {
        let currentPain = 0;
        const painStrike = painStrikeOpt.strike;
        
        options.forEach((opt: any) => {
          const callIntrinsic = Math.max(0, painStrike - opt.strike);
          currentPain += callIntrinsic * opt.call.oi;
          const putIntrinsic = Math.max(0, opt.strike - painStrike);
          currentPain += putIntrinsic * opt.put.oi;
        });

        if (currentPain < minPainValue) {
          minPainValue = currentPain;
          maxPainStrike = painStrike;
        }
      });

      res.json({
        underlying: symbol,
        currentPrice,
        expiries: data.optionChain.expiryDates || [],
        options: filteredOptions,
        pcr: Number(pcr.toFixed(2)),
        oiSupport,
        oiResistance,
        maxPain: maxPainStrike
      });
    } catch (error: any) {
      console.error("Groww Options Data Error:", error.message);
      res.status(500).json({ error: "Failed to fetch real options data from Groww", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Tiker 360 Plus Server running on http://localhost:${PORT}`);
  });
}

startServer();
