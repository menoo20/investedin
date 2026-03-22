export async function getHistoricalGoldPrice(dateString: string): Promise<number | null> {
  const symbol = 'GC=F';
  
  try {
    const date = new Date(dateString);
    const startTs = Math.floor(date.getTime() / 1000);
    const endTs = startTs + 86400 * 5; // Look ahead 5 days

    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTs}&period2=${endTs}&interval=1d`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) return null;

    const data = await response.json();
    const price = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];

    if (price) {
      console.log(`[Gold-API] Fetched for ${dateString}: $${price}/oz`);
    }
    
    return price || null;
  } catch (error) {
    console.error(`[Gold-API] Error for ${dateString}:`, error);
    return null;
  }
}

export async function getCurrentGoldPrice(): Promise<number | null> {
  const symbol = 'GC=F';
  try {
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
    
    for (let i = closePrices.length - 1; i >= 0; i--) {
      if (closePrices[i] !== null && closePrices[i] !== undefined) {
        console.log(`[Gold-API] System-time price: $${closePrices[i]}/oz`);
        return closePrices[i];
      }
    }
    return null;
  } catch (error) {
    console.error('[Gold-API] Current price error:', error);
    return null;
  }
}
