/**
 * 由 logo.svg 生成手机桌面图标（PNG）
 *
 * 用法：
 *   npm i @resvg/resvg-js
 *   node tools/gen-icons.js
 *
 * 产出（写入项目根目录）：
 *   apple-touch-icon.png  180x180  iOS「添加到主屏幕」
 *   icon-192.png          192x192  Android manifest
 *   icon-512.png          512x512  Android manifest / 启动画面
 *
 * 说明：iOS 不支持 SVG 图标，且透明背景会被系统填成黑色，
 *      因此这里统一合成白底，并按图形真实包围盒精确居中。
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'logo.svg'), 'utf8');

// 1) 探测图形真实包围盒（viewBox 未必紧贴图形，靠它才能精确居中）
const probe = new Resvg(raw);
const bb = probe.getBBox();
const bx = bb.x !== undefined ? bb.x : bb.left;
const by = bb.y !== undefined ? bb.y : bb.top;
console.log(`图形包围盒: x=${bx.toFixed(2)} y=${by.toFixed(2)} w=${bb.width.toFixed(2)} h=${bb.height.toFixed(2)}`);

// 2) 抽出 <svg> 内部内容，重新合成到正方形画布
const inner = raw
  .replace(/^[\s\S]*?<svg[^>]*>/i, '')
  .replace(/<\/svg>\s*$/i, '')
  .trim();

const CANVAS = 100;
const PAD = 0.16;       // 四周留白 16%，同时满足 maskable 安全区要求
const BG = '#ffffff';   // 白底
const FG = '#2563EB';   // logo 原色，与页面 --accent 一致

function build(size) {
  const avail = CANVAS * (1 - 2 * PAD);
  const k = Math.min(avail / bb.width, avail / bb.height);
  const w = bb.width * k;
  const h = bb.height * k;
  const tx = (CANVAS - w) / 2 - bx * k;
  const ty = (CANVAS - h) / 2 - by * k;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${size}" height="${size}">` +
    `<rect width="${CANVAS}" height="${CANVAS}" fill="${BG}"/>` +
    `<g fill="${FG}" transform="translate(${tx.toFixed(4)} ${ty.toFixed(4)}) scale(${k.toFixed(6)})">${inner}</g>` +
    `</svg>`;

  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

const targets = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

for (const [name, size] of targets) {
  const png = build(size);
  fs.writeFileSync(path.join(ROOT, name), png);
  console.log(`${name.padEnd(22)} ${size}x${size}  ${String(png.length).padStart(7)} bytes`);
}
