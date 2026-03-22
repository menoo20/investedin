const http = require('http');

function convert(amount, fromCurrency, toCurrency) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ amount, fromCurrency, toCurrency });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/convert',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log("Testing Converter...");
  const result = await convert('1000', 'USD', 'EGP');
  console.log("USD -> EGP:", result);
  
  const result2 = await convert('1000', 'SAR', 'EGP');
  console.log("SAR -> EGP:", result2);
})();
