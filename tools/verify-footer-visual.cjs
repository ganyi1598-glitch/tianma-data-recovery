// 核验页脚渲染：按用户截图宽度 980px 渲染，并确认备案链接可见（非隐藏/裁切）
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
  const out = {};

  for (const [name, width] of [['w980', 980], ['w1440', 1440], ['w390', 390]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: 2 });
    await page.goto(FILE, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: KILL_ANIM });
    await new Promise(r => setTimeout(r, 350));

    out[name] = await page.evaluate(() => {
      // ⚠️ 不要用 /备案/ 过滤：实际文本是「鄂ICP备2026…」「鄂公网安备4201…」，
      //    两串里都没有「案」字，会导致匹配为空（曾误判为链接丢失）
      const links = [...document.querySelectorAll('footer a')]
        .filter(a => /(ICP备|公网安备)/.test(a.textContent) || /beian\.(miit|mps)\.gov\.cn/.test(a.href));
      return links.map(a => {
        const r = a.getBoundingClientRect();
        const cs = getComputedStyle(a);
        // 是否真正可见：有尺寸、未被裁切、未被隐藏
        const visible = r.width > 0 && r.height > 0
          && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0;
        // 是否被父容器裁切
        const fr = a.closest('footer').getBoundingClientRect();
        const clipped = r.right > fr.right + 1;
        return {
          text: a.textContent.trim(),
          visible,
          clipped,
          box: `x${Math.round(r.left)} y${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`,
          color: cs.color,
          fontSize: cs.fontSize,
        };
      });
    });

    const f = await page.$('footer');
    if (f) await f.screenshot({ path: `${OUT}\\foot-check-${name}.png` });
    await page.close();
  }

  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
