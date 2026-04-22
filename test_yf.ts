import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const summary = await yahooFinance.quoteSummary('RELIANCE.NS', {
      modules: [
        'incomeStatementHistory', 
        'incomeStatementHistoryQuarterly',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'majorHoldersBreakdown',
        'institutionOwnership'
      ]
    });
    console.log(JSON.stringify(summary, null, 2));
  } catch (err: any) {
    console.error(err);
  }
}
test();
