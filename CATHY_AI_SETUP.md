# CathyAI 网页聊天部署说明

## 目标

在 `fencing_tournament_helper.html` 右上角打开 `🤖` 就能直接和 Cathy 数据对话。

## 架构

- **前端**：网页上的聊天窗口
- **后端**：Cloudflare Worker（免费额度足够家用）
- **AI**：OpenAI API（需要你自己的 API key）
- **数据**：浏览器本地的 `localStorage['cathy_training_data']`，点击「发送」时传给 Worker

## 步骤

### 1. 拿到 OpenAI API Key

打开 https://platform.openai.com/api-keys
- 点击 `+ Create new secret key`
- 复制 key（以 `sk-` 开头）
- 保管好，不要发给别人

### 2. 注册 / 登录 Cloudflare

打开 https://dash.cloudflare.com
- 注册免费账号

### 3. 创建 Worker

1. 左侧菜单 → `Workers & Pages`
2. 点 `Create application`
3. 点 `Create Worker`
4. 给 Worker 起个名字，比如 `cathyai`
5. 点 `Deploy`

### 4. 粘贴后端代码

1. Worker 创建好后，点 `Edit code`
2. 把 `cloudflare-worker.js` 里的全部内容复制进去
3. 点 `Save and deploy`

### 5. 设置 API Key

1. Worker 页面 → `Settings` → `Variables`
2. 点 `Add variable`
3. Name: `OPENAI_API_KEY`
4. Value: 你的 OpenAI API key
5. 点 `Encrypt`（变成 secret）
6. 点 `Save`

### 6. 拿到 Worker URL

1. 回到 Worker 主页面
2. 找到 `Preview` 下面的 URL，比如：
   ```
   https://cathyai.your-name.workers.dev
   ```
3. 复制这个地址

### 7. 填到网页

打开 `fencing_tournament_helper.html`，找到这一行：

```js
const CATHY_AI_WORKER_URL = '';
```

改成：

```js
const CATHY_AI_WORKER_URL = 'https://cathyai.your-name.workers.dev';
```

保存，commit，push。

## 使用

1. 打开网页
2. 点右上角 `🤖`
3. 输入问题，点发送
4. CathyAI 会根据 `击剑数据` 里已输入的记录回答

## 费用

- Cloudflare Worker：免费 100,000 次请求/天，家用足够
- OpenAI `gpt-4o-mini`：很便宜，约 $0.15 / 百万输入 token

## 数据隐私

- API key 只存在 Cloudflare 后台，不暴露在网页源码
- Cathy 的训练数据从浏览器 `localStorage` 传给 Worker，不在 GitHub 公开
