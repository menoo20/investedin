import prisma from '../src/lib/prisma';
import { getHistoricalStockPrice } from '../src/lib/api/stocks';
import { getHistoricalAssetPrice } from '../src/lib/api/cryptocompare';
import { getHistoricalGoldPrice } from '../src/lib/api/gold';
import { getHistoricalCurrencyPrice } from '../src/lib/api/currency-asset';

const ASSETS = ['sp500', 'bitcoin', 'ethereum', 'solana', 'gold'];
const CURRENCIES = ['SAR', 'EGP', 'EUR', 'GBP'];

async function seed() {
  console.log('🚀 Starting historical data seed...');
  
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 5); // 5 years back

  for (const assetId of ASSETS) {
    console.log(`\n📦 Seeding ${assetId}...`);
    // For seeding many dates, we'll just sample monthly/weekly to fill the DB
    // or just fetch key years. In a real app we'd fetch daily CSVs.
    // For this demo, let's fetch the first day of each month for 5 years.
    
    let current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      try {
        if (assetId === 'sp500') await getHistoricalStockPrice(assetId, dateString);
        else if (assetId === 'gold') await getHistoricalGoldPrice(dateString);
        else await getHistoricalAssetPrice(assetId, dateString);
        
        process.stdout.write('.');
      } catch (e) {
        process.stdout.write('x');
      }
      
      // Advance by 1 month
      current.setMonth(current.getMonth() + 1);
    }
  }

  for (const currency of CURRENCIES) {
    console.log(`\n💵 Seeding ${currency}...`);
    let current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      try {
        await getHistoricalCurrencyPrice(currency, dateString);
        process.stdout.write('.');
      } catch (e) {
        process.stdout.write('x');
      }
      current.setMonth(current.getMonth() + 1);
    }
  }

  console.log('\n\n✅ Seeding complete!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
