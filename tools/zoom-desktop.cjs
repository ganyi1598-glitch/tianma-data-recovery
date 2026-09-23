// 桌面端区块特写，确认放大后观感协调
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FILE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = 'F:\\2026-09-12-10-53-11\\.workbuddy\\tmp';
fs.mkdirSync(OUT, { recursive: true });
const KILL_ANIM = `[data-reveal],[data-stagger]>*{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });
  await page.goto(FILE, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: KILL_ANIM });
  await new Promise(r => setTimeout(r, 400));

  for (const [label, sel] of [['services', '#services'], ['pricing', '#pricing'], ['faq', '#faq'], ['cases', '#cases']]) {
    const el = await page.$(sel);
    if (el) await el.screenshot({ path: `${OUT}\\dt-${label}.png` });
  }
  console.log('done');
  await browser.close();
})();
