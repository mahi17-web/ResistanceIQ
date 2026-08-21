import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\mahil\\.gemini\\antigravity-ide\\brain\\41c18b7a-9d12-4790-9169-8580f0f71857';

const searchMailboxDirs = [
  path.resolve('./storage/dev_emails'),
  path.resolve('./resistanceiq/storage/dev_emails'),
];

function getLatestOtpForEmail(targetEmail) {
  const cleanTarget = targetEmail.toLowerCase().trim();

  for (const dir of searchMailboxDirs) {
    if (!fs.existsSync(dir)) continue;

    // Check .eml files
    const emlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.eml')).sort().reverse();
    for (const f of emlFiles) {
      try {
        const content = fs.readFileSync(path.join(dir, f), 'utf-8');
        if (content.toLowerCase().includes(cleanTarget)) {
          // Extract base64 or plaintext OTP
          const matchPlain = content.match(/\b(\d{6})\b/);
          if (matchPlain) return matchPlain[1];

          // If base64 encoded plain text part
          const b64Blocks = content.split('\n\n');
          for (const block of b64Blocks) {
            try {
              const decoded = Buffer.from(block.trim(), 'base64').toString('utf-8');
              const matchDecoded = decoded.match(/\b(\d{6})\b/);
              if (matchDecoded) return matchDecoded[1];
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Check .json files
    const jsonFiles = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse();
    for (const f of jsonFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        if (data.to_email && data.to_email.toLowerCase().trim() === cleanTarget) {
          return data.verification_code;
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

async function registerViaApi(email, password) {
  const res = await fetch('http://127.0.0.1:8000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Eleanor',
      last_name: 'Vance',
      email: email,
      organization_name: 'Bayer Crop Science',
      password: password,
      confirm_password: password,
    }),
  });
  if (!res.ok) {
    throw new Error(`API registration failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function runE2EForgotPassword() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    const timestamp = Date.now();
    const testEmail = `lead.researcher_${timestamp}@bayer-agri.bio`;
    const initialPassword = `InitialBayerPass2026!#`;
    const newPassword = `NewBayerIntelligencePass2026!#`;

    console.log('1. Registering initial account via API...');
    await registerViaApi(testEmail, initialPassword);
    console.log('✓ Account registered successfully.');

    console.log('2. Navigating to Login page and clicking Forgot Password...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#login-forgot-password-link', { timeout: 8000 });
    await page.click('#login-forgot-password-link');

    // Step 1: Email Entry
    await page.waitForSelector('#forgot-email-input', { timeout: 8000 });
    await page.screenshot({ path: path.join(artifactDir, 'forgot_password_step1_email.png') });
    console.log('✓ Captured Step 1: Email Entry');

    console.log('3. Submitting email for verification code...');
    await page.focus('#forgot-email-input');
    await page.type('#forgot-email-input', testEmail);
    await new Promise(r => setTimeout(r, 400));
    await page.click('#forgot-send-code-btn');

    // Step 2: Verification Code Entry
    await new Promise(r => setTimeout(r, 600));
    await page.waitForFunction(() => Boolean(document.querySelector('#otp-box-0')), { timeout: 8000 });
    console.log('✓ Reached Step 2: Verification Code Screen');

    // Retrieve OTP from secure test mailbox (.eml / .json artifact)
    await new Promise(r => setTimeout(r, 800));
    const otpCode = getLatestOtpForEmail(testEmail);
    console.log(`✓ Retrieved OTP from dev mailbox (.eml artifact): ${otpCode ? 'Found (' + otpCode + ')' : 'Not found'}`);
    if (!otpCode || otpCode.length !== 6) {
      throw new Error(`Failed to retrieve valid 6-digit OTP from dev mailbox for ${testEmail}`);
    }

    // Focus and press keyboard for each digit to trigger React controlled state
    for (let i = 0; i < 6; i++) {
      await page.focus(`#otp-box-${i}`);
      await page.keyboard.press(otpCode[i]);
      await new Promise(r => setTimeout(r, 120));
    }

    await page.screenshot({ path: path.join(artifactDir, 'forgot_password_step2_otp_entered.png') });
    console.log('✓ Captured Step 2: OTP Entered');

    console.log('4. Verifying security code...');
    await page.click('#verify-code-btn');
    await new Promise(r => setTimeout(r, 1000));

    // Step 3: New Password
    await page.waitForFunction(() => Boolean(document.querySelector('#new-password-input')), { timeout: 8000 });
    await page.type('#new-password-input', newPassword);
    await page.type('#confirm-new-password-input', newPassword);
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(artifactDir, 'forgot_password_step3_new_password.png') });
    console.log('✓ Captured Step 3: New Password Screen');

    console.log('5. Submitting new password...');
    await page.click('#reset-password-submit-btn');

    // Step 4: Success Confirmation
    await page.waitForSelector('#return-to-login-btn', { timeout: 8000 });
    await page.screenshot({ path: path.join(artifactDir, 'forgot_password_step4_success.png') });
    console.log('✓ Captured Step 4: Success Confirmation');

    console.log('6. Returning to Sign In and verifying old password rejection...');
    await page.click('#return-to-login-btn');
    await page.waitForSelector('#login-email-input', { timeout: 8000 });

    // Test Old Password Fails
    await page.type('#login-email-input', testEmail);
    await page.type('#login-password-input', initialPassword);
    await page.click('#login-submit-btn');
    await new Promise(r => setTimeout(r, 1200));
    const alertVisible = await page.$('div[role="alert"]');
    console.log('✓ Old password rejected:', Boolean(alertVisible));
    if (!alertVisible) {
      throw new Error('Old password was incorrectly accepted!');
    }

    // Test New Password Succeeds
    console.log('7. Logging in with NEW password...');
    await page.evaluate(() => {
      document.querySelector('#login-password-input').value = '';
    });
    await page.type('#login-password-input', newPassword);
    await page.click('#login-submit-btn');

    await page.waitForSelector('.main-area', { timeout: 10000 });
    await page.screenshot({ path: path.join(artifactDir, 'forgot_password_step5_dashboard_restored.png') });
    console.log('✓ Successfully logged in with NEW password and entered dashboard!');

    console.log('\n🎉 FORGOT PASSWORD END-TO-END VERIFICATION PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2EForgotPassword();
