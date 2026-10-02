const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyAll() {
  console.log('=== STARTING TARGETED UI FIXES QA VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // Track Console Errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.toString()));

  const viewports = [
    { name: 'Desktop (1280px)', width: 1280, height: 900 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Mobile (480px)', width: 480, height: 854 },
    { name: 'Mobile (375px)', width: 375, height: 667 }
  ];

  // 1. Check Menu Drawer Box Shadow
  await page.setViewport({ width: 480, height: 854 });
  await page.goto('http://localhost:5000/#home', { waitUntil: 'networkidle0' });
  const drawerShadow = await page.evaluate(() => {
    const drawer = document.getElementById('menuDrawer');
    return window.getComputedStyle(drawer).boxShadow;
  });
  console.log('1. [MENU DRAWER] Computed box-shadow:', drawerShadow);
  if (drawerShadow === 'none' || drawerShadow === '') {
    console.log('   ✓ SUCCESS: Box shadow removed from .menu-drawer\n');
  } else {
    console.error('   ✗ FAILED: Box shadow still present:', drawerShadow, '\n');
  }

  // 2. Check each viewport for Overflow, Spacing, Cameo Layout, and Footer Buttons
  for (const vp of viewports) {
    console.log(`--- Testing Viewport: ${vp.name} ---`);
    await page.setViewport({ width: vp.width, height: vp.height });

    // Test on Esther (which has cameo, card-grid-row, and footer buttons)
    await page.goto('http://localhost:5000/#esther', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 150));

    const checkData = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth > doc.clientWidth;
      
      // Card Grid Row Spacing
      const cardGrid = document.querySelector('#view-esther .card-grid-row');
      const cards = cardGrid ? Array.from(cardGrid.querySelectorAll('.bkc-card')) : [];
      let cardSpacing = 0;
      if (cards.length >= 2) {
        const rect1 = cards[0].getBoundingClientRect();
        const rect2 = cards[1].getBoundingClientRect();
        // If stacked vertically
        if (Math.abs(rect1.left - rect2.left) < 10) {
          cardSpacing = rect2.top - rect1.bottom;
        } else {
          // If side by side
          cardSpacing = rect2.left - rect1.right;
        }
      }

      // Mission Cameo Layout
      const cameoLayout = document.querySelector('#view-esther .mission-cameo-layout');
      const cameoImg = document.querySelector('#view-esther .mission-cameo-img');
      const textSide = document.querySelector('#view-esther .mission-text-side');
      let cameoOrder = '';
      let imgRect = null;
      let textRect = null;
      if (cameoImg && textSide) {
        imgRect = cameoImg.getBoundingClientRect();
        textRect = textSide.getBoundingClientRect();
        if (imgRect.bottom <= textRect.top + 2) {
          cameoOrder = 'IMAGE_FIRST_STACKED';
        } else if (imgRect.left >= textRect.right - 2) {
          cameoOrder = 'SIDE_BY_SIDE';
        } else {
          cameoOrder = 'OTHER';
        }
      }

      // Footer Buttons
      const btnBack = document.querySelector('#view-esther .btn-back-home');
      const btnShare = document.querySelector('#view-esther .btn-hero-share');
      let buttonData = null;
      if (btnBack && btnShare) {
        const bRect = btnBack.getBoundingClientRect();
        const sRect = btnShare.getBoundingClientRect();
        buttonData = {
          backHeight: bRect.height,
          shareHeight: sRect.height,
          backWidth: bRect.width,
          shareWidth: sRect.width,
          heightMatch: Math.abs(bRect.height - sRect.height) <= 1
        };
      }

      return {
        overflow: overflow,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        cardSpacing: Math.round(cardSpacing),
        cameoOrder: cameoOrder,
        imgWidth: imgRect ? Math.round(imgRect.width) : 0,
        imgHeight: imgRect ? Math.round(imgRect.height) : 0,
        buttonData: buttonData
      };
    });

    console.log(`   Overflow: ${checkData.overflow ? 'YES (BAD)' : 'NONE (scrollWidth: ' + checkData.scrollWidth + 'px, clientWidth: ' + checkData.clientWidth + 'px)'}`);
    console.log(`   Card Grid Spacing: ${checkData.cardSpacing}px between cards`);
    console.log(`   Cameo Layout: ${checkData.cameoOrder} (image size: ${checkData.imgWidth}x${checkData.imgHeight}px)`);
    if (checkData.buttonData) {
      console.log(`   Buttons: Back height=${checkData.buttonData.backHeight}px, Share height=${checkData.buttonData.shareHeight}px | Equal: ${checkData.buttonData.heightMatch}`);
    }

    // Take screenshot
    const shotPath = path.join(__dirname, `qa_${vp.width}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`   Screenshot saved: qa_${vp.width}.png\n`);
  }

  // Console Error Check
  console.log('=== CONSOLE ERROR AUDIT ===');
  console.log(`Total Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errors found:', consoleErrors);
  } else {
    console.log('✓ Clean console: ZERO errors detected across all tested viewports!\n');
  }

  await browser.close();
  console.log('=== QA VERIFICATION FINISHED ===');
}

verifyAll().catch(err => {
  console.error('QA verification script error:', err);
  process.exit(1);
});
