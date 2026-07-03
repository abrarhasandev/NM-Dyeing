const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3003/dashboard/order');
  await page.waitForSelector('button');

  // Click Custom tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Custom')) {
      await tab.click();
      break;
    }
  }

  // Wait and click trigger
  await page.waitForTimeout(1000);
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Pick a date range') || text.includes('2026')) {
      await btn.click();
      break;
    }
  }

  // Wait for calendar
  await page.waitForTimeout(1000);

  // Click July 10 and July 20
  const days = await page.$$('button');
  let clickCount = 0;
  for (const day of days) {
    const text = await page.evaluate(el => el.textContent, day);
    const parentClass = await page.evaluate(el => el.parentElement?.className, day);
    // Find July days
    if (text === '10' && clickCount === 0) {
      await day.click();
      clickCount++;
      await page.waitForTimeout(500);
    } else if (text === '20' && clickCount === 1) {
      await day.click();
      clickCount++;
      await page.waitForTimeout(500);
    }
  }

  // Dump HTML of calendar cells
  const cells = await page.evaluate(() => {
    const rdpCells = document.querySelectorAll('td');
    return Array.from(rdpCells).map(td => {
      const btn = td.querySelector('button');
      return {
        tdClass: td.className,
        btnText: btn?.textContent || '',
        btnClass: btn?.className || '',
        btnSelected: btn?.getAttribute('aria-selected') || 'null'
      };
    });
  });

  console.log(JSON.stringify(cells, null, 2));

  await browser.close();
})();
