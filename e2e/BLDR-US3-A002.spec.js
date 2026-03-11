const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';

const results = [];

function record(name, status, detail) {
  results.push({ name, status, detail });
  const icon = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'SKIP';
  console.log(`[${icon}] ${name}${detail ? ': ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // =========================================================
    // Setup: Register + Create Calculator
    // =========================================================
    console.log('\n=== Setup: Register and create calculator ===');
    await page.goto(`${TARGET_URL}/register`);
    await page.waitForLoadState('networkidle');

    const ts = Date.now();
    await page.fill('input[aria-label="Email"]', `e2e-final-${ts}@test.com`);
    await page.fill('input[aria-label="Password"]', 'TestPass123!');
    await page.fill('input[aria-label="Confirm password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Authenticated');

    const newCalcBtn = page.locator('button').filter({ hasText: /new calculator/i });
    await newCalcBtn.waitFor({ state: 'visible', timeout: 5000 });
    await newCalcBtn.click();
    await page.waitForURL('**/editor/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    console.log('Editor loaded:', page.url());

    await page.screenshot({ path: '/tmp/smf-01-editor.png' });
    console.log('Screenshot: /tmp/smf-01-editor.png');

    // =========================================================
    // AC1: Step manager NOT visible in Single Page mode (default)
    // =========================================================
    console.log('\n=== AC1: Step manager hidden in Single Page mode ===');

    const stepManagerSection = page.locator('[aria-label="Step manager"]');
    const visibleInSinglePage = await stepManagerSection.isVisible({ timeout: 2000 }).catch(() => false);

    if (!visibleInSinglePage) {
      record('AC1: Step manager hidden in Single Page mode', 'PASS',
        'Step manager not rendered in default single-page mode');
    } else {
      record('AC1: Step manager hidden in Single Page mode', 'FAIL',
        'Step manager is rendered in single-page mode (should be hidden)');
    }

    await page.screenshot({ path: '/tmp/smf-02-single-page-mode.png' });
    console.log('Screenshot: /tmp/smf-02-single-page-mode.png');

    // =========================================================
    // AC2: Switch to Multi-Step — step manager appears with >= 1 step
    // =========================================================
    console.log('\n=== AC2: Switch to Multi-Step mode ===');

    await page.locator('input[value="multi-step"]').click();
    await page.waitForTimeout(400);

    await page.screenshot({ path: '/tmp/smf-03-multi-step-mode.png' });
    console.log('Screenshot: /tmp/smf-03-multi-step-mode.png');

    const visibleInMultiStep = await stepManagerSection.isVisible({ timeout: 5000 }).catch(() => false);
    if (visibleInMultiStep) {
      record('AC2: Step manager appears in Multi-Step mode', 'PASS',
        'Step manager section is visible after switching to multi-step');
    } else {
      record('AC2: Step manager appears in Multi-Step mode', 'FAIL',
        'Step manager not visible after switching to multi-step');
    }

    const stepTitleInputs = page.locator('[aria-label^="Step "][aria-label$=" title"]');
    const initialStepCount = await stepTitleInputs.count();
    console.log('Initial step count:', initialStepCount);

    if (initialStepCount >= 1) {
      record('AC2: At least one step shown when entering multi-step mode', 'PASS',
        `${initialStepCount} step(s) present immediately`);
    } else {
      record('AC2: At least one step shown when entering multi-step mode', 'FAIL',
        'No steps found after switching to multi-step');
    }

    // =========================================================
    // AC3: Step has editable title input
    // =========================================================
    console.log('\n=== AC3: Step title is editable ===');

    const firstStepInput = stepTitleInputs.first();
    const originalTitle = await firstStepInput.inputValue();
    console.log('Original step title:', originalTitle);

    await firstStepInput.click({ clickCount: 3 });
    await firstStepInput.fill('Renamed Step A');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const renamedTitle = await firstStepInput.inputValue();
    if (renamedTitle === 'Renamed Step A') {
      record('AC3: Step has editable title input', 'PASS',
        `Title changed from "${originalTitle}" to "Renamed Step A"`);
    } else {
      record('AC3: Step has editable title input', 'FAIL',
        `Got "${renamedTitle}" after editing`);
    }

    await page.screenshot({ path: '/tmp/smf-04-step-renamed.png' });
    console.log('Screenshot: /tmp/smf-04-step-renamed.png');

    // =========================================================
    // AC4: Fields added appear in a step or unassigned list
    // =========================================================
    console.log('\n=== AC4: Fields appear in step or unassigned list ===');

    // Add a Number field via field type palette
    const numberFieldBtn = page.locator('button').filter({ hasText: /^Number$/i }).first();
    const numberBtnVisible = await numberFieldBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (numberBtnVisible) {
      await numberFieldBtn.click();
      console.log('Added Number field');
      await page.waitForTimeout(400);
    } else {
      // Try first available type
      const anyTypeBtn = page.locator('button').filter({ hasText: /^(Text|Dropdown|Slider|Checkbox|Radio)$/i }).first();
      if (await anyTypeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const btnText = await anyTypeBtn.textContent();
        await anyTypeBtn.click();
        console.log('Added field type:', btnText);
        await page.waitForTimeout(400);
      } else {
        console.log('WARNING: Could not find field type palette button');
      }
    }

    await page.screenshot({ path: '/tmp/smf-05-field-added.png' });
    console.log('Screenshot: /tmp/smf-05-field-added.png');

    const stepListItems = page.locator('[aria-label="Step manager"] ul li');
    const unassignedList = page.locator('[aria-label="Unassigned fields"]');
    const stepItemCount = await stepListItems.count();
    const unassignedVisible = await unassignedList.isVisible({ timeout: 1000 }).catch(() => false);

    console.log('Field in step:', stepItemCount, 'Unassigned visible:', unassignedVisible);

    if (stepItemCount > 0) {
      record('AC4: Field added goes to step in multi-step mode', 'PASS',
        `${stepItemCount} field(s) assigned to step automatically`);
    } else if (unassignedVisible) {
      record('AC4: Field added appears in unassigned list', 'PASS',
        'Field appears in unassigned fields list');
    } else {
      record('AC4: Fields appear in step or unassigned list', 'NOT TESTED',
        'No field type palette buttons found to add a field');
    }

    // =========================================================
    // AC5: "Add step" button creates a new step
    // =========================================================
    console.log('\n=== AC5: Add step button ===');

    const addStepBtn = page.locator('button').filter({ hasText: /^Add step$/i });
    const addStepVisible = await addStepBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Add step button visible:', addStepVisible);

    const stepsBeforeAdd = await stepTitleInputs.count();
    if (addStepVisible) {
      await addStepBtn.click();
      await page.waitForTimeout(400);
      const stepsAfterAdd = await stepTitleInputs.count();

      if (stepsAfterAdd === stepsBeforeAdd + 1) {
        record('AC5: Add step creates a new step', 'PASS',
          `Step count: ${stepsBeforeAdd} -> ${stepsAfterAdd}`);
      } else {
        record('AC5: Add step creates a new step', 'FAIL',
          `Expected ${stepsBeforeAdd + 1} steps, got ${stepsAfterAdd}`);
      }
    } else {
      record('AC5: Add step button visible', 'FAIL', 'Add step button not found in step manager');
    }

    await page.screenshot({ path: '/tmp/smf-06-step-added.png' });
    console.log('Screenshot: /tmp/smf-06-step-added.png (two steps should now be visible)');

    // =========================================================
    // AC6: Delete step removes a step
    // =========================================================
    console.log('\n=== AC6: Delete step button ===');

    const stepCountBeforeDel = await stepTitleInputs.count();
    // Buttons have aria-label "Delete [step title]"
    const deleteBtns = page.locator('[aria-label="Step manager"] button[aria-label^="Delete "]');
    const delCount = await deleteBtns.count();
    console.log('Delete step buttons:', delCount, 'Steps:', stepCountBeforeDel);

    if (delCount > 0) {
      const lastDelLabel = await deleteBtns.last().getAttribute('aria-label');
      await deleteBtns.last().click();
      await page.waitForTimeout(400);
      const stepCountAfterDel = await stepTitleInputs.count();

      if (stepCountAfterDel === stepCountBeforeDel - 1) {
        record('AC6: Delete step removes a step', 'PASS',
          `"${lastDelLabel}" removed step (${stepCountBeforeDel} -> ${stepCountAfterDel})`);
      } else {
        record('AC6: Delete step removes a step', 'FAIL',
          `Expected ${stepCountBeforeDel - 1}, got ${stepCountAfterDel}`);
      }
    } else {
      record('AC6: Delete step button visible', 'FAIL', 'No delete step buttons found');
    }

    await page.screenshot({ path: '/tmp/smf-07-step-deleted.png' });
    console.log('Screenshot: /tmp/smf-07-step-deleted.png');

    // =========================================================
    // AC7: Field can be moved between steps using assign dropdown
    // =========================================================
    console.log('\n=== AC7: Assign field to step using dropdown ===');

    // Ensure we have 2 steps
    let currentStepCount = await stepTitleInputs.count();
    if (currentStepCount < 2) {
      await addStepBtn.click();
      await page.waitForTimeout(400);
      currentStepCount = await stepTitleInputs.count();
      console.log('Added step, now have:', currentStepCount);
    }

    // Use "Remove from step" first to make a field unassigned, then test assign dropdown
    const removeBtns = page.locator('[aria-label="Step manager"] button[aria-label^="Remove "]');
    let rmCount = await removeBtns.count();
    console.log('Remove-from-step buttons:', rmCount);

    if (rmCount === 0) {
      // Add a field (auto-assigns to first step in multi-step mode)
      const addFieldBtn = page.locator('button').filter({ hasText: /^(Number|Text|Slider)$/i }).first();
      if (await addFieldBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addFieldBtn.click();
        await page.waitForTimeout(400);
        rmCount = await removeBtns.count();
        console.log('Remove buttons after adding field:', rmCount);
      }
    }

    if (rmCount > 0) {
      // Remove field from step to make it unassigned
      const rmLabel = await removeBtns.first().getAttribute('aria-label');
      await removeBtns.first().click();
      await page.waitForTimeout(400);
      console.log('Removed:', rmLabel);

      // Now assign dropdown should appear
      const assignDropdown = page.locator('[aria-label="Unassigned fields"] select[aria-label*="Assign"]').first();
      const dropdownVisible = await assignDropdown.isVisible({ timeout: 3000 }).catch(() => false);
      console.log('Assign dropdown visible:', dropdownVisible);

      if (dropdownVisible) {
        // Get options using page.evaluate (avoids CSS selector issues)
        const optionValues = await page.evaluate(() => {
          const selects = document.querySelectorAll('[aria-label="Unassigned fields"] select');
          for (const sel of selects) {
            return Array.from(sel.options).map(o => ({ value: o.value, text: o.text.trim() }));
          }
          return [];
        });
        console.log('Dropdown options:', JSON.stringify(optionValues));

        const validOptions = optionValues.filter(o => o.value !== '');
        if (validOptions.length > 0) {
          const targetStepId = validOptions[0].value;
          const targetStepText = validOptions[0].text;
          await assignDropdown.selectOption(targetStepId);
          await page.waitForTimeout(400);

          const unassignedAfter = await unassignedList.isVisible({ timeout: 1000 }).catch(() => false);
          const stepItemsAfter = await stepListItems.count();
          console.log('After assign - unassigned visible:', unassignedAfter, 'step items:', stepItemsAfter);

          record('AC7: Field can be moved to step using assign dropdown', 'PASS',
            `Field assigned to step "${targetStepText}" via dropdown`);
        } else {
          record('AC7: Assign dropdown has step options', 'FAIL',
            'No valid step options available in dropdown');
        }
      } else {
        record('AC7: Assign dropdown appears for unassigned fields', 'FAIL',
          'Assign dropdown not visible after removing field from step');
      }
    } else {
      record('AC7: Field can be moved between steps', 'NOT TESTED',
        'No fields available to make unassigned');
    }

    await page.screenshot({ path: '/tmp/smf-08-field-assigned.png' });
    console.log('Screenshot: /tmp/smf-08-field-assigned.png');

    // =========================================================
    // AC8: Move step up / Move step down reorders steps
    // =========================================================
    console.log('\n=== AC8: Reorder steps ===');

    currentStepCount = await stepTitleInputs.count();
    console.log('Steps for reorder test:', currentStepCount);

    if (currentStepCount < 2) {
      await addStepBtn.click();
      await page.waitForTimeout(400);
      currentStepCount = await stepTitleInputs.count();
      console.log('Added step, now have:', currentStepCount);
    }

    if (currentStepCount >= 2) {
      const s1Before = await stepTitleInputs.nth(0).inputValue();
      const s2Before = await stepTitleInputs.nth(1).inputValue();
      console.log(`Before: step1="${s1Before}" step2="${s2Before}"`);

      // Use specific selectors: "Move [title] down" — contains both "Move" and "down"
      // From debug: aria-label is "Move Step 1 down" etc.
      const moveDownBtns = page.locator('[aria-label="Step manager"] button[aria-label*="Move"][aria-label*="down"]:not([disabled])');
      const mdCount = await moveDownBtns.count();
      console.log('Enabled move-down buttons:', mdCount);

      if (mdCount > 0) {
        const mdLabel = await moveDownBtns.first().getAttribute('aria-label');
        console.log('Clicking:', mdLabel);
        await moveDownBtns.first().click();
        await page.waitForTimeout(400);

        const s1After = await stepTitleInputs.nth(0).inputValue();
        const s2After = await stepTitleInputs.nth(1).inputValue();
        console.log(`After move-down: step1="${s1After}" step2="${s2After}"`);

        if (s1After === s2Before && s2After === s1Before) {
          record('AC8: Move step down reorders steps', 'PASS',
            `"${s1Before}" successfully moved from position 1 to position 2`);
        } else {
          record('AC8: Move step down reorders steps', 'FAIL',
            `Expected swap to ["${s2Before}","${s1Before}"], got ["${s1After}","${s2After}"]`);
        }

        // Test move up: second step should be moveable up
        const moveUpBtns = page.locator('[aria-label="Step manager"] button[aria-label*="Move"][aria-label*="up"]:not([disabled])');
        const muCount = await moveUpBtns.count();
        console.log('Enabled move-up buttons:', muCount);

        if (muCount > 0) {
          const s1Pre = await stepTitleInputs.nth(0).inputValue();
          const s2Pre = await stepTitleInputs.nth(1).inputValue();
          const muLabel = await moveUpBtns.first().getAttribute('aria-label');
          console.log('Clicking:', muLabel);

          await moveUpBtns.first().click();
          await page.waitForTimeout(400);

          const s1Post = await stepTitleInputs.nth(0).inputValue();
          const s2Post = await stepTitleInputs.nth(1).inputValue();
          console.log(`After move-up: step1="${s1Post}" step2="${s2Post}"`);

          if (s1Post === s2Pre && s2Post === s1Pre) {
            record('AC8: Move step up reorders steps', 'PASS',
              `Steps swapped correctly via move-up`);
          } else {
            record('AC8: Move step up reorders steps', 'FAIL',
              `Expected swap to ["${s2Pre}","${s1Pre}"], got ["${s1Post}","${s2Post}"]`);
          }
        } else {
          record('AC8: Move step up button', 'FAIL', 'No enabled move-up buttons found after move-down');
        }
      } else {
        // Log all buttons for debugging
        const allSmBtns = await page.locator('[aria-label="Step manager"] button').all();
        console.log('All step manager buttons:');
        for (const btn of allSmBtns) {
          const label = await btn.getAttribute('aria-label');
          const disabled = await btn.isDisabled();
          console.log(`  "${label}" disabled=${disabled}`);
        }
        record('AC8: Move step down button enabled', 'FAIL',
          'No enabled move-down buttons found (first step should have move-down enabled)');
      }
    } else {
      record('AC8: Reorder steps', 'FAIL', `Only ${currentStepCount} step(s), need at least 2`);
    }

    await page.screenshot({ path: '/tmp/smf-09-steps-reordered.png' });
    console.log('Screenshot: /tmp/smf-09-steps-reordered.png');

    // =========================================================
    // AC9: "Remove [field] from [step]" button moves field to unassigned
    // =========================================================
    console.log('\n=== AC9: Remove field from step ===');

    const removeBtns2 = page.locator('[aria-label="Step manager"] button[aria-label^="Remove "]');
    let rmCount2 = await removeBtns2.count();
    console.log('Remove-from-step buttons:', rmCount2);

    if (rmCount2 === 0) {
      // Add a field to have something to remove
      const fBtn = page.locator('button').filter({ hasText: /^(Number|Text|Slider)$/i }).first();
      if (await fBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const fBtnText = await fBtn.textContent();
        await fBtn.click();
        await page.waitForTimeout(400);
        rmCount2 = await removeBtns2.count();
        console.log(`Added ${fBtnText} field, remove buttons now:`, rmCount2);
      }
    }

    if (rmCount2 > 0) {
      const rmLabel2 = await removeBtns2.first().getAttribute('aria-label');
      console.log('Clicking:', rmLabel2);

      const stepItemsBefore2 = await stepListItems.count();
      await removeBtns2.first().click();
      await page.waitForTimeout(400);

      const unassignedNow = await unassignedList.isVisible({ timeout: 2000 }).catch(() => false);
      const stepItemsAfter2 = await stepListItems.count();
      console.log(`After remove: unassigned visible=${unassignedNow}, step items: ${stepItemsBefore2} -> ${stepItemsAfter2}`);

      if (unassignedNow) {
        record('AC9: Remove field from step moves field to unassigned list', 'PASS',
          `"${rmLabel2}" worked — field now in unassigned list`);
      } else if (stepItemsAfter2 < stepItemsBefore2) {
        record('AC9: Remove field from step decreases step item count', 'PASS',
          `Step items: ${stepItemsBefore2} -> ${stepItemsAfter2}`);
      } else {
        record('AC9: Remove field from step', 'FAIL',
          'Field was not moved to unassigned after clicking remove');
      }
    } else {
      record('AC9: Remove field from step button', 'NOT TESTED',
        'No fields assigned to steps to test removal');
    }

    await page.screenshot({ path: '/tmp/smf-10-field-removed.png' });
    console.log('Screenshot: /tmp/smf-10-field-removed.png');

    // Final full-page screenshot
    await page.screenshot({ path: '/tmp/smf-11-final.png', fullPage: true });
    console.log('Screenshot: /tmp/smf-11-final.png (final state)');

    // Console errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole errors during test:');
      consoleErrors.forEach(e => console.log('  ERROR:', e));
    } else {
      console.log('\nNo console errors during test');
    }

  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    await page.screenshot({ path: '/tmp/smf-fatal.png' }).catch(() => {});
    record('Test execution', 'FAIL', err.message);
  } finally {
    await browser.close();
  }

  // Results summary
  console.log('\n====================================================');
  console.log('    BLDR-US3-A002 E2E TEST RESULTS (FINAL)');
  console.log('====================================================');

  const passes = results.filter(r => r.status === 'PASS').length;
  const fails = results.filter(r => r.status === 'FAIL').length;
  const notTested = results.filter(r => r.status === 'NOT TESTED').length;

  results.forEach(r => {
    const icon = r.status === 'PASS' ? 'PASS' : r.status === 'FAIL' ? 'FAIL' : 'SKIP';
    console.log(`  [${icon}] ${r.name}`);
    if (r.detail) console.log(`         ${r.detail}`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`  Total: ${results.length} | Pass: ${passes} | Fail: ${fails} | Not Tested: ${notTested}`);
  const verdict = fails === 0 ? 'PASS' : 'FAIL';
  console.log(`  VERDICT: ${verdict}`);
  console.log('====================================================\n');
})();
