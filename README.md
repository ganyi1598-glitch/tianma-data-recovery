# 天马一站式数据服务中心 · 官网

武汉天马专业数据恢复中心的单页官网，纯静态 HTML，无构建依赖。

> 硬盘 / SSD、RAID / 服务器、U盘 / 内存卡、手机、开盘、监控录像恢复
> 先免费检测，报价透明，恢复成功才收费。

## 目录结构

```
.
├── index.html            # 整站页面（内联 CSS / JS，无构建依赖）
├── logo.svg              # 矢量 logo（浏览器标签页图标）
├── og-cover.jpg          # 社交平台分享封面
├── wechat-qr.jpg         # 微信好友码
├── icon-192.png          # 桌面图标 192×192
├── icon-512.png          # 桌面图标 512×512
├── apple-touch-icon.png  # 桌面图标 180×180（iOS 专用）
├── manifest.webmanifest  # PWA 清单
├── sw.js                 # Service Worker（network-first）
├── tools/gen-icons.js    # 由 logo.svg 生成上述 PNG 图标
├── .gitignore
└── README.md
```

## 本地预览

直接双击 `index.html` 即可，或起一个静态服务：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 部署

### GitHub Pages

仓库已启用 Pages（分支 `main` / 根目录），推送到 `main` 后自动重新发布：

```
https://ganyi1598-glitch.github.io/tianma-data-recovery/
```

### EdgeOne Makers

同一份代码同步部署在腾讯 EdgeOne Makers（项目名 `tianma-data-recovery`）。

GitHub 版本已剥离 EdgeOne Pages 平台注入脚本 `unified.js`，其余内容与线上一字不差。

## 添加到手机桌面

本站已配置为可安装的 Web App（PWA），桌面图标由 `logo.svg` 光栅化而来。

- **iPhone / iPad**：用 **Safari** 打开网址 → 底部分享按钮 → 「添加到主屏幕」
- **Android**：用 **Chrome** 打开网址 → 右上角 ⋮ → 「安装应用」/「添加到主屏幕」
- **国产浏览器**（华为 / 小米 / QQ 等）：菜单里的「添加到桌面」

> ⚠️ 微信、QQ 等**内置浏览器不支持**添加到桌面，必须用系统浏览器打开。
> 添加后点击图标会以独立窗口运行，不显示浏览器地址栏。

### 换了 logo 之后重新生成图标

```bash
npm i @resvg/resvg-js
node tools/gen-icons.js
```

## 联系

- 到店：武汉市江汉区民主一街 177 号 · 新星电脑城二楼
- 电话：184 0271 8242
- 营业时间：周一至周日 10:00 — 18:00
