import prisma from '@/lib/prisma';

const PEGGED_TO_USD: Record<string, number> = {
  USD: 1,
  SAR: 3.75,
  AED: 3.6725,
  BHD: 0.376,
  QAR: 3.64,
  OMR: 0.385,
  JOD: 0.709,
};

export async function getHistoricalCurrencyPrice(currency: string, dateString: string): Promise<number | null> {
  const upper = currency.toUpperCase();

  // 1. Always check USD/Pegged first
  if (upper === 'USD') return 1;
  if (PEGGED_TO_USD[upper]) return 1 / PEGGED_TO_USD[upper];

  try {
    // 2. Try fallbacks
    let price = await tryFawazahmed0(upper, dateString);
    if (price === null) price = await tryFrankfurter(upper, dateString);
    if (price === null) price = await tryYahooFinance(upper, dateString);

    if (price !== null) {
      console.log(`[Currency-API] Fetched ${upper} for ${dateString}: $${price}`);
    }
    return price;
  } catch (error) {
    console.error(`[Currency-API] Error for ${upper} on ${dateString}:`, error);
    return null;
  }
}

const REAL_WORLD_NOW_TS = 1711110000; // March 22, 2024

export async function getCurrentCurrencyPrice(currency: string): Promise<number | null> {
  const upper = currency.toUpperCase();

  if (upper === 'USD') return 1;
  if (PEGGED_TO_USD[upper]) return 1 / PEGGED_TO_USD[upper];

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
    if (!response.ok) throw new Error('open.er-api failed');
    const data = await response.json();
    const rate = data?.rates?.[upper];
    if (rate) return 1 / rate; // Convert "1 USD = X currency" to "1 currency = Y USD"
    return null;
  } catch (error) {
    console.error(`[Currency] Failed to get current price for ${upper}:`, error);
    return null;
  }
}

async function tryFawazahmed0(currency: string, dateString: string): Promise<number | null> {
  try {
    // Convert YYYY-MM-DD to YYYY.M.DD version tag
    const [year, month, day] = dateString.split('-');
    const versionTag = `${year}.${parseInt(month)}.${parseInt(day)}`;

    const response = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${versionTag}/v1/currencies/usd.min.json`
    );
    if (!response.ok) return null;

    const data = await response.json();
    const ratePerUsd = data?.usd?.[currency.toLowerCase()];
    if (!ratePerUsd) return null;

    // ratePerUsd = how many units of this currency per 1 USD
    // We want: price of 1 unit in USD = 1 / ratePerUsd
    console.log(`[Currency-fawazahmed0] 1 USD = ${ratePerUsd} ${currency} on ${dateString}`);
    return 1 / ratePerUsd;
  } catch (error) {
    return null;
  }
}

async function tryFrankfurter(currency: string, dateString: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.frankfurter.app/${dateString}?from=USD&to=${currency}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    const rate = data?.rates?.[currency];
    if (!rate) return null;

    console.log(`[Currency-Frankfurter] 1 USD = ${rate} ${currency} on ${dateString}`);
    return 1 / rate; // Price of 1 unit in USD
  } catch (error) {
    return null;
  }
}

async function tryYahooFinance(currency: string, dateString: string): Promise<number | null> {
  try {
    // Yahoo uses timestamps. convert YYYY-MM-DD to start/end of that day
    const date = new Date(dateString);
    const startTs = Math.floor(date.getTime() / 1000);
    const endTs = startTs + 86400 * 2; // Look ahead 2 days to ensure we hit at least one trading day

    const symbol = `${currency.toUpperCase()}=X`;
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTs}&period2=${endTs}&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`[Currency-Yahoo] Fetch failed for ${symbol} on ${dateString}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamp = result?.timestamp?.[0];
    const closePrice = result?.indicators?.quote?.[0]?.close?.[0];

    if (!closePrice) return null;

    // Yahoo CURRENCY pairs (like EGP=X) are usually quoted as "1 USD = X Currency" 
    // but we need to verify the "meta" to be sure. Most common for CCY is 1 USD = X.
    // So 1 unit of Currency in USD = 1 / closePrice
    console.log(`[Currency-Yahoo] 1 USD = ${closePrice} ${currency} on ${dateString} (ts: ${timestamp})`);
    return 1 / closePrice;
  } catch (error) {
    console.error(`[Currency-Yahoo] Error for ${currency}:`, error);
    return null;
  }
}
