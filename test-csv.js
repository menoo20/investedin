const https = require('https');
https.get('https://freegoldapi.com/data/latest.csv', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const lines = data.split('\n').filter(l => l.includes('2023-'));
    console.log(lines.join('\n'));
  });
});
