const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTests() {
  console.log('--- Starting Comprehensive Automated Browser Tests ---');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // 1. Check Console Errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  // Mobile Viewport (iPhone 14 / modern mobile)
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  console.log('1. Navigating to http://localhost:5000/#home on Mobile (430x932)...');
  await page.goto('http://localhost:5000/#home', { waitUntil: 'networkidle0' });
  
  // 2. Check Horizontal Overflow on Mobile
  const mobileOverflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  console.log('2. Mobile Overflow Check:', mobileOverflow);

  // Take Home Mobile Screenshot
  await page.screenshot({ path: path.join(__dirname, 'test_home_mobile.png'), fullPage: false });
  console.log('Captured test_home_mobile.png');

  // 3. Test Hamburger Menu
  console.log('3. Testing Hamburger Menu...');
  await page.click('#btnMenuToggle');
  await new Promise(r => setTimeout(r, 400));
  const isMenuOpen = await page.evaluate(() => {
    const drawer = document.getElementById('menuDrawer');
    return drawer && drawer.classList.contains('open');
  });
  console.log('Hamburger Menu opened successfully:', isMenuOpen);
  await page.screenshot({ path: path.join(__dirname, 'test_menu_open.png') });

  // 4. Test Navigation via Drawer to David
  console.log('4. Navigating to David via Drawer...');
  await page.click('#menuDrawer a[href="#david"]');
  await new Promise(r => setTimeout(r, 400));
  const davidActive = await page.evaluate(() => {
    const v = document.getElementById('view-david');
    return v && v.classList.contains('active');
  });
  console.log('David page is active:', davidActive);
  await page.screenshot({ path: path.join(__dirname, 'test_david_mobile.png') });

  // 5. Test Back to Home Button
  console.log('5. Testing Back to Home button...');
  await page.click('#view-david .btn-back-home');
  await new Promise(r => setTimeout(r, 400));
  const homeActiveAfterBack = await page.evaluate(() => {
    const v = document.getElementById('view-home');
    return v && v.classList.contains('active');
  });
  console.log('Returned to Home successfully:', homeActiveAfterBack);

  // 6. Test Card Clicks on Home Page for all heroes
  const heroes = ['david', 'esther', 'moses', 'daniel', 'noah', 'ruth'];
  for (const h of heroes) {
    console.log(`6. Testing card click for ${h}...`);
    await page.click(`#card-hero-${h}`);
    await new Promise(r => setTimeout(r, 300));
    const active = await page.evaluate((hero) => {
      const v = document.getElementById(`view-${hero}`);
      return v && v.classList.contains('active');
    }, h);
    console.log(`Hero ${h} view activated:`, active);
    await page.screenshot({ path: path.join(__dirname, `test_${h}_view.png`) });
    
    // Check overflow on hero page
    const heroOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (heroOverflow) console.error(`WARNING: Overflow detected on ${h} page!`);
    
    // Return home
    await page.click(`#view-${h} .btn-back-home`);
    await new Promise(r => setTimeout(r, 200));
  }

  // 7. Test Share Button & Modal
  console.log('7. Testing Share Button...');
  await page.click('#btnHeaderShare');
  await new Promise(r => setTimeout(r, 300));
  const shareOpen = await page.evaluate(() => {
    const modal = document.getElementById('shareModalBackdrop');
    return modal && modal.classList.contains('open');
  });
  console.log('Share modal opened successfully:', shareOpen);
  await page.screenshot({ path: path.join(__dirname, 'test_share_modal.png') });

  // Test copy button
  await page.click('#btnCopyLink');
  await new Promise(r => setTimeout(r, 200));
  const toastVisible = await page.evaluate(() => {
    const t = document.getElementById('toastFeedback');
    return t && t.classList.contains('show');
  });
  console.log('Share Toast notification displayed:', toastVisible);

  await page.click('#btnCloseShare');
  await new Promise(r => setTimeout(r, 300));

  // 8. Desktop Viewport Test
  console.log('8. Testing Desktop Viewport (1280x800)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5000/#home', { waitUntil: 'networkidle0' });
  
  const desktopOverflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  console.log('Desktop Overflow Check:', desktopOverflow);
  await page.screenshot({ path: path.join(__dirname, 'test_desktop_view.png') });

  // 9. Console Error Summary
  console.log('9. Total Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console Errors:', consoleErrors);
  } else {
    console.log('✓ ZERO Console Errors detected!');
  }

  await browser.close();
  console.log('--- Comprehensive Automated Browser Tests Completed ---');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
