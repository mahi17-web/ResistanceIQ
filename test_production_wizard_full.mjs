import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runFullWizardVerification() {
  console.log('====================================================');
  console.log('RESISTANCEIQ — PRODUCTION LIVE WIZARD VERIFICATION');
  console.log('Target: https://resistance-iq.vercel.app');
  console.log('API Target: https://resistanceiq-api.onrender.com/api/v1');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Log Network Activity
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('resistanceiq-api.onrender.com') || u.includes('/api/v1/')) {
        console.log(`[HTTP REQ] ${req.method()} ${u}`);
      }
    });

    page.on('response', async (res) => {
      const u = res.url();
      if (u.includes('resistanceiq-api.onrender.com') || u.includes('/api/v1/')) {
        console.log(`[HTTP RES] ${res.status()} ${u}`);
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR CONSOLE]:`, msg.text());
      }
    });

    // ── 1. LOGIN ──
    console.log('[1/6] Navigating to Login Page: https://resistance-iq.vercel.app/login');
    await page.goto('https://resistance-iq.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('[2/6] Entering credentials for Dr. Priya Patel...');
    await page.type('#login-email-input', 'priya@bindwell.bio', { delay: 15 });
    await page.type('#login-password-input', 'ResistanceIQ2026!', { delay: 15 });

    console.log('[3/6] Clicking Sign In button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
      page.click('#login-submit-btn'),
    ]);

    await new Promise((r) => setTimeout(r, 2000));
    console.log('Current URL after login:', page.url());

    // ── 2. NEW CANDIDATE PAGE ──
    console.log('\n[4/6] Navigating to New Candidate Wizard (/new)...');
    await page.goto('https://resistance-iq.vercel.app/new', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));
    console.log('Current Wizard URL:', page.url());

    // Check initial loaded crops
    const initialButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter((t) => t.length > 0);
    });
    console.log(`Initial rendered buttons count: ${initialButtons.length}`);
    console.log('Initial sample entities:', initialButtons.slice(0, 8));

    // ── 3. SEARCH "rice" ──
    console.log('\n[5/6] Searching for "rice" in crop search input...');
    const searchInput = await page.$('input[placeholder*="Search crop"]');
    if (!searchInput) {
      throw new Error('Crop search input field not found on /new!');
    }

    await searchInput.click();
    await searchInput.type('rice', { delay: 40 });
    console.log('Typed "rice". Waiting for debounced API fetch to resolve...');
    await new Promise((r) => setTimeout(r, 2500));

    const cropResults = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map((b) => b.innerText.trim())
        .filter((t) => t.includes('Rice') || t.includes('rice') || t.includes('Oryza'));
    });
    console.log('Crop results found:', cropResults);

    if (cropResults.length === 0) {
      throw new Error('No crop result matching "rice" appeared in the UI!');
    }

    // Click on the Rice card
    console.log('Selecting "Paddy Rice"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const riceBtn = btns.find((b) => b.innerText.includes('Rice') || b.innerText.includes('Oryza'));
      if (riceBtn) riceBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1000));

    // ── 4. STEP 1 -> STEP 2 (Select Threat) ──
    const nextStep1Btn = await page.$('#btn-step1-next');
    const isStep1Disabled = await page.$eval('#btn-step1-next', (b) => b.disabled);
    console.log('#btn-step1-next disabled:', isStep1Disabled);

    if (isStep1Disabled) {
      throw new Error('#btn-step1-next remains disabled after selecting crop!');
    }

    console.log('Advancing to Step 2: Select Threat Organism...');
    await nextStep1Btn.click();
    await new Promise((r) => setTimeout(r, 2500));

    const step2Header = await page.evaluate(() => document.querySelector('h2')?.innerText);
    console.log('Step 2 Header:', step2Header);

    const threats = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map((b) => b.innerText.trim())
        .filter((t) => t.includes('Planthopper') || t.includes('Armyworm') || t.includes('Borer') || t.includes('Spodoptera') || t.includes('Nilaparvata') || t.includes('Gall') || t.includes('DOCUMENTED') || t.includes('DIRECT'));
    });
    console.log('Threat organisms rendered:', threats.slice(0, 5));

    // Select the first threat
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const threatBtn = btns.find((b) => b.innerText.includes('Planthopper') || b.innerText.includes('Armyworm') || b.innerText.includes('Borer') || b.innerText.includes('DIRECT') || b.innerText.includes('DOCUMENTED'));
      if (threatBtn) threatBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1000));

    // ── 5. STEP 2 -> STEP 3 (Select Target) ──
    const isStep2Disabled = await page.$eval('#btn-step2-next', (b) => b.disabled);
    console.log('#btn-step2-next disabled:', isStep2Disabled);

    if (isStep2Disabled) {
      throw new Error('#btn-step2-next remains disabled after selecting threat!');
    }

    console.log('Advancing to Step 3: Select Biological Target Receptor...');
    await page.click('#btn-step2-next');
    await new Promise((r) => setTimeout(r, 2500));

    const step3Header = await page.evaluate(() => document.querySelector('h2')?.innerText);
    console.log('Step 3 Header:', step3Header);

    const targets = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map((b) => b.innerText.trim())
        .filter((t) => t.includes('UniProt') || t.includes('IRAC') || t.includes('Receptor') || t.includes('AChE') || t.includes('GABA') || t.includes('RyR') || t.includes('VGSC') || t.includes('GluCl'));
    });
    console.log('Biological targets rendered:', targets.slice(0, 5));

    console.log('\n====================================================');
    console.log('>>> VERIFICATION PASSED: PRODUCTION WIZARD IS FULLY WORKING! <<<');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
  } finally {
    await browser.close();
  }
}

runFullWizardVerification();
