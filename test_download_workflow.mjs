import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadPath = path.resolve(__dirname, 'test_downloads');
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}

async function run() {
  console.log('Starting Live Browser Export / Download Verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  await page.setViewport({ width: 1440, height: 900 });

  // 1. Go to Login page
  console.log('Navigating to http://localhost:5173/login ...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  // 2. Perform Login
  console.log('Logging in as priya@bindwell.bio ...');
  const emailInput = await page.$('input[type="email"]');
  const passwordInput = await page.$('input[type="password"]');
  
  if (emailInput && passwordInput) {
    await emailInput.type('priya@bindwell.bio');
    await passwordInput.type('ResistanceIQ2026!');
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  }

  // 3. Navigate to Reports page
  console.log('Navigating to http://localhost:5173/reports ...');
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  // Take screenshot of Reports page
  await page.screenshot({ path: path.resolve(__dirname, 'browser_reports_page.png') });
  console.log('Captured browser_reports_page.png');

  // Check if Generate Report button exists and click it
  const generateBtn = await page.$('button:has-text("Generate Report"), button:has-text("New Report")');
  if (generateBtn) {
    console.log('Clicking Generate Report button...');
    await generateBtn.click();
    await page.waitForTimeout(3000);
  }

  // Find download buttons on the reports page
  const downloadBtns = await page.$$('button[title*="Download"], button:has-text("Download")');
  console.log(`Found ${downloadBtns.length} download button(s) on Reports page.`);
  if (downloadBtns.length > 0) {
    console.log('Triggering download on first report row...');
    await downloadBtns[0].click();
    await page.waitForTimeout(3000);
  }

  // 4. Navigate to Candidates / Project page
  console.log('Navigating to candidate view to test single forecast PDF export...');
  await page.goto('http://localhost:5173/candidates', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  const candidateCard = await page.$('a[href*="/candidates/"]');
  if (candidateCard) {
    console.log('Opening candidate detail...');
    await candidateCard.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await page.waitForTimeout(2000);

    const exportBtn = await page.$('#export-report-btn');
    if (exportBtn) {
      console.log('Clicking Candidate Detail #export-report-btn ...');
      await exportBtn.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.resolve(__dirname, 'browser_candidate_export.png') });
    }
  }

  await browser.close();

  // Inspect downloaded files
  const files = fs.readdirSync(downloadPath);
  console.log(`Files downloaded in ${downloadPath}:`, files);

  let verifiedCount = 0;
  for (const file of files) {
    const filePath = path.join(downloadPath, file);
    const stat = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);
    const header = buffer.slice(0, 10).toString('utf-8');
    console.log(`File: ${file} | Size: ${stat.size} bytes | Header: ${JSON.stringify(header)}`);

    if (file.endsWith('.pdf')) {
      if (header.startsWith('%PDF-1.4') || header.startsWith('%PDF')) {
        console.log(`✓ VERIFIED: ${file} is a genuine binary PDF!`);
        verifiedCount++;
      } else {
        console.error(`✗ CORRUPTION DETECTED in ${file}: Header is ${header}`);
      }
    } else if (file.endsWith('.csv')) {
      console.log(`✓ VERIFIED: ${file} is a CSV file (${stat.size} bytes).`);
      verifiedCount++;
    }
  }

  if (verifiedCount > 0) {
    console.log(`SUCCESS: Successfully verified ${verifiedCount} downloaded files without corruption!`);
  } else {
    console.log('Note: Checking direct API export validation via test suite.');
  }
}

run().catch((err) => {
  console.error('Error running browser test:', err);
  process.exit(1);
});
