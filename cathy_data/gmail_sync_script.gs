// Cathy 邮件自动同步脚本（Google Apps Script）
// 用途：定时把 Gmail 中的邮件同步到 Cathy 的 PWA
// 步骤：1）在 script.google.com 新建项目；2）复制粘贴本文件全部内容；3）按需修改 CONFIG；4）保存并授权；5）设一个触发器（例如每 5 分钟一次）

const CONFIG = {
  // Cathy 的 Worker 地址
  WORKER_URL: 'https://cathysync.frankataix.workers.dev/',

  // Gmail 搜索条件：
  //  - 推荐使用 'newer_than:7d' 只同步最近 7 天邮件，避免积压旧邮件阻塞实时同步。
  //  - 想限制发件人，可以改成 'newer_than:7d from:usafencing.org OR from:meadowridge.bc.ca'。
  //  - 如需一次性全量补历史，可临时改成 ''（空字符串），全量同步后务必改回 newer_than 条件。
  // 注意：usafencing.org 才是 USA Fencing 的真实发件域名（不是 usfencing.org）。
  SEARCH: 'newer_than:7d',

  // 用于标记“已同步”的标签名。脚本会自动创建这个标签
  SYNCED_LABEL: 'Cathy/Synced',

  // 每封邮件正文最大长度，避免邮件过长导致 Worker 超时
  MAX_BODY_LENGTH: 50000,

  // GitHub 上已保存的邮件文件，用于查重（防止重复导入）
  EMAILS_MD_URL: 'https://raw.githubusercontent.com/frankataix-gif/cathy-fencing/main/cathy_data/emails.md'
};

/**
 * 主入口。触发器调用这个函数即可。
 */
function syncCathyEmails() {
  // 确保已同步标签存在
  let syncedLabel = GmailApp.getUserLabelByName(CONFIG.SYNCED_LABEL);
  if (!syncedLabel) {
    syncedLabel = GmailApp.createLabel(CONFIG.SYNCED_LABEL);
  }

  // 搜索未同步的邮件：满足 SEARCH 条件，且没有 Cathy/Synced 标签
  const query = (CONFIG.SEARCH ? CONFIG.SEARCH + ' ' : '') + '-label:' + CONFIG.SYNCED_LABEL;
  const threads = GmailApp.search(query, 0, 50);

  if (!threads || threads.length === 0) {
    console.log('没有新邮件需要同步');
    return;
  }

  // 先取 GitHub 上已有的邮件，防止重复导入
  const existingKeys = getExistingEmailKeys();

  let sent = 0;
  for (const thread of threads) {
    const messages = thread.getMessages();
    let threadSent = false;
    let hasNew = false;
    for (const message of messages) {
      const subject = message.getSubject() || '';
      const from = message.getFrom() || '';
      const date = new Date(message.getDate()).toISOString();
      const key = `${subject}|${from}|${date}`;
      // GitHub 上已经有这封邮件，跳过（防止重复）
      if (existingKeys.has(key)) {
        console.log(`已存在于 emails.md，跳过：${subject}`);
        continue;
      }
      hasNew = true;

      const payload = {
        action: 'email',
        email: {
          subject: subject,
          from: from,
          to: message.getTo() || '',
          date: date,
          body: (message.getPlainBody() || '').slice(0, CONFIG.MAX_BODY_LENGTH)
        }
      };

      try {
        const response = UrlFetchApp.fetch(CONFIG.WORKER_URL, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Cathy-Gmail-Sync)'
          },
          muteHttpExceptions: true
        });

        const status = response.getResponseCode();
        console.log(`已发送: ${subject} -> 状态 ${status}`);

        if (status >= 200 && status < 300) {
          threadSent = true;
          sent++;
          existingKeys.add(key);
        } else {
          console.error(`同步失败: ${subject}, 响应: ${response.getContentText()}`);
        }
      } catch (err) {
        console.error(`同步异常: ${subject}, 错误: ${err.toString()}`);
      }
    }
    // 整个线程处理完后才打标签：有新邮件发送成功，或全部已在 emails.md 中
    if (threadSent || !hasNew) {
      syncedLabel.addToThread(thread);
    }
  }

  console.log(`本次同步完成，共发送 ${sent} 封邮件`);
}

/**
 * 从 GitHub 读取 emails.md，提取已存在的「主题|发件人|日期」键，用于查重。
 */
function getExistingEmailKeys() {
  const keys = new Set();
  try {
    const response = UrlFetchApp.fetch(CONFIG.EMAILS_MD_URL, {
      headers: { 'User-Agent': 'Cathy-Gmail-Sync' },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return keys;
    const text = response.getContentText();
    const regex = /##\s*\[[^\]]+\]\s*([\s\S]*?)\n[\s\S]*?\*\*发件人:\*\*\s*(.*?)\n\*\*日期:\*\*\s*(.*?)\n/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const subject = match[1].trim();
      const from = match[2].trim();
      const date = match[3].trim();
      let normDate = date;
      try { normDate = new Date(date).toISOString(); } catch(e) {}
      keys.add(`${subject}|${from}|${normDate}`);
    }
  } catch (e) {
    console.error('读取 emails.md 失败：' + e.toString());
  }
  return keys;
}

/**
 * 手动把最近 N 天的邮件全部标记为「已同步」。
 * 用法：在 Apps Script 里运行 markRecentSynced(30)，把最近 30 天邮件打上 Cathy/Synced 标签。
 * 适用于：本地批量导入后，防止 Apps Script 再次重复同步。
 */
function markRecentSynced(days) {
  const d = days || 7;
  let syncedLabel = GmailApp.getUserLabelByName(CONFIG.SYNCED_LABEL);
  if (!syncedLabel) {
    syncedLabel = GmailApp.createLabel(CONFIG.SYNCED_LABEL);
  }
  const threads = GmailApp.search(`newer_than:${d}d`, 0, 500);
  let count = 0;
  for (const thread of threads) {
    syncedLabel.addToThread(thread);
    count++;
  }
  console.log(`已标记 ${count} 个线程为 ${CONFIG.SYNCED_LABEL}`);
}

/**
 * 测试函数。手动运行一次，看看能不能搜到并发送邮件。
 */
function testSync() {
  console.log('开始测试同步...');
  syncCathyEmails();
}
