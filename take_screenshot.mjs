import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputPath = process.argv[2] || 'C:\\Users\\mahil\\.gemini\antigravity-ide\\brain\\36ddb5ba-d675-4f4d-8fa3-a6eca068e724\\dashboard_baseline.png';
const url = process.argv[3] || 'http://localhost:5173/';
const width = parseInt(process.argv[4], 10) || 1920;
const height = parseInt(process.argv[5], 10) || 1080;

const scrollY = parseInt(process.argv[6], 10) || 0;

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${width},${height}`],
    defaultViewport: { width, height }
  });

  try {
    const page = await browser.newPage();
    
    if (url.includes('auth=true') || url === 'http://localhost:5173/') {
      // First log in
      await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.type('#login-email-input', 'priya@bindwell.bio', { delay: 10 });
      await page.type('#login-password-input', 'ResistanceIQ2026!', { delay: 10 });
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 2000));
    } else {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));
    }
    if (scrollY > 0) {
      await page.evaluate((y) => {
        const main = document.querySelector('main') || window;
        main.scrollTo(0, y);
      }, scrollY);
      await new Promise(r => setTimeout(r, 500));
    }
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Screenshot saved to ${outputPath} (${width}x${height}, scrollY: ${scrollY})`);
  } catch (err) {
    console.error('Error taking screenshot:', err);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
