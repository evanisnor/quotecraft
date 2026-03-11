const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const CALCULATOR_ID = 'ff30b9ed-46f7-4782-a2f3-ca65feebab08';
const EMAIL = 'e2etest@quotecraft.test';
const PASSWORD = 'securepassword';
const SCREENSHOTS_DIR = '/Users/evan/Code/github.com/evanisnor/quotecraft/e2e/screenshots';

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
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

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

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us1-a001-01-editor.png` });

    // =====================================================================
    // AC1: The "Theme Colors" section is visible in the editor
    // =====================================================================
    console.log('--- AC1: Checking for Theme Colors section ---');
    const themeColorsSection = page.locator('section[aria-label="Theme Colors"]');
    const sectionCount = await themeColorsSection.count();
    if (sectionCount > 0) {
      pass('AC1: "Theme Colors" section is visible in the editor');
    } else {
      fail('AC1: "Theme Colors" section is visible in the editor', 'section[aria-label="Theme Colors"] not found');
    }

    // =====================================================================
    // AC2: All four color pickers are present and labeled correctly
    // =====================================================================
    console.log('--- AC2: Checking for all four color pickers ---');

    const primaryLabel = page.locator('label[for="color-primary"]');
    const primaryInput = page.locator('input#color-primary[type="color"]');
    const secondaryLabel = page.locator('label[for="color-secondary"]');
    const secondaryInput = page.locator('input#color-secondary[type="color"]');
    const backgroundLabel = page.locator('label[for="color-background"]');
    const backgroundInput = page.locator('input#color-background[type="color"]');
    const textLabel = page.locator('label[for="color-text"]');
    const textInput = page.locator('input#color-text[type="color"]');

    const primaryLabelText = await primaryLabel.count() > 0 ? await primaryLabel.textContent() : null;
    const secondaryLabelText = await secondaryLabel.count() > 0 ? await secondaryLabel.textContent() : null;
    const backgroundLabelText = await backgroundLabel.count() > 0 ? await backgroundLabel.textContent() : null;
    const textLabelText = await textLabel.count() > 0 ? await textLabel.textContent() : null;

    const primaryInputCount = await primaryInput.count();
    const secondaryInputCount = await secondaryInput.count();
    const backgroundInputCount = await backgroundInput.count();
    const textInputCount = await textInput.count();

    if (primaryLabelText === 'Primary Color' && primaryInputCount > 0) {
      pass('AC2: Primary Color picker present with correct label');
    } else {
      fail('AC2: Primary Color picker present with correct label',
        `Label: "${primaryLabelText}", Input count: ${primaryInputCount}`);
    }

    if (secondaryLabelText === 'Secondary Color' && secondaryInputCount > 0) {
      pass('AC2: Secondary Color picker present with correct label');
    } else {
      fail('AC2: Secondary Color picker present with correct label',
        `Label: "${secondaryLabelText}", Input count: ${secondaryInputCount}`);
    }

    if (backgroundLabelText === 'Background Color' && backgroundInputCount > 0) {
      pass('AC2: Background Color picker present with correct label');
    } else {
      fail('AC2: Background Color picker present with correct label',
        `Label: "${backgroundLabelText}", Input count: ${backgroundInputCount}`);
    }

    if (textLabelText === 'Text Color' && textInputCount > 0) {
      pass('AC2: Text Color picker present with correct label');
    } else {
      fail('AC2: Text Color picker present with correct label',
        `Label: "${textLabelText}", Input count: ${textInputCount}`);
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us1-a001-02-color-pickers.png` });

    // =====================================================================
    // AC3: Interacting with a color picker updates the visible value
    // =====================================================================
    console.log('--- AC3: Verifying color inputs respond to programmatic value changes ---');

    // Read the current value of the primary color input
    const initialPrimaryValue = await primaryInput.inputValue();
    console.log(`Initial primary color value: ${initialPrimaryValue}`);

    // Use JavaScript to set a new value and dispatch an input/change event
    // Native color pickers open an OS dialog that Playwright cannot control directly,
    // but we can verify the input reflects its initial value and responds to programmatic changes.
    const newColor = initialPrimaryValue === '#ff0000' ? '#00ff00' : '#ff0000';
    await primaryInput.evaluate((el, color) => {
      el.value = color;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, newColor);

    await page.waitForTimeout(300);

    const updatedPrimaryValue = await primaryInput.inputValue();
    console.log(`Updated primary color value: ${updatedPrimaryValue}`);

    if (updatedPrimaryValue === newColor) {
      pass('AC3: Primary color picker value updates after programmatic change');
    } else {
      fail('AC3: Primary color picker value updates after programmatic change',
        `Expected "${newColor}", got "${updatedPrimaryValue}"`);
    }

    // Verify the input type is "color" — confirming all four inputs are color controls
    const allColorInputs = page.locator('section[aria-label="Theme Colors"] input[type="color"]');
    const allColorInputCount = await allColorInputs.count();
    if (allColorInputCount === 4) {
      pass('AC3: All four inputs are of type "color" (color picker controls)');
    } else {
      fail('AC3: All four inputs are of type "color" (color picker controls)',
        `Expected 4 color inputs, found ${allColorInputCount}`);
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us1-a001-03-after-change.png` });

    // --- Check for console errors ---
    if (consoleErrors.length === 0) {
      pass('No console errors during the test flow');
    } else {
      fail('No console errors during the test flow', consoleErrors.join('; '));
    }

  } catch (err) {
    fail('Unexpected error during test', err.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us1-a001-error.png` });
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
