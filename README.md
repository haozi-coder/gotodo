# Web综合项目：待办清单系统

## 项目简介
原生 HTML + CSS + ES6 JavaScript 实现的移动端优先响应式待办清单系统。纯前端项目，无构建工具、无第三方依赖，浏览器直接运行。

## 技术栈
- HTML5 语义化标签：`header` / `nav` / `main` / `section` / `article` / `aside` / `footer`
- CSS3：Flex + Grid 响应式布局，媒体查询断点 768px
- 原生 JavaScript（ES6+）：ES Module 模块化、async/await、Fetch API
- HTML5 Canvas API：任务完成率环形图可视化
- HTML 图片懒加载：`loading="lazy"` 属性
- Web Storage（localStorage）数据持久化
- Web Crypto API：SHA-256 加盐哈希（密码演示级加密）

## 功能清单
### 必做功能
1. 三个页面：首页 `index.html`、列表 `list.html`、详情 `detail.html`
2. HTML5 语义标签 header / nav / main / section / article / aside / footer
3. 响应式布局：手机（<768px）单列，桌面（>=768px）两列网格，媒体查询 + Flex/Grid
4. 新增待办表单，前端校验标题长度（3-20 字符）、内容长度（≤100 字）
5. 注册表单含手机号格式校验（11位、1开头）
6. JS 动态渲染任务列表、搜索（同时匹配标题和内容）、筛选（全部/已完成/未完成）
7. 任务增删改交互：新增、标记完成/取消完成、编辑、删除（带确认）

### 提高选做功能
1. LocalStorage 持久化存储，刷新页面数据不丢失
2. Canvas 绘制任务完成率环形图（实时统计可视化）
3. 图片懒加载：`loading="lazy"`，滚动到可视区域才加载图片
4. Fetch 读取本地 `data.json` 加载初始示例数据（仅新用户首次登录）
5. 用户注册/登录，待办数据按用户隔离存储

### 安全与健壮性改进
1. 密码加盐哈希存储（SHA-256 + 随机盐），不再保存明文；旧版明文账号登录时自动迁移
2. innerHTML 拼接前统一经 `escapeHtml()` 转义，防止 XSS 注入
3. localStorage 数据解析失败自动兜底为空，页面不白屏
4. 示例数据只初始化一次（`initLoaded` 标记），任务删光后刷新不会复活

## 页面说明
| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 登录/注册 | `login.html` | 注册、登录；未登录访问任意页面都会跳回此处 |
| 首页总览 | `index.html` | 任务统计（总数/已完成/未完成）、快速新增、最近 3 条任务 |
| 全部任务 | `list.html` | 新增、搜索、筛选、标记完成、删除；桌面端两列网格 |
| 任务详情 | `detail.html` | 查看原任务、编辑标题/内容、删除任务 |

## 运行方式
1. 用 VSCode 打开项目文件夹，安装 Live Server 插件
2. 右键 `index.html` → Open with Live Server，浏览器自动打开
3. 首次打开会跳转到登录页，先注册一个账号再登录（未登录访问任意页面都会跳回登录页）
4. 登录后即可新增/管理任务，数据保存在浏览器 localStorage 中

## 数据存储说明
所有数据存储在浏览器 localStorage 中，键名如下：

| 键名 | 用途 |
| --- | --- |
| `userList` | 已注册用户列表（含盐和密码哈希，不含明文密码） |
| `currentUser` | 当前登录用户名 |
| `user_todo_<用户名>` | 对应用户的待办数据 |
| `user_initLoaded_<用户名>` | 该用户是否已加载过示例数据 |
| `hasShowTip` | 是否已看过欢迎提示 |

> 注意：这是纯前端演示项目，数据仅存在当前浏览器的 localStorage 中，换浏览器或清理缓存会丢失。

## 技术亮点
- **XSS 防护**：所有 innerHTML 拼接前经 `escapeHtml()` 转义，防止任务内容注入脚本
- **数据健壮性**：localStorage 解析失败自动兜底为空数据，不会白屏
- **id 归一化**：地址栏 `?id=1` 取到的是字符串，统一转为数字比较，避免详情页找不到任务
- **示例数据只初始化一次**：`initLoaded` 标记防止用户删光任务后刷新又复活
- **密码加盐哈希**：注册/登录密码经 SHA-256 加盐存储（Web Crypto），不落明文；兼容旧版明文账号自动迁移
- **旧数据兼容**：老用户无初始化标记时只补标记，绝不覆盖已有任务
- **诚实反馈**：任务在别的标签页被删时如实提示，不弹假的"修改成功"
- **搜索覆盖内容**：搜索框同时匹配任务标题和描述

## 目录结构
```
gotodo/
├── index.html        # 首页总览：统计、Canvas环形图、快速新增、最近任务
├── list.html         # 全部任务：搜索、筛选、新增、删除
├── detail.html       # 任务详情：查看、编辑、删除
├── login.html        # 登录 / 注册（含手机号校验）
├── data.json         # 初始示例数据（新用户首次登录加载）
├── README.md
├── css/
│   └── style.css     # 全局样式 + 响应式媒体查询
├── images/
│   └── chart-illustration.svg  # 示意图（懒加载演示）
└── js/
    ├── common.js     # 公共模块：导航/页脚、校验、转义、存储、登录注册
    ├── index.js      # 首页逻辑 + Canvas 环形图绘制
    ├── list.js       # 列表页逻辑
    └── detail.js     # 详情页逻辑
```

## 常见问题
**Q：为什么必须用 Live Server 打开，不能直接双击 html 文件？**
A：页面使用 ES Module（`import`/`export`）和 `fetch`，直接以 `file://` 协议打开会因浏览器跨域限制导致模块加载失败。

**Q：忘记密码怎么办？**
A：演示项目未提供找回密码功能。清除浏览器 localStorage 中的 `userList` 后重新注册即可（会同时清掉所有用户及待办数据）。