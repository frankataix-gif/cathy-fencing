// Cathy 视频 Worker —— R2 视频上传/播放 + 教练视频页（每教练独立链接/语言/留言串）
// 绑定：VIDEOS (r2_bucket -> cathy-videos)、AI (Workers AI，留言翻译)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ===== 教练页多语言 =====
const COACH_I18N = {
  zh: { title: 'Cathy 比赛视频', sub: '每场对阵的视频与讨论', comments: '留言', send: '发送', namePh: '留言…', none: '还没有视频', general: '总体留言', coach: '教练', family: '家长', loading: '加载中…', auto: '页面会自动更新新视频' },
  en: { title: "Cathy's Bout Videos", sub: 'Videos and discussion per bout', comments: 'Comments', send: 'Send', namePh: 'Write a comment…', none: 'No videos yet', general: 'General comments', coach: 'Coach', family: 'Family', loading: 'Loading…', auto: 'This page updates automatically' },
  it: { title: 'Video dei match di Cathy', sub: 'Video e discussione per ogni assalto', comments: 'Commenti', send: 'Invia', namePh: 'Scrivi un commento…', none: 'Nessun video ancora', general: 'Commenti generali', coach: 'Coach', family: 'Famiglia', loading: 'Caricamento…', auto: 'La pagina si aggiorna automaticamente' },
  fr: { title: 'Vidéos des matchs de Cathy', sub: 'Vidéos et discussion par assaut', comments: 'Commentaires', send: 'Envoyer', namePh: 'Écrire un commentaire…', none: 'Pas encore de vidéos', general: 'Commentaires généraux', coach: 'Coach', family: 'Famille', loading: 'Chargement…', auto: 'La page se met à jour automatiquement' }
};
const LANG_NAME = { zh: '中文', en: 'English', it: 'italiano', fr: 'français' };

async function readJson(env, key) {
  const o = await env.VIDEOS.get(key);
  if (!o) return null;
  try { return JSON.parse(await o.text()); } catch (e) { return null; }
}
async function writeJson(env, key, obj) {
  await env.VIDEOS.put(key, JSON.stringify(obj), { httpMetadata: { contentType: 'application/json' } });
}

async function translate(env, text, targetLang) {
  if (!env.AI || !text) return text;
  try {
    const res = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
      messages: [
        { role: 'system', content: `Translate the user's text into ${LANG_NAME[targetLang] || 'English'}. Output ONLY the translation, no explanation. Keep names/numbers/scores as-is.` },
        { role: 'user', content: text }
      ],
      max_tokens: 512
    });
    const t = (res && res.response) ? res.response.trim() : '';
    return t || text;
  } catch (e) { return text; }
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

      const reqUrl = new URL(request.url);

      // ===== 教练视频页 =====
      if (request.method === 'GET' && reqUrl.pathname.startsWith('/coach/')) {
        const token = decodeURIComponent(reqUrl.pathname.slice('/coach/'.length)).replace(/\/+$/, '');
        if (!/^[a-z0-9]{16,64}$/i.test(token)) return new Response('invalid link', { status: 403 });
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return new Response('link expired or invalid', { status: 404 });
        const t = COACH_I18N[meta.lang] || COACH_I18N.en;
        return new Response(renderCoachPage(token, meta, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      // 教练页数据（feed + 该教练的留言串）
      if (request.method === 'GET' && reqUrl.pathname.startsWith('/coach-data/')) {
        const token = decodeURIComponent(reqUrl.pathname.slice('/coach-data/'.length)).replace(/\/+$/, '');
        if (!/^[a-z0-9]{16,64}$/i.test(token)) return json({ error: 'invalid' }, 403);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid' }, 404);
        const feed = await readJson(env, 'coach/feed.json') || { videos: [] };
        const comments = await readJson(env, `coach/comments_${token}.json`) || [];
        // 家长留言显示为教练语言版本
        const shown = comments.map(c => ({ ...c, display: c.author === 'coach' ? c.text : (c.coachText || c.text) }));
        return json({ meta, feed, comments: shown });
      }

      // GET /video/<key> — R2 视频流式播放（支持 Range 拖进度，key 为不可猜随机串）
      if (request.method === 'GET' && reqUrl.pathname.startsWith('/video/')) {
        const key = decodeURIComponent(reqUrl.pathname.slice('/video/'.length));
        if (!key || key.includes('..')) return new Response('forbidden', { status: 403 });
        if (!env.VIDEOS) return new Response('videos not configured', { status: 503 });
        const obj = request.headers.get('Range')
          ? await env.VIDEOS.get(key, { range: request.headers })
          : await env.VIDEOS.get(key);
        if (!obj) return new Response('not found', { status: 404 });
        const h = new Headers();
        obj.writeHttpMetadata(h);
        h.set('Access-Control-Allow-Origin', '*');
        h.set('Accept-Ranges', 'bytes');
        h.set('Cache-Control', 'public, max-age=86400');
        let status = 200;
        if (obj.range) {
          status = 206;
          const r = obj.range;
          let start, end;
          if (r.suffix !== undefined) { start = Math.max(0, obj.size - r.suffix); end = obj.size - 1; }
          else { start = r.offset || 0; end = start + (r.length || obj.size) - 1; }
          h.set('Content-Range', `bytes ${start}-${end}/${obj.size}`);
          h.set('Content-Length', String(end - start + 1));
        } else {
          h.set('Content-Length', String(obj.size));
        }
        return new Response(obj.body, { status, headers: h });
      }

      // POST /video-part?key=&uploadId=&part= — multipart 分片上传（原始二进制 body）
      if (request.method === 'POST' && reqUrl.pathname === '/video-part') {
        if (!env.VIDEOS) return json({ error: 'videos not configured' }, 503);
        const key = reqUrl.searchParams.get('key') || '';
        const uploadId = reqUrl.searchParams.get('uploadId') || '';
        const part = parseInt(reqUrl.searchParams.get('part') || '0', 10);
        if (!key || key.includes('..') || !uploadId || !part) return json({ error: 'bad request' }, 400);
        const data = await request.arrayBuffer();
        if (data.byteLength > 30 * 1024 * 1024) return json({ error: 'chunk too large' }, 413);
        const mpu = env.VIDEOS.resumeMultipartUpload(key, uploadId);
        const r = await mpu.uploadPart(part, data);
        return json({ etag: r.etag, partNumber: r.partNumber });
      }

      if (request.method !== 'POST') return new Response('OK', { headers: CORS_HEADERS });

      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'invalid body' }, 400); }

      if (body.action === 'video_init') {
        if (!env.VIDEOS) return json({ error: 'videos not configured' }, 503);
        const name = String(body.name || 'video').slice(0, 120);
        const ext = (name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
        const rand = [...crypto.getRandomValues(new Uint8Array(20))].map(b => b.toString(16).padStart(2, '0')).join('');
        const key = `videos/${rand}${ext}`;
        const mpu = await env.VIDEOS.createMultipartUpload(key, {
          httpMetadata: { contentType: body.contentType || 'video/mp4' },
          customMetadata: { name: encodeURIComponent(name) }
        });
        return json({ key, uploadId: mpu.uploadId });
      }

      if (body.action === 'video_complete') {
        if (!env.VIDEOS) return json({ error: 'videos not configured' }, 503);
        const { key, uploadId, parts } = body;
        if (!key || !uploadId || !Array.isArray(parts) || !parts.length) return json({ error: 'bad request' }, 400);
        const mpu = env.VIDEOS.resumeMultipartUpload(key, uploadId);
        await mpu.complete(parts);
        return json({ ok: true, key, url: `${reqUrl.origin}/video/${key}` });
      }

      if (body.action === 'video_abort') {
        if (!env.VIDEOS) return json({ error: 'videos not configured' }, 503);
        const mpu = env.VIDEOS.resumeMultipartUpload(body.key || '', body.uploadId || '');
        try { await mpu.abort(); } catch (e) {}
        return json({ ok: true });
      }

      if (body.action === 'video_delete') {
        if (!env.VIDEOS) return json({ error: 'videos not configured' }, 503);
        const key = String(body.key || '');
        if (!key.startsWith('videos/') || key.includes('..')) return json({ error: 'forbidden' }, 403);
        await env.VIDEOS.delete(key);
        return json({ ok: true });
      }

      if (body.action === 'video_stat') {
        if (!env.VIDEOS) return json({ error: 'videos not configured' }, 503);
        const key = String(body.key || '');
        if (!key.startsWith('videos/')) return json({ error: 'forbidden' }, 403);
        const obj = await env.VIDEOS.head(key);
        return json({ exists: !!obj, size: obj ? obj.size : 0 });
      }

      // ===== 教练链接管理 =====
      if (body.action === 'coach_register') {
        const token = String(body.token || '');
        const name = String(body.name || '').slice(0, 60);
        const lang = String(body.lang || 'en');
        if (!/^[a-z0-9]{16,64}$/i.test(token) || !name || !COACH_I18N[lang]) return json({ error: 'bad request' }, 400);
        await writeJson(env, `coach/meta_${token}.json`, { name, lang, createdAt: new Date().toISOString() });
        return json({ ok: true });
      }

      if (body.action === 'coach_revoke') {
        const token = String(body.token || '');
        if (!/^[a-z0-9]{16,64}$/i.test(token)) return json({ error: 'bad request' }, 400);
        await env.VIDEOS.delete(`coach/meta_${token}.json`);
        return json({ ok: true });
      }

      if (body.action === 'feed_save') {
        const feed = body.feed;
        if (!feed || !Array.isArray(feed.videos)) return json({ error: 'bad request' }, 400);
        feed.updatedAt = new Date().toISOString();
        await writeJson(env, 'coach/feed.json', feed);
        return json({ ok: true });
      }

      // 留言：author 'coach'（来自教练页）或 'family'（来自 App），可带语音 audioUrl
      if (body.action === 'comment_add') {
        const token = String(body.token || '');
        const text = String(body.text || '').slice(0, 2000).trim();
        const audioUrl = String(body.audioUrl || '');
        const author = body.author === 'family' ? 'family' : 'coach';
        const videoId = body.videoId || null;
        if (!/^[a-z0-9]{16,64}$/i.test(token) || (!text && !audioUrl)) return json({ error: 'bad request' }, 400);
        if (audioUrl && !audioUrl.startsWith(`${reqUrl.origin}/video/`)) return json({ error: 'bad audio url' }, 400);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid link' }, 404);
        const coachLang = meta.lang || 'en';
        const rec = {
          id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          videoId, author, text,
          ts: new Date().toISOString()
        };
        if (audioUrl) rec.audioUrl = audioUrl;
        // 双向翻译：写中文的人 → 翻成教练语言；写教练语言的人 → 翻成中文（家长侧显示）
        if (author === 'family' && coachLang !== 'zh') rec.coachText = await translate(env, text, coachLang);
        if (author === 'coach' && coachLang !== 'zh') rec.zhText = await translate(env, text, 'zh');
        const list = (await readJson(env, `coach/comments_${token}.json`)) || [];
        list.push(rec);
        if (list.length > 500) list.splice(0, list.length - 500);
        await writeJson(env, `coach/comments_${token}.json`, list);
        return json({ ok: true, comment: rec });
      }

      if (body.action === 'comments_get') {
        const token = String(body.token || '');
        if (!/^[a-z0-9]{16,64}$/i.test(token)) return json({ error: 'bad request' }, 400);
        const list = (await readJson(env, `coach/comments_${token}.json`)) || [];
        return json({ comments: list });
      }

      return json({ error: 'unknown action' }, 400);
    } catch (e) {
      return json({ error: e.message || 'internal error' }, 500);
    }
  }
};

// ===== 教练页 HTML =====
function renderCoachPage(token, meta, t) {
  const title = esc(t.title) + ' — ' + esc(meta.name);
  return `<!DOCTYPE html><html lang="${esc(meta.lang)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;background:#f1f5f9;color:#1e293b}
  .wrap{max-width:640px;margin:0 auto;padding:14px}
  h1{font-size:1.2rem;margin:8px 0 2px}.sub{color:#64748b;font-size:0.8rem;margin-bottom:14px}
  .vid{background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .tgroup{margin-bottom:18px}
  .tname{font-weight:700;font-size:0.95rem;margin:4px 0 8px;padding:6px 10px;background:#e0e7ff;border-radius:8px}
  .tname span{font-weight:400;font-size:0.75rem;color:#64748b}
  .vid .ctx{font-size:0.8rem;color:#64748b;margin-bottom:6px}
  .vid .bt{font-weight:700;font-size:0.95rem;margin-bottom:8px}
  video{width:100%;border-radius:8px;background:#000;display:block}
  .cmts{margin-top:10px;border-top:1px solid #eef2f7;padding-top:8px}
  .cmt{font-size:0.85rem;padding:6px 8px;border-radius:8px;margin-bottom:4px}
  .cmt.coach{background:#eff6ff}.cmt.family{background:#f0fdf4}
  .cmt .who{font-size:0.7rem;color:#94a3b8;margin-bottom:2px}
  .box{display:flex;gap:6px;margin-top:6px}
  .box input{flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:16px}
  .box button{padding:8px 14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:0.85rem;cursor:pointer}
  .gen{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px;margin-bottom:14px}
  .note{font-size:0.75rem;color:#94a3b8;text-align:center;margin:16px 0}
</style></head><body><div class="wrap">
<h1>🤺 ${esc(t.title)}</h1>
<div class="sub">${esc(meta.name)} · ${esc(t.sub)} · ${esc(t.auto)}</div>
<div id="list">${esc(t.loading)}</div>
<div class="gen"><b>💬 ${esc(t.general)}</b>
  <div class="cmts" id="gen-comments"></div>
  <div class="box"><input id="gen-input" placeholder="${esc(t.namePh)}"><button onclick="sendCmt(null)">${esc(t.send)}</button><button onclick="toggleRec(null,this)" title="Voice" style="background:#dcfce7;color:#166534">🎤</button></div>
</div>
<div class="note">Cathy Fencing · videos update automatically</div>
</div>
<script>
const TOKEN = ${JSON.stringify(token)};
const T = ${JSON.stringify(t)};
let vids = [], cmts = [];
function escH(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function load(){
  try{
    const r = await fetch('/coach-data/' + TOKEN);
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if(!d.feed) throw new Error('no feed');
    vids = d.feed.videos || [];
    cmts = d.comments || [];
    render();
  }catch(e){
    document.getElementById('list').innerHTML = '<div class="vid" style="color:#b91c1c">Load failed: ' + escH(e.message) + '</div>';
  }
}
let renderedIds = '';
function render(){
  const list = document.getElementById('list');
  const ids = vids.map(v => v.id).join('|');
  // 视频列表变了才整体重建——播放器不被留言刷新打断
  if (ids !== renderedIds) {
    renderedIds = ids;
    if(!vids.length){ list.innerHTML = '<div class="vid" style="color:#94a3b8">' + escH(T.none) + '</div>'; }
    else {
      const groups = {};
      vids.forEach(v => {
        const tk = v.tournament || '—';
        if(!groups[tk]) groups[tk] = { date: v.date || '', place: v.place || '', vids: [] };
        groups[tk].vids.push(v);
      });
      list.innerHTML = Object.entries(groups).sort((a,b) => (b[1].date||'').localeCompare(a[1].date||'')).map(([tname, g]) =>
        '<div class="tgroup"><div class="tname">🏆 ' + escH(tname) + (g.date ? ' <span>' + escH(g.date) + (g.place ? ' · ' + escH(g.place) : '') + '</span>' : '') + '</div>' +
        g.vids.map(v =>
          '<div class="vid">' +
          '<div class="bt">' + escH([v.event, v.bout, v.opponent ? 'vs ' + v.opponent : '', v.score].filter(Boolean).join(' · ') || v.name) + '</div>' +
          (v.youtube
            ? '<a href="' + escH(v.url) + '" target="_blank" style="display:block;padding:14px;background:#fee2e2;color:#991b1b;border-radius:8px;text-align:center;text-decoration:none;font-weight:600">▶ Watch on YouTube</a>'
            : '<video controls playsinline preload="metadata" src="' + escH(v.url) + '" onerror="vidErr(this)"></video>') +
          '<div class="cmts" data-vid="' + escH(v.id) + '"></div>' +
          '<div class="box"><input placeholder="' + escH(T.namePh) + '" onkeydown="if(event.keyCode===13)sendCmt(\\'' + v.id + '\\',this)"><button onclick="sendCmt(\\'' + v.id + '\\',this.previousElementSibling)">' + escH(T.send) + '</button><button onclick="toggleRec(\\'' + v.id + '\\',this)" title="Voice" style="background:#dcfce7;color:#166534">🎤</button></div>' +
          '</div>'
        ).join('') + '</div>'
      ).join('');
    }
  }
  // 留言原地更新，不动视频元素
  vids.forEach(v => {
    const el = list.querySelector('.cmts[data-vid="' + v.id + '"]');
    if (el) el.innerHTML = cmts.filter(c => c.videoId === v.id).map(c => cmtHtml(c)).join('');
  });
  document.getElementById('gen-comments').innerHTML = cmts.filter(c => !c.videoId).map(c => cmtHtml(c)).join('');
}
function vidErr(el){
  const code = el.error ? el.error.code : '?';
  const msg = document.createElement('div');
  msg.style.cssText = 'padding:14px;background:#fee2e2;color:#991b1b;border-radius:8px;font-size:0.8rem';
  msg.textContent = 'Video failed to load (error ' + code + ')';
  el.replaceWith(msg);
}
function cmtHtml(c){
  return '<div class="cmt ' + c.author + '"><div class="who">' + (c.author === 'coach' ? escH(T.coach) : escH(T.family)) + ' · ' + String(c.ts||'').slice(5,16).replace('T',' ') + '</div>' +
    (c.audioUrl ? '<audio controls preload="metadata" src="' + escH(c.audioUrl) + '" style="width:100%;margin:2px 0"></audio>' : '') +
    (c.text && c.text !== '🎤' ? escH(c.display || c.text) : '') + '</div>';
}
async function sendCmt(videoId, input){
  input = input || document.getElementById('gen-input');
  const text = input.value.trim();
  if(!text) return;
  input.value = '';
  input.disabled = true;
  // 乐观上屏：留言立刻显示
  cmts.push({ id: 'tmp_' + Date.now(), videoId, author: 'coach', text, display: text, ts: new Date().toISOString() });
  render();
  try{
    await fetch('/', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'comment_add', token: TOKEN, videoId, author:'coach', text})});
    await load();
  }catch(e){ input.value = text; }
  input.disabled = false;
  input.focus();
}
// ===== 语音留言：MediaRecorder -> R2 -> comment_add(audioUrl) =====
let rec = null, recChunks = [];
async function toggleRec(videoId, btn){
  if(rec){ rec.stop(); return; }
  if(!navigator.mediaDevices || !window.MediaRecorder){ alert('Voice recording not supported'); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "");
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
    recChunks = [];
    rec.ondataavailable = e => { if(e.data && e.data.size) recChunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      btn.textContent = "⏳";
      try{
        const blob = new Blob(recChunks, { type: rec.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? ".m4a" : ".webm";
        const init = await (await fetch("/", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"video_init", name:"voice"+ext, contentType:blob.type }) })).json();
        const pr = await fetch("/video-part?key=" + encodeURIComponent(init.key) + "&uploadId=" + encodeURIComponent(init.uploadId) + "&part=1", { method:"POST", headers:{"Content-Type":"application/octet-stream"}, body: blob });
        const part = await pr.json();
        const comp = await (await fetch("/", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"video_complete", key:init.key, uploadId:init.uploadId, parts:[part] }) })).json();
        if(comp.url){
          cmts.push({ id:"tmp_"+Date.now(), videoId, author:"coach", text:"", audioUrl:comp.url, ts:new Date().toISOString() });
          render();
          await fetch("/", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"comment_add", token:TOKEN, videoId, author:"coach", text:"🎤", audioUrl:comp.url }) });
          await load();
        }
      }catch(e){}
      btn.textContent = "🎤";
      rec = null;
    };
    rec.start();
    btn.textContent = "⏹";
  }catch(e){ alert("Mic unavailable"); }
}
load();
setInterval(load, 45000);
</script></body></html>`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
