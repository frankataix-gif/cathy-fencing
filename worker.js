const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const RULES_PATH = 'cathy_data/email_rules.json';

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
      if (request.method !== 'POST') return new Response('OK', { headers: CORS_HEADERS });

      let body;
      const ctype = request.headers.get('Content-Type') || '';
      try {
        if (ctype.includes('application/x-www-form-urlencoded') || ctype.includes('multipart/form-data')) {
          body = Object.fromEntries((await request.formData()).entries());
        } else {
          body = await request.json();
        }
      } catch (e) { return json({ error: 'invalid body' }, 400); }

    if (body.action === 'ai' || body.action === 'coach') {
      const prompt = body.action === 'ai' ? buildAiPrompt(body) : buildCoachPrompt(body);
      try {
        const res = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
          messages: [
            { role: 'system', content: '你是一名击剑教练，擅长用中文给出简洁、可执行的训练建议和赛前提醒。' },
            { role: 'user', content: prompt }
          ]
        });
        const text = (res && res.response) ? res.response : '';
        const suggestions = parseSuggestions(text);
        return json({ suggestions, analysis: text });
      } catch (e) {
        return json({ error: e.message || 'ai failed' }, 500);
      }
    }

    if (body.action === 'save') {
      const { path, content, message } = body;
      const existing = await readGitHubFile(env, path);
      const result = await writeGitHubFile(env, path, content, message || 'Update via worker', existing?.sha);
      return json(result);
    }

    if (body.action === 'email_summary') {
      const emails = body.newEmails || [];
      const previous = body.previousSummary || null;
      const prompt = buildEmailSummaryPrompt(body);
      let text = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
            messages: [
              { role: 'system', content: '你只能输出 JSON，不允许解释。' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2048
          });
          text = (res && res.response) ? res.response : '';
          if (text && text.trim()) break;
        } catch (e) {}
      }
      let parsed = extractJson(text);
      const categoryMap = { '击剑': 0, '学校': 0, '营销': 0, '待办': 0, '其他': 0 };
      emails.forEach(e => { categoryMap[e.category || '其他'] = (categoryMap[e.category || '其他'] || 0) + 1; });
      if (!parsed) {
        parsed = {
          date: body.date || new Date().toISOString().slice(0, 10),
          total: emails.length,
          categories: categoryMap,
          actions: emails.map(e => ({
            title: (e.subject || '邮件').slice(0, 30),
            source: e.subject || '',
            priority: e.todo && e.todo !== '无' ? '高' : '中',
            category: e.category || '其他'
          })),
          priority: 'AI 分析失败，请点刷新分析重试',
          summary: 'AI 暂时未能生成总结，已列出邮件清单'
        };
      } else {
        let actions = previous && Array.isArray(previous.actions) ? previous.actions.slice() : [];
        if (Array.isArray(parsed.actions)) {
          parsed.actions.forEach(a => {
            const idx = actions.findIndex(x => x.source === a.source);
            if (idx >= 0) actions[idx] = a;
            else actions.push(a);
          });
        }
        emails.forEach(e => {
          const subject = e.subject || '';
          if (!actions.some(a => a.source === subject)) {
            actions.push({
              title: (e.subject || '邮件').slice(0, 30),
              source: subject,
              priority: e.todo && e.todo !== '无' ? '高' : '中',
              category: e.category || '其他'
            });
          }
        });
        parsed.actions = actions;
        parsed.categories = parsed.categories || categoryMap;
        parsed.date = parsed.date || body.date || new Date().toISOString().slice(0, 10);
      }
      return json(parsed);
    }

    if (body.action === 'email') {
      const email = body.email || body;
      const subject = email.subject || '(no subject)';
      const from = email.from || email.fromEmail || '';
      const to = email.to || '';
      const date = email.date || new Date().toISOString();
      const rawText = email.body || email.text || email.html || '';
      const classifyText = rawText.slice(0, 1200);
      const storeText = rawText.slice(0, 500);

      const meta = await classifyEmail(env, { subject, from, text: classifyText });
      const entry = `\n## [${meta.category}] ${subject}\n\n**发件人:** ${from}\n**日期:** ${date}\n**摘要:** ${meta.summary}\n**待办:** ${meta.todo}\n\n${storeText}\n\n---\n`;
      const normDate = (d) => { try { return new Date(d).toISOString(); } catch(e) { return d; } };
      const emailKey = `${subject}|${from}|${normDate(date)}`;
      let result = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const existing = await readGitHubFile(env, 'cathy_data/emails.md');
          if (existing && existing.content) {
            const regex = /##\s*\[[^\]]+\]\s*([\s\S]*?)\n[\s\S]*?\*\*发件人:\*\*\s*(.*?)\n\*\*日期:\*\*\s*(.*?)\n/g;
            let m;
            let duplicate = false;
            while ((m = regex.exec(existing.content)) !== null) {
              const k = `${m[1].trim()}|${m[2].trim()}|${normDate(m[3].trim())}`;
              if (k === emailKey) { duplicate = true; break; }
            }
            if (duplicate) {
              return json({ ok: true, skipped: 'duplicate', meta });
            }
          }
          const newContent = (existing ? existing.content : '# 收件箱 / Emails\n') + entry;
          result = await writeGitHubFile(env, 'cathy_data/emails.md', newContent, 'Append email', existing?.sha);
          if (!result.error) break;
          // sha 冲突时重试
          if (result.error && !String(result.error).toLowerCase().includes('sha')) break;
        } catch (e) {
          result = { error: e.message };
          break;
        }
      }
      return json({ ...result, meta });
    }

    if (body.action === 'email_reclassify') {
      const email = body.email || {};
      const newCat = body.category || '其他';
      const allowed = ['击剑', '学校', '营销', '待办', '其他'];
      if (!allowed.includes(newCat)) return json({ error: 'bad category' }, 400);
      const normDate = (d) => { try { return new Date(d).toISOString(); } catch(e) { return d; } };
      const targetKey = `${email.subject || ''}|${email.from || ''}|${normDate(email.date || '')}`;
      let result = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const existing = await readGitHubFile(env, 'cathy_data/emails.md');
          if (!existing) return json({ error: 'emails.md not found' }, 404);
          const parts = existing.content.split(/\n## /);
          let changed = false;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part.trim().startsWith('[')) continue;
            const lines = part.split('\n');
            const m = (lines[0] || '').match(/^\[([^\]]+)\]\s*(.*)/);
            const subject = (m ? m[2] : '').trim();
            let from = '', date = '';
            for (const line of lines) {
              if (line.startsWith('**发件人:**')) from = line.replace(/^\*\*发件人:\*\*\s*/, '').trim();
              else if (line.startsWith('**日期:**')) date = line.replace(/^\*\*日期:\*\*\s*/, '').trim();
            }
            const key = `${subject}|${from}|${normDate(date)}`;
            if (key === targetKey) {
              parts[i] = `[${newCat}] ${subject}` + '\n' + lines.slice(1).join('\n');
              changed = true;
              break;
            }
          }
          if (!changed) return json({ error: 'email not found' }, 404);
          const newContent = parts.join('\n## ');
          result = await writeGitHubFile(env, 'cathy_data/emails.md', newContent, 'Reclassify email', existing.sha);
          if (!result.error) break;
          if (result.error && !String(result.error).toLowerCase().includes('sha')) break;
        } catch (e) {
          result = { error: e.message };
          break;
        }
      }
      return json(result);
    }

    if (body.action === 'import') {
      const source = body.source || 'manual';
      const content = body.content || '';
      const ts = new Date().toISOString();
      const markdown = `---\nimported: ${ts}\nsource: ${source}\n---\n\n${content}`;
      const existing = await readGitHubFile(env, 'cathy_data/usaf_dashboard.md');
      const result = await writeGitHubFile(env, 'cathy_data/usaf_dashboard.md', markdown, 'Import USAF dashboard', existing?.sha);
      return json(result);
    }

    return json({ error: 'unknown action' }, 400);
    } catch (e) {
      return json({ error: e.message || 'internal error' }, 500);
    }
  }
};

async function readGitHubFile(env, path) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || 'frankataix-gif/cathy-fencing';
  const branch = env.GITHUB_BRANCH || 'main';
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(api + '?ref=' + branch, { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'cathy-worker' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read ${res.status}`);
  const data = await res.json();
  return { sha: data.sha, content: decodeURIComponent(escape(atob(data.content))) };
}

async function writeGitHubFile(env, path, content, message, sha) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || 'frankataix-gif/cathy-fencing';
  const branch = env.GITHUB_BRANCH || 'main';
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const payload = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch
  };
  if (sha) payload.sha = sha;
  const res = await fetch(api, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'cathy-worker' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) return { error: data.message || `GitHub ${res.status}` };
  return data;
}

function buildAiPrompt(body) {
  const ctx = body.context || {};
  return `运动员：Cathy He（花剑 Y14，Vancouver）
赛事：${ctx.tournament || '未知'}
项目：${ctx.event || ''}
对手：${ctx.opponent || ''}（${ctx.round || ''}）
比分：${ctx.score || ''}
赛后留言：
${body.summary || ''}

请给出：
1. 问题分析（1-3 条）
2. 针对性训练建议（3 条以内）
3. 下次赛前提醒（1 条）

用中文，简洁，直接给建议。`;
}

function buildCoachPrompt(body) {
  const ctx = body.context || {};
  const themes = ctx.themes ? Object.entries(ctx.themes).map(([k, v]) => `${k}:${v}`).join(', ') : '';
  const recent = ctx.recentReflections ? ctx.recentReflections.map(r => `${r.key}: ${r.summary.slice(0, 300)}`).join('\n') : '';
  const stats = ctx.stats || {};
  return `你是 Cathy He 的击剑训练助手。请基于以下信息给出本周训练计划和下一场赛前提醒。

运动员信息：花剑 Y14，Vancouver。
整体数据：赛事 ${stats.totalEvents || 0} 场，总剑数 ${stats.totalBouts || 0}，胜率 ${stats.winRate || ''}，Pool 胜率 ${stats.poolRate || ''}，平均名次 ${stats.avgPlace || '-'}。
弱点主题：${themes || '无'}。

最近留言：
${recent || '无'}

请输出：
1. 本周训练重点（最多 4 条）
2. 下一场赛前提醒（最多 3 条）
3. 对手档案关注点（如有）

用中文，分点，直接可用。`;
}

function parseSuggestions(text) {
  if (!text) return [];
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.length > 5)
    .slice(0, 20);
}

function keywordClassify(from, subject, text, rules) {
  const combined = (from + ' ' + subject + ' ' + text).toLowerCase();
  const entries = rules && typeof rules === 'object' ? Object.entries(rules) : [];
  for (const [category, keywords] of entries) {
    if (!Array.isArray(keywords)) continue;
    if (keywords.some(k => combined.includes(String(k).toLowerCase()))) return category;
  }
  return null;
}

async function loadEmailRules(env) {
  try {
    const existing = await readGitHubFile(env, RULES_PATH);
    if (existing && existing.content) {
      const parsed = JSON.parse(existing.content);
      return parsed.rules || {};
    }
  } catch(e) {}
  return {};
}

async function classifyEmail(env, email) {
  const prompt = `你是 Cathy 家庭的邮件助理。请阅读邮件，按以下 JSON 格式输出，不要任何额外文字：
{"分类":"...","摘要":"...","待办":"..."}

分类只能从这五个中选一个：击剑 / 学校 / 营销 / 待办 / 其他
摘要用 1-2 句中文总结邮件核心
待办：这封邮件需要做什么？不需要行动写"无"

发件人：${email.from}
主题：${email.subject}
正文：${email.text.slice(0, 3000)}`;

  const rules = await loadEmailRules(env);
  const keywordCategory = keywordClassify(email.from, email.subject, email.text, rules);

  let rawText = '';
  try {
    const res = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
      messages: [
        { role: 'system', content: '你只能输出 JSON，不允许解释。' },
        { role: 'user', content: prompt }
      ]
    });
    rawText = res && res.response ? res.response : '';
    let obj = null;
    if (typeof rawText === 'object' && rawText !== null) {
      obj = rawText;
    } else if (typeof rawText === 'string') {
      const m = rawText.match(/\{[\s\S]*?\}/);
      if (m) obj = JSON.parse(m[0]);
    }
    if (obj) {
      return {
        category: keywordCategory || obj['分类'] || obj.category || '其他',
        summary: obj['摘要'] || obj.summary || '',
        todo: obj['待办'] || obj.todo || '无',
        raw: rawText
      };
    }
  } catch(e) {}
  return { category: keywordCategory || '其他', summary: '', todo: '无', raw: rawText };
}

function buildEmailSummaryPrompt(body) {
  const date = body.date || new Date().toISOString().slice(0, 10);
  const previous = body.previousSummary || null;
  const emails = body.newEmails || [];
  const emailLines = emails.slice(0, 30).map(e =>
    `- 分类：${e.category || '其他'}，主题：${(e.subject || '').slice(0, 80)}，摘要：${(e.summary || '').slice(0, 120)}，待办：${(e.todo || '无').slice(0, 80)}`
  ).join('\n');
  const previousText = previous ? `之前已有 ${date} 当天的总结，现在新增 ${emails.length} 封邮件，请合并更新总结。

之前总结（${date}）：
- 总邮件数：${previous.total || 0}
- 分类统计：${JSON.stringify(previous.categories || {})}
- 之前需要做的事：${(previous.actions || []).map(a => a.title).join('；') || '无'}
- 之前优先级建议：${previous.priority || ''}
- 之前一句话总结：${previous.summary || ''}

新增邮件：` : `请基于以下 ${date} 一天的邮件，整理一份总结。

邮件列表：`;
  return `你是 Cathy 家庭的邮件助理。${previousText}
${emailLines}

请用中文，按以下 JSON 格式输出，不要任何额外文字。注意：要对每一封邮件都生成一条，不要遗漏：
{
  "date": "${date}",
  "total": 总邮件数,
  "categories": {"击剑": 数字, "学校": 数字, "营销": 数字, "待办": 数字, "其他": 数字},
  "actions": [{"title": "这封邮件的一句话概要（15字以内）", "source": "来源邮件主题", "priority": "高/中/低", "category": "分类"}],
  "priority": "过去7天最需要注意的一句话建议",
  "summary": "一句话总结过去7天邮件重点"
}`;
}

function extractJson(text) {
  if (!text) return null;
  if (typeof text === 'object' && text !== null) return text;
  if (typeof text !== 'string') return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch(e) {}
  return null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
