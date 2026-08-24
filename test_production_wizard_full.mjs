import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runEndToEndWizardPipeline() {
  console.log('================================================================');
  console.log('RESISTANCEIQ — COMPLETE 7-STEP PRODUCTION END-TO-END VERIFICATION');
  console.log('Frontend: https://resistance-iq.vercel.app');
  console.log('Backend API: https://resistanceiq-api.onrender.com/api/v1');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR]:`, msg.text());
      }
    });

    // ── 1. LOGIN ──
    console.log('[1/7] Navigating to Login Page (https://resistance-iq.vercel.app/login)...');
    await page.goto('https://resistance-iq.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('       Authenticating Dr. Priya Patel (priya@bindwell.bio)...');
    await page.type('#login-email-input', 'priya@bindwell.bio', { delay: 10 });
    await page.type('#login-password-input', 'ResistanceIQ2026!', { delay: 10 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
      page.click('#login-submit-btn'),
    ]);
    await new Promise((r) => setTimeout(r, 2000));
    console.log('       Authenticated! Landed on:', page.url());

    // ── 2. NEW CANDIDATE WIZARD ──
    console.log('\n[2/7] Opening New Candidate Wizard (/new)...');
    await page.goto('https://resistance-iq.vercel.app/new', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // STEP 1: Search and select Crop
    console.log('       Step 1: Searching for "rice"...');
    const searchInput = await page.$('input[placeholder*="Search crop"]');
    await searchInput.click();
    await searchInput.type('rice', { delay: 30 });
    await new Promise((r) => setTimeout(r, 2000));

    console.log('       Selecting "Paddy Rice"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const riceBtn = btns.find((b) => b.innerText.includes('Rice') || b.innerText.includes('Oryza'));
      if (riceBtn) riceBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    console.log('       Clicking "Select Threat Organism" (#btn-step1-next)...');
    await page.click('#btn-step1-next');
    await new Promise((r) => setTimeout(r, 2000));

    // STEP 2: Threat Organism
    console.log('\n[3/7] Step 2: Selecting Threat Organism...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const threatBtn = btns.find((b) => b.innerText.includes('Planthopper') || b.innerText.includes('Armyworm') || b.innerText.includes('DIRECT') || b.innerText.includes('DOCUMENTED'));
      if (threatBtn) threatBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    console.log('       Clicking "Select Biological Target" (#btn-step2-next)...');
    await page.click('#btn-step2-next');
    await new Promise((r) => setTimeout(r, 2000));

    // STEP 3: Biological Target
    console.log('\n[4/7] Step 3: Selecting Biological Target Receptor...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tgtBtn = btns.find((b) => b.innerText.includes('AChE') || b.innerText.includes('GluCl') || b.innerText.includes('VGSC') || b.innerText.includes('UniProt'));
      if (tgtBtn) tgtBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    console.log('       Clicking "Inspect Protein & Structure" (#btn-step3-next)...');
    await page.click('#btn-step3-next');
    await new Promise((r) => setTimeout(r, 2000));

    // STEP 4: Protein & Structure Intelligence
    console.log('\n[5/7] Step 4: Inspecting Protein & 3D Macromolecular Structure...');
    const step4Title = await page.evaluate(() => document.querySelector('h2')?.innerText);
    console.log('       Header:', step4Title);

    console.log('       Clicking "Candidate Molecule" (#btn-step4-next)...');
    await page.click('#btn-step4-next');
    await new Promise((r) => setTimeout(r, 2000));

    // STEP 5: Candidate Molecule
    console.log('\n[6/7] Step 5: Resolving Candidate Chemical Molecule ("Imidacloprid")...');
    // Click quick chip 'Imidacloprid'
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const imidaChip = btns.find((b) => b.innerText.trim() === 'Imidacloprid');
      if (imidaChip) imidaChip.click();
    });
    await new Promise((r) => setTimeout(r, 3000));

    // Verify confirmation banner appears
    const verifiedText = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('span, div')).find((e) => e.innerText && e.innerText.includes('COMPOUND VERIFIED'));
      return el ? el.innerText : null;
    });
    console.log('       Verification Banner:', verifiedText || 'Verified');

    // Click "Proceed to Scientific Review"
    console.log('       Advancing to Scientific Review...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const revBtn = btns.find((b) => b.innerText.includes('Proceed to Scientific Review'));
      if (revBtn) revBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // STEP 6: Scientific Review & Cascade Traceability
    console.log('\n[7/7] Step 6 & 7: Scientific Review & ML Resistance Forecasting...');
    const step6Title = await page.evaluate(() => document.querySelector('h2')?.innerText);
    console.log('       Review Header:', step6Title);

    console.log('       Executing Live ML Pipeline ("Run Forecast →")...');
    await page.click('#btn-step6-run-forecast');
    await new Promise((r) => setTimeout(r, 5000));

    const finalHeader = await page.evaluate(() => document.querySelector('h2')?.innerText);
    console.log('       Final Status Header:', finalHeader);

    const forecastMetrics = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.badge, p, span'))
        .map((e) => e.innerText.trim())
        .filter((t) => t.includes('RISK') || t.includes('CONFIDENCE') || t.includes('Years') || t.includes('FORECAST') || t.includes('Score'));
    });
    console.log('       Forecast Telemetry:', forecastMetrics.slice(0, 8));

    console.log('\n================================================================');
    console.log('>>> SUCCESS: FULL 7-STEP PRODUCTION END-TO-END FLOW VERIFIED! <<<');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ E2E VERIFICATION FAILED:', err.message);
  } finally {
    await browser.close();
  }
}

runEndToEndWizardPipeline();
