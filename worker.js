const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (request.method !== 'POST') return new Response('OK', { headers: CORS_HEADERS });

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }

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
      const result = await writeGitHubFile(env, path, content, message || 'Update via worker');
      return json(result);
    }

    if (body.action === 'email') {
      const email = body.email || body;
      const subject = email.subject || '(no subject)';
      const from = email.from || email.fromEmail || '';
      const to = email.to || '';
      const date = email.date || new Date().toISOString();
      const text = email.body || email.text || email.html || '';
      const entry = `\n## ${subject}\n\n**From:** ${from}\n**To:** ${to}\n**Date:** ${date}\n\n${text}\n\n---\n`;
      const existing = await readGitHubFile(env, 'cathy_data/emails.md');
      const newContent = (existing ? existing.content : '# 收件箱 / Emails\n') + entry;
      const result = await writeGitHubFile(env, 'cathy_data/emails.md', newContent, 'Append email', existing?.sha);
      return json(result);
    }

    if (body.action === 'import') {
      const source = body.source || 'manual';
      const content = body.content || '';
      const ts = new Date().toISOString();
      const markdown = `---\nimported: ${ts}\nsource: ${source}\n---\n\n${content}`;
      const result = await writeGitHubFile(env, 'cathy_data/usaf_dashboard.md', markdown, 'Import USAF dashboard');
      return json(result);
    }

    return json({ error: 'unknown action' }, 400);
  }
};

async function readGitHubFile(env, path) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || 'frankataix-gif/cathy-fencing';
  const branch = env.GITHUB_BRANCH || 'main';
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(api + '?ref=' + branch, { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'cathy-worker' } });
  if (!res.ok) return null;
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
  return res.json();
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
