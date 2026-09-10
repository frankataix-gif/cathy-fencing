# Gmail → Cathy App 自动同步设置指南（方案 B）

## 原理

1. 在 `script.google.com` 新建一个 Apps Script 项目。
2. 粘贴 `gmail_sync_script.gs` 的代码。
3. 设一个定时触发器（例如每 15 分钟）。
4. 脚本会扫描 Gmail 中符合条件的未同步邮件，自动 POST 到 Cloudflare Worker。
5. Worker 把邮件追加写入 `cathy_data/emails.md`，App 里就能看到。

**优点**：完全免费、不用第三方、不转发邮件地址、不泄露密码。
**延迟**：最多 15 分钟（取决于触发器间隔）。

## 需要确认的发件人域名

脚本顶部 `SEARCH` 字段需要填发件人域名。例子：

```js
// 只收 USAF 邮件
SEARCH: 'from:usfencing.org',

// 收 USAF + Meadowridge 学校
SEARCH: 'from:usfencing.org OR from:meadowridge.bc.ca',

// 收 USAF + 学校 + 某个公司账户
SEARCH: 'from:usfencing.org OR from:meadowridge.bc.ca OR from:company.com',
```

## 操作步骤

### 1. 打开 Google Apps Script

- 访问 https://script.google.com
- 登录你妈妈的 Gmail 账户
- 点「新建项目」

### 2. 粘贴代码

- 把 `cathy_data/gmail_sync_script.gs` 的全部内容复制进去
- 修改 `SEARCH` 里的发件人域名（妈妈学校域名不确定的话先用 `usfencing.org`，以后再加）
- 点「保存」（或按 Ctrl+S）

### 3. 授权

- 第一次保存后，点「运行」旁边的「▶」按钮，选 `testSync` → 点「运行」
- 会弹出授权窗口：
  - 「高级」→「前往 [项目名]（不安全）」
  - 授权 Gmail 和 URL 请求
- 运行后看「执行记录」，如果有 `已发送` 字样说明成功

### 4. 设置定时器

- 点左侧「⏰ 触发器」图标
- 点「添加触发器」
- 设置：
  - 运行：`syncCathyEmails`
  - 事件来源：`时间驱动`
  - 时间类型：`分钟计时器`
  - 间隔：`每 15 分钟`
- 保存

### 5. 完成

之后 Gmail 里所有符合条件的邮件都会自动同步到 App 的「我的 → 邮件」卡片。

## 如果需要改邮件范围

修改 `SEARCH` 里的 Gmail 搜索语法，例如：

- 只收 USAF：`from:usfencing.org`
- 收 USAF + 学校：`from:usfencing.org OR from:meadowridge.bc.ca`
- 收所有含 "fencing" 或 "registration" 的邮件：`subject:fencing OR subject:registration`
- 排除已同步的：脚本会自动处理，不用管

## 常见问题

- **App 里看不到邮件**：等 15 分钟让触发器跑一次，或手动在 Apps Script 里点「▶」运行 `testSync`。
- **想立刻同步**：在 Apps Script 里点「▶」运行 `testSync`。
- **想停用**：在 Apps Script 的「触发器」里删掉定时器即可。
- **邮件太多**：在 `SEARCH` 里加更精确的条件，例如 `subject:registration`。

## 隐私提醒

- `cathy_data/emails.md` 存在公开 GitHub 仓库，任何人都能看到。如果邮件里有敏感信息，请谨慎设置 `SEARCH`，只同步必要的邮件。
- 如果想完全私有化，可以把 `cathy-fencing` 仓库设为 private。
