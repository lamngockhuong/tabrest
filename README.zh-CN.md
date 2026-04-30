🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 **简体中文** <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  让标签页得到休息，释放内存 - 一款自动释放闲置标签页的 Chrome 扩展。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome" alt="Manifest V3">
  <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?branch=main&logo=github" alt="CI Status">
  <img src="https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome" alt="Code Style: Biome">
  <img src="https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=black" alt="JavaScript ES Modules">
  <img src="https://img.shields.io/github/license/lamngockhuong/tabrest" alt="License">
</p>

## 功能特性

- **自动释放闲置标签页** - 可配置计时器（5 分钟至 4 小时）
- **内存阈值** - 当 RAM 超过 60-95% 时释放标签页
- **单标签页内存限制** - 释放 JS heap 占用超过 100MB-1GB 的标签页
- **启动时释放** - 浏览器启动时释放内存
- **手动控制** - 释放当前/左侧/右侧/其他标签页
- **关闭重复标签页** - 一键去重当前窗口中的标签页
- **标签页搜索** - 按标题或 URL 实时筛选标签页列表
- **标签组** - 释放整个标签组
- **侧边栏模式** - 在 Chrome 侧边栏中打开 TabRest（可选开启）
- **暂停标签页/网站** - 临时保护标签页或域名（30 分钟至 2 小时）
- **释放前警告提示** - 自动丢弃前在页面显示 3 秒提示
- **视觉标识** - 已丢弃标签页标题上显示可自定义前缀（💤）
- **白名单** - 保护网站免遭自动释放（支持 localhost 及 IP）
- **导入/导出** - 将白名单、黑名单和会话备份为 JSON 文件
- **会话** - 保存并恢复标签页组合
- **滚动位置恢复** - 标签页重新加载时恢复滚动位置
- **YouTube 时间戳** - 重新加载后从上次播放位置继续视频
- **离线时跳过** - 网络不可用时不丢弃标签页
- **仅闲置时释放** - 仅在计算机空闲时自动释放标签页
- **电源模式** - 省电、普通或高性能配置
- **自动释放通知** - 标签页被释放时收到通知
- **内存提示气泡** - 悬停统计数据可查看每个标签页估计节省的 RAM
- **引导向导** - 首次运行时的交互式多步骤设置
- **可选错误报告** - 通过 Sentry 匿名发送崩溃报告（默认关闭），并支持手动提交错误报告
- **自动打开更新日志** - 在次要/主要版本更新时自动打开发布说明
- **可选主机权限** - 仅在启用表单保护时申请访问权限
- **RAM 使用显示** - 在弹窗顶部实时显示 RAM 百分比
- **统计数据** - 追踪已释放的标签页数量及节省的内存
- **多语言** - 支持 11 种语言

## 键盘快捷键

| 快捷键        | 操作           |
| ------------- | -------------- |
| `Alt+Shift+D` | 释放当前标签页 |
| `Alt+Shift+O` | 释放其他标签页 |
| `Alt+Shift+→` | 释放右侧标签页 |
| `Alt+Shift+←` | 释放左侧标签页 |

## 安装

### 从源代码安装

1. 克隆此仓库
2. 在 Chrome 中打开 `chrome://extensions`
3. 启用「开发者模式」（右上角）
4. 点击「加载已解压的扩展程序」
5. 选择项目文件夹

### 从 Chrome Web Store 安装

即将上线。

## 工作原理

TabRest 使用 Chrome 原生 `chrome.tabs.discard()` API 来释放标签页。已丢弃的标签页：

- 仍显示在标签栏中
- 保留滚动位置和表单数据
- 点击后立即重新加载
- 闲置期间释放内存

## 项目结构

```text
tabrest/
├── manifest.json           # 扩展配置（MV3）
├── _locales/               # i18n 翻译文件（en、vi）
├── src/
│   ├── background/         # Service worker 模块
│   ├── content/            # 表单检测器、YouTube 跟踪器
│   ├── popup/              # 弹窗/侧边栏 UI
│   ├── options/            # 设置页面
│   ├── pages/              # 引导页、更新日志
│   └── shared/             # 共享工具模块
├── icons/                  # 扩展图标
├── website/                # Astro 文档站点（tabrest.ohnice.app）
└── docs/                   # 项目文档
```

## 开发

```bash
pnpm install          # 安装依赖
pnpm run lint         # 使用 Biome 检查代码
pnpm run lint:fix     # 自动修复 lint 问题
pnpm run format       # 格式化代码
pnpm run ci           # 运行完整 CI（validate + lint）
```

## 推广素材

Chrome Web Store 推广图片以 SVG 格式存放在 `assets/` 目录中。

```bash
./scripts/generate-promo-images.sh   # 生成 PNG 文件
```

## 隐私

- 不收集任何数据
- 无外部服务器
- 所有设置均在本地存储
- 查看[隐私政策](docs/privacy-policy.md)

## 赞助

如果您觉得此扩展有用，欢迎支持其开发：

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## 其他项目

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - 跨浏览器扩展，通过生产力功能增强 GitHub 界面
- [Termote](https://github.com/lamngockhuong/termote) - 通过 PWA 从移动端/桌面端远程控制 CLI 工具（Claude Code、GitHub Copilot 及任意终端）

## 许可证

MIT
