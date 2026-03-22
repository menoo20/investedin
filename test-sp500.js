const http = require('http');

const data = JSON.stringify({
  amount: '1000',
  currency: 'USD',
  asset: 'solana',
  date: '2022-01-01'
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
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('Response DATA:', parsed.data);
      if (parsed.data && parsed.data.roiPercentage !== undefined) {
        console.log('SUCCESS: ROI calculated for S&P 500.');
      } else {
        console.error('FAILURE: Unexpected response structure.', parsed);
      }
    } catch (e) {
      console.log('Raw Response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
