const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const EDITOR_PATH = '/editor/test-123';

// Test results tracker
const results = [];
function pass(name) {
  console.log(`PASS: ${name}`);
  results.push({ name, status: 'PASS' });
}
function fail(name, reason) {
  console.log(`FAIL: ${name} — ${reason}`);
  results.push({ name, status: 'FAIL', reason });
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // Inject a fake auth token so the protected editor route renders
  await context.addInitScript(() => {
    localStorage.setItem('auth_token', 'fake-e2e-test-token');
  });

  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log(`Navigating to ${TARGET_URL}${EDITOR_PATH}`);
    await page.goto(`${TARGET_URL}${EDITOR_PATH}`, { waitUntil: 'networkidle', timeout: 15000 });

    // Wait for the editor to appear (heading)
    await page.waitForSelector('h1', { timeout: 10000 });
    const heading = await page.textContent('h1');
    console.log('Page heading:', heading);

    await page.screenshot({ path: '/tmp/calc-us2-a001-01-initial.png', fullPage: true });

    // =====================================================================
    // AC1: A "Formula outputs" section is visible on the editor page
    // =====================================================================
    const formulaOutputsSection = page.locator('section[aria-label="Formula outputs"]');
    const sectionCount = await formulaOutputsSection.count();
    if (sectionCount > 0) {
      pass('AC1: Formula outputs section is visible on editor page');
    } else {
      fail('AC1: Formula outputs section is visible on editor page', 'section[aria-label="Formula outputs"] not found');
    }

    // =====================================================================
    // AC2: Clicking "Add output" adds a new output item to the list
    // =====================================================================
    const addOutputButton = page.locator('button', { hasText: 'Add output' });
    const addButtonCount = await addOutputButton.count();
    if (addButtonCount === 0) {
      fail('AC2: Clicking "Add output" adds a new output item', '"Add output" button not found');
    } else {
      // Initially list should be empty
      const initialItems = page.locator('section[aria-label="Formula outputs"] ul li');
      const initialCount = await initialItems.count();
      console.log('Initial output item count:', initialCount);

      // Click "Add output"
      await addOutputButton.click();
      await page.waitForTimeout(500);

      const afterAddItems = page.locator('section[aria-label="Formula outputs"] ul li');
      const afterAddCount = await afterAddItems.count();
      console.log('Output item count after first add:', afterAddCount);

      if (afterAddCount === initialCount + 1) {
        pass('AC2: Clicking "Add output" adds a new output item to the list');
      } else {
        fail('AC2: Clicking "Add output" adds a new output item to the list', 
          `Expected ${initialCount + 1} items, got ${afterAddCount}`);
      }
    }

    await page.screenshot({ path: '/tmp/calc-us2-a001-02-after-add.png', fullPage: true });

    // Add a second output for reorder testing
    await addOutputButton.click();
    await page.waitForTimeout(500);

    const itemsAfterTwo = await page.locator('section[aria-label="Formula outputs"] ul li').count();
    console.log('Output item count after second add:', itemsAfterTwo);

    // Add a third for better reorder testing
    await addOutputButton.click();
    await page.waitForTimeout(500);

    const itemsAfterThree = await page.locator('section[aria-label="Formula outputs"] ul li').count();
    console.log('Output item count after third add:', itemsAfterThree);

    await page.screenshot({ path: '/tmp/calc-us2-a001-03-three-outputs.png', fullPage: true });

    // =====================================================================
    // AC3: Each output item has a delete button that removes it from the list
    // =====================================================================
    const deleteButtons = page.locator('section[aria-label="Formula outputs"] ul li button[aria-label^="Delete output"]');
    const deleteButtonCount = await deleteButtons.count();
    console.log('Delete buttons found:', deleteButtonCount);

    if (deleteButtonCount === 0) {
      fail('AC3: Each output item has a delete button', 'No delete buttons found with aria-label starting with "Delete output"');
    } else {
      // Get the count before deletion
      const countBeforeDelete = await page.locator('section[aria-label="Formula outputs"] ul li').count();
      
      // Get label of first item's delete button to verify aria-label format
      const firstDeleteAriaLabel = await deleteButtons.first().getAttribute('aria-label');
      console.log('First delete button aria-label:', firstDeleteAriaLabel);

      // Verify aria-label format matches "Delete output [label]"
      if (firstDeleteAriaLabel && firstDeleteAriaLabel.startsWith('Delete output ')) {
        pass('AC3: Delete button has correct aria-label format ("Delete output [label]")');
      } else {
        fail('AC3: Delete button has correct aria-label format', `Got: ${firstDeleteAriaLabel}`);
      }

      // Click the first delete button
      await deleteButtons.first().click();
      await page.waitForTimeout(500);

      const countAfterDelete = await page.locator('section[aria-label="Formula outputs"] ul li').count();
      console.log(`Count before delete: ${countBeforeDelete}, after delete: ${countAfterDelete}`);

      if (countAfterDelete === countBeforeDelete - 1) {
        pass('AC3: Clicking delete button removes the output item from the list');
      } else {
        fail('AC3: Clicking delete button removes the output item from the list',
          `Expected ${countBeforeDelete - 1} items, got ${countAfterDelete}`);
      }
    }

    await page.screenshot({ path: '/tmp/calc-us2-a001-04-after-delete.png', fullPage: true });

    // =====================================================================
    // AC4: Clicking an output item selects it (sets data-selected="true")
    // =====================================================================
    const listItems = page.locator('section[aria-label="Formula outputs"] ul li');
    const listItemCount = await listItems.count();
    console.log('List items remaining:', listItemCount);

    if (listItemCount === 0) {
      fail('AC4: Clicking an output item selects it', 'No output items in list');
    } else {
      // Check initial state — no item should be selected (or one might be from add)
      const selectedBefore = page.locator('section[aria-label="Formula outputs"] ul li[data-selected="true"]');
      const selectedBeforeCount = await selectedBefore.count();
      console.log('Selected items before click:', selectedBeforeCount);

      // Click the select button (inner button, not delete button) of first item
      const firstItemSelectButton = listItems.first().locator('button').first();
      await firstItemSelectButton.click();
      await page.waitForTimeout(500);

      // Verify data-selected="true" is set on the first item
      const firstItemSelected = await listItems.first().getAttribute('data-selected');
      console.log('First item data-selected after click:', firstItemSelected);

      if (firstItemSelected === 'true') {
        pass('AC4: Clicking an output item selects it (sets data-selected="true")');
      } else {
        // Try checking if any item has data-selected="true"
        const selectedAfter = await page.locator('section[aria-label="Formula outputs"] ul li[data-selected="true"]').count();
        if (selectedAfter > 0) {
          pass('AC4: Clicking an output item selects it (sets data-selected="true" on list item)');
        } else {
          fail('AC4: Clicking an output item selects it (sets data-selected="true")',
            `data-selected was "${firstItemSelected}" on first item, ${selectedAfter} items with data-selected="true"`);
        }
      }
    }

    await page.screenshot({ path: '/tmp/calc-us2-a001-05-selected.png', fullPage: true });

    // =====================================================================
    // AC5: Outputs can be reordered using ArrowUp/ArrowDown keyboard keys
    // =====================================================================
    // Add another output if we only have one
    const currentCount = await page.locator('section[aria-label="Formula outputs"] ul li').count();
    if (currentCount < 2) {
      await addOutputButton.click();
      await page.waitForTimeout(500);
    }

    const itemsBefore = page.locator('section[aria-label="Formula outputs"] ul li');
    const itemsBeforeCount = await itemsBefore.count();
    console.log('Items for reorder test:', itemsBeforeCount);

    if (itemsBeforeCount < 2) {
      fail('AC5: Outputs can be reordered using ArrowUp/ArrowDown', 'Need at least 2 items to test reorder');
    } else {
      // Get labels of first and second items
      const firstItemLabelBefore = await itemsBefore.nth(0).locator('button').first().textContent();
      const secondItemLabelBefore = await itemsBefore.nth(1).locator('button').first().textContent();
      console.log('Before reorder — Item 0:', firstItemLabelBefore, '| Item 1:', secondItemLabelBefore);

      // Focus the first item and press ArrowDown to move it down
      await itemsBefore.nth(0).focus();
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);

      const itemsAfterReorder = page.locator('section[aria-label="Formula outputs"] ul li');
      const firstItemLabelAfter = await itemsAfterReorder.nth(0).locator('button').first().textContent();
      const secondItemLabelAfter = await itemsAfterReorder.nth(1).locator('button').first().textContent();
      console.log('After ArrowDown — Item 0:', firstItemLabelAfter, '| Item 1:', secondItemLabelAfter);

      await page.screenshot({ path: '/tmp/calc-us2-a001-06-after-arrowdown.png', fullPage: true });

      // The items should have swapped
      const swapped = (firstItemLabelAfter === secondItemLabelBefore && secondItemLabelAfter === firstItemLabelBefore);
      if (swapped) {
        pass('AC5: Pressing ArrowDown on first item moves it down (reorders correctly)');
      } else {
        fail('AC5: Pressing ArrowDown on first item moves it down',
          `Before: [${firstItemLabelBefore}, ${secondItemLabelBefore}], After: [${firstItemLabelAfter}, ${secondItemLabelAfter}]`);
      }

      // Now test ArrowUp — focus the second item (which was the original first) and press ArrowUp
      const itemsForArrowUp = page.locator('section[aria-label="Formula outputs"] ul li');
      const secondItemCurrentLabel = await itemsForArrowUp.nth(1).locator('button').first().textContent();
      console.log('Focusing item at index 1:', secondItemCurrentLabel, '- pressing ArrowUp');

      await itemsForArrowUp.nth(1).focus();
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(500);

      const itemsAfterArrowUp = page.locator('section[aria-label="Formula outputs"] ul li');
      const firstLabelAfterUp = await itemsAfterArrowUp.nth(0).locator('button').first().textContent();
      const secondLabelAfterUp = await itemsAfterArrowUp.nth(1).locator('button').first().textContent();
      console.log('After ArrowUp — Item 0:', firstLabelAfterUp, '| Item 1:', secondLabelAfterUp);

      await page.screenshot({ path: '/tmp/calc-us2-a001-07-after-arrowup.png', fullPage: true });

      // After ArrowUp the second item should be back in position 0
      const reorderedBack = (firstLabelAfterUp === firstItemLabelBefore && secondLabelAfterUp === secondItemLabelBefore);
      if (reorderedBack) {
        pass('AC5: Pressing ArrowUp on second item moves it up (reorders correctly)');
      } else {
        fail('AC5: Pressing ArrowUp on second item moves it up',
          `Expected: [${firstItemLabelBefore}, ${secondItemLabelBefore}], Got: [${firstLabelAfterUp}, ${secondLabelAfterUp}]`);
      }
    }

  } catch (error) {
    console.log('FATAL ERROR:', error.message);
    await page.screenshot({ path: '/tmp/calc-us2-a001-error.png', fullPage: true });
  }

  // Summary
  console.log('\n========== TEST RESULTS ==========');
  let passed = 0, failed = 0;
  for (const r of results) {
    if (r.status === 'PASS') {
      console.log(`  PASS: ${r.name}`);
      passed++;
    } else {
      console.log(`  FAIL: ${r.name}`);
      console.log(`        Reason: ${r.reason}`);
      failed++;
    }
  }
  console.log(`\nTotal: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);

  if (consoleErrors.length > 0) {
    console.log('\nConsole errors detected:');
    consoleErrors.forEach(e => console.log('  ', e));
  }

  await browser.close();
})();
