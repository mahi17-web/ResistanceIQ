import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\mahil\\.gemini\\antigravity-ide\\brain\\41c18b7a-9d12-4790-9169-8580f0f71857';

const viewports = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900',  width: 1440, height: 900 },
  { name: '1280x800',  width: 1280, height: 800 },
  { name: '1024x768',  width: 1024, height: 768 },
  { name: '390x844',   width: 390,  height: 844 },
];

async function captureAll() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CAPTURE REGISTRATION VIEWPORTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Capturing Registration Page ---');
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(r => setTimeout(r, 600));

      const screenshotPath = path.join(artifactDir, `register_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Saved: register_${vp.name}.png`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. TEST REGISTRATION LIVE INTERACTIVITY (STRENGTH, CHECKLIST, TELEMETRY)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Testing Registration Interactive State ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.type('#reg-first-name', 'Dr. Eleanor', { delay: 10 });
    await page.type('#reg-last-name', 'Vance', { delay: 10 });
    await page.type('#reg-email', 'e.vance@blackmesa-agro.bio', { delay: 10 });
    await page.type('#reg-org', 'Black Mesa AgroSciences', { delay: 10 });
    await page.select('#reg-role', 'Lead Chemist');

    // Test intermediate password strength
    await page.type('#reg-password', 'Secret#2026', { delay: 10 });
    await page.type('#reg-confirm-password', 'Secret#2026', { delay: 10 });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
      path: path.join(artifactDir, 'register_filled_interactive.png'),
      fullPage: false,
    });
    console.log('Saved: register_filled_interactive.png');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CAPTURE LOGIN VIEWPORTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Capturing Login Page ---');
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(r => setTimeout(r, 600));

      const screenshotPath = path.join(artifactDir, `login_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Saved: login_${vp.name}.png`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. TEST LOGIN INTERACTION & ERROR ALERT UX
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Testing Login Error Banner ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('#login-email-input', 'invalid_scientist@test.bio', { delay: 10 });
    await page.type('#login-password-input', 'WrongPassword123!', { delay: 10 });
    await page.click('#login-submit-btn');
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(artifactDir, 'login_error_state.png'),
      fullPage: false,
    });
    console.log('Saved: login_error_state.png');

  } catch (err) {
    console.error('Puppeteer capture error:', err);
  } finally {
    await browser.close();
  }
}

captureAll();
