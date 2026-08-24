import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testProduction() {
  console.log('=== STARTING PRODUCTION BROWSER TEST ===');
  console.log('Target: https://resistance-iq.vercel.app');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
    });

    page.on('pageerror', (err) => {
      console.error('[BROWSER UNCAUGHT ERROR]:', err.message);
    });

    page.on('request', (req) => {
      if (req.url().includes('/api/') || req.url().includes('onrender.com')) {
        console.log(`[NETWORK REQUEST]: ${req.method()} ${req.url()}`);
      }
    });

    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('/api/') || url.includes('onrender.com')) {
        console.log(`[NETWORK RESPONSE]: ${res.status()} ${url}`);
        try {
          const text = await res.text();
          console.log(`[RESPONSE BODY (${url})]:`, text.slice(0, 300));
        } catch (e) {
          console.log(`[RESPONSE BODY READ ERROR]:`, e.message);
        }
      }
    });

    console.log('\n--- STEP 1: GO TO LOGIN ---');
    await page.goto('https://resistance-iq.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('\n--- STEP 2: FILL LOGIN CREDENTIALS ---');
    await page.type('#login-email-input', 'priya@bindwell.bio', { delay: 20 });
    await page.type('#login-password-input', 'ResistanceIQ2026!', { delay: 20 });

    console.log('Submitting login form...');
    await page.click('button[type="submit"]');

    await new Promise((r) => setTimeout(r, 4000));

    const currentUrl = page.url();
    console.log('After login URL:', currentUrl);

    const storage = await page.evaluate(() => {
      return {
        riq_auth_token: localStorage.getItem('riq_auth_token') ? 'PRESENT' : 'MISSING',
        riq_token: localStorage.getItem('riq_token') ? 'PRESENT' : 'MISSING',
        riq_user: localStorage.getItem('riq_user') ? 'PRESENT' : 'MISSING',
        allKeys: Object.keys(localStorage),
      };
    });
    console.log('LocalStorage state:', storage);

    console.log('\n--- STEP 3: NAVIGATE TO NEW CANDIDATE ---');
    await page.goto('https://resistance-iq.vercel.app/new-candidate', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Wizard URL:', page.url());

    await new Promise((r) => setTimeout(r, 2000));

    const htmlSummary = await page.evaluate(() => {
      return {
        h1: document.querySelector('h1')?.innerText,
        h2: document.querySelector('h2')?.innerText,
        inputs: Array.from(document.querySelectorAll('input')).map((i) => i.placeholder || i.name || i.type),
        buttons: Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter((t) => t.length > 0).slice(0, 15),
      };
    });
    console.log('Page Elements:', htmlSummary);

    // 4. Type "rice" into the crop search bar
    console.log('\n--- STEP 4: TYPE "rice" INTO CROP SEARCH ---');
    const searchInput = await page.$('input[placeholder*="Search crop"]');
    if (searchInput) {
      console.log('Found crop search input! Typing "rice"...');
      await searchInput.click();
      await searchInput.type('rice', { delay: 50 });
      await new Promise((r) => setTimeout(r, 3000));

      const crops = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter((t) => t.length > 0);
      });
      console.log('All buttons/cards after typing "rice":', crops);

      const nextBtnDisabled = await page.$eval('#btn-step1-next', (b) => b.disabled).catch(() => 'NOT_FOUND');
      console.log('#btn-step1-next disabled state:', nextBtnDisabled);
    } else {
      console.error('Crop search input NOT found on current page!');
    }

    console.log('\n=== PRODUCTION BROWSER TEST COMPLETE ===');
  } catch (err) {
    console.error('Error during production browser test:', err);
  } finally {
    await browser.close();
  }
}

testProduction();
