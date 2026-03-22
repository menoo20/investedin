const { getHistoricalGoldPrice } = require('./src/lib/api/gold');
(async () => {
    const price = await getHistoricalGoldPrice("2023-07-13");
    console.log("Price for 2023-07-13 is:", price);
})();
