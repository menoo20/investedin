import { NextResponse } from 'next/server';
import { getCurrentExchangeRate } from '@/lib/api/frankfurter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, fromCurrency, toCurrency } = body;

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json({ error: "Missing required fields (amount, fromCurrency, toCurrency)" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) {
      return NextResponse.json({ 
        success: true, 
        data: {
          originalAmount: parsedAmount,
          convertedAmount: parsedAmount,
          rate: 1
        }
      });
    }

    // Since our getCurrentExchangeRate returns the value of 1 USD in the target currency,
    // we need to get both rates relative to USD to compute the cross-rate.
    // e.g., 1 USD = 3.75 SAR, 1 USD = 50 EGP
    // Rate from SAR to EGP = (USD to EGP) / (USD to SAR) = 50 / 3.75 = 13.33

    const fromRateToUsd = from === 'USD' ? 1 : await getCurrentExchangeRate(from);
    const toRateToUsd = to === 'USD' ? 1 : await getCurrentExchangeRate(to);

    if (!fromRateToUsd || !toRateToUsd) {
      throw new Error("Could not fetch live exchange rates for one or both currencies.");
    }

    const crossRate = toRateToUsd / fromRateToUsd;
    const convertedAmount = parsedAmount * crossRate;

    return NextResponse.json({ 
      success: true, 
      data: {
        originalAmount: parsedAmount,
        convertedAmount,
        rate: crossRate
      }
    });

  } catch (error: any) {
    console.error("Conversion API Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to convert currency. " + (error?.message || "") }, { status: 500 });
  }
}
