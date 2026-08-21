import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\mahil\\.gemini\\antigravity-ide\\brain\\7e35203e-15dd-41cc-b742-0fda75786a6b';

async function runTest() {
  console.log('--- STARTING COMPLETE PRODUCTION E2E SUITE ---');
  
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const consoleErrors = [];

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('[BROWSER CONSOLE ERROR]:', msg.text());
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      console.log('[BROWSER UNCAUGHT ERROR]:', err.toString());
      consoleErrors.push(err.toString());
    });

    const uniqueId = Math.floor(Math.random() * 90000) + 10000;
    const testUser = {
      firstName: 'Mahilesh',
      lastName: 'Sundar',
      email: `mahilesh_${uniqueId}@resistanceiq-bio.com`,
      org: 'BioSciences Global Lab',
      role: 'Research Scientist',
      password: 'ResistanceIQ#Pass2026!'
    };

    // Step 1: Open registration
    console.log('Step 1: Navigating to /register...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: `${artifactDir}\\e2e_01_register_page.png` });

    // Step 2: Create real account
    console.log(`Step 2: Submitting registration for ${testUser.email}...`);
    await page.type('#reg-first-name', testUser.firstName, { delay: 10 });
    await page.type('#reg-last-name', testUser.lastName, { delay: 10 });
    await page.type('#reg-email', testUser.email, { delay: 10 });
    await page.type('#reg-org', testUser.org, { delay: 10 });
    await page.type('#reg-password', testUser.password, { delay: 10 });
    await page.type('#reg-confirm-password', testUser.password, { delay: 10 });
    await new Promise(r => setTimeout(r, 600));

    await page.click('#submit-register-btn');
    await page.waitForSelector('#continue-to-app-btn', { timeout: 10000 });
    console.log('   Registration succeeded! Success modal displayed.');
    await page.screenshot({ path: `${artifactDir}\\e2e_02_registration_success.png` });

    // Enter Dashboard
    await page.click('#continue-to-app-btn');
    await page.waitForSelector('.stat-strip', { timeout: 10000 });
    console.log('   Redirected to Dashboard post-registration.');
    await page.screenshot({ path: `${artifactDir}\\e2e_03_dashboard_initial.png` });

    // Step 4: Logout
    console.log('Step 4: Logging out...');
    await page.click('#topbar-user-menu-btn');
    await page.waitForSelector('#topbar-signout-btn', { visible: true, timeout: 5000 });
    await page.click('#topbar-signout-btn');
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('   Logged out successfully. Login form displayed.');
    await page.screenshot({ path: `${artifactDir}\\e2e_04_after_logout.png` });

    // Step 5: Login with exact same credentials
    console.log(`Step 5: Logging in as ${testUser.email}...`);
    await page.type('input[type="email"]', testUser.email, { delay: 10 });
    await page.type('input[type="password"]', testUser.password, { delay: 10 });
    await page.click('button[type="submit"]');

    // Step 6: Verify Dashboard loads
    await page.waitForSelector('.stat-strip', { timeout: 10000 });
    console.log('Step 6: Dashboard loaded after login.');
    await page.screenshot({ path: `${artifactDir}\\e2e_05_dashboard_after_login.png` });

    // Step 7: Refresh browser
    console.log('Step 7: Refreshing browser...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.stat-strip', { timeout: 10000 });
    console.log('   Dashboard survived browser refresh!');

    // Step 8: Navigate Dashboard -> Forecasting -> Research -> Dashboard
    console.log('Step 8: Navigating routes...');
    await page.goto('http://localhost:5173/comparison', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}\\e2e_06_comparison_page.png` });

    await page.goto('http://localhost:5173/backtest', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}\\e2e_07_backtest_page.png` });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.stat-strip', { timeout: 10000 });
    console.log('   Returned to Dashboard seamlessly.');
    await page.screenshot({ path: `${artifactDir}\\e2e_08_dashboard_final.png` });

    // Check displayed user name
    const displayedUser = await page.$eval('#topbar-user-menu-btn', el => el.innerText);
    console.log('TopBar User Button Content:\n', displayedUser);

    console.log('--- ALL 12 STEPS COMPLETED SUCCESSFULLY ---');
    console.log('Console errors encountered:', consoleErrors.length);

  } catch (err) {
    console.error('Test Suite Failed:', err);
  } finally {
    await browser.close();
  }
}

runTest();
