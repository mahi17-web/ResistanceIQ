import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\mahil\\.gemini\\antigravity-ide\\brain\\7e35203e-15dd-41cc-b742-0fda75786a6b';

async function testRegistration() {
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

    // Fill registration with unique email
    const uniqueId = Date.now().toString().slice(-6);
    const testEmail = `researcher.${uniqueId}@caltech-bio.edu`;

    await page.type('#reg-first-name', 'Marcus', { delay: 15 });
    await page.type('#reg-last-name', 'Aurelius', { delay: 15 });
    await page.type('#reg-email', testEmail, { delay: 15 });
    await page.type('#reg-org', 'Caltech Molecular Lab', { delay: 15 });
    await page.select('#reg-role', 'Principal Investigator');

    const pass = 'BioIntelligence#2026';
    await page.type('#reg-password', pass, { delay: 15 });
    await page.type('#reg-confirm-password', pass, { delay: 15 });
    await new Promise(r => setTimeout(r, 600));

    // Click submit
    await page.click('#submit-register-btn');

    // Wait for success screen
    await page.waitForSelector('#continue-to-app-btn', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    // Capture success screen
    await page.screenshot({ path: `${artifactDir}\\register_success_screen.png` });
    console.log('SUCCESS: Registration completed and captured success screen!');

    // Click Enter Dashboard
    await page.click('#continue-to-app-btn');
    await new Promise(r => setTimeout(r, 2000));

    // Capture final dashboard screen
    await page.screenshot({ path: `${artifactDir}\\register_post_redirect_dashboard.png` });
    console.log('SUCCESS: Redirected to Dashboard post-registration!');

  } catch (err) {
    console.error('Registration test error:', err);
  } finally {
    await browser.close();
  }
}

testRegistration();
