const http = require('http');

const assets = ['bitcoin', 'ethereum', 'solana', 'gold', 'sp500', 'currency_egp', 'currency_eur'];
const amount = 10600;
const date = '2023-12-22';

async function fetchAssetRecord(asset) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      amount: amount.toString(),
      currency: 'SAR',
      asset: asset,
      date: date
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/calculate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ success: false, error: 'Parse Error' });
        }
      });
    });

    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log(`Investment Report for ${amount} SAR on ${date} (Grounded to Mar 2024)`);
  console.log('---------------------------------------------------------------------');
  
  for (const asset of assets) {
    const res = await fetchAssetRecord(asset);
    if (res.success) {
      const result = res.data;
      console.log(`${asset.toUpperCase().padEnd(12)}: ${result.roiPercentage.toFixed(2).padStart(8)}% | Current Value: ${result.currentValueLocal.toFixed(2).padStart(12)} SAR`);
    } else {
      console.log(`${asset.toUpperCase().padEnd(12)}: Error - ${res.error || 'Unknown'}`);
    }
  }
}

runTest();
