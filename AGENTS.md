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
- If a requested detail is not in the database, ask the user to update the relevant `.md` file or paste the source text.

---

# Cathy 小助手（App）现状说明 — 截至 2026-09-30

## 1. 架构

| 部分 | 位置 | 说明 |
|---|---|---|
| App（PWA） | `fencing_tournament_helper.html`（单文件）→ GitHub Pages `https://frankataix-gif.github.io/cathy-fencing/fencing_tournament_helper.html` | 推送 main 后 1–2 分钟生效 |
| 数据同步服务 | `worker.js` → Cloudflare Worker `cathysync.frankataix.workers.dev` | GitHub 读写（`read`/`save`/`/file`，限 `cathy_data/` 白名单、拒绝 `..`）、邮件归类与 AI 归纳 |
| 视频 / 教练服务 | `video_worker.js` → Worker `cathyvideos.frankataix.workers.dev`，R2 桶 `cathy-videos` | 视频存取、教练页、家庭页、留言、翻译 |
| 数据 | `cathy_data/`（**公开仓库** `frankataix-gif/cathy-fencing`） | `user_data.json`、`emails.md`、`email_rules.json`、`results.json` 等 |
| 邮件推送 | `gmail_sync_script.gs`（Apps Script） | Gmail → cathysync `email` action |
| 赛事数据 | `.github/workflows/update.yml` + `cathy_data/*.py` | 定时抓 USA Fencing，更新 TOURNAMENTS 数组 |

顶部导航：`赛事 视频 日程 邮件 我的`；赛事内子页：`USA Fencing / 成绩 / AI / 会员`。

## 2. 功能总览

### 赛事
- USA Fencing 赛事列表 + 地图（筛选：全部 / 推荐 Cathy / 未报名 / 已报名 / 关注；第二层 Region / Circuit 颜色），报名人数、live 链接、距离与车程。
- 报名 / 关注状态；已报名赛事自动同步进日程，取消报名同步移除。
- 成绩页：每场对阵可写反思、📹 上传视频（自动带赛事 / 回合 / 对手 / 比分）。

### 视频（App「视频」页 + 教练页 + 家庭页）
- **上传**：多选、后台队列、底部进度面板（字节级进度、重试 / 移除 / 清除），上传中防锁屏；视频存 IndexedDB `cathy_uploads` 做**跨会话断点续传**（App 被关掉后重开自动续传）。iOS 切到后台时暂停，回前台继续。
- **私密 / 共享 / 教练** 三个子页；共享视频同步到 R2 `coach/feed.json`（打开 App、打开视频前都会推一次）。
- **一套播放器两种身份**（`video_worker.js renderCoachPage(token, meta, t, mode)`）：
  - 教练：`/coach/<token>`，每位教练一条专属链接、自选界面语言，只看自己与 Cathy 的对话。
  - 家庭：`/family`；App 里点共享视频 → 全屏 iframe `/family?embed=1&v=<id>&s=clip|bout`，左上「‹ 返回」，面板关闭 postMessage `cf-close`。
- **分析播放器**：±5 秒、逐帧、按住快进 / 慢放 / 倒扫、0.25–2x、双指缩放 + 拖动、进度条时间点标记（家庭端按教练上色）、打点留言 + 标签、语音留言（录音时暂停视频）、片段切换 🎬N。
- **对话模型**：每位教练每场对阵一条对话；留言 `videoId` = 片段 id（可带 `vt` 秒）或整场 `b:赛事~项目~回合~对手~比分`；`author` = coach / family / cathy。
- **计数口径（两端一致）**：视频下「💬 N」= 该片段；对阵「💬 N 条留言」= 整场 + 各片段。教练页只含本教练，家庭端汇总所有教练。
- **家庭端**：按教练分标签 +「全部」、默认打开有未读 / 最近留言的教练、身份 Cathy / 家长、「⏱ 挂在当前时间」开关（关 = 整场）。
- **未读**：家庭端存 R2 `coach/family_reads.json`（key `<coachId>|<boutId>`，多设备同步）；教练端存本机 `cr_<token>`；App「视频」标签红点。
- **翻译**：Workers AI（qwen3），提示词含击剑术语；文字双向翻译，语音不翻译。
- **缩略图**：排队加载（同时 2 个）、截首帧缓存（教练页 localStorage `cth_<id>`），iPhone 需 `#t=0.1` 才显示首帧；失败显示深色格子不报错。MKV 不按扩展名拦截，实际播不了才提示。
- **教练管理**（「👤 教练」页）：新建、复制链接、改名、🔄 换新链接（留言保留，旧链接立即 404）、撤销。教练名单和 token 只存 R2 `coach/registry.json`，**不写进公开仓库**。

### 日程
- 月历（多日事件同一水平线；月初补空格；今天高亮；点哪天就预填哪天）+ 事件列表（倒计时、已结束可折叠、正在进行置顶）。
- 类型：比赛 / 训练营 / 俱乐部训练 / 体能 / 拉伸 / 其他；地点点开 Google 地图；多图多文件附件；编辑器内可删除。
- 邮件里识别出的日程可「加入日程」（事件记 `sourceEmailKey` / `sourceSubject`）。

### 待办
- 分组：⭐重要 / 已过期 / 今天 / 未来 7 天 / 更晚；已完成按完成时间倒序、可折叠。
- 字段：标题、截止日、分类、地址（地图）、备注、多图多文件（兼容旧 `image`/`pdf`，编辑保存后迁移到 `attach`）、语音留言、重要。
- **分类可自定义**：「我的 → 设置 → 🏷️ 待办分类」，按修改时间多设备同步。
- 从邮件一键加入待办、待办可跳回原邮件。

### 邮件
- 分类：击剑 / Cathy&David / 生活旅行 / 营销 / 待办 / 其他；👧👦 标注涉及哪个孩子；改分类时可记住发件人。
- **AI 归纳最近 30 天**：需要办理（加入待办 / 取消 / 恢复 / 📧 原邮件）+ 信息通知（知道了）；「其他待办」累计不清空。
- 列表刷新时保持「查看原文」展开和滚动位置；邮件卡片显示 AI 识别的日程「📅 … 加入日程」（只对 2026-09-30 之后新进来的邮件有）。

### 我的
- 常用资料（公开组 + 🔒 加密组「妈妈」，AES 主密码）、比赛视频库、设置（邮件分类规则、待办分类、Cathy 数据导出）。

### 通用
- 多设备同步：`cathy_data/user_data.json`，registrations / schedule / reflections / tasks / videos 按 id 合并 + 墓碑（防已删项复活）；tasks / videos 字段级更新按 updatedAt 谁新用谁（videos 回落 uploadedAt），改视频字段必须盖 updatedAt；registrations 用平行表 `registrationTs` 记时间戳，无戳远端值视为旧数据不能盖过有戳本地值；待办分类按时间覆盖。
- 手机返回手势先关弹层（`overlayPush` / `overlayPop` + popstate，`_overlayIgnorePop` 防误关下一层），已接入日程 / 待办编辑器、视频全屏播放器。
- 打开 / 回到前台检测新版本，顶部出现更新横幅。

## 3. 部署与验证

- App：改 `fencing_tournament_helper.html` → commit → push（远端 GitHub Actions 提交很密，push 被拒就 `git pull --rebase` 重试）。
- 视频服务：`python C:\Users\25534\AppData\Local\Temp\deploy_video_worker_named.py cathyvideos`
- 同步服务：`python C:\Users\25534\AppData\Local\Temp\deploy_cathy_worker_content.py`（只换代码、保留 GITHUB_TOKEN 等密钥；旧的 `deploy_cathy_worker.py` 会被拒）
- 部署脚本和 Cloudflare token（`cf_token.txt`）都在 Temp 目录，被清理时需重建；token 不进仓库。
- 测试环境：`deploy_video_worker_named.py cathyvideos-staging` → 自动绑定独立测试桶 `cathy-videos-staging`，测完删除该 Worker。
- 验证：
  - JS 语法：esprima 解析每个 `<script>`（老 esprima 不认 `?.` / `??` / `catch {}` / `\p{}`，先替换再解析；`\p{}` 那条报错是原有写法）。
  - **video_worker.js 改完必须拉线上 `/coach/<token>` 和 `/family` 页面再解析 `<script>`**。
  - 功能：Playwright（手机尺寸）实测；测试时拦截 `save` / `comment_add` / `feed_save` 等写操作，**不要把测试数据写进真实数据**。

## 4. 已知坑（别再踩）

1. 教练页是服务器端模板字符串：内嵌 JS 里写 `\'` 会变成裸 `'` 截断整段脚本；onclick 里别嵌双引号，传参用 `data-*`。
2. 同名全局变量会让整个 `<script>` 块失效（例：`_vBtnStyle` 重复声明曾导致日程页全坏）；新增全局名先 grep。
3. sync 内部写 localStorage 用 `saveUIToLocal`（不触发自动同步），否则无限同步循环。
4. iOS：不能播 `blob:` 视频；`<video preload=metadata>` 不画首帧（加 `#t=0.1`）；同时加载太多 `<video>` 会随机报错；Service Worker 在 iOS 直通不缓存视频；网页切后台 JS 暂停。
5. iOS 相册选视频后要先"导出"才交给网页，这期间切走会被取消，网页无法提前介入。
6. Worker AI 返回的 JSON 有嵌套（日程）时要贪婪匹配 `\{[\s\S]*\}`。
7. 公开仓库：`cathy_data/` 下的邮件摘要、日程等都是公开可读的（见待做「方案 B」）。
8. 家庭钥匙已按用户决定关闭（`video_worker.js` `FAMILY_KEY_REQUIRED = false`，改回 true 即恢复；哈希仍在 R2 `coach/family.json`）。家长端接口因此无鉴权，懂技术的人可调用拿到教练链接。
9. **GITHUB_TOKEN 会过期/被吊销**（2026-10-01 发生过一次：401 → PDF/附件打不开 + 全部同步静默失败）。健康检查：`curl -X POST https://cathysync.frankataix.workers.dev/ -d '{"action":"read","path":"cathy_data/version.json"}' -H 'Content-Type: application/json'`。恢复：本机 `git credential fill`（protocol=https host=github.com）里的有效 token → `PUT /accounts/{acc}/workers/scripts/cathysync/secrets` 更新 `GITHUB_TOKEN`（cf token 在 `Temp/cf_token.txt`）。注意 gho_ 开头的 OAuth token 也可能过期，复发就换长期 PAT。
10. **静态审查查不出线上故障**：审查代码前先 curl 三个活接口（read /file /feed），401/403 一眼可见。

## 5. 待做 / 已商定

- **等用户 iPhone 实测**：App 内播放器录语音（iframe 麦克风）、两台手机红点 / 已读同步、教练页缩略图、返回键。
- 视频交流第二批（已商定顺序）：① 教练新留言邮件提醒（需教练邮箱、发件 Gmail、频率）+ 语音转文字并翻译 + 引用回复 / 修改自己的留言 + 删除权限收紧 + 教练名显示优化；② 画面画线标注 + A-B 段循环；③ 每位教练对话 AI 小结 + 标签统计接入 AI 教练。
- 方案 B：仓库改私有 + 网页搬 Cloudflare Pages（网址会变，主屏幕图标要重加），用户未决定。
- MKV / HEVC 无转码（建议拍 MP4 / H.264 或归档 YouTube）；国内访问 workers.dev 不稳定，需要时绑自定义域名。

---

## UI/UX 通用规范

> 适用于 `fencing_tournament_helper.html` 及所有相关页面。

1. **确认型操作**：删除、编辑、清空等不可撤销操作必须二次确认；删除按钮用 `.danger`（红色）并远离主操作。
2. **输入框**：`box-sizing: border-box`；长文本 `width:100%`，日期 / 短字段 120–170px；小屏全部 100%；字号 16px（防 iOS 缩放）；中文输入法组字时回车不提交。
3. **按钮**：主 `.primary`（`var(--primary)`）、次 `.secondary`（`#e2e8f0`）、危险 `.danger`（`#ef4444`）；触摸目标 ≥ 44px。
4. **模态框**：居中 `min(90%, 420px)`；遮罩 / ESC / 返回手势可关；保留已填内容。
5. **列表与日历**：多日事件用 track 保持同一水平线；排序一致；超长文本省略号。
6. **响应式**：移动端优先，禁止横向滚动；日历格子 `minmax(0, 1fr)`。
7. **反馈**：保存 / 提交时禁用按钮，完成后提示成功或失败；验证失败聚焦第一个错误字段。

## 设计与实现纪律

1. **先复述，再动手**：先简短复述理解，指出方案的优点和潜在问题；不讲技术原理，只讲重点和体验。
2. **尽量一次做到最终版**：减少中间确认；但删除、清空、付费、发送等不可逆操作前仍需确认。
3. **自测 + 自动修 bug**：完成后立即回测（渲染、交互、同步），发现 bug 主动修并告知；不回测不推送。
4. **成熟 App 标准**：复用现有设计系统；列表 / 筛选 / 详情 / 编辑 / 删除 / 空状态 / 加载 / 错误按成熟 App 惯例；同义字段同名。
5. **数据先行**：`cathy_data/*.md` 是单一数据源；没数据时如实说明。
