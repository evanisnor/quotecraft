const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const CALCULATOR_ID = 'ff30b9ed-46f7-4782-a2f3-ca65feebab08';
const EMAIL = 'e2etest@quotecraft.test';
const PASSWORD = 'securepassword';

const results = [];

function pass(name, detail = '') {
  console.log(`[PASS] ${name}${detail ? ': ' + detail : ''}`);
  results.push({ name, status: 'PASS', detail });
}

function fail(name, detail = '') {
  console.error(`[FAIL] ${name}${detail ? ': ' + detail : ''}`);
  results.push({ name, status: 'FAIL', detail });
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Capture console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // --- Step 1: Log in ---
    console.log('--- Logging in ---');
    await page.goto(`${TARGET_URL}/login`);
    await page.waitForSelector('input[aria-label="Email"]', { timeout: 10000 });
    await page.fill('input[aria-label="Email"]', EMAIL);
    await page.fill('input[aria-label="Password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    pass('Login and redirect to dashboard');

    // --- Step 2: Navigate to editor ---
    console.log('--- Navigating to editor ---');
    await page.goto(`${TARGET_URL}/editor/${CALCULATOR_ID}`);
    await page.waitForSelector('h1:has-text("Calculator Editor")', { timeout: 10000 });
    pass('Editor page loaded');

    await page.screenshot({ path: '/tmp/bldr-us3-a003-01-editor-initial.png' });

    // --- Step 3: Verify single-page mode is default (no progress bar) ---
    console.log('--- Checking single-page mode (no progress bar expected) ---');
    const progressBarInitial = await page.locator('[role="progressbar"]').count();
    if (progressBarInitial === 0) {
      pass('No progress bar in single-page mode (correct)');
    } else {
      fail('Progress bar visible in single-page mode (should not be)');
    }

    // --- Step 4: Switch to multi-step mode ---
    console.log('--- Switching to multi-step mode ---');
    await page.click('input[value="multi-step"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/bldr-us3-a003-02-multistep-empty.png' });

    // Verify progress bar appears
    const progressBarAfterToggle = await page.locator('[role="progressbar"]').count();
    if (progressBarAfterToggle > 0) {
      pass('Progress bar appears after switching to multi-step mode');
    } else {
      fail('Progress bar not found after switching to multi-step mode');
    }

    // Check "Step 1 of 1" label
    const stepLabel1of1 = await page.locator('text=Step 1 of 1').count();
    if (stepLabel1of1 > 0) {
      pass('Progress bar shows "Step 1 of 1" after enabling multi-step mode');
    } else {
      const stepText = await page.locator('[role="progressbar"]').evaluate((el) => el.closest('div')?.textContent ?? '');
      fail(`Progress bar does not show "Step 1 of 1". Found: "${stepText}"`);
    }

    // Verify Back and Next buttons appear
    const backBtn1 = page.locator('button[aria-label="Previous step"]');
    const nextBtn1 = page.locator('button[aria-label="Next step"]');
    const backVisible1 = await backBtn1.count() > 0;
    const nextVisible1 = await nextBtn1.count() > 0;
    if (backVisible1 && nextVisible1) {
      pass('Back and Next buttons visible in multi-step mode');
    } else {
      fail(`Navigation buttons missing. Back: ${backVisible1}, Next: ${nextVisible1}`);
    }

    // Both should be disabled with 1 step
    const backDisabled1 = await backBtn1.isDisabled();
    const nextDisabled1 = await nextBtn1.isDisabled();
    if (backDisabled1 && nextDisabled1) {
      pass('Both Back and Next are disabled with only 1 step');
    } else {
      fail(`With 1 step: Back disabled=${backDisabled1}, Next disabled=${nextDisabled1} (both should be disabled)`);
    }

    // --- Step 5: Add a second step ---
    console.log('--- Adding a second step ---');
    await page.click('button:has-text("Add step")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/bldr-us3-a003-03-two-steps.png' });

    // Progress bar should now show "Step 1 of 2"
    const stepLabel1of2 = await page.locator('text=Step 1 of 2').count();
    if (stepLabel1of2 > 0) {
      pass('Progress bar shows "Step 1 of 2" after adding second step');
    } else {
      const bodyText = await page.locator('body').innerText();
      const match = bodyText.match(/Step \d+ of \d+/);
      fail(`Progress bar does not show "Step 1 of 2". Found: "${match ? match[0] : 'not found'}"`);
    }

    // Back should be disabled (on step 1), Next should be enabled (there's a step 2)
    const backDisabled2 = await backBtn1.isDisabled();
    const nextDisabled2 = await nextBtn1.isDisabled();
    if (backDisabled2 && !nextDisabled2) {
      pass('With 2 steps on step 1: Back is disabled, Next is enabled');
    } else {
      fail(`With 2 steps on step 1: Back disabled=${backDisabled2} (expected true), Next disabled=${nextDisabled2} (expected false)`);
    }

    // --- Step 6: Click Next and verify step 2 ---
    console.log('--- Clicking Next to go to step 2 ---');
    await nextBtn1.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/bldr-us3-a003-04-step2.png' });

    // Progress bar should show "Step 2 of 2"
    const stepLabel2of2 = await page.locator('text=Step 2 of 2').count();
    if (stepLabel2of2 > 0) {
      pass('Progress bar shows "Step 2 of 2" after clicking Next');
    } else {
      const bodyText = await page.locator('body').innerText();
      const match = bodyText.match(/Step \d+ of \d+/);
      fail(`Progress bar does not show "Step 2 of 2". Found: "${match ? match[0] : 'not found'}"`);
    }

    // Back should be enabled (can go back), Next should be disabled (on last step)
    const backDisabled3 = await backBtn1.isDisabled();
    const nextDisabled3 = await nextBtn1.isDisabled();
    if (!backDisabled3 && nextDisabled3) {
      pass('On step 2 of 2: Back is enabled, Next is disabled');
    } else {
      fail(`On step 2 of 2: Back disabled=${backDisabled3} (expected false), Next disabled=${nextDisabled3} (expected true)`);
    }

    // --- Step 7: Verify no console errors ---
    if (consoleErrors.length === 0) {
      pass('No console errors during the test flow');
    } else {
      fail(`Console errors detected: ${consoleErrors.join('; ')}`);
    }

  } catch (err) {
    fail('Unexpected error during test', err.message);
    await page.screenshot({ path: '/tmp/bldr-us3-a003-error.png' });
    console.error('Stack:', err.stack);
  } finally {
    await browser.close();

    // --- Summary ---
    console.log('\n======= TEST SUMMARY =======');
    const passed = results.filter((r) => r.status === 'PASS');
    const failed = results.filter((r) => r.status === 'FAIL');
    results.forEach((r) => {
      const icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
      console.log(`[${icon}] ${r.name}${r.detail ? ': ' + r.detail : ''}`);
    });
    console.log(`\nTotal: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log('\nFailed tests:');
      failed.forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
      process.exit(1);
    } else {
      console.log('\nAll tests passed.');
      process.exit(0);
    }
  }
})();
