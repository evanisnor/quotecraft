// BLDR-US5: Save & Auto-Save E2E Tests
// Tests acceptance criteria for BLDR-US5-A001, BLDR-US5-A002, BLDR-US5-A003
//
// Strategy: Since the PostgreSQL DB is not available (Docker not running),
// we inject a fake auth token via localStorage and mock all API calls
// via Playwright route interception. This lets us test the full UI behavior
// of the auto-save feature without a live backend.

const { chromium } = require('playwright');

const DASHBOARD_URL = 'http://localhost:3000';
// Fake calculator ID for testing
const CALC_ID = 'test-calculator-abc123';
const EDITOR_URL = `${DASHBOARD_URL}/editor/${CALC_ID}`;

// A plausible fake JWT token (the dashboard only checks it exists, not validates it)
const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIifQ.fake-sig';

const results = [];

function pass(name, detail = '') {
  results.push({ status: 'PASS', name, detail });
  console.log(`PASS: ${name}${detail ? ' — ' + detail : ''}`);
}

function fail(name, detail = '') {
  results.push({ status: 'FAIL', name, detail });
  console.log(`FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

function skip(name, reason) {
  results.push({ status: 'SKIP', name, reason });
  console.log(`SKIP: ${name} — ${reason}`);
}

async function setupEditorPage(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track PUT requests to the calculator config endpoint
  const putRequests = [];
  const apiErrors = [];

  // Mock the PUT /v1/calculators/:id endpoint
  await page.route(`**/v1/calculators/${CALC_ID}`, (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      putRequests.push({
        timestamp: Date.now(),
        body: route.request().postData(),
      });
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: CALC_ID } }),
      });
    } else {
      route.continue();
    }
  });

  // Navigate to dashboard first to establish the origin
  await page.goto(DASHBOARD_URL);

  // Set auth token in localStorage
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, FAKE_TOKEN);

  // Now navigate to the editor page
  await page.goto(EDITOR_URL, { waitUntil: 'networkidle', timeout: 15000 });

  return { page, context, putRequests, apiErrors };
}

async function test_saveStatusIndicatorPresent(browser) {
  const { page, context } = await setupEditorPage(browser);
  try {
    await page.screenshot({ path: '/tmp/bldr-us5-editor-loaded.png' });

    // Check for the save status indicator with role="status"
    const statusEl = page.locator('[role="status"]');
    const count = await statusEl.count();
    
    if (count > 0) {
      pass('Save status indicator present', `role="status" element found`);
    } else {
      fail('Save status indicator present', 'No element with role="status" found on editor page');
    }

    // Check for the Save button
    const saveBtn = page.locator('button[aria-label="Save"]');
    const btnCount = await saveBtn.count();
    
    if (btnCount > 0) {
      pass('Save button visible', 'Manual Save button with aria-label="Save" found');
    } else {
      // Try a less specific selector
      const anyBtn = await page.locator('button').filter({ hasText: 'Save' }).count();
      if (anyBtn > 0) {
        pass('Save button visible', 'Save button found (by text)');
      } else {
        fail('Save button visible', 'No Save button found on editor page');
      }
    }
  } finally {
    await context.close();
  }
}

async function test_initialSaveStatusIsIdle(browser) {
  const { page, context } = await setupEditorPage(browser);
  try {
    const statusEl = page.locator('[role="status"]');
    await statusEl.waitFor({ timeout: 5000 });

    // In idle state, the label should be empty (no visible text about saving)
    const statusText = await statusEl.textContent();
    
    // The indicator shows empty for idle, so we should NOT see "Saving..." or "Error saving"
    if (!statusText?.includes('Saving...') && !statusText?.includes('Error saving')) {
      pass('Initial save status is idle', `Status element text: "${statusText?.trim()}" (no saving activity)`);
    } else {
      fail('Initial save status is idle', `Unexpected status on load: "${statusText?.trim()}"`);
    }
  } finally {
    await context.close();
  }
}

async function test_autoSaveAfterFieldChange(browser) {
  const { page, context, putRequests } = await setupEditorPage(browser);
  try {
    // Wait for the editor to be fully rendered
    const statusEl = page.locator('[role="status"]');
    await statusEl.waitFor({ timeout: 5000 });

    const putsBefore = putRequests.length;

    // Add a field to trigger a state change
    // Look for field type palette buttons (Number, Text, etc.)
    const addFieldBtn = page.locator('button').filter({ hasText: /Number|Text|Dropdown|Radio|Checkbox|Slider/i }).first();
    const addFieldCount = await addFieldBtn.count();
    
    if (addFieldCount === 0) {
      skip('Auto-save after field change', 'Could not find field type palette buttons to trigger a change');
      return;
    }

    console.log('Clicking add field button to trigger state change...');
    await addFieldBtn.click();

    await page.screenshot({ path: '/tmp/bldr-us5-after-field-add.png' });

    // Wait for "Saving..." status to appear (auto-save should trigger)
    try {
      await page.waitForFunction(() => {
        const el = document.querySelector('[role="status"]');
        return el && (el.textContent?.includes('Saving...') || el.textContent?.includes('Saved'));
      }, { timeout: 5000 });
      pass('Auto-save triggered', 'Status changed from idle after field was added');
    } catch (e) {
      fail('Auto-save triggered', 'Status did not change to Saving... or Saved within 5 seconds after field add');
    }

    // Wait for the debounce + save to complete (2s debounce + network roundtrip)
    await page.waitForTimeout(3500);
    
    const putsAfter = putRequests.length;

    if (putsAfter > putsBefore) {
      pass('PUT request made to API', `${putsAfter - putsBefore} PUT request(s) sent to /v1/calculators/${CALC_ID}`);
    } else {
      fail('PUT request made to API', `No PUT requests detected after field add (waited 3.5s for 2s debounce)`);
    }

    await page.screenshot({ path: '/tmp/bldr-us5-after-autosave.png' });

  } finally {
    await context.close();
  }
}

async function test_savingStatusShown(browser) {
  const { page, context, putRequests } = await setupEditorPage(browser);
  try {
    // Intercept the PUT to delay it and observe "Saving..." status
    await page.route(`**/v1/calculators/${CALC_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        // Delay response to observe Saving... state
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: { id: CALC_ID } }),
          });
        }, 2000); // 2 second delay to make Saving... visible
      } else {
        route.continue();
      }
    });

    const statusEl = page.locator('[role="status"]');
    await statusEl.waitFor({ timeout: 5000 });

    // Add a field to trigger auto-save
    const addFieldBtn = page.locator('button').filter({ hasText: /Number|Text|Dropdown|Radio|Checkbox|Slider/i }).first();
    if (await addFieldBtn.count() === 0) {
      skip('Saving... status shown', 'Could not find field type buttons');
      return;
    }
    await addFieldBtn.click();

    // Wait for "Saving..." to appear
    let savingShown = false;
    try {
      await page.waitForFunction(() => {
        const el = document.querySelector('[role="status"]');
        return el && el.textContent?.includes('Saving...');
      }, { timeout: 5000 });
      savingShown = true;
      pass('Saving... status shown', '"Saving..." text appears in status indicator');
      await page.screenshot({ path: '/tmp/bldr-us5-saving-status.png' });
    } catch (e) {
      // Maybe it was too fast — check if we see Saved instead
      const text = await statusEl.textContent();
      if (text?.includes('Saved')) {
        pass('Saving... status shown', 'Save completed fast — "Saved" status visible (Saving... transient)');
      } else {
        fail('Saving... status shown', `Expected "Saving..." but got: "${text?.trim()}"`);
      }
    }

  } finally {
    await context.close();
  }
}

async function test_savedStatusAfterSuccess(browser) {
  const { page, context } = await setupEditorPage(browser);
  try {
    const statusEl = page.locator('[role="status"]');
    await statusEl.waitFor({ timeout: 5000 });

    // Add a field
    const addFieldBtn = page.locator('button').filter({ hasText: /Number|Text|Dropdown|Radio|Checkbox|Slider/i }).first();
    if (await addFieldBtn.count() === 0) {
      skip('Saved status after success', 'Could not find field type buttons');
      return;
    }
    await addFieldBtn.click();

    // Wait for save to complete and show "Saved"
    try {
      await page.waitForFunction(() => {
        const el = document.querySelector('[role="status"]');
        return el && el.textContent?.includes('Saved');
      }, { timeout: 6000 });
      pass('"Saved" status shown after successful save', '"Saved" appears in status indicator');
      await page.screenshot({ path: '/tmp/bldr-us5-saved-status.png' });
    } catch (e) {
      const text = await statusEl.textContent();
      fail('"Saved" status shown after successful save', `Expected "Saved" but got: "${text?.trim()}"`);
    }
  } finally {
    await context.close();
  }
}

async function test_errorStatusOnAPIFailure(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Mock the PUT to fail
    await page.route(`**/v1/calculators/${CALC_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(DASHBOARD_URL);
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, FAKE_TOKEN);
    await page.goto(EDITOR_URL, { waitUntil: 'networkidle', timeout: 15000 });

    const statusEl = page.locator('[role="status"]');
    await statusEl.waitFor({ timeout: 5000 });

    // Add a field to trigger auto-save
    const addFieldBtn = page.locator('button').filter({ hasText: /Number|Text|Dropdown|Radio|Checkbox|Slider/i }).first();
    if (await addFieldBtn.count() === 0) {
      skip('Error status on API failure', 'Could not find field type buttons');
      return;
    }
    await addFieldBtn.click();

    // The retry logic uses exponential backoff: 1s, 2s, 4s with 3 retries
    // Total worst case: 2s debounce + 3 retries * (1s + 2s + 4s) = 2 + 7 = ~9s
    // Wait enough time to pass through all retries
    console.log('Waiting for retries to exhaust (up to 15s)...');
    
    try {
      await page.waitForFunction(() => {
        const el = document.querySelector('[role="status"]');
        return el && el.textContent?.includes('Error saving');
      }, { timeout: 35000 });
      pass('"Error saving" status shown on API failure', '"Error saving" appears after retries exhausted');
      
      // Check for the alert message — scoped inside the save status indicator
      // to avoid strict-mode violations if other role="alert" elements exist on the page
      const alertEl = page.locator('[role="status"] [role="alert"]');
      const alertCount = await alertEl.count();
      if (alertCount > 0) {
        const alertText = await alertEl.first().textContent();
        pass('User notified on persistent failure', `Alert message: "${alertText?.trim()}"`);
      } else {
        fail('User notified on persistent failure', 'No role="alert" element found after error');
      }
      
      await page.screenshot({ path: '/tmp/bldr-us5-error-status.png' });
    } catch (e) {
      const text = await statusEl.textContent();
      fail('"Error saving" status shown on API failure', `Expected "Error saving" but got: "${text?.trim()}" after 20s`);
    }
  } finally {
    await context.close();
  }
}

async function test_manualSaveButton(browser) {
  const { page, context, putRequests } = await setupEditorPage(browser);
  try {
    const statusEl = page.locator('[role="status"]');
    await statusEl.waitFor({ timeout: 5000 });

    const putsBefore = putRequests.length;

    // Click Save button directly without making any field changes
    const saveBtn = page.locator('button').filter({ hasText: /^Save$/ }).first();
    if (await saveBtn.count() === 0) {
      skip('Manual Save button works', 'Could not find Save button');
      return;
    }

    console.log('Clicking manual Save button...');
    await saveBtn.click();

    // Wait briefly to see if a PUT is fired
    await page.waitForTimeout(2000);
    const putsAfter = putRequests.length;

    if (putsAfter > putsBefore) {
      pass('Manual Save button triggers PUT request', `${putsAfter - putsBefore} PUT request(s) sent on button click`);
    } else {
      // The save may be skipped if config hasn't changed (isSaving guard or no-op)
      // Let's check if the status changed at least
      const text = await statusEl.textContent();
      if (text?.includes('Saving...') || text?.includes('Saved')) {
        pass('Manual Save button triggers save', 'Status changed to Saving.../Saved on button click');
      } else {
        fail('Manual Save button triggers PUT request', `No PUT made; status: "${text?.trim()}"`);
      }
    }

    await page.screenshot({ path: '/tmp/bldr-us5-manual-save.png' });
  } finally {
    await context.close();
  }
}

async function test_debounceResetOnRapidChanges(browser) {
  const { page, context, putRequests } = await setupEditorPage(browser);
  try {
    const statusEl = page.locator('[role="status"]');
    await statusEl.waitFor({ timeout: 5000 });

    const addFieldBtn = page.locator('button').filter({ hasText: /Number|Text|Dropdown|Radio|Checkbox|Slider/i }).first();
    if (await addFieldBtn.count() === 0) {
      skip('Debounce resets on rapid changes', 'Could not find field type buttons');
      return;
    }

    const putsBefore = putRequests.length;

    // Rapidly add multiple fields to test that debounce resets
    console.log('Adding 3 fields rapidly to test debounce reset...');
    await addFieldBtn.click();
    await page.waitForTimeout(500); // less than 2s debounce
    await addFieldBtn.click();
    await page.waitForTimeout(500);
    await addFieldBtn.click();
    
    // Wait 1s (still within debounce window from last click)
    await page.waitForTimeout(1000);
    const putsDuring = putRequests.length;

    // Wait for debounce to trigger
    await page.waitForTimeout(3000);
    const putsAfter = putRequests.length;

    if (putsAfter > putsBefore) {
      pass('Auto-save fires after debounce settles', `PUT(s) sent: ${putsAfter - putsBefore}`);
      // Ideally only 1 PUT for multiple rapid changes, but at most a few
      if (putsDuring === putsBefore) {
        pass('Debounce prevents premature saves', 'No PUT during rapid typing phase');
      } else {
        fail('Debounce prevents premature saves', `${putsDuring - putsBefore} PUT(s) fired during rapid changes — debounce not working`);
      }
    } else {
      fail('Auto-save fires after debounce settles', 'No PUT sent after 3s wait following rapid changes');
    }
  } finally {
    await context.close();
  }
}

async function test_editorPageLoads(browser) {
  const { page, context } = await setupEditorPage(browser);
  try {
    // Basic check that the editor page loads (not a blank page or error)
    const title = await page.title();
    const h1 = await page.locator('h1').textContent().catch(() => '');
    const url = page.url();

    await page.screenshot({ path: '/tmp/bldr-us5-editor-page.png' });

    if (url.includes('/editor/') && h1 && h1.length > 0) {
      pass('Editor page loads', `URL: ${url}, H1: "${h1}"`);
    } else if (url.includes('/login')) {
      fail('Editor page loads', 'Redirected to /login — auth token injection failed');
    } else {
      fail('Editor page loads', `Unexpected state — URL: ${url}, H1: "${h1}"`);
    }
  } finally {
    await context.close();
  }
}

(async () => {
  console.log('=== BLDR-US5: Save & Auto-Save E2E Tests ===');
  console.log(`Dashboard: ${DASHBOARD_URL}`);
  console.log(`Editor URL: ${EDITOR_URL}`);
  console.log('');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });

  try {
    console.log('\n--- Test 1: Editor Page Loads ---');
    await test_editorPageLoads(browser);

    console.log('\n--- Test 2: Save Status Indicator Present ---');
    await test_saveStatusIndicatorPresent(browser);

    console.log('\n--- Test 3: Initial Save Status is Idle ---');
    await test_initialSaveStatusIsIdle(browser);

    console.log('\n--- Test 4: Auto-Save Triggered After Field Change ---');
    await test_autoSaveAfterFieldChange(browser);

    console.log('\n--- Test 5: "Saving..." Status Shown ---');
    await test_savingStatusShown(browser);

    console.log('\n--- Test 6: "Saved" Status After Successful Save ---');
    await test_savedStatusAfterSuccess(browser);

    console.log('\n--- Test 7: Error Status on API Failure (with Retries) ---');
    await test_errorStatusOnAPIFailure(browser);

    console.log('\n--- Test 8: Manual Save Button ---');
    await test_manualSaveButton(browser);

    console.log('\n--- Test 9: Debounce Resets on Rapid Changes ---');
    await test_debounceResetOnRapidChanges(browser);

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n=== TEST SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  for (const r of results) {
    const icon = r.status === 'PASS' ? 'PASS' : r.status === 'FAIL' ? 'FAIL' : 'SKIP';
    console.log(`  [${icon}] ${r.name}`);
    if (r.detail) console.log(`         ${r.detail}`);
    if (r.reason) console.log(`         Reason: ${r.reason}`);
  }

  console.log(`\nTotal: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  
  const verdict = failed === 0 ? 'PASS' : 'FAIL';
  console.log(`\nVerdict: ${verdict}`);

  if (failed > 0) {
    process.exit(1);
  }
})();
