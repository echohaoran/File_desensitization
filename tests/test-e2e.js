const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CHROME = '/Users/echowang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE = 'http://127.0.0.1:8765';
const INPUT = path.join(__dirname, 'test-input.txt');

async function run() {
  fs.writeFileSync(INPUT, '客户姓名：张三，联系电话：13800138000，身份证号：110101199001011234。\n投资金额：500万元人民币，所属基金：成长一号。\n邮箱：zhangsan@example.com');

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  // ========== DESENSITIZE FLOW ==========
  await page.goto(`${BASE}/pages/desensitize.html`);
  await page.waitForSelector('#uploadZone');

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('#uploadZone')
  ]);
  await fileChooser.setFiles(INPUT);

  // wait for detections to render
  await page.waitForFunction(() => {
    return document.querySelectorAll('.detect-item').length > 0;
  }, { timeout: 5000 });

  const beforeCount = await page.evaluate(() => document.querySelectorAll('.detect-item').length);
  console.log('Initial detections:', beforeCount);

  // Select "张三" in the text preview and click Add popup
  await page.evaluate(() => {
    const preview = document.querySelector('.text-preview');
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const idx = node.textContent.indexOf('张三');
      if (idx >= 0) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + 2);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        preview.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        break;
      }
    }
  });

  await page.waitForSelector('#selectionPopup.is-visible', { timeout: 2000 });
  await page.click('#selectionAddBtn');

  // wait for new detect item
  await page.waitForFunction((prev) => {
    return document.querySelectorAll('.detect-item').length > prev;
  }, beforeCount, { timeout: 3000 });

  const afterCount = await page.evaluate(() => document.querySelectorAll('.detect-item').length);
  console.log('Detections after manual add:', afterCount);

  if (afterCount <= beforeCount) throw new Error('Manual redaction was not added');

  // Confirm redaction
  await page.click('#confirmBtn');
  await page.waitForSelector('#downloadBar:not(.hidden)', { timeout: 3000 });

  // Extract redacted text and mapping
  const result = await page.evaluate(() => {
    return {
      redactedText: document.getElementById('redacted_export') ? document.getElementById('redacted_export').value : '',
      mapping: window.__lastMapping || null
    };
  });

  // Use state directly from the page script
  const { redactedText, mappingJson } = await page.evaluate(() => {
    // Access the module's internal state via a global hook we add below
    return {
      redactedText: window.__redactedText || '',
      mappingJson: window.__mappingJson || ''
    };
  });

  // Add hooks by injecting script after load? Instead use evaluate to read from closure not possible.
  // Fallback: download mapping JSON from the page content
  const mappingText = await page.evaluate(() => document.getElementById('mappingJson').textContent);
  const redactedFromPreview = await page.evaluate(() => document.querySelector('.text-preview') ? document.querySelector('.text-preview').textContent : '');

  const redactedPath = path.join(__dirname, 'test-redacted.txt');
  const mappingPath = path.join(__dirname, 'test-mapping.json');
  fs.writeFileSync(redactedPath, redactedFromPreview);
  fs.writeFileSync(mappingPath, mappingText);

  console.log('Redacted file written:', redactedPath);
  console.log('Mapping file written:', mappingPath);

  // ========== RESTORE FLOW ==========
  await page.goto(`${BASE}/pages/restore.html`);
  await page.waitForSelector('#redactedUploadZone');

  const [fc1] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('#redactedUploadZone')
  ]);
  await fc1.setFiles(redactedPath);

  const [fc2] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('#mappingUploadZone')
  ]);
  await fc2.setFiles(mappingPath);

  await page.waitForSelector('.validate-box.is-ok', { timeout: 3000 });
  await page.click('#restoreBtn');
  await page.waitForSelector('#downloadBar:not(.hidden)', { timeout: 3000 });

  const restoredText = await page.evaluate(() => document.querySelector('.restore-result__body .text-preview') ? document.querySelector('.restore-result__body .text-preview').textContent : '');
  console.log('Restored preview:', restoredText.slice(0, 80));

  const originalText = fs.readFileSync(INPUT, 'utf8');
  if (!restoredText.includes('张三') || !restoredText.includes('13800138000')) {
    throw new Error('Restore did not recover original sensitive content');
  }

  await browser.close();

  // cleanup
  fs.unlinkSync(redactedPath);
  fs.unlinkSync(mappingPath);
  fs.unlinkSync(INPUT);

  console.log('E2E test passed');
}

run().catch(err => {
  console.error('E2E test failed:', err.message);
  process.exit(1);
});
