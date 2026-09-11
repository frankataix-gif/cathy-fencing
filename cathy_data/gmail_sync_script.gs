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
  MAX_BODY_LENGTH: 50000
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

  let sent = 0;
  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      // 如果该邮件已经被标记，跳过
      const labels = message.getThread().getLabels().map(l => l.getName());
      if (labels.includes(CONFIG.SYNCED_LABEL)) continue;

      const payload = {
        action: 'email',
        email: {
          subject: message.getSubject() || '',
          from: message.getFrom() || '',
          to: message.getTo() || '',
          date: message.getDate().toISOString(),
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
        console.log(`已发送: ${payload.email.subject} -> 状态 ${status}`);

        if (status >= 200 && status < 300) {
          // 同步成功后，给邮件加标签
          syncedLabel.addToThread(message.getThread());
          sent++;
        } else {
          console.error(`同步失败: ${payload.email.subject}, 响应: ${response.getContentText()}`);
        }
      } catch (err) {
        console.error(`同步异常: ${payload.email.subject}, 错误: ${err.toString()}`);
      }
    }
  }

  console.log(`本次同步完成，共发送 ${sent} 封邮件`);
}

/**
 * 测试函数。手动运行一次，看看能不能搜到并发送邮件。
 */
function testSync() {
  console.log('开始测试同步...');
  syncCathyEmails();
}
