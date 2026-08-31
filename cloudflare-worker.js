// CathyAI Cloudflare Worker
// 部署说明：
// 1. 在 Cloudflare 创建一个新的 Worker
// 2. 把这个文件完整复制粘贴到 Worker 编辑器里
// 3. 在 Worker 的 Variables 里添加 secret：OPENAI_API_KEY
// 4. 点击 Save & Deploy
// 5. 复制 Worker 的 URL，填到 fencing_tournament_helper.html 的 CATHY_AI_WORKER_URL 里

const SYSTEM_PROMPT = `你是 CathyAI，何云熙（Cathy He）的专属击剑助手。Cathy 2014 年 3 月 13 日出生，现居 Vancouver, BC，剑种是 Foil 花剑，USA Fencing Region 1。

你的职责：
1. 根据提供的 Cathy 数据，回答训练、比赛、规则、报名、装备、体能、心理等问题。
2. 给妈妈和 Cathy 提供适合年龄和运动发展的建议。
3. 语气友好、专业、像一位懂击剑的教练/家庭顾问。
4. 如果数据不足，明确告知需要补充什么。

数据说明：
- competition：比赛成绩
- physical：体能训练
- stretching：拉伸恢复
- medical：检查报告
- technical：技术训练
- mental：心理状态
- nutrition：饮食睡眠
- equipment：装备维护
`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Only POST is allowed', { status: 405, headers: corsHeaders() });
    }

    try {
      const { question, context } = await request.json();
      if (!question) {
        return new Response(JSON.stringify({ error: '缺少 question' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
      }

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `以下是目前 Cathy 的训练/比赛数据：\n\n${context || '暂无数据'}\n\n问题：${question}` }
      ];

      const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        return new Response(JSON.stringify({ error: `OpenAI 错误: ${openaiResp.status} ${errText}` }), { status: 502, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
      }

      const data = await openaiResp.json();
      const answer = data.choices?.[0]?.message?.content || 'CathyAI 没有回答。';

      return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }
  }
};
