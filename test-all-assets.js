const { calculateInvestment } = require('./src/lib/services/investment');

async function runTest() {
  const assets = ['bitcoin', 'ethereum', 'solana', 'gold', 'sp500', 'currency_egp', 'currency_eur'];
  const amount = 10600;
  const date = '2023-12-22';
  
  console.log(`Investment Report for ${amount} SAR on ${date} (Grounded to Mar 2024)`);
  console.log('---------------------------------------------------------------------');
  
  for (const asset of assets) {
    try {
      const result = await calculateInvestment(amount, 'SAR', asset, date);
      console.log(`${asset.toUpperCase().padEnd(12)}: ${result.roiPercentage.toFixed(2).padStart(8)}% | Current Value: ${result.currentValueLocal.toFixed(2).padStart(12)} SAR`);
    } catch (e) {
      console.log(`${asset.toUpperCase().padEnd(12)}: Error - ${e.message}`);
    }
  }
}

runTest();
