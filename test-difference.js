const http = require('http');

function calculate(amount, currency, asset, date) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ amount, currency, asset, date });
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
      res.on('data', (d) => body += d);
      res.on('end', () => resolve(JSON.parse(body).data));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const sarResult = await calculate('500', 'SAR', 'gold', '2020-01-01');
  console.log('--- 500 SAR to Gold (2020-01-01) ---');
  console.log(`Initial Value (USD): $${sarResult.initialInvestmentUsd}`);
  console.log(`Units Bought: ${sarResult.unitsBought} oz`);
  console.log(`Current Value: ${sarResult.currentValueLocal} SAR`);
  console.log(`ROI: +${sarResult.roiPercentage.toFixed(2)}%\n`);

  const usdResult = await calculate('500', 'USD', 'gold', '2020-01-01');
  console.log('--- 500 USD to Gold (2020-01-01) ---');
  console.log(`Initial Value (USD): $${usdResult.initialInvestmentUsd}`);
  console.log(`Units Bought: ${usdResult.unitsBought} oz`);
  console.log(`Current Value: $${usdResult.currentValueLocal} USD`);
  console.log(`ROI: +${usdResult.roiPercentage.toFixed(2)}%\n`);
})();
