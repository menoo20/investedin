import prisma from '@/lib/prisma';

const PEGGED_RATES: Record<string, number> = {
  SAR: 3.75,
  AED: 3.6725,
  BHD: 0.376,
  QAR: 3.64,
  OMR: 0.385,
  JOD: 0.709,
  HKD: 7.8,
};
// Historical reference rates for currencies not covered by APIs for older dates.
// These are approximate yearly averages from public central bank data.
// EGP underwent major devaluations in Nov 2016, March 2022, Jan 2023, and March 2024.
const HISTORICAL_REFERENCE_RATES: Record<string, [string, number][]> = {
  EGP: [
    ['2015-01-01', 7.63],
    ['2016-01-01', 7.83],
    ['2016-11-03', 15.77],  // Float/devaluation
    ['2017-01-01', 18.85],
    ['2018-01-01', 17.68],
    ['2019-01-01', 17.41],
    ['2020-01-01', 15.85],
    ['2021-01-01', 15.71],
    ['2022-01-01', 15.72],
    ['2022-03-21', 18.27],  // Devaluation
    ['2022-10-27', 24.50],  // Further slide
    ['2023-01-11', 29.80],  // Devaluation
    ['2023-06-01', 30.85],
    ['2024-01-01', 30.90],
    ['2024-03-06', 49.50],  // Major devaluation
    ['2024-06-01', 47.80],
    ['2025-01-01', 50.80],
    ['2026-01-01', 52.20],
  ],
};

function getHistoricalReferenceRate(currency: string, dateString: string): number | null {
  const refs = HISTORICAL_REFERENCE_RATES[currency.toUpperCase()];
  if (!refs || refs.length === 0) return null;

  // Find the closest earlier or equal date
  let closestRate: number | null = null;
  for (const [refDate, rate] of refs) {
    if (refDate <= dateString) {
      closestRate = rate;
    } else {
      break;
    }
  }
  if (closestRate !== null) {
    console.log(`[ExRate-Reference] Using reference rate: 1 USD = ${closestRate} ${currency} on ${dateString}`);
  }
  return closestRate;
}

export async function getHistoricalExchangeRate(date: string, toCurrency: string): Promise<number | null> {
  if (toCurrency === 'USD') return 1;

  try {
    const response = await fetch(`https://api.frankfurter.app/${date}?from=USD&to=${toCurrency}`);
    if (!response.ok) {
      // Fallback if Frankfurter fails
      const backupResponse = await fetch(`https://open.er-api.com/v6/latest/USD`);
      const backupData = await backupResponse.json();
      return backupData.rates?.[toCurrency] || null;
    }

    const data = await response.json();
    return data.rates?.[toCurrency] || null;
  } catch (error) {
    console.error(`[Exchange-API] Error fetching ${toCurrency} on ${date}:`, error);
    return null;
  }
}

export async function getCurrentExchangeRate(currency: string): Promise<number | null> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error('open.er-api.com failed');
    const data = await response.json();
    return data?.rates?.[currency.toUpperCase()] || null;
  } catch (error) {
    console.error(`Failed to fetch current exchange rate for ${currency}:`, error);
    return null;
  }
}

async function tryFawazahmed0Rate(currency: string, dateString: string): Promise<number | null> {
  try {
    const [year, month, day] = dateString.split('-');
    const versionTag = `${year}.${parseInt(month)}.${parseInt(day)}`;
    const response = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${versionTag}/v1/currencies/usd.min.json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const rate = data?.usd?.[currency.toLowerCase()];
    if (!rate) return null;
    console.log(`[ExRate-fawazahmed0] 1 USD = ${rate} ${currency} on ${dateString}`);
    return rate;
  } catch {
    return null;
  }
}

async function tryFrankfurterRate(currency: string, dateString: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.frankfurter.app/${dateString}?from=USD&to=${currency}`);
    if (!response.ok) return null;
    const data = await response.json();
    const rate = data?.rates?.[currency];
    if (!rate) return null;
    console.log(`[ExRate-Frankfurter] 1 USD = ${rate} ${currency} on ${dateString}`);
    return rate;
  } catch {
    return null;
  }
}
