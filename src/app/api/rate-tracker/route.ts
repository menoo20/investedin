import { NextResponse } from 'next/server';
import { getHistoricalAssetPrice, getCurrentAssetPrice } from '@/lib/api/cryptocompare';
import { getHistoricalGoldPrice, getCurrentGoldPrice } from '@/lib/api/gold';
import { getHistoricalCurrencyPrice, getCurrentCurrencyPrice } from '@/lib/api/currency-asset';
import { getHistoricalStockPrice, getCurrentStockPrice } from '@/lib/api/stocks';

type AssetType = 'crypto' | 'gold' | 'currency' | 'stock';

function classifyAsset(asset: string): { type: AssetType; id: string } {
  if (asset.startsWith('currency_')) {
    return { type: 'currency', id: asset.replace('currency_', '').toUpperCase() };
  }
  if (asset === 'gold') {
    return { type: 'gold', id: 'gold' };
  }
  if (['sp500', 'nasdaq', 'dowjones'].includes(asset.toLowerCase())) {
    return { type: 'stock', id: asset.toLowerCase() };
  }
  return { type: 'crypto', id: asset };
}

async function getPriceOnDate(type: AssetType, id: string, date: string): Promise<number | null> {
  switch (type) {
    case 'crypto':
      return getHistoricalAssetPrice(id, date);
    case 'gold':
      return getHistoricalGoldPrice(date);
    case 'currency':
      return getHistoricalCurrencyPrice(id, date);
    case 'stock':
      return getHistoricalStockPrice(id, date);
  }
}

async function getLivePrice(type: AssetType, id: string): Promise<number | null> {
  switch (type) {
    case 'crypto':
      return getCurrentAssetPrice(id);
    case 'gold':
      return getCurrentGoldPrice();
    case 'currency':
      return getCurrentCurrencyPrice(id);
    case 'stock':
      return getCurrentStockPrice(id);
  }
}

function getAssetUnit(type: AssetType, id: string): string {
  switch (type) {
    case 'crypto':
      const symbols: Record<string, string> = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL' };
      return symbols[id] || id.toUpperCase();
    case 'gold':
      return 'oz';
    case 'currency':
      return id.toUpperCase();
    case 'stock':
      return id === 'sp500' ? 'Points' : 'USD';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { asset, date1, date2, currency } = body;

    const targetCurrency = (currency || 'USD').toUpperCase();

    if (!asset || !date1) {
      return NextResponse.json(
        { error: 'Missing required fields (asset, date1)' },
        { status: 400 }
      );
    }

    const { type, id } = classifyAsset(asset);
    const unit = getAssetUnit(type, id);

    // Fetch prices in parallel
    const promises: Promise<number | null>[] = [
      getPriceOnDate(type, id, date1),
      getLivePrice(type, id),
    ];

    if (date2) {
      promises.push(getPriceOnDate(type, id, date2));
    }

    if (targetCurrency !== 'USD') {
      promises.push(getPriceOnDate('currency', targetCurrency, date1));
      promises.push(getLivePrice('currency', targetCurrency));
      if (date2) {
        promises.push(getPriceOnDate('currency', targetCurrency, date2));
      }
    }

    const results = await Promise.all(promises);
    let price1 = results[0];
    let currentPrice = results[1];
    let price2 = date2 ? results[2] : null;

    if (price1 === null) {
      throw new Error(`Could not fetch price for ${asset} on ${date1}`);
    }
    if (currentPrice === null) {
      throw new Error(`Could not fetch current price for ${asset}`);
    }

    if (targetCurrency !== 'USD') {
      const baseIndex = date2 ? 3 : 2;
      const targetPrice1 = results[baseIndex];
      const targetCurrentPrice = results[baseIndex + 1];
      const targetPrice2 = date2 ? results[baseIndex + 2] : null;

      if (!targetPrice1 || !targetCurrentPrice || (date2 && !targetPrice2)) {
         throw new Error(`Could not fetch conversion rates for ${targetCurrency}`);
      }

      price1 = price1 / targetPrice1;
      currentPrice = currentPrice / targetCurrentPrice;
      if (date2 && price2 !== null && targetPrice2) {
        price2 = price2 / targetPrice2;
      }
    }

    // Calculate changes
    const changeFromDate1 = currentPrice - price1;
    const changePercentFromDate1 = ((changeFromDate1) / price1) * 100;

    let comparison = null;
    if (date2 && price2 !== null) {
      const changeBetween = price2 - price1;
      const changePercentBetween = ((changeBetween) / price1) * 100;
      comparison = {
        date2,
        price2,
        changeBetween,
        changePercentBetween,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        asset,
        unit,
        currency: targetCurrency,
        date1,
        price1,
        currentPrice,
        changeFromDate1,
        changePercentFromDate1,
        comparison,
      },
    });
  } catch (error: any) {
    console.error('Rate Tracker API Error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch rate data. ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
