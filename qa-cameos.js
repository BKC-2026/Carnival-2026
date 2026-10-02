const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function runQA() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  const heroes = ['david', 'daniel', 'ruth', 'noah', 'esther', 'moses'];
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  const results = {};

  for (const vp of viewports) {
    results[vp.name] = {};
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const h of heroes) {
      await page.goto(`http://localhost:5000/#${h}`, { waitUntil: 'networkidle0' });

      // Scroll card into view to trigger lazy loading
      await page.evaluate((hero) => {
        const card = document.querySelector(`#view-${hero} .hero-mission-card`);
        if (card) card.scrollIntoView();
      }, h);

      // Wait for image to load
      await page.waitForFunction((hero) => {
        const img = document.querySelector(`#view-${hero} .mission-cameo-img`);
        return img && img.complete && img.naturalWidth > 0;
      }, { timeout: 5000 }, h);

      // Check overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Check cameo image
      const cameoInfo = await page.evaluate((hero) => {
        const card = document.querySelector(`#view-${hero} .hero-mission-card`);
        const img = card ? card.querySelector('.mission-cameo-img') : null;
        if (!img) return null;
        const comp = window.getComputedStyle(img);
        return {
          src: img.src,
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: img.offsetWidth,
          height: img.offsetHeight,
          order: comp.order,
          objectFit: comp.objectFit,
          borderRadius: comp.borderRadius
        };
      }, h);

      results[vp.name][h] = {
        hasOverflow: overflow,
        cameo: cameoInfo
      };

      // Take screenshot of the mission card
      const cardEl = await page.$(`#view-${h} .hero-mission-card`);
      if (cardEl) {
        await cardEl.screenshot({ path: `assets/qa-${h}-${vp.name}.png` });
      }
    }
  }

  await browser.close();

  console.log('=== CONSOLE ERRORS ===');
  console.log(consoleErrors.length === 0 ? 'None' : consoleErrors);

  console.log('=== RESULTS SUMMARY ===');
  for (const vp of viewports) {
    console.log(`\nViewport: ${vp.name} (${vp.width}px)`);
    for (const h of heroes) {
      const res = results[vp.name][h];
      const c = res.cameo;
      console.log(`  Hero: ${h.padEnd(7)} | Overflow: ${res.hasOverflow} | Cameo: ${c ? `${c.width}x${c.height} (nat: ${c.naturalWidth}x${c.naturalHeight}, fit: ${c.objectFit}, rad: ${c.borderRadius})` : 'MISSING'}`);
    }
  }
}

runQA().catch(console.error);
