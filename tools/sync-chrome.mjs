#!/usr/bin/env node
/**
 * 导航 / 页脚同步脚本
 *
 * 为什么需要它：站点拆成多页后，导航与页脚在每个页面里都要有一份（SEO 要求 HTML 里真实存在）。
 * 手工维护 8 份必然漏改。本脚本把 chrome/nav.html 与 chrome/footer.html 的内容
 * 注入到每个页面里成对的标记之间，改一次导航只改 chrome/ 下一个文件，然后跑一次本脚本。
 *
 * 用法：
 *   node tools/sync-chrome.mjs           # 写入
 *   node tools/sync-chrome.mjs --check   # 只检查是否一致，不写入（CI / 部署前用）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const NAV_MARK = ['<!-- NAV:START -->', '<!-- NAV:END -->'];
const FOOT_MARK = ['<!-- FOOTER:START -->', '<!-- FOOTER:END -->'];

function readChrome(name) {
  const p = path.join(ROOT, 'chrome', name);
  if (!fs.existsSync(p)) {
    console.error(`✗ 找不到 ${p}`);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8').trimEnd();
}

/** 用 content 替换 text 中 [start, end] 之间的部分（含标记本身保留） */
function inject(text, [start, end], content) {
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i === -1 || j === -1 || j < i) return null;
  return text.slice(0, i + start.length) + '\n' + content + '\n' + text.slice(j);
}

const nav = readChrome('nav.html');
const foot = readChrome('footer.html');

const SKIP = new Set(['chrome', 'docs', 'node_modules', '.git', '.edgeone', 'tools', 'assets']);

const pages = fs.readdirSync(ROOT).filter(f => {
  if (!f.endsWith('.html')) return false;
  return !SKIP.has(f);
});

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
  console.error(`✗ 有 ${changed} 个页面的导航/页脚与 chrome/ 不一致 → 跑 \`node tools/sync-chrome.mjs\` 修复`);
  process.exit(1);
}
console.log(`${CHECK ? '检查完成' : '同步完成'}：共 ${pages.length} 页，${changed} 个${CHECK ? '需同步' : '已更新'}，${same} 个已一致`);
