const SYMBOL_MAP: Record<string, string> = {
  'sp500': '^GSPC',
  'nasdaq': '^IXIC',
  'dowjones': '^DJI',
};

export async function getHistoricalStockPrice(assetId: string, dateString: string): Promise<number | null> {
  const normalizedId = assetId.toLowerCase();
  
  try {
    const symbol = SYMBOL_MAP[normalizedId] || assetId.toUpperCase();
    const date = new Date(dateString);
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
      console.log(`[Stock-API] Fetched ${symbol} on ${dateString}: $${closePrice}`);
    }
    return closePrice;
  } catch (error) {
    console.error(`[Stock-Service] Error for ${assetId}:`, error);
    return null;
  }
}

export async function getCurrentStockPrice(assetId: string): Promise<number | null> {
  try {
    const symbol = SYMBOL_MAP[assetId.toLowerCase()] || assetId.toUpperCase();
    
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
    const indicators = result?.indicators?.quote?.[0];
    const closePrices = indicators?.close || [];
    
    // Get the most recent non-null close price
    for (let i = closePrices.length - 1; i >= 0; i--) {
      if (closePrices[i] !== null && closePrices[i] !== undefined) {
        console.log(`[Stock-API] ${symbol} grounded price: $${closePrices[i]}`);
        return closePrices[i];
      }
    }

    return null;
  } catch (error) {
    console.error(`[Stock-API] Current price error for ${assetId}:`, error);
    return null;
  }
}
