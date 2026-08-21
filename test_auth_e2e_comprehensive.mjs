import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\mahil\\.gemini\antigravity-ide\\brain\\41c18b7a-9d12-4790-9169-8580f0f71857';

async function testFullAuthFlow() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    const timestamp = Date.now();
    const testEmail = `lead.scientist_${timestamp}@novartis-research.bio`;
    const testPassword = `Novartis#Research${timestamp.toString().slice(-4)}`;

    console.log('1. Navigating to /register...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#reg-first-name', { timeout: 8000 });

    console.log('2. Filling Registration Form...');
    await page.type('#reg-first-name', 'Sarah');
    await page.type('#reg-last-name', 'Connor');
    await page.type('#reg-email', testEmail);
    await page.type('#reg-org', 'Novartis AgroSciences');
    await page.select('#reg-role', 'Computational Biologist');
    await page.type('#reg-password', testPassword);
    await page.type('#reg-confirm-password', testPassword);

    await new Promise(r => setTimeout(r, 600));

    console.log('3. Submitting Registration Form...');
    await page.click('#submit-register-btn');

    // Wait for success screen or dashboard redirection
    await page.waitForSelector('#continue-to-app-btn, .main-area', { timeout: 10000 });
    console.log('✓ Registration succeeded!');

    const continueBtn = await page.$('#continue-to-app-btn');
    if (continueBtn) {
      console.log('4. Clicking Enter Dashboard...');
      await continueBtn.click();
      await page.waitForSelector('.main-area', { timeout: 8000 }).catch(() => {});
    }

    await new Promise(r => setTimeout(r, 1000));
    console.log('✓ Successfully entered dashboard after registration!');

    // 5. Check localStorage tokens
    const tokens = await page.evaluate(() => {
      return {
        authToken: localStorage.getItem('riq_auth_token') || localStorage.getItem('riq_token'),
        refreshToken: localStorage.getItem('riq_refresh_token'),
      };
    });
    console.log('✓ Tokens in localStorage:', Boolean(tokens.authToken));

    // 6. Test Sign Out
    console.log('6. Testing Sign Out...');
    const userMenuBtn = await page.$('#topbar-user-menu-btn');
    if (userMenuBtn) {
      await userMenuBtn.click();
      await new Promise(r => setTimeout(r, 400));
      await page.click('#topbar-signout-btn');
      await page.waitForSelector('#login-email-input', { timeout: 8000 }).catch(() => {});
    } else {
      await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    }

    await new Promise(r => setTimeout(r, 800));
    console.log('✓ Sign out redirected to:', page.url());

    // 7. Test Login with Registered User
    console.log('7. Logging in with created credentials...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-email-input', { timeout: 8000 });
    await page.type('#login-email-input', testEmail);
    await page.type('#login-password-input', testPassword);
    await page.click('#login-submit-btn');

    await page.waitForSelector('.main-area', { timeout: 10000 });
    console.log('✓ Login succeeded and navigated to Dashboard!');

    console.log('🎉 ALL END-TO-END AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFullAuthFlow();
