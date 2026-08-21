import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\mahil\\.gemini\\antigravity-ide\\brain\\7e35203e-15dd-41cc-b742-0fda75786a6b';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Initial State (1920x1080)
    await page.screenshot({ path: `${artifactDir}\\rebuild_initial_1920x1080.png` });
    console.log('Saved rebuild_initial_1920x1080.png');

    // 2. Fill form to test live validation, strength meter, checklist, and telemetry
    await page.type('#reg-first-name', 'Eleanor', { delay: 15 });
    await page.type('#reg-last-name', 'Vance', { delay: 15 });
    await page.type('#reg-email', 'e.vance@blackmesa-bio.com', { delay: 15 });
    await page.type('#reg-org', 'Black Mesa AgroSciences', { delay: 15 });
    await page.select('#reg-role', 'Computational Biologist');

    const pass = 'BioInformatics#2026';
    await page.type('#reg-password', pass, { delay: 15 });
    await page.type('#reg-confirm-password', pass, { delay: 15 });
    await new Promise(r => setTimeout(r, 800));

    // Viewports check (Item 22)
    // 1920x1080
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}\\rebuild_filled_1920x1080.png` });
    console.log('Saved rebuild_filled_1920x1080.png');

    // 1440x900
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}\\rebuild_filled_1440x900.png` });
    console.log('Saved rebuild_filled_1440x900.png');

    // 1280x800
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}\\rebuild_filled_1280x800.png` });
    console.log('Saved rebuild_filled_1280x800.png');

    // 1024x768
    await page.setViewport({ width: 1024, height: 768 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}\\rebuild_filled_1024x768.png` });
    console.log('Saved rebuild_filled_1024x768.png');

    // 390x844 (Mobile)
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}\\rebuild_filled_390x844.png` });
    console.log('Saved rebuild_filled_390x844.png');

  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    await browser.close();
  }
}

run();
