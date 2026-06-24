const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CHROME = '/Users/echowang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE = 'http://127.0.0.1:8765';
const INPUT = path.join(__dirname, 'test-input-paragraph.txt');

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

  // Try selecting text in the SECOND paragraph: "成长一号"
  const popupVisible = await page.evaluate(() => {
    return new Promise((resolve) => {
      const preview = document.querySelector('.text-preview');
      const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
      let found = false;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const idx = node.textContent.indexOf('成长一号');
        if (idx >= 0) {
          found = true;
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + 4);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          preview.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          setTimeout(() => {
            const popup = document.getElementById('selectionPopup');
            resolve({
              found: true,
              popupExists: !!popup,
              popupVisible: popup ? popup.classList.contains('is-visible') : false,
              nodeText: node.textContent.slice(0, 60),
              nodeStart: node.parentElement ? node.parentElement.dataset.start : null
            });
          }, 100);
          break;
        }
      }
      if (!found) resolve({ found: false });
    });
  });

  console.log('Paragraph 2 selection result:', popupVisible);

  await browser.close();
  fs.unlinkSync(INPUT);

  if (!popupVisible.popupVisible) {
    console.error('Popup did not show for second paragraph selection');
    process.exit(1);
  }
  console.log('Test passed');
}

run().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
