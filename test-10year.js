const http = require('http');

async function fetchAssetRecord(asset, date) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ amount: '1000', currency: 'USD', asset: asset, date: date });
    const options = { hostname: 'localhost', port: 3000, path: '/api/calculate', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => { resolve(JSON.parse(body)); });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(data);
    req.end();
  });
}

async function runTenYearCheck() {
  const assets = ['gold', 'sp500', 'bitcoin'];
  const tenYearsAgo = '2014-03-22';
  console.log(`10-Year Historical Check (${tenYearsAgo} to Mar 2024)`);
  console.log('---------------------------------------------------------');
  for (const asset of assets) {
    const res = await fetchAssetRecord(asset, tenYearsAgo);
    if (res.success) {
      console.log(`${asset.toUpperCase().padEnd(10)}: ${res.data.roiPercentage.toFixed(2).padStart(8)}% ROI`);
    } else {
      console.log(`${asset.toUpperCase().padEnd(10)}: Error - ${res.error || 'Unknown'}`);
    }
  }
}

runTenYearCheck();
