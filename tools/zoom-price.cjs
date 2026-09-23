// 高清特写：移动端关键区块，2x DPR 放大看细节
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
  await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 });
  await page.goto(FILE, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: KILL_ANIM });
  await new Promise(r => setTimeout(r, 400));

  // 价格表特写
  const t = await page.$('#pt-hdd');
  await t.screenshot({ path: `${OUT}\\zoom-price-hdd.png` });

  // 实际字体解析结果
  const fonts = await page.evaluate(() => {
    const el = document.querySelector('#pt-hdd .price');
    const th = document.querySelector('#pt-hdd th');
    const p = document.querySelector('.svc p');
    return {
      priceText: el.textContent.trim(),
      priceSize: getComputedStyle(el).fontSize,
      priceWeight: getComputedStyle(el).fontWeight,
      priceColor: getComputedStyle(el).color,
      thSize: getComputedStyle(th).fontSize,
      svcSize: getComputedStyle(p).fontSize,
      svcColor: getComputedStyle(p).color,
    };
  });
  console.log(JSON.stringify(fonts, null, 2));

  await browser.close();
})();
