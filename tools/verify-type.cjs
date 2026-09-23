// 排版可读性核验：多断点渲染 + 横向溢出检测 + 关键选择器字号/字重
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
  const report = [];

  for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 1000, 900], ['mobile', 390, 900]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(FILE, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: KILL_ANIM });
    await new Promise(r => setTimeout(r, 350));

    const overflow = await page.evaluate(() => {
      const bad = [];
      const vw = document.documentElement.clientWidth;
      document.querySelectorAll('body *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const cls = (typeof el.className === 'string' && el.className.trim())
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
          bad.push(el.tagName.toLowerCase() + cls + ` [L${Math.round(r.left)} R${Math.round(r.right)} W${Math.round(r.width)}]`);
        }
      });
      return {
        docWidth: document.documentElement.scrollWidth,
        winWidth: window.innerWidth,
        offenderCount: bad.length,
        offenders: [...new Set(bad)].slice(0, 10),
      };
    });

    const sizes = await page.evaluate(() => {
      const pick = ['.ptable table', '.ptable th', '.ptable td.price', '.ptable-foot', '.svc p',
        '.faq p', '.step p', '.eyebrow', '.note-chip', '.hero-meta', '.opt', '.brand-strip>span', '.foot'];
      const out = {};
      pick.forEach(s => {
        const el = document.querySelector(s);
        if (el) { const c = getComputedStyle(el); out[s] = `${c.fontSize} w${c.fontWeight}`; }
      });
      return out;
    });

    await page.screenshot({ path: `${OUT}\\type-${name}-full.png`, fullPage: true });
    if (name === 'mobile') {
      for (const [label, sel] of [['services', '#services'], ['pricing', '#pricing'], ['check', '#check'], ['faq', '#faq']]) {
        const el = await page.$(sel);
        if (el) await el.screenshot({ path: `${OUT}\\type-mobile-${label}.png` });
      }
    }
    report.push({ name, width, overflow, sizes });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})();
