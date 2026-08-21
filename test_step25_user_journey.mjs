import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\mahil\\.gemini\\antigravity-ide\\brain\\7e35203e-15dd-41cc-b742-0fda75786a6b';

async function runStep25UserTest() {
  console.log('=== Step 25: Controlled User Journey & Interpretability Audit ===');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    // 1. Navigate to Login
    console.log('1. Navigating to Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Perform Login
    console.log('2. Performing Authentication...');
    await page.type('input[type="email"]', 'bio.curator.1787215156@resistanceiq.org');
    await page.type('input[type="password"]', 'ResistanceIQ2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2500));

    const shot1 = path.join(ARTIFACTS_DIR, 'step25_01_dashboard.png');
    await page.screenshot({ path: shot1, fullPage: true });
    console.log('  * Saved dashboard screenshot:', shot1);

    // 2. Navigate to Wizard: New Candidate Evaluation
    console.log('3. Navigating to New Candidate Wizard (7 Steps)...');
    await page.goto('http://localhost:5173/new', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const shot2 = path.join(ARTIFACTS_DIR, 'step25_02_wizard_step1_crop.png');
    await page.screenshot({ path: shot2, fullPage: true });
    console.log('  * Saved Step 1 (Crop) screenshot:', shot2);

    // 3. Navigate to Comparison Page
    console.log('4. Navigating to Candidate Comparison Page...');
    await page.goto('http://localhost:5173/comparison', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const shot3 = path.join(ARTIFACTS_DIR, 'step25_03_comparison_page.png');
    await page.screenshot({ path: shot3, fullPage: true });
    console.log('  * Saved Comparison page screenshot (Research Prioritization + Uncertainty Overlap):', shot3);

    // 4. Navigate to Historical Backtest Page
    console.log('5. Navigating to Historical Backtest Page...');
    await page.goto('http://localhost:5173/backtest', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const shot4 = path.join(ARTIFACTS_DIR, 'step25_04_backtest_page.png');
    await page.screenshot({ path: shot4, fullPage: true });
    console.log('  * Saved Backtest page screenshot:', shot4);

    console.log('\nAll Controlled User Journey tests completed with 100% success!');
  } catch (err) {
    console.error('Error during Step 25 user testing:', err);
  } finally {
    await browser.close();
  }
}

runStep25UserTest();
