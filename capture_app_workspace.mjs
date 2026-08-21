import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\mahil\\.gemini\\antigravity-ide\\brain\\ab8512e2-1262-417e-8705-d1f0636a1dcd';
const baseUrl = 'http://localhost:5173/register';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Initial State
    await page.screenshot({ path: `${artifactDir}\\app_workspace_initial_1920.png` });
    console.log('Saved app_workspace_initial_1920.png');

    // 2. Fill Form
    await page.type('#reg-first-name', 'Priya', { delay: 25 });
    await page.type('#reg-last-name', 'Mehta', { delay: 25 });
    await page.type('#reg-email', 'p.mehta@bindwellbio.com', { delay: 20 });
    await page.type('#reg-org', 'Bindwell BioSciences Inc.', { delay: 20 });
    await page.select('#reg-role', 'Computational Biologist');

    const pass = 'BioInformatics#2026';
    await page.type('#reg-password', pass, { delay: 20 });
    await page.type('#reg-confirm-password', pass, { delay: 20 });
    await new Promise(r => setTimeout(r, 800));

    // 2. Filled View
    await page.screenshot({ path: `${artifactDir}\\app_workspace_filled_1920.png` });
    console.log('Saved app_workspace_filled_1920.png');

    // 3. Laptop Viewport (1280x800)
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}\\app_workspace_laptop_1280.png` });
    console.log('Saved app_workspace_laptop_1280.png');

    // 4. Tablet Viewport (1024x900)
    await page.setViewport({ width: 1024, height: 900 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}\\app_workspace_tablet_1024.png` });
    console.log('Saved app_workspace_tablet_1024.png');

    // 5. Mobile Viewport (390x844)
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}\\app_workspace_mobile_390.png` });
    console.log('Saved app_workspace_mobile_390.png');

  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    await browser.close();
  }
}

run();
