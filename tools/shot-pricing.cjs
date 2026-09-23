// 截图核验价格区：桌面 + 手机两种宽度，并检查是否横向溢出
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FILE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = 'F:\\2026-09-12-10-53-11\\.workbuddy\\tmp';
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const report = [];

  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['tablet', 1000, 900],
    ['mobile', 390, 900],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(FILE, { waitUntil: 'networkidle0' });

    // 关闭入场动画，否则元素截图全是空白
    await page.addStyleTag({ content: `[data-reveal],[data-stagger]>*{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}` });
    await page.evaluate(() => { document.querySelectorAll('.ptable').forEach(e => e.classList.remove('flash')); });
    await new Promise(r => setTimeout(r, 250));

    // 检查整页横向溢出
    const overflow = await page.evaluate(() => ({
      docWidth: document.documentElement.scrollWidth,
      winWidth: window.innerWidth,
    }));

    const el = await page.$('#pricing');
    await el.screenshot({ path: `${OUT}\\price-${name}.png` });

    // 卡片数量与每行实际列数
    const grid = await page.evaluate(() => {
      const g = document.querySelector('.pricing-3col');
      if (!g) return null;
      const cs = getComputedStyle(g);
      return {
        cols: cs.gridTemplateColumns,
        cards: [...g.querySelectorAll('.ptable')].map(c => c.id || c.querySelector('h3')?.textContent),
        overflowingCards: [...g.querySelectorAll('.ptable')]
          .filter(c => c.scrollWidth > c.clientWidth + 1).map(c => c.id),
      };
    });

    report.push({ name, width, overflow, grid });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})();
