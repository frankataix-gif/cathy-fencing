# Gmail → Cathy App 自动同步设置指南

## 原理

1. 在 `script.google.com` 新建一个 Apps Script 项目。
2. 粘贴 `gmail_sync_script.gs` 的代码。
3. 设一个定时触发器（建议每 5–15 分钟）。
4. 脚本会扫描 Gmail 中未同步的邮件，自动 POST 到 Cloudflare Worker。
5. Worker 分类并把邮件追加写入 `cathy_data/emails.md`，App 里就能看到。

**优点**：完全免费、不用第三方、不转发邮件地址、不泄露密码。  
**延迟**：取决于触发器间隔（建议 5 分钟）。

## 默认行为

脚本默认 `SEARCH: ''`，即同步该 Gmail 账户中**所有未同步过的邮件**。

如果你只想同步部分邮件，可以修改脚本顶部的 `SEARCH`，例如：

```js
SEARCH: 'from:usafencing.org OR from:meadowridge.bc.ca',
```

> 注意：USA Fencing 的真实发件域名是 `usafencing.org`（不是 `usfencing.org`）。

## 操作步骤

### 1. 打开 Google Apps Script

- 访问 https://script.google.com
- 登录 `nataliewu100@gmail.com` 的 Gmail 账户
- 点「新建项目」

### 2. 粘贴代码

- 把 `cathy_data/gmail_sync_script.gs` 的全部内容复制进去
- 点「保存」（或按 Ctrl+S）
- 可选：按需修改 `SEARCH`（空则同步全部）

### 3. 授权并测试

- 第一次保存后，点「运行」旁边的「▶」按钮，选 `testSync` → 点「运行」
- 会弹出授权窗口：
  - 「高级」→「前往 [项目名]（不安全）」
  - 授权 Gmail 和 URL 请求
- 运行后看「执行记录」：
  - 有 `已发送: ... 状态 200` 说明成功
  - 看到 `状态 403` 请看下方「常见问题 → 403 错误」

### 4. 设置定时器

- 点左侧「⏰ 触发器」图标
- 点「添加触发器」
- 设置：
  - 运行：`syncCathyEmails`
  - 事件来源：`时间驱动`
  - 时间类型：`分钟计时器`
  - 间隔：`每 5 分钟`（或 10/15 分钟）
- 保存

### 5. 完成

之后新邮件会自动同步到 App 的「邮件」Tab。

## 常见问题

- **App 里看不到邮件**：
  1. 先确认 GitHub 上 `cathy_data/emails.md` 有没有新增（工人是否写入）。
  2. 在 Apps Script 里点「▶」运行 `testSync`，看执行记录。
  3. 等 5 分钟让触发器跑一次。
- **想立刻同步**：在 Apps Script 里点「▶」运行 `testSync`。
- **403 错误 / 同步失败**：Cloudflare 可能会拦截没有 `User-Agent` 的请求。脚本已经加了 `User-Agent` 头。如果仍然 403，请检查：
  - Cloudflare 域名下是否开启了「Super Bot Fight Mode」或「Browser Integrity Check」。
  - Worker 路由 `cathysync.frankataix.workers.dev` 是否被 Cloudflare Access 保护。如果是，需要给 Apps Script 或 Make 配置 Service Auth Token。
- **想停用**：在 Apps Script 的「触发器」里删掉定时器即可。
- **邮件太多**：把 `SEARCH` 改得更精确，例如 `from:usafencing.org OR from:meadowridge.bc.ca`。

## 隐私提醒

- `cathy_data/emails.md` 存在公开 GitHub 仓库，任何人都能看到。如果邮件里有敏感信息，请谨慎设置 `SEARCH`，只同步必要的邮件。
- 如果想完全私有化，可以把 `cathy-fencing` 仓库设为 private。
