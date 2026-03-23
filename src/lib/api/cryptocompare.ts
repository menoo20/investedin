import prisma from '@/lib/prisma';

// Map our internal asset IDs (from CoinGecko format) to CryptoCompare symbols
const ASSET_SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
};

function getSymbol(assetId: string): string {
  return ASSET_SYMBOL_MAP[assetId.toLowerCase()] || assetId.toUpperCase();
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

export async function getHistoricalAssetPrice(assetId: string, dateString: string): Promise<number | null> {
  const normalizedId = assetId.toLowerCase();
  const dateObj = new Date(dateString + 'T00:00:00Z');
  const lookupDate = new Date(dateObj);
  lookupDate.setUTCHours(0, 0, 0, 0);

  const isToday = lookupDate.getTime() === new Date().setUTCHours(0, 0, 0, 0);

  try {
    // 1. Check Cache
    let cached = await prisma.assetPrice.findUnique({
      where: { assetId_date: { assetId: normalizedId, date: lookupDate } }
    });

    // 1-Hour TTL for "Today's" data
    if (cached && isToday) {
      const ageMs = Date.now() - cached.createdAt.getTime();
      if (ageMs > CACHE_TTL_MS) {
        console.log(`[Crypto-DB] Today's cache is stale (${Math.round(ageMs/60000)}m old). Refreshing...`);
        cached = null;
      }
    }

    if (cached) {
      console.log(`[Crypto-DB] Cache hit: ${normalizedId} on ${dateString} = $${cached.priceUsd}`);
      return cached.priceUsd;
    }

    // 2. Fetch API
    const symbol = getSymbol(assetId);
    const timestamp = Math.floor(dateObj.getTime() / 1000);
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=5&toTs=${timestamp}`
    );
    if (!response.ok) throw new Error(`CryptoCompare API error: ${response.status}`);

    const data = await response.json();
    if (data.Response !== 'Success' || !data.Data?.Data?.length) return null;

    const price = data.Data.Data[data.Data.Data.length - 1].close;

    if (price) {
      // 3. Save Cache (Update createdAt to refresh TTL for today)
      await prisma.assetPrice.upsert({
        where: { assetId_date: { assetId: normalizedId, date: lookupDate } },
        update: { priceUsd: price, createdAt: new Date() },
        create: { assetId: normalizedId, date: lookupDate, priceUsd: price }
      });
      console.log(`[Crypto-API] Fetched & Cached ${symbol} on ${dateString}: $${price}`);
    }
    return price || null;
  } catch (error) {
    console.error(`[Crypto-Service] Error for ${assetId}:`, error);
    return null;
  }
}

export async function getCurrentAssetPrice(assetId: string): Promise<number | null> {
  try {
    const symbol = getSymbol(assetId);
    const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.USD) {
      console.log(`[Crypto-API] Latest price for ${symbol}: $${data.USD}`);
      return data.USD;
    }
    return null;
  } catch (error) {
    console.error(`[Crypto-API] Current price error for ${assetId}:`, error);
    return null;
  }
}
