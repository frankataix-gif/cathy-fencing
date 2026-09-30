# Cathy He （何云熙）击剑专属 AI

You are the dedicated fencing AI for Cathy He (何云熙), a 2014-born Y14 Foil fencer from Vancouver, BC, USA Fencing Region 1.

## Always consult these data files before answering
- `cathy_data/index.md` — database overview
- `cathy_data/profile.md` — Cathy 个人信息
- `cathy_data/handbook.md` — USA Fencing 规则大纲
- `cathy_data/tournaments.md` — 赛事数据
- `cathy_data/results.md` — 比赛成绩
- `cathy_data/physical.md` — 体能数据
- `cathy_data/history.md` — 训练/参赛历史
- `fencing_tournament_helper.html` — 赛事可视化工具及 TOURNAMENTS 数组

## Rules of engagement
- Answer in Chinese, with English fencing terms where helpful.
- Use Vancouver / Pacific Time for all dates and greetings.
- Never log in to USA Fencing; only use public info or data the user provides.
- Do not make up rules, dates, or tournament info; ground answers in the files above.
- If a requested detail is not in the database, ask the user to update the relevant `.md` file or paste the source text (handbook page, result sheet, etc.).

## UI/UX 通用规范

> 适用于 `fencing_tournament_helper.html` 及所有相关原型/测试页面。

### 1. 确认型操作
- 删除、编辑、清空等不可撤销操作**必须有二次确认**。
- 移动端优先使用浏览器 `confirm()` 或自定义模态框，按钮文案：`确认删除` / `取消`。
- 避免误触：删除按钮用 `.danger`（红色）并远离主操作。

### 2. 输入框与表单
- 所有 `<input>`、`<select>`、`<textarea>` 使用 `box-sizing: border-box;`。
- 宽度按语义设定：
  - 标题/备注等长文本：`width: 100%`
  - 日期/时间/短字段：`width: 120px ~ 160px`
  - 类型选择等中等字段：`width: 120px ~ 180px`
- 小屏（`< 640px`）下所有输入框默认 `width: 100%`，避免横向滚动。
- 每个输入框配 `<label>`，点击可聚焦。

### 3. 按钮规范
- 主操作：`.primary` 蓝色背景 `var(--primary)`。
- 次要/取消：`.secondary` 灰色背景 `#e2e8f0`。
- 危险：`.danger` 红色 `#ef4444`。
- 触摸目标最小 `44px`；按钮内边距 `padding: 8px 16px`。

### 4. 模态框
- 居中显示，宽度 `width: min(90%, 420px)`。
- 点击遮罩或按 ESC 可关闭（移动端加上 `取消` 按钮）。
- 表单模态保留当前值，避免用户重新输入。

### 5. 列表与日历
- 日历中多日事件通过 **track** 保持同一水平线，颜色连续。
- 列表按时间倒序/正序一致，避免排序混用。
- 超长文本使用 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`。

### 6. 响应式
- 移动端优先；避免固定 `px` 宽度导致溢出。
- 日历格子使用 `minmax(0, 1fr)`，防止内容撑开。
- 禁止出现横向滚动条。

### 7. 反馈
- 保存/提交时禁用按钮，完成后显示成功或失败提示。
- 表单验证失败时聚焦到第一个错误字段。

## 设计与实现纪律

1. **先复述，再动手**
   - 用户提出需求后，先简短复述理解。
   - 同时指出该方案的优点和潜在使用问题。
   - 不讲技术原理，只讲重点和用户体验。

2. **尽量一次性做到最终版**
   - 理解用户最终目的后，一次完成到接近最终可用状态。
   - 减少中间确认步骤，避免让用户一步步点下一步。
   - 但涉及删除、清空、付费、发送等不可逆操作前，仍需二次确认。

3. **自测 + 自动修复 bug**
   - 新功能完成后，立即做功能回测（如页面渲染、交互、数据同步）。
   - 发现 bug 主动修复，并告知用户修了哪里。
   - 不回测不推送。

4. **遵循成熟 App 标准**
   - 风格统一：颜色、字体、按钮、卡片、tab、表单等复用已有设计系统。
   - 流程标准：列表、筛选、详情、编辑、删除、确认、空状态、加载、错误提示按成熟 App 惯例实现。
   - 字段一致：相同含义用相同字段名和 UI 文案。
   - 优先实现功能目标，不堆砌花哨效果。

5. **数据先行，界面跟上**
   - `cathy_data/*.md` 是单一数据源。
   - 用户可边填数据边看界面更新，不需要一次性给全。
   - Agent 基于事实回答，没数据时如实说明。

## 最近更新 / Changelog

### 2026-09-03
- 日程（Schedule）功能重写：
  - `+日程` 改为全屏面板编辑，字段包括标题、日期、结束日期、开始/结束时间、类型、地点、地图链接、官网/报名链接、备注。
  - 日程类型统一为 6 类：比赛、训练营、俱乐部训练、体能、拉伸、其他。
  - 倒计时 badge 优化，邻近事件使用醒目颜色区分。
  - 已报名赛事自动同步到日程，取消报名时同步移除。
- GitHub 跨设备数据同步：
  - 新增 Cloudflare Worker `/save` 端点，将本地 `已报名`、`日程`、`出发城市` 等写入 `cathy_data/user_data.json`。
  - 网页启动时自动读取 `cathy_data/user_data.json` 并恢复 localStorage，实现换机同步。
  - `CATHY_SYNC_WORKER_URL` 已预填为 `https://cathysync.frankataix.workers.dev/`。
- 赛事地图：
  - 地图导航地址按赛事类型推断国家（美国/非美国），不再一律追加 USA。
  - 推荐 Cathy 维度细分为 `本地+重要` / `本地距离` / `重要赛事` / `较远但重要` / `Cathy 可报名` / `未推荐`，并对应不同颜色。
  - 地图筛选改为两层：主要筛选（全部 / 推荐 Cathy / 未报名 / 已报名 / 关注赛事）+ 第二层颜色（Region / Circuit），顶部显示当前条件提示。

### 2026-09-29
- 「视频比赛」子 tab（USA Fencing 区）：
  - 每教练独立永久链接 `/coach/<32位token>`，页面按教练语言渲染（中/英/意/法），教练刷新即见全部视频，每 45 秒自动更新。
  - 留言双向 AI 翻译（Workers AI）：教练留言存原文+中文，家长回复自动翻成教练语言；各教练留言串互相隔离。
  - 成绩页每场 bout 行有 📹 上传按钮，视频自动带赛事/轮次/对手/比分上下文进共享 feed（R2 `coach/feed.json`）。
  - 家长侧视频墙按时间倒序展示全部视频 + 逐条/总体留言，可回复指定教练线程；教练链接可撤销（token 立即失效）。
  - `cathy_coaches` 并入多端同步（按 token 并集）。

### 2026-09-09
- 修复 `.github/workflows/update.yml` 稳定性：
  - `import_to_html.py` 改用 bracket counting 替换 `TOURNAMENTS` 数组，避免正则表达式解析失败。
  - `fetch_tournament_entries.py` 在抓取报名人数的同时提取 `live_url`，避免对同一赛事详情页重复请求。
  - 跳过 `not_yet_open` 赛事的详情抓取，减少无效网络请求。
  - 工作流增加 `concurrency` 防止多实例同时运行，推送前 `git pull --rebase` 避免 fast-forward 冲突。
- 赛事地图合并进「赛事」tab，地图筛选与列表完全同步。

### 2026-09-28
- 全方位审计修复：
  - 多设备同步：`syncAllToGitHub` 推送前现在合并 registrations/schedule/reflections（原先只有 tasks 合并，其他整包覆盖会丢数据）；新增日程墓碑（`cathy_schedule_tombstones`）防止已删日程跨设备复活；日程事件带 `updatedAt`。
  - Worker 安全：`save`/`read` 限定 `cathy_data/` 白名单路径，`/file`、`save`、`read` 全部拒绝 `..` 路径穿越。
  - XSS：赛事/日程/成绩/邮件等注入 innerHTML 的字段统一 `escapeHtml`。
  - DOM 修正：`emails-list`→`emails-list-full`、`base-city-input`→`base-city-modal-input`；补上 `upcoming-card`/`upcoming-list` 容器（近期事项卡片之前是死代码）；邮件加载失败回退本地缓存。
  - 注意：sync 内部写 localStorage 要用 `saveUIToLocal`（不触发 queueAutoSync），否则 `cathy_schedule_events`/`cathy_reflections` 会引发无限同步循环。
- Apps Script 查重改走 Worker `read`（raw CDN 延迟会导致重复推送）。

### 2026-09-29
- 比赛视频功能（Cloudflare R2）：
  - 新 Worker `cathyvideos.frankataix.workers.dev`（`video_worker.js`），绑定 R2 桶 `cathy-videos`；独立于 cathysync，无密钥依赖。
  - 上传：App 分片 15MB → Worker → R2 multipart；播放：`/video/<key>` 流式 + Range 拖进度。
  - App：赛事卡片「📹 视频」区上传/打开；「我的 → 比赛视频库」管理（复制链接发教练、>90 天建议归档 YouTube、删除）；记录存 user_data.json `videos` 并集合并。
  - 部署：`python deploy_video_worker.py`（Temp 目录，PUT multipart 含 VIDEOS binding + POST subdomain 启用 workers.dev）。
  - R2 成本：10GB 免费，超出 $0.015/GB/月，流量免费；100GB ≈ $1.35/月。

### 2026-09-30
- 顶部导航改为纯文字 5 项：`赛事 视频 日程 邮件 我的`（无图标，均分宽度）；赛事内子 tab：`USA Fencing / 成绩 / AI / 会员`。
- 教练页重设计（video_worker.js `renderCoachPage`，已部署）：
  - 教练主页化：蓝色头卡 `Coach {name}` 大字 + 「Cathy He · Foil · Vancouver — 学员」副标 + 🌐 语言自选（18 种内置 + 自定义语言 AI 翻译缓存）。
  - 视频三级分组：赛事(粘性标题,可带 `tUrl` 跳 USA Fencing 官方页) → 对阵(回合标题) → 视频片段缩略图格（`preload=metadata` 首帧 + ▶ 遮罩 + 时长角标 + NEW 标记）。
  - NEW 标记：feed 带 `uploadedAt`，教练打开页面后 POST `coach_seen` 回写 `meta.lastSeen`，比它新的视频标 NEW、头部显示「N new since last visit」。
  - 留言 IG 式折叠：按对阵聚合该 bout 全部片段的留言，`💬 N comments` 点击展开；留言挂在该对阵第一个视频 id 上；相对时间（m/h/d）。
  - 手动 ⟳ 刷新 + 更新时间戳 + 45s 轮询保留；视频元素按签名比对重建，留言原地更新不打断播放。
- 家长语言可配置：视频 tab 加「我的留言语言」下拉（`cathy_family_lang`），写入 feed.familyLang；教练留言翻译成该语言（存 `familyText`/`translations[lang]`，zh 时仍写 `zhText` 兼容）。
- 不关联 bout 的「上传视频」先弹窗问活动主体名（可空→「自建活动」）+ 对阵/备注，保证每条视频有归属主体。
- ⚠️ 已知坑：教练页模板字符串里的内嵌 JS 若写 `\'` 会被模板解析成裸 `'` 截断字符串 → 整个脚本语法错误、页面卡 Loading。模板内字符串转义必须写 `\\'` / `\\"`（见 escH）。改完务必用 esprima 校验线上返回页的 `<script>`。
- 部署命令：`python "C:\Users\25534\AppData\Local\Temp\deploy_video_worker.py"`（若被清理，参数见 git 历史/复制 deploy_cathy_worker.py 改 worker 名为 cathyvideos + VIDEOS binding）。
- 视频上传改为后台队列（`_upQueue` / `_upRun` / `_upPaint`，与按钮解耦）：文件选择支持多选；底部浮动进度面板（XHR 字节级进度，可收起/重试/移除/清除）；上传中申请 Wake Lock 防锁屏，分片失败等回前台+联网后最多重试 8 次续传；上传中 beforeunload 和「更新」横幅会先提醒。选 MKV/AVI 等会提示格式教练播不了。限制：iOS 把 App 切到后台时网页 JS 会被挂起，回到前台自动续传。
- 断点续传（跨会话）：选中的视频存 IndexedDB `cathy_uploads`（`files` 存 File 本体、`state` 存 key/uploadId/parts），每传完一片写进度；App 被系统关闭/刷新后，启动时 `_upRestore()` 自动放回队列从断点续传；完成按 R2 key 去重入库并清理本地存储。出错不再 abort（保留断点），用户「移除」才 abort；连续失败 2 次重试会丢弃断点从头传。已用 Playwright 实测：40MB 传 1 片后刷新 → 自动续传完成、IDB 清零。
- App「视频」私密/共享页改为教练页同款（`renderWallInto` + `.vw-*` 样式）：赛事头卡 → 对阵白卡 → 缩略图格（首帧 `#t=0.1`、▶、时长、文件名）；每个视频下 `💬 N`（共享）/ 大小（私密）+ ⋯ 菜单（共享/收回、复制链接、归档 YT、删除）；共享页对阵留言 IG 式折叠（统一时间线 + 回复框）；点缩略图开全屏播放器 `openFamPlayer`（视频 + 本场留言，带时间点可点击跳转）。结构签名不变时只原地更新留言，不重建缩略图（避免视频重载/回复框被清）。MKV 等格式直接显示「浏览器播不了」。Playwright 手机尺寸实测通过。
- iOS 缩略图黑屏：`<video preload=metadata>` 在 iPhone 不画首帧，src 须加 `#t=0.1`（App 与教练页都已加；教练页播放器借缩略图做 poster 改按 `.vcell[data-vid]` 查找）。
- App 留言交互重做（`_cmtHtml` / `_replyBox` / `vwSend` / `vwRec` / `vwAuPlay`）：留言气泡加大字号，教练留言带「↩ 回复」（切到该教练并聚焦），家长留言显示「→ 教练名」；回复框「回复给」教练 chips（默认 = 本线最近留言的教练）+ 圆角输入框（16px 防 iOS 缩放，中文输入法组字回车不误发）+ 发送按钮（发送中禁用、失败保留文字）+ 🎤 录音条（计时 / ⏹ 发送 / ✕ 取消，录音时暂停视频）；语音改自定义小播放器（全局单实例互斥、刷新不打断）；播放器里「⏱ 挂在视频 0:12」开关可把留言挂到当前片段时间点，回复框吸底。旧 `familyComment` / `familyVoice` 已删除。
- 教练页缩略图改为排队截图（`thumbsKick` / `thLoad`）：同时最多加载 2 个视频（iPhone 同时加载太多 `<video>` 会随机报错，旧版一报错就把格子换成「Video failed to load」且不重试），截首帧（黑画面会往后跳到 ~2s 再截）存 localStorage `cth_<id>`，然后释放视频元素；失败重试一次，仍失败显示中性深色格子（仍可点开播放），不再显示报错文字。播放器海报直接用缓存截图。Worker `/video/`：无 Range 请求改回 200（原来误返回 206）。
- 留言数统一口径（两端一致）：视频下「💬 N」= 该片段的留言，点开播放器/分析面板也只列这 N 条；对阵下「💬 N 条留言 / match comments」= 对阵级 + 全部片段留言合并（片段留言标 🎬N / [片段N]，教练页点击可打开该片段并跳到时间点 `openAt`）。App 播放器回复默认挂到当前片段（videoId = 片段 id）。注意：教练页只含本教练线程，App 汇总所有教练，多教练时 App 数字会更大。
- MKV 不再按扩展名拦截：实测这些 MKV（内为浏览器可解码编码）在教练页、Chrome 都能播；App 去掉「MKV 播不了」提示和上传警告，改为按实际加载失败才提示。App 缩略图也改为排队加载（同时 2 个、优先当前可见页、失败重试一次、不显示报错）。
### 2026-09-30 统一播放器 + 家庭钥匙（第一阶段）
- **一套播放器两种身份**（video_worker.js `renderCoachPage(token, meta, t, mode)`）：`/coach/<token>` 教练模式；`/family`（钥匙放网址 `#fk=`，页面存 localStorage `cf_fk`）家庭模式。App 里点共享视频 → 全屏 iframe 打开 `/family?embed=1&v=<id>&s=clip|bout#fk=`，面板关闭时 postMessage `cf-close` 通知 App 关层，`cf-unread` 报未读数。
- 家庭模式：按教练分标签（未读数、颜色点）+「全部」；默认打开有未读 / 最近留言的教练（先看当前片段再看整场）；片段切换 🎬N；范围「片段留言 / 本场留言」；发送区身份 Cathy / 家长 + 「⏱ 挂在当前时间」开关（关 = 整场留言）；进度条标记按教练上色；标签只在准备发送时展开。
- 对话模型：每位教练每场对阵一条对话，留言 videoId = 片段 id（可带 vt）或 `b:赛事~项目~回合~对手~比分`（整场）。author = coach / family / cathy。
- 未读：家长端存服务器 `coach/family_reads.json`（key `<coachId>|<boutId>`，多设备同步，`family_seen`）；教练端存本机 localStorage `cr_<token>`。教练页 lastSeen 只在首次加载时取（修复 15 秒后 NEW 消失）。
- **安全（方案 A）**：教练名单 + 密钥只存 R2 `coach/registry.json`，不再写进公开仓库（App 同步不再上传 coaches / coachTombstones，本机 `cathy_coaches` 清除）。家庭钥匙 SHA-256 存 `coach/family.json`（`family_init` 仅首次可用）。需家庭钥匙：family_data / family_seen / coach_create / coach_import / coach_rename / coach_revoke / coach_rotate / coach_register / feed_save / video_delete / comments_get，以及 author=family|cathy 的 comment_add；comment_del / comment_tags 用教练 token（本人线程）或家庭钥匙。App 本机钥匙 localStorage `cathy_family_key`（打开 App 设置链接 `...#fk=<key>` 自动保存，不同步）。**钥匙不要写进任何仓库文件。**
- **2026-09-30 用户决定不需要家庭钥匙**：video_worker.js `FAMILY_KEY_REQUIRED = false`，所有家长端操作不再校验钥匙（改回 true 即恢复，钥匙哈希仍在 `coach/family.json`，`family_init` 仍锁定）；家庭页 api 带 `fam: 1` 标识家长端（comment_del / comment_tags 据此走 coachId）。App 去掉钥匙检查与提示。教练名单仍只存 R2、不回公开仓库，但接口无鉴权，懂技术的人可直接调用拿到教练链接。
- App「👤 教练」页：服务器要求钥匙时才显示输入框；教练菜单新增「🔄 换新链接」（`coach_rotate`，留言搬到新 token、旧链接立即 404）。
- 翻译提示词加入击剑术语（parata = 防守/格挡，affondo = 弓步）。
- 测试环境：需要时用 `deploy_video_worker_named.py cathyvideos-staging` 临时部署测试 Worker（名字以 -staging 结尾自动绑定独立测试桶 `cathy-videos-staging`，不会动正式数据），测完删除该 Worker；测试桶保留。
### 2026-09-30 日程 / 待办 / 邮件参照「Frank非洲创业」（07_Frank小助手）改进
- 日历修 bug：月初补空格（以前 1 号永远排在星期日列）、点哪天预填哪天（以前总是今天）、高亮今天。
- 日程：编辑器支持 prefill（`openScheduleEditor(event, prefill)`）、多附件（`attach:{images[],files[]}`）、编辑器内删除；列表显示类型名、地点点开 Google 地图、来源邮件。保存时保留事件原有字段（Object.assign）。
- 待办：分类可自定义（「我的 → 设置 → 🏷️ 待办分类」，localStorage `cathy_task_categories` + `cathy_task_categories_at`，同步 payload `taskCategories:{list, updatedAt}`，新的覆盖旧的，`mergeRemoteTaskCats`）；地址字段（地图链接）；多图多文件（`_attachNormalize` 兼容旧 `image`/`pdf`，编辑保存后迁移到 `attach`，旧字段清空）；保留语音；已完成按 updatedAt 倒序。颜色用 `taskCatColor(cat)`。
- 返回手势：`overlayPush/overlayPop` + popstate（`_overlayIgnorePop` 防止按钮关闭时误关下一层）；日程/待办编辑器、视频全屏播放器已接入。
- 邮件：AI 归纳窗口 7 → 30 天（`getWindowCutoffDate` -29，`EMAIL_AI_VERSION` 9，worker 提示词同步）；重绘保持「查看原文」展开和滚动位置；AI 待办加「📧 原邮件」（`jumpToEmailBySource`）；信息通知可点「知道了」（dismiss key `info:<topic>`）。
- 邮件识别日程：worker.js `classifyEmail` 让 AI 额外输出 `日程`（标题/日期/时间/地点，营销邮件不取），写入 emails.md `**日程:** {json}`；App 解析后在邮件卡片显示「📅 … 加入日程」，保存后显示「已在日程」（事件记 `sourceEmailKey`/`sourceSubject`）。**只对新进来的邮件生效。** worker 解析 JSON 改为先贪婪匹配（嵌套对象）。
- cathysync 部署：用 `deploy_cathy_worker_content.py`（PUT `/workers/scripts/cathysync/content`，只换代码、保留绑定和密钥）；旧的 `deploy_cathy_worker.py` 会因要求重填 GITHUB_TOKEN 被拒。
- 待办：MKV/HEVC 格式浏览器播不了（无转码，建议拍 MP4/H.264 或归档 YouTube）；教练语音留言不翻译；国内访问 workers.dev 不稳定，如需要可绑自定义域名。
