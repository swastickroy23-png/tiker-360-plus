import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function test() {
  try {
    const res = await yahooFinance.options('AAPL');
    console.log(JSON.stringify(res, null, 2).substring(0, 1000));
  } catch (e) {
    console.error(e);
  }
}
test();
