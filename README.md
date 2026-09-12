# 天马一站式数据服务中心 · 官网

武汉天马专业数据恢复中心的单页官网，纯静态 HTML，无构建依赖。

> 硬盘 / SSD、RAID / 服务器、U盘 / 内存卡、手机、开盘、监控录像恢复
> 先免费检测，报价透明，恢复成功才收费。

## 目录结构

```
.
├── index.html      # 整站页面（内联 CSS / JS，无构建依赖）
├── logo.svg        # 站点图标 favicon
├── og-cover.jpg    # 社交平台分享封面
├── wechat-qr.jpg   # 微信好友码
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

仓库已启用 Pages（分支 `main` / 根目录）。推送到 `main` 后自动发布，地址形如：

```
https://<用户名>.github.io/tianma-data-recovery/
```

### EdgeOne Makers

同一份代码也已部署在腾讯 EdgeOne Makers，项目名 `tianma-data-recovery`。

## 联系

- 到店：武汉市江汉区民主一街 177 号 新星电脑城二楼
- 电话：186 9612 8515
