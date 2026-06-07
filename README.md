# ConnectStore

> 纯前端的 App Store 资料工作台 — 给独立开发者管理多个 app 的上架文案、生成符合规范的截图海报。

所有数据保存在浏览器本地（**IndexedDB**，配额通常数百 MB 起，足够放下大量真机截图与图标），不上传任何服务器，没有账号、没有后端、没有追踪。打开网页即用，关掉浏览器数据仍在；想换设备就「备份」成一个 JSON 文件再「恢复」。

> [!TIP]
> 第一次打开点 **载入示例项目**，30 秒看到一整套带配色、版式、文案的截图海报长什么样。

## 为什么做这个

上架 App Store 时最磨人的两件事：① 把标题/副标题/关键词/描述按 Apple 的字数限制、按每种语言抄来抄去；② 用 Figma/PS 拼一套规格正确、风格统一的截图海报。市面工具要么要登录上传、要么按月收费、要么导出带水印。ConnectStore 把这两件事放进一个**纯本地、开箱即用、可自由自定义**的网页里。

## 功能

### 多项目管理
- 左侧栏列出所有项目，点击切换
- 每个项目有独立标识：上传了 App 图标就显示图标，否则显示强调色方块
- 新建、重命名、**一键复制整个项目**、删除（需确认）
- **备份 / 恢复**：把全部数据导出成 JSON 文件，换机或回滚时一键导入（合并或替换）

### 上架资料编辑器
- 内置 9 个 App Store Connect 标准字段（应用名、副标题、推广文本、描述、关键词、版本新增内容、3 个 URL）
- 字段带 Apple 官方字符上限校验（30 / 30 / 170 / 4000 / 100 / 4000），超限红色提示
- 多语言并排显示，每个字段对每个 locale 独立填写
- 可隐藏不需要的默认字段，也可一键还原
- 支持新增**自定义字段**（id / 双语 label / 类型 text/textarea/url / 可选最大长度）
- 支持新增 locale（12 个 App Store 常用语言预设，也可自定义编码）
- 一键导出整个项目的字段配置 + 数据为 JSON

### App 图标
- 项目级上传 1024×1024 App 图标（点击或拖拽），用作侧栏标识 + 海报底部品牌徽标

### 截图海报生成器
**双色配色系统**：
- **背景色** 决定海报底色 / 卡片色（任选颜色都会被收敛到可读的高亮度，文字不会糊）
- **强调色** 决定主标题强调字、品牌徽标，并为正文灰度注入同一色温
- 各 7 个预设 + 取色器 + hex 输入，派生出的 10 色方案实时预览

**每张海报独立自定义参数**（核心）：
- **文字位置**：顶部 / 底部 / 隐藏（纯设备图）
- **背景样式**：纯色 / 渐变 / 光晕
- **设备缩放**（0.6–1.3×）、**上下偏移**、**旋转**（±12°，做斜放风格）、**字号缩放**（0.7–1.4×）
- **显示/隐藏设备外壳**、**显示/隐藏底部水印**
- 调好一张后「**应用此版式到全部海报**」，整组瞬间统一
- 新建海报自动继承上一张的版式与设备，保证一套截图风格一致

**设备与内容**：
- **设备**：iPhone 6.9″ / 6.7″ / 6.5″ / 5.5″、iPad 13″ / iPad Pro 12.9″，输出尺寸严格按 Apple [App Store screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)；设备外壳按机型还原灵动岛 / 刘海 / Home 键
- **文案语言**：从项目的 locales 中选
- **副标题 / 主标题（支持 `<em>...</em>` 斜体强调）/ 描述**，全部所见即所得实时预览
- **真机截图上传**：点击或拖拽（编辑区与海报区都能拖），按设备屏幕比例裁切
- **拖拽重排**海报顺序、复制、删除

**导出**：
- 单张「导出 PNG」：按设备原生像素尺寸导出（如 1290×2796）
- 「导出全部 (ZIP)」：批量打包整个项目所有海报
- 文件名含项目名、海报 id、locale、像素尺寸，便于上传 App Store Connect

### 国际化
- 工具自身界面支持中 / 英切换（不影响用户编辑的项目数据）
- 项目数据本身完全多语言，每个字段值按 locale 分开存储

## 技术栈

- **Vite 8** + **React 19**（无 TypeScript，纯 JSX）
- **html-to-image** 把海报 DOM 渲染为 PNG
- **JSZip** 批量打包
- 状态管理：原生 `useSyncExternalStore`（同步内存树）+ **IndexedDB** 持久化（localStorage 兜底），无 Redux / Zustand
- 字体：Google Fonts 的 Fraunces（衬线）+ Inter（无衬线）
- 配色生成器：HSL 色彩空间，从背景色 + 强调色派生整套调色板（[colors.js](src/utils/colors.js)）
- **Vitest** 单元测试覆盖配色、设备规格、字段、版式、存储逻辑（40 个用例）

## 启动

```bash
npm install
npm run dev          # 开发服务器 http://localhost:5173
```

```bash
npm run build        # 产出静态文件到 dist/
npm run preview      # 本地预览构建结果
npm test             # 跑单元测试
npm run lint         # ESLint
```

构建后的 `dist/` 是纯静态资源，可以直接部署到 GitHub Pages、Cloudflare Pages、Vercel、Netlify 等。

## 数据存储

数据保存在 **IndexedDB**（数据库 `connectstore` → object store `kv` → 键 `state`）。内存里维持一份同步状态树，写入时防抖（250ms）异步落盘，离开页面前 flush，避免丢失最后的编辑。结构形如：

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
      "icon": { "dataUrl": "data:image/png;base64,...", "name": "icon.png" },
      "theme": { "bgColor": "#f4ecd8", "accentColor": "#1a2f66" },
      "appName": {
        "en-US": { "main": "Yueji", "accent": "Pro" }
      },
      "posters": [
        {
          "id": "shot_xxx",
          "device": "iphone-6.9",
          "locale": "zh-Hans",
          "copy": { "eyebrow": "...", "headline": "...", "body": "..." },
          "screenshot": { "dataUrl": "data:image/png;base64,...", "name": "1.png" },
          "layout": {
            "textPos": "top",        // top | bottom | none
            "bgStyle": "gradient",   // solid | gradient | radial
            "deviceScale": 1, "deviceOffsetY": 0, "rotation": 0, "fontScale": 1,
            "showDevice": true, "showFooter": true
          }
        }
      ]
    }
  }
}
```

> 自动迁移：① 旧版若有 `localStorage['connectstore.v1']` 数据，首次启动会自动搬进 IndexedDB 并清掉旧键；② `theme.keyColor` 会被当作 `accentColor`；③ 缺失的 `layout` 字段回落到默认值。

> 真机截图与 App 图标以 base64 内联存储。IndexedDB 配额远大于 localStorage（通常按可用磁盘比例计，数百 MB 起），侧栏底部会显示当前已用量。无 IndexedDB 的环境（极旧浏览器 / 测试）会自动回退到 `localStorage`。

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
├── App.jsx                       # 顶层布局 + 空状态
├── main.jsx
├── index.css
├── i18n.js                       # UI 自身的中英文文案
├── state/
│   ├── idb.js                    # IndexedDB key/value 封装 + 容量估算
│   ├── storage.js                # 状态树 + IDB 持久化/迁移、项目 CRUD、备份/恢复、示例
│   ├── storage.test.js
│   └── useStore.js               # React 订阅 hook
├── utils/
│   ├── devices.js                # Apple 设备规格表          (+ .test.js)
│   ├── colors.js                 # 双色 → 调色板 / 背景      (+ .test.js)
│   ├── fields.js                 # 默认字段 + locale 列表    (+ .test.js)
│   └── layout.js                 # 海报版式模型              (+ layout.test.js)
└── components/
    ├── Sidebar.jsx               # 项目列表 + 备份/恢复 + UI 语言
    ├── MetadataTab.jsx           # 上架资料编辑器
    ├── IconUpload.jsx            # App 图标上传
    ├── ScreenshotsTab.jsx        # 截图海报生成器（配色/版式/PNG/ZIP）
    └── Poster.jsx                # 单张海报的原生尺寸渲染
```

## 后续可做（Roadmap）

- [ ] 海报模板预设（一键套用排版风格）
- [ ] App Icon 生成（1024×1024 + 各尺寸切图）
- [ ] 直接对接 App Store Connect API 上传
- [x] ~~IndexedDB 存储以容纳更多大图~~
- [x] ~~导出/导入项目 JSON 备份文件~~
- [x] ~~海报排版风格自定义（文字位置/背景/缩放/旋转）~~
- [x] ~~重排海报顺序~~

## License

MIT — 见 [LICENSE](LICENSE)。
