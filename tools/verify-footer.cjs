// 核验页脚备案信息：图标+编号顺序、链接地址、行内不溢出
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
  const report = {};

  for (const [name, width] of [['desktop', 1440], ['mobile', 390]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: 2 });
    await page.goto(FILE, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: KILL_ANIM });
    await new Promise(r => setTimeout(r, 350));

    report[name] = await page.evaluate(() => {
      const links = [...document.querySelectorAll('footer a')]
        .filter(a => /beian|mps|miit/.test(a.href) || /备案/.test(a.textContent))
        .map(a => {
          const svg = a.querySelector('svg');
          const kids = [...a.childNodes].filter(n => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
          // 判断图标是否在编号之前
          const svgIdx = kids.findIndex(n => n.tagName && n.tagName.toLowerCase() === 'svg');
          const textIdx = kids.findIndex(n => n.nodeType === 3 && n.textContent.trim());
          return {
            text: a.textContent.trim(),
            href: a.href,
            hasIcon: !!svg,
            iconBeforeText: svgIdx !== -1 && textIdx !== -1 && svgIdx < textIdx,
            target: a.target,
            rel: a.rel,
            newTabSafe: a.target === '_blank' && /noopener/.test(a.rel),
          };
        });
      const vw = document.documentElement.clientWidth;
      const overflow = [...document.querySelectorAll('body *')]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1); })
        .length;
      return { links, overflow, docWidth: document.documentElement.scrollWidth, winWidth: innerWidth };
    });

    if (name === 'mobile') {
      const f = await page.$('footer');
      if (f) await f.screenshot({ path: `${OUT}\\footer-mobile.png` });
    }
    await page.close();
  }

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
