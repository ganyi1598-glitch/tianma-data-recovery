#!/usr/bin/env node
/**
 * 公共区块同步脚本（导航 / 联系方式条 / 页脚）
 *
 * 为什么需要它：站点拆成多页后，导航、联系方式、页脚在每个页面里都要有一份
 * （SEO 要求 HTML 里真实存在，不能靠 JS 注入）。手工维护 9 份必然漏改。
 * 本脚本把 chrome/ 下的公共区块注入到每个页面里成对的标记之间，
 * 改一次只改 chrome/ 下一个文件，然后跑一次本脚本。
 *
 * 三个区块：
 *   chrome/nav.html           → <!-- NAV:START -->     ... <!-- NAV:END -->
 *   chrome/contact-strip.html → <!-- CONTACT:START --> ... <!-- CONTACT:END -->
 *   chrome/footer.html        → <!-- FOOTER:START -->  ... <!-- FOOTER:END -->
 *
 * 联系方式条在 contact.html / visit.html 上跳过（这两页自带更完整的联系与导航内容，
 * 且其 CONTACT 标记之间**要求为空**，由本脚本保证）。
 *
 * 用法：
 *   node tools/sync-chrome.mjs           # 写入
 *   node tools/sync-chrome.mjs --check   # 只检查是否一致，不写入（部署前用）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const NAV_MARK = ['<!-- NAV:START -->', '<!-- NAV:END -->'];
const CONTACT_MARK = ['<!-- CONTACT:START -->', '<!-- CONTACT:END -->'];
const FOOT_MARK = ['<!-- FOOTER:START -->', '<!-- FOOTER:END -->'];

/** 这些页面自带联系/导航内容，不注入公共联系方式条 */
const NO_CONTACT_STRIP = new Set(['contact.html', 'visit.html']);

function readChrome(name) {
  const p = path.join(ROOT, 'chrome', name);
  if (!fs.existsSync(p)) {
    console.error(`✗ 找不到 ${p}`);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8').trimEnd();
}

/** 用 content 替换 text 中 [start, end] 之间的部分（标记本身保留） */
function inject(text, [start, end], content) {
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i === -1 || j === -1 || j < i) return null;
  return text.slice(0, i + start.length) + '\n' + content + '\n' + text.slice(j);
}

/** 取出 [start, end] 之间的原内容 */
function inner(text, [start, end]) {
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i === -1 || j === -1 || j < i) return null;
  return text.slice(i + start.length, j).trim();
}

const nav = readChrome('nav.html');
const contactStrip = readChrome('contact-strip.html');
const foot = readChrome('footer.html');

const SKIP = new Set(['chrome', 'docs', 'node_modules', '.git', '.edgeone', 'tools', 'assets']);

const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !SKIP.has(f));

if (!pages.length) {
  console.error('✗ 没找到任何页面 html');
  process.exit(1);
}

let changed = 0, same = 0, bad = [];
for (const f of pages) {
  const p = path.join(ROOT, f);
  const src = fs.readFileSync(p, 'utf8');

  let out = inject(src, NAV_MARK, nav);
  if (out === null) { bad.push(`${f}（缺 NAV 标记）`); continue; }

  if (inner(out, CONTACT_MARK) === null) { bad.push(`${f}（缺 CONTACT 标记）`); continue; }
  out = inject(out, CONTACT_MARK, NO_CONTACT_STRIP.has(f) ? '' : contactStrip);

  out = inject(out, FOOT_MARK, foot);
  if (out === null) { bad.push(`${f}（缺 FOOTER 标记）`); continue; }

  if (out === src) { same++; continue; }
  changed++;
  if (!CHECK) fs.writeFileSync(p, out);
  console.log(`  ${CHECK ? '· 需同步' : '✓ 已同步'}  ${f}`);
}

console.log('');
if (bad.length) {
  console.error('✗ 以下页面缺标记，未处理：\n  - ' + bad.join('\n  - '));
  process.exit(1);
}
if (CHECK && changed) {
  console.error(`✗ 有 ${changed} 个页面的公共区块与 chrome/ 不一致 → 跑 \`node tools/sync-chrome.mjs\` 修复`);
  process.exit(1);
}
console.log(`${CHECK ? '检查完成' : '同步完成'}：共 ${pages.length} 页，${changed} 个${CHECK ? '需同步' : '已更新'}，${same} 个已一致`);
