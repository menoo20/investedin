// Map our internal asset IDs (from CoinGecko format) to CryptoCompare symbols
const ASSET_SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
};



function getSymbol(assetId: string): string {
  return ASSET_SYMBOL_MAP[assetId.toLowerCase()] || assetId.toUpperCase();
}

export async function getHistoricalAssetPrice(assetId: string, dateString: string): Promise<number | null> {
  try {
    const symbol = getSymbol(assetId);
    const dateObj = new Date(dateString + 'T00:00:00Z');
    const timestamp = Math.floor(dateObj.getTime() / 1000);

    // Increase limit to 5 and look back a bit to ensure we catch the trading day
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=5&toTs=${timestamp}`
    );
    if (!response.ok) throw new Error(`CryptoCompare API returned ${response.status}`);

    const data = await response.json();
    if (data.Response !== 'Success' || !data.Data?.Data?.length) {
      console.error(`CryptoCompare did not return valid data for ${symbol} on ${dateString}`);
      return null;
    }

    // Return the last available price before or on the target date
    const dayData = data.Data.Data[data.Data.Data.length - 1];
    const price = dayData.close;

    if (price) {
      console.log(`[Crypto-API] Fetched ${symbol} on ${dateString}: $${price}`);
    }
    return price || null;
  } catch (error) {
    console.error(`Failed to fetch historical price for ${assetId} on ${dateString}:`, error);
    return null;
  }
}

export async function getCurrentAssetPrice(assetId: string): Promise<number | null> {
  try {
    const symbol = getSymbol(assetId);
    
    // Use the latest price from the API (relative to system now)
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`
    );
    if (!response.ok) throw new Error(`CryptoCompare price API returned ${response.status}`);

    const data = await response.json();
    const price = data.USD;
    
    if (price) {
      console.log(`[Crypto-API] System-relative price for ${symbol}: $${price}`);
      return price;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch current price for ${assetId}:`, error);
    return null;
  }
}
