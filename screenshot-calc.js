const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log("Navigating...");
  await page.goto('http://localhost:3000');
  
  // Wait for the tab switcher
  await page.waitForSelector('button:has-text("Calculator")');
  console.log("Clicking Calculator tab...");
  await page.click('button:has-text("Calculator")');
  
  // Wait for the calculator UI to animate in
  await page.waitForTimeout(1000);
  
  // Click some buttons (1 5 * 6 =)
  console.log("Typing 15 * 6 = ...");
  await page.click('button:has-text("1")');
  await page.click('button:has-text("5")');
  await page.click('button:has-text("×")');
  await page.click('button:has-text("6")');
  await page.click('button:has-text("=")');
  
  await page.waitForTimeout(500);
  
  const screenshotPath = path.join('C:\\Users\\menoo\\.gemini\\antigravity\\brain\\e2f22224-3e49-4682-b73d-61eaaebd7414', 'calculator_final.png');
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved to", screenshotPath);
  
  await browser.close();
})();
