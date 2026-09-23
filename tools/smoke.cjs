// 冒烟测试：JS 报错、锚点跳转、自检表单、二维码弹窗
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FILE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(FILE, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  const result = { errors };

  // 1. 关键区块存在
  result.sections = await page.evaluate(() =>
    ['#services', '#pricing', '#process', '#faq', '#contact', '#check']
      .filter(s => !document.querySelector(s)).map(s => 'MISSING ' + s));

  // 2. 价格卡片完整性
  result.priceCards = await page.evaluate(() =>
    [...document.querySelectorAll('.ptable')].map(c => ({
      id: c.id,
      rows: c.querySelectorAll('tbody tr').length,
      hasPrice: !!c.querySelector('.price'),
    })));

  // 3. 服务卡片锚点跳转（DOM 直接触发，避免视口外不可点击）
  await page.evaluate(() => document.querySelector('.svc[data-target="#pt-nas"]').click());
  await new Promise(r => setTimeout(r, 900));
  result.anchorJump = await page.evaluate(() => ({
    hash: location.hash,
    nasVisible: (() => { const r = document.querySelector('#pt-nas').getBoundingClientRect(); return r.top > -300 && r.top < window.innerHeight; })(),
  }));

  // 4. 自检表单可交互（选设备类型）
  await page.evaluate(() => document.querySelector('#check').scrollIntoView());
  await new Promise(r => setTimeout(r, 400));
  const hasRadio = await page.evaluate(() => {
    const r = document.querySelector('input[name="dt"][value="机械硬盘"]');
    if (!r) return false;
    r.click();
    return true;
  });
  result.formCheck = hasRadio
    ? await page.evaluate(() => ({ selected: document.querySelector('input[name="dt"][value="机械硬盘"]').checked }))
    : 'RADIO_NOT_FOUND';

  // 5. 加好友按钮 → 二维码弹窗
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  const hasFab = await page.evaluate(() => {
    const b = document.querySelector('[data-fab-addfriend]');
    if (!b) return false;
    b.click();
    return true;
  });
  await new Promise(r => setTimeout(r, 600));
  result.qrLightbox = hasFab
    ? await page.evaluate(() => {
        const lb = document.querySelector('.qr-lightbox');
        if (!lb) return 'NOT_FOUND';
        const cs = getComputedStyle(lb);
        return { visible: cs.display !== 'none' && cs.opacity !== '0', display: cs.display };
      })
    : 'FAB_NOT_FOUND';

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
