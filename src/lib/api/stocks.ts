import prisma from '@/lib/prisma';

const SYMBOL_MAP: Record<string, string> = {
  'sp500': '^GSPC',
  'nasdaq': '^IXIC',
  'dowjones': '^DJI',
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

export async function getHistoricalStockPrice(assetId: string, dateString: string): Promise<number | null> {
  const normalizedId = assetId.toLowerCase();
  const date = new Date(dateString);
  const lookupDate = new Date(date);
  lookupDate.setUTCHours(0,0,0,0);

  const isToday = lookupDate.getTime() === new Date().setUTCHours(0,0,0,0);

  try {
    // 1. Check Cache
    let cached = await prisma.assetPrice.findUnique({
      where: { assetId_date: { assetId: normalizedId, date: lookupDate } }
    });

    // 1-Hour TTL for "Today's" data
    if (cached && isToday) {
      const ageMs = Date.now() - cached.createdAt.getTime();
      if (ageMs > CACHE_TTL_MS) {
        console.log(`[Stock-DB] Today's cache is stale (${Math.round(ageMs/60000)}m old). Refreshing...`);
        cached = null;
      }
    }

    if (cached) {
      console.log(`[Stock-DB] Cache hit: ${normalizedId} on ${dateString} = $${cached.priceUsd}`);
      return cached.priceUsd;
    }

    // 2. Fetch API
    const symbol = SYMBOL_MAP[normalizedId] || assetId.toUpperCase();
    const startTs = Math.floor(date.getTime() / 1000);
    const endTs = startTs + 86400 * 5; // Look ahead 5 days

    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTs}&period2=${endTs}&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) return null;

    const data = await response.json();
    const closePrice = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];

    if (closePrice) {
      // 3. Save Cache (Update createdAt to refresh TTL for today)
      await prisma.assetPrice.upsert({
        where: { assetId_date: { assetId: normalizedId, date: lookupDate } },
        update: { priceUsd: closePrice, createdAt: new Date() },
        create: { assetId: normalizedId, date: lookupDate, priceUsd: closePrice }
      });
      console.log(`[Stock-API] Fetched & Cached ${symbol} on ${dateString}: $${closePrice}`);
    }
    return closePrice;
  } catch (error) {
    console.error(`[Stock-Service] Error for ${assetId}:`, error);
    return null;
  }
}

export async function getCurrentStockPrice(assetId: string): Promise<number | null> {
  const normalizedId = assetId.toLowerCase();
  try {
    const symbol = SYMBOL_MAP[normalizedId] || assetId.toUpperCase();
    
    // Use the actual system "now" (relative to the user's clock)
    const endTs = Math.floor(Date.now() / 1000);
    const startTs = endTs - 86400 * 7;

    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTs}&period2=${endTs}&interval=1d`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const closePrices = result?.indicators?.quote?.[0]?.close || [];
    
    // Get the most recent non-null close price
    for (let i = closePrices.length - 1; i >= 0; i--) {
      if (closePrices[i] !== null && closePrices[i] !== undefined) {
        console.log(`[Stock-API] Latest price for ${symbol}: $${closePrices[i]}`);
        return closePrices[i];
      }
    }

    return null;
  } catch (error) {
    console.error(`[Stock-API] Current price error for ${assetId}:`, error);
    return null;
  }
}
