import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  const symbols = ['^NSEI', '^NSEBANK', '^CNXFIN', '^BSESN'];
  try {
    console.log('Fetching quotes for:', symbols);
    const quotes = await yahooFinance.quote(symbols);
    console.log('Success! Received', quotes.length, 'quotes.');
    console.log(JSON.stringify(quotes.map(q => ({ symbol: q.symbol, shortName: q.shortName })), null, 2));
  } catch (err: any) {
    console.error('Error fetching quotes:', err.message);
    if (err.errors) {
      console.error('Details:', JSON.stringify(err.errors, null, 2));
    }
  }
}

test();
