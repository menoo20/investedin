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

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

export async function getHistoricalCurrencyPrice(currency: string, dateString: string): Promise<number | null> {
  const upper = currency.toUpperCase();
  const date = new Date(dateString);
  const lookupDate = new Date(date);
  lookupDate.setUTCHours(0, 0, 0, 0);

  const isToday = lookupDate.getTime() === new Date().setUTCHours(0, 0, 0, 0);

  // 1. Always check USD/Pegged first
  if (upper === 'USD') return 1;
  if (PEGGED_TO_USD[upper]) return 1 / PEGGED_TO_USD[upper];

  try {
    // 2. Check DB Cache
    let cached = await prisma.exchangeRate.findUnique({
      where: { currency_date: { currency: upper, date: lookupDate } }
    });

    // 1-Hour TTL for "Today's" data
    if (cached && isToday) {
      const ageMs = Date.now() - cached.createdAt.getTime();
      if (ageMs > CACHE_TTL_MS) {
        console.log(`[Currency-DB] Today's cache is stale (${Math.round(ageMs/60000)}m old). Refreshing...`);
        cached = null;
      }
    }

    if (cached) {
      console.log(`[Currency-DB] Cache hit for ${upper} on ${dateString}: 1 USD = ${cached.rateVsUsd}`);
      return 1 / cached.rateVsUsd;
    }

    // 3. Try fallbacks
    let price = await tryFawazahmed0(upper, dateString);
    if (price === null) price = await tryFrankfurter(upper, dateString);
    if (price === null) price = await tryYahooFinance(upper, dateString);

    if (price !== null) {
      // 4. Save Cache (store as rateVsUsd, update createdAt to refresh TTL for today)
      const rateVsUsd = 1 / price;
      await prisma.exchangeRate.upsert({
        where: { currency_date: { currency: upper, date: lookupDate } },
        update: { rateVsUsd, createdAt: new Date() },
        create: { currency: upper, date: lookupDate, rateVsUsd }
      });
      console.log(`[Currency-API] Fetched & Cached ${upper} on ${dateString}: 1 USD = ${rateVsUsd}`);
    }
    return price;
  } catch (error) {
    console.error(`[Currency-API] Error for ${upper} on ${dateString}:`, error);
    return null;
  }
}

export async function getCurrentCurrencyPrice(currency: string): Promise<number | null> {
  const upper = currency.toUpperCase();

  if (upper === 'USD') return 1;
  if (PEGGED_TO_USD[upper]) return 1 / PEGGED_TO_USD[upper];

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
    if (!response.ok) throw new Error('open.er-api failed');
    const data = await response.json();
    const rate = data?.rates?.[upper];
    if (rate) return 1 / rate; 
    return null;
  } catch (error) {
    console.error(`[Currency] Failed to get current price for ${upper}:`, error);
    return null;
  }
}

async function tryFawazahmed0(currency: string, dateString: string): Promise<number | null> {
  try {
    const [year, month, day] = dateString.split('-');
    const versionTag = `${year}.${parseInt(month)}.${parseInt(day)}`;
    const response = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${versionTag}/v1/currencies/usd.min.json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const ratePerUsd = data?.usd?.[currency.toLowerCase()];
    return ratePerUsd ? 1 / ratePerUsd : null;
  } catch (error) {
    return null;
  }
}

async function tryFrankfurter(currency: string, dateString: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.frankfurter.app/${dateString}?from=USD&to=${currency}`);
    if (!response.ok) return null;
    const data = await response.json();
    const rate = data?.rates?.[currency];
    return rate ? 1 / rate : null;
  } catch (error) {
    return null;
  }
}

async function tryYahooFinance(currency: string, dateString: string): Promise<number | null> {
  try {
    const date = new Date(dateString);
    const startTs = Math.floor(date.getTime() / 1000);
    const endTs = startTs + 86400 * 3;
    const symbol = `${currency.toUpperCase()}=X`;
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTs}&period2=${endTs}&interval=1d`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;
    const data = await response.json();
    const closePrice = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];
    return closePrice ? 1 / closePrice : null;
  } catch (error) {
    return null;
  }
}
