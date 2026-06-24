const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CHROME = '/Users/echowang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE = 'http://127.0.0.1:8765';
const INPUT = path.join(__dirname, 'test-input-drag.txt');

async function run() {
  fs.writeFileSync(INPUT, '客户姓名：张三，联系电话：13800138000，身份证号：110101199001011234。\n投资金额：500万元人民币，所属基金：成长一号。\n邮箱：zhangsan@example.com');

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(`${BASE}/pages/desensitize.html`);
  await page.waitForSelector('#uploadZone');

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('#uploadZone')
  ]);
  await fileChooser.setFiles(INPUT);

  await page.waitForFunction(() => {
    return document.querySelectorAll('.detect-item').length > 0;
  }, { timeout: 5000 });

  const beforeCount = await page.evaluate(() => document.querySelectorAll('.detect-item').length);
  console.log('Initial detections:', beforeCount);

  // Step 1: drag-select "张三" in first paragraph
  const firstParagraphBox = await page.evaluate(() => {
    const preview = document.querySelector('.text-preview');
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const idx = node.textContent.indexOf('张三');
      if (idx >= 0) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + 2);
        const rects = range.getClientRects();
        const rect = rects[0];
        return {
          x1: rect.left,
          y1: rect.top + rect.height / 2,
          x2: rect.right,
          y2: rect.top + rect.height / 2
        };
      }
    }
    return null;
  });

  if (!firstParagraphBox) throw new Error('Could not find first paragraph text position');
  console.log('First paragraph text box:', firstParagraphBox);

  await page.mouse.move(firstParagraphBox.x1, firstParagraphBox.y1);
  await page.mouse.down();
  await page.mouse.move(firstParagraphBox.x2, firstParagraphBox.y2);
  await page.mouse.up();

  await page.waitForSelector('#selectionPopup.is-visible', { timeout: 2000 });
  console.log('Popup visible after first paragraph drag-select');
  await page.click('#selectionAddBtn');

  await page.waitForFunction((prev) => {
    return document.querySelectorAll('.detect-item').length > prev;
  }, beforeCount, { timeout: 3000 });

  const afterCount = await page.evaluate(() => document.querySelectorAll('.detect-item').length);
  console.log('Detections after first manual add:', afterCount);

  // Step 2: drag-select "成长一号" in second paragraph
  const secondParagraphBox = await page.evaluate(() => {
    const preview = document.querySelector('.text-preview');
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const idx = node.textContent.indexOf('成长一号');
      if (idx >= 0) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + 4);
        const rects = range.getClientRects();
        const rect = rects[0];
        return {
          x1: rect.left,
          y1: rect.top + rect.height / 2,
          x2: rect.right,
          y2: rect.top + rect.height / 2
        };
      }
    }
    return null;
  });

  if (!secondParagraphBox) throw new Error('Could not find second paragraph text position');
  console.log('Second paragraph text box:', secondParagraphBox);

  await page.mouse.move(secondParagraphBox.x1, secondParagraphBox.y1);
  await page.mouse.down();
  await page.mouse.move(secondParagraphBox.x2, secondParagraphBox.y2);
  await page.mouse.up();

  const popupState = await page.evaluate(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const popup = document.getElementById('selectionPopup');
        resolve({
          popupExists: !!popup,
          popupVisible: popup ? popup.classList.contains('is-visible') : false,
          popupStyle: popup ? { left: popup.style.left, top: popup.style.top } : null,
          selectionText: window.getSelection().toString()
        });
      }, 200);
    });
  });

  console.log('Second paragraph drag-select popup state:', popupState);

  await browser.close();
  fs.unlinkSync(INPUT);

  if (!popupState.popupVisible) {
    console.error('Popup did not show for second paragraph drag-select');
    process.exit(1);
  }
  console.log('Test passed');
}

run().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
