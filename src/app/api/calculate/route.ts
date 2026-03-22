import { NextResponse } from 'next/server';
import { calculateInvestment } from '@/lib/services/investment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency, asset, date } = body;

    if (!amount || !currency || !asset || !date) {
      return NextResponse.json({ error: "Missing required fields (amount, currency, asset, date)" }, { status: 400 });
    }

    if (asset.toUpperCase() === 'ALL') {
      const ALL_ASSETS = [
        'bitcoin', 'ethereum', 'solana', 'gold', 'sp500',
        'currency_usd', 'currency_eur', 'currency_gbp', 'currency_sar', 'currency_egp'
      ].filter(a => a !== `currency_${currency.toLowerCase()}`); // Filter out the invested currency

      const results: any[] = [];
      for (const a of ALL_ASSETS) {
        try {
          const res = await calculateInvestment(parseFloat(amount), currency.toUpperCase(), a, date);
          results.push({ assetId: a, ...res });
          // Add a delay to prevent Coingecko/Frankfurter rate limiting
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          console.error(`Error calculating for asset ${a}:`, err);
        }
      }

      if (results.length === 0) {
        return NextResponse.json({ error: "Rate limit exceeded or failed to fetch all assets. Please try again in a minute." }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data: results });
    }

    const result = await calculateInvestment(
      parseFloat(amount),
      currency.toUpperCase(),
      asset.toLowerCase(),
      date
    );

    return NextResponse.json({ success: true, data: { assetId: asset.toLowerCase(), ...result } });
  } catch (error: any) {
    console.error("Calculation API Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to calculate investment. " + (error?.message || "") }, { status: 500 });
  }
}
