import { getHistoricalExchangeRate, getCurrentExchangeRate } from '../api/frankfurter';
import { getHistoricalAssetPrice, getCurrentAssetPrice } from '../api/cryptocompare';
import { getHistoricalGoldPrice, getCurrentGoldPrice } from '../api/gold';
import { getHistoricalCurrencyPrice, getCurrentCurrencyPrice } from '../api/currency-asset';
import { getHistoricalStockPrice, getCurrentStockPrice } from '../api/stocks';

// The underlying API services (stocks.ts, cryptocompare.ts, gold.ts, currency-asset.ts) 
// now handle their own caching internally using Prisma.
// Therefore, we can simplify this file to just orchestrate the calls.

export interface CalculationResult {
  initialInvestmentLocal: number;
  initialInvestmentUsd: number;
  unitsBought: number;
  currentValueLocal: number;
  currentValueUsd: number;
  roiPercentage: number;
  pastAssetPriceUsd: number;
  currentAssetPriceUsd: number;
  pastExchangeRate: number;
  currentExchangeRate: number;
}

export async function calculateInvestment(
  amountLocal: number,
  currency: string,
  assetId: string, // e.g., 'bitcoin'
  dateString: string // e.g., '2020-01-01'
): Promise<CalculationResult> {
  
  // 1. Get historical conversion & historical price (Caching is now handled in the API services)
  const pastRateToLocal = await getHistoricalExchangeRate(dateString, currency);
  if (pastRateToLocal === null) throw new Error(`Could not fetch exchange rate for ${currency} on ${dateString}`);

  let pastPriceUsd: number | null = null;
  const normalizedId = assetId.toLowerCase();

  if (normalizedId === 'gold') {
    pastPriceUsd = await getHistoricalGoldPrice(dateString);
  } else if (normalizedId.startsWith('currency_')) {
    const targetCurrency = normalizedId.replace('currency_', '').toUpperCase();
    pastPriceUsd = await getHistoricalCurrencyPrice(targetCurrency, dateString);
  } else if (['sp500', 'nasdaq', 'dowjones'].includes(normalizedId)) {
    pastPriceUsd = await getHistoricalStockPrice(normalizedId, dateString);
  } else {
    pastPriceUsd = await getHistoricalAssetPrice(assetId, dateString);
  }

  if (pastPriceUsd === null) throw new Error(`Could not fetch asset price for ${assetId} on ${dateString}`);

  // amountLocal / pastRateToLocal = USD amount on that date
  const initialInvestmentUsd = amountLocal / pastRateToLocal;

  // 2. Calculate units bought
  const unitsBought = initialInvestmentUsd / pastPriceUsd;

  // 3. Get CURRENT live price and rate
  let currentPriceUsd: number | null;
  if (normalizedId === 'gold') {
    currentPriceUsd = await getCurrentGoldPrice() || pastPriceUsd;
  } else if (normalizedId.startsWith('currency_')) {
    const targetCurrency = normalizedId.replace('currency_', '').toUpperCase();
    currentPriceUsd = await getCurrentCurrencyPrice(targetCurrency) || pastPriceUsd;
  } else if (['sp500', 'nasdaq', 'dowjones'].includes(normalizedId)) {
    currentPriceUsd = await getCurrentStockPrice(normalizedId) || pastPriceUsd;
  } else {
    currentPriceUsd = await getCurrentAssetPrice(assetId) || pastPriceUsd;
  }
  
  if (currentPriceUsd === null) currentPriceUsd = pastPriceUsd;

  let currentRateToLocal = 1;
  if (currency.toUpperCase() !== 'USD') {
    currentRateToLocal = await getCurrentExchangeRate(currency) || pastRateToLocal;
  }

  // 4. Calculate current values
  const currentValueUsd = unitsBought * currentPriceUsd;
  const currentValueLocal = currentValueUsd * currentRateToLocal;

  // 5. Calculate ROI
  const roiPercentage = ((currentValueLocal - amountLocal) / amountLocal) * 100;

  return {
    initialInvestmentLocal: amountLocal,
    initialInvestmentUsd,
    unitsBought,
    currentValueLocal,
    currentValueUsd,
    roiPercentage,
    pastAssetPriceUsd: pastPriceUsd,
    currentAssetPriceUsd: currentPriceUsd,
    pastExchangeRate: pastRateToLocal,
    currentExchangeRate: currentRateToLocal
  };
}
