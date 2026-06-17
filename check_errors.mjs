import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log("Navigating to preview...");
  await page.goto('http://localhost:4173/');
  
  await page.waitForTimeout(5000);
  console.log("Done waiting.");
  
  await browser.close();
})();
