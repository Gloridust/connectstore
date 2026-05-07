# ConnectStore

> 纯前端的 App Store 资料工作台 — 给独立开发者管理多个 app 的上架文案、生成符合规范的截图海报。

所有数据保存在浏览器 `localStorage`，不上传任何服务器。打开页面即可使用，关掉浏览器数据也在。

## 功能

### 多项目管理
- 左侧栏列出所有项目，点击切换
- 每个项目有独立的颜色标识（关键色）
- 支持新建、重命名、删除（需确认）

### 上架资料编辑器
- 内置 9 个 App Store Connect 标准字段（应用名、副标题、推广文本、描述、关键词、版本新增内容、3 个 URL）
- 字段带 Apple 官方字符上限校验（30 / 30 / 170 / 4000 / 100 / 4000），超限红色提示
- 多语言并排显示，每个字段对每个 locale 独立填写
- 可隐藏不需要的默认字段，也可一键还原
- 支持新增**自定义字段**（id / 双语 label / 类型 text/textarea/url / 可选最大长度）
- 支持新增 locale（12 个 App Store 常用语言预设，也可自定义编码）
- 一键导出整个项目的字段配置 + 数据为 JSON

### 截图海报生成器
**配色**：
- 选一个**关键色**，自动派生 9 色配色方案（米色背景 / 卡片色 / 主墨色 / 辅墨色 / 4 级文字灰 / 互补强调色）
- 7 个内置预设色（蓝、绿、红、琥珀、紫、青、黑），点击切换
- 配色色卡实时预览

**海报**：
- 一个项目可创建任意数量海报，每张可独立设置：
  - **设备**：iPhone 6.9″ / 6.7″ / 6.5″ / 5.5″、iPad 13″ / iPad Pro 12.9″（输出尺寸严格按 Apple [App Store screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)）
  - **文案语言**：从项目的 locales 中选
  - **副标题（eyebrow）/ 主标题（headline，支持 `<em>...</em>` 斜体强调）/ 描述（body）**
  - **真机截图上传**：本地上传后填进设备外壳，按设备屏幕比例裁切
- 底部品牌水印按 locale 显示对应语言的应用名（带可选斜体后缀）
- 卡片预览实时缩放，所见即所得

**导出**：
- 单张「导出 PNG」按钮：按设备的原生像素尺寸导出（如 1290×2796）
- 「导出全部 (ZIP)」：批量打包整个项目所有海报
- 文件名包含项目名、海报 id、locale、像素尺寸，便于上传 App Store Connect

### 国际化
- 工具自身界面支持中 / 英切换（不影响用户编辑的项目数据）
- 项目数据本身完全多语言，每个字段值按 locale 分开存储

## 技术栈

- **Vite 8** + **React 19**（无 TypeScript，纯 JSX）
- **html-to-image** 把海报 DOM 渲染为 PNG
- **JSZip** 批量打包
- 状态管理：原生 `useSyncExternalStore` + `localStorage`，无 Redux / Zustand
- 字体：Google Fonts 的 Fraunces（衬线）+ Inter（无衬线）
- 配色生成器：HSL 色彩空间，从单色派生整套调色板（[colors.js](src/utils/colors.js)）

## 启动

```bash
npm install
npm run dev
```

打开 http://localhost:5173 即可。

```bash
npm run build       # 产出静态文件到 dist/
npm run preview     # 本地预览构建结果
```

构建后的 `dist/` 是纯静态资源，可以直接部署到 GitHub Pages、Cloudflare Pages、Vercel、Netlify 等。

## 数据存储

所有数据保存在 `localStorage`，键名 `connectstore.v1`，结构形如：

```jsonc
{
  "version": 1,
  "uiLang": "zh",
  "currentProjectId": "p_xxxxxx",
  "projects": {
    "p_xxxxxx": {
      "id": "p_xxxxxx",
      "name": "阅迹 Pro",
      "createdAt": 1715000000000,
      "updatedAt": 1715000000000,
      "locales": ["en-US", "zh-Hans"],
      "fields": [/* 自定义字段，默认字段在代码里 */],
      "hiddenDefaults": [],
      "values": {
        "name": { "en-US": "...", "zh-Hans": "..." },
        "subtitle": { "en-US": "...", "zh-Hans": "..." }
      },
      "theme": { "keyColor": "#1a2f66" },
      "appName": {
        "en-US": { "main": "Yueji", "accent": "Pro" }
      },
      "posters": [
        {
          "id": "shot_xxx",
          "device": "iphone-6.9",
          "locale": "zh-Hans",
          "copy": { "eyebrow": "...", "headline": "...", "body": "..." },
          "screenshot": { "dataUrl": "data:image/png;base64,...", "name": "1.png" }
        }
      ]
    }
  }
}
```

> ⚠️ 真机截图以 base64 存在 `localStorage` 里。浏览器的 `localStorage` 配额通常是 5–10 MB，存太多大图会爆。如有更大需求可换 IndexedDB（未来工作）。

## 设备规格速查

| 设备                     | 输出尺寸    |
| ------------------------ | ----------- |
| iPhone 6.9″ / 6.7″       | 1290 × 2796 |
| iPhone 6.5″              | 1284 × 2778 |
| iPhone 5.5″              | 1242 × 2208 |
| iPad 13″ (M4)            | 2064 × 2752 |
| iPad Pro 12.9″           | 2048 × 2732 |

> 上传的真机截图最好等比例匹配；不匹配时按 `object-fit: cover` 居中裁切。

## 目录结构

```
src/
├── App.jsx                       # 顶层布局
├── main.jsx
├── index.css
├── i18n.js                       # UI 自身的中英文文案
├── state/
│   ├── storage.js                # localStorage 读写、项目 CRUD
│   └── useStore.js               # React 订阅 hook
├── utils/
│   ├── devices.js                # Apple 设备规格表
│   ├── colors.js                 # 关键色 → 调色板
│   └── fields.js                 # 默认字段 + locale 列表
└── components/
    ├── Sidebar.jsx               # 项目列表 + 创建/删除/UI 语言
    ├── MetadataTab.jsx           # 上架资料编辑器
    ├── ScreenshotsTab.jsx        # 截图海报生成器（含 PNG/ZIP 导出）
    └── Poster.jsx                # 单张海报的原生尺寸渲染
```

## 后续可做（Roadmap）

- [ ] 海报模板预设（不同的排版风格）
- [ ] 拖拽排序海报与字段
- [ ] IndexedDB 存储以容纳更多大图
- [ ] 导出/导入项目 JSON 备份文件
- [ ] App Icon 生成（1024×1024 + 各尺寸切图）
- [ ] 直接对接 App Store Connect API 上传

## License

MIT — 见 [LICENSE](LICENSE)。
