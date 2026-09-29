// Cathy 视频 Worker —— R2 视频上传/播放 + 教练视频页（每教练独立链接/语言/留言串）
// 绑定：VIDEOS (r2_bucket -> cathy-videos)、AI (Workers AI，留言翻译)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ===== 教练页多语言 =====
const COACH_I18N = {
  zh: { title: 'Cathy 比赛视频', sub: '每场对阵的视频与讨论', comments: '留言', send: '发送', namePh: '留言…', none: '还没有视频', general: '总体留言', coach: '教练', family: '家长', loading: '加载中…', auto: '页面会自动更新新视频', tip: '用你的母语留言，系统自动互译。点 🌐 看原文。', other: '其他语言…', langPh: '输入你的语言（如 Hrvatski）', student: '学员', refresh: '刷新', updated: '已更新', newV: '个新视频', cmtsOf: '条留言', videosHere: '这个链接里的比赛视频', update: '有新版本，点击更新' },
  'zh-TW': { title: 'Cathy 比賽影片', sub: '每場對陣的影片與討論', comments: '留言', send: '發送', namePh: '留言…', none: '還沒有影片', general: '總體留言', coach: '教練', family: '家長', loading: '載入中…', auto: '頁面會自動更新新影片', tip: '用你的母語留言，系統自動互譯。點 🌐 看原文。', other: '其他語言…', langPh: '輸入你的語言' },
  en: { title: "Cathy's Bout Videos", sub: 'Videos and discussion per bout', comments: 'Comments', send: 'Send', namePh: 'Write a comment…', none: 'No videos yet', general: 'General comments', coach: 'Coach', family: 'Family', loading: 'Loading…', auto: 'This page updates automatically', tip: 'Comment in your own language — auto-translated both ways. 🌐 shows the original.', other: 'Other language…', langPh: 'Type your language (e.g. Hrvatski)', student: 'Your student', refresh: 'Refresh', updated: 'Updated', newV: 'new since last visit', cmtsOf: 'comments', videosHere: 'bout videos under this link', update: 'Update available — tap to refresh' },
  it: { title: 'Video dei match di Cathy', sub: 'Video e discussione per ogni assalto', comments: 'Commenti', send: 'Invia', namePh: 'Scrivi un commento…', none: 'Nessun video ancora', general: 'Commenti generali', coach: 'Coach', family: 'Famiglia', loading: 'Caricamento…', auto: 'La pagina si aggiorna automaticamente', tip: 'Commenta nella tua lingua — traduzione automatica. 🌐 per l’originale.', other: 'Altra lingua…', langPh: 'Scrivi la tua lingua' },
  fr: { title: 'Vidéos des matchs de Cathy', sub: 'Vidéos et discussion par assaut', comments: 'Commentaires', send: 'Envoyer', namePh: 'Écrire un commentaire…', none: 'Pas encore de vidéos', general: 'Commentaires généraux', coach: 'Coach', family: 'Famille', loading: 'Chargement…', auto: 'La page se met à jour automatiquement', tip: 'Commentez dans votre langue — traduction automatique. 🌐 pour l’original.', other: 'Autre langue…', langPh: 'Tapez votre langue' },
  es: { title: 'Videos de combates de Cathy', sub: 'Vídeos y discusión por asalto', comments: 'Comentarios', send: 'Enviar', namePh: 'Escribe un comentario…', none: 'Aún no hay vídeos', general: 'Comentarios generales', coach: 'Entrenador', family: 'Familia', loading: 'Cargando…', auto: 'La página se actualiza automáticamente', tip: 'Comenta en tu idioma — traducción automática. 🌐 muestra el original.', other: 'Otro idioma…', langPh: 'Escribe tu idioma' },
  ar: { title: 'فيديوهات مباريات كاثي', sub: 'فيديوهات ومناقشة لكل نزال', comments: 'التعليقات', send: 'إرسال', namePh: 'اكتب تعليقاً…', none: 'لا توجد فيديوهات بعد', general: 'تعليقات عامة', coach: 'المدرب', family: 'العائلة', loading: 'جارٍ التحميل…', auto: 'تتحدث الصفحة تلقائياً', tip: 'اكتب بلغتك — تُترجم التعليقات تلقائياً. اضغط 🌐 للأصل.', other: 'لغة أخرى…', langPh: 'اكتب لغتك' },
  de: { title: 'Cathys Gefechtsvideos', sub: 'Videos und Diskussion pro Gefecht', comments: 'Kommentare', send: 'Senden', namePh: 'Kommentar schreiben…', none: 'Noch keine Videos', general: 'Allgemeine Kommentare', coach: 'Trainer', family: 'Familie', loading: 'Lädt…', auto: 'Die Seite aktualisiert sich automatisch', tip: 'In Ihrer Sprache kommentieren — automatisch übersetzt. 🌐 zeigt das Original.', other: 'Andere Sprache…', langPh: 'Ihre Sprache eingeben' },
  ja: { title: 'Cathyの試合動画', sub: '各試合の動画とディスカッション', comments: 'コメント', send: '送信', namePh: 'コメントを入力…', none: 'まだ動画がありません', general: '全体へのコメント', coach: 'コーチ', family: '家族', loading: '読み込み中…', auto: 'ページは自動更新されます', tip: '母国語でコメント — 自動で相互翻訳。🌐で原文表示。', other: 'その他の言語…', langPh: '言語を入力' },
  ko: { title: 'Cathy 경기 영상', sub: '경기별 영상과 토론', comments: '댓글', send: '보내기', namePh: '댓글을 입력하세요…', none: '아직 영상이 없습니다', general: '전체 댓글', coach: '코치', family: '가족', loading: '로딩 중…', auto: '페이지가 자동으로 업데이트됩니다', tip: '모국어로 댓글 작성 — 자동 번역. 🌐 원문 보기.', other: '기타 언어…', langPh: '언어를 입력하세요' },
  ru: { title: 'Видео боёв Cathy', sub: 'Видео и обсуждение каждого боя', comments: 'Комментарии', send: 'Отправить', namePh: 'Написать комментарий…', none: 'Видео пока нет', general: 'Общие комментарии', coach: 'Тренер', family: 'Семья', loading: 'Загрузка…', auto: 'Страница обновляется автоматически', tip: 'Пишите на своём языке — автоперевод в обе стороны. 🌐 — оригинал.', other: 'Другой язык…', langPh: 'Введите ваш язык' },
  hu: { title: 'Cathy mérkőzés videói', sub: 'Videók és beszélgetés mérkőzésenként', comments: 'Hozzászólások', send: 'Küldés', namePh: 'Írj hozzászólást…', none: 'Még nincs videó', general: 'Általános hozzászólások', coach: 'Edző', family: 'Család', loading: 'Betöltés…', auto: 'Az oldal automatikusan frissül', tip: 'Írj anyanyelveden — automatikus fordítás. 🌐 az eredetihez.', other: 'Más nyelv…', langPh: 'Írd be a nyelved' },
  pt: { title: 'Vídeos dos combates da Cathy', sub: 'Vídeos e discussão por combate', comments: 'Comentários', send: 'Enviar', namePh: 'Escreva um comentário…', none: 'Ainda não há vídeos', general: 'Comentários gerais', coach: 'Treinador', family: 'Família', loading: 'A carregar…', auto: 'A página atualiza-se automaticamente', tip: 'Comente no seu idioma — tradução automática. 🌐 mostra o original.', other: 'Outro idioma…', langPh: 'Escreva o seu idioma' },
  uk: { title: 'Відео поєдинків Cathy', sub: 'Відео та обговорення кожного поєдинку', comments: 'Коментарі', send: 'Надіслати', namePh: 'Написати коментар…', none: 'Відео поки немає', general: 'Загальні коментарі', coach: 'Тренер', family: 'Родина', loading: 'Завантаження…', auto: 'Сторінка оновлюється автоматично', tip: 'Пишіть своєю мовою — автопереклад. 🌐 — оригінал.', other: 'Інша мова…', langPh: 'Введіть вашу мову' },
  pl: { title: 'Wideo walk Cathy', sub: 'Wideo i dyskusja dla każdej walki', comments: 'Komentarze', send: 'Wyślij', namePh: 'Napisz komentarz…', none: 'Brak wideo', general: 'Komentarze ogólne', coach: 'Trener', family: 'Rodzina', loading: 'Ładowanie…', auto: 'Strona aktualizuje się automatycznie', tip: 'Komentuj w swoim języku — tłumaczenie automatyczne. 🌐 pokazuje oryginał.', other: 'Inny język…', langPh: 'Wpisz swój język' },
  fa: { title: 'ویدیوهای مبارزه کتی', sub: 'ویدیو و بحث برای هر مبارزه', comments: 'نظرات', send: 'ارسال', namePh: 'نظر بنویسید…', none: 'هنوز ویدیویی نیست', general: 'نظرات کلی', coach: 'مربی', family: 'خانواده', loading: 'در حال بارگذاری…', auto: 'صفحه به‌صورت خودکار به‌روزرسانی می‌شود', tip: 'به زبان خود بنویسید — ترجمه خودکار. 🌐 متن اصلی.', other: 'زبان دیگر…', langPh: 'زبان خود را بنویسید' },
  ro: { title: 'Videoclipuri meciuri Cathy', sub: 'Videoclipuri și discuții pentru fiecare asalt', comments: 'Comentarii', send: 'Trimite', namePh: 'Scrie un comentariu…', none: 'Încă nu sunt videoclipuri', general: 'Comentarii generale', coach: 'Antrenor', family: 'Familie', loading: 'Se încarcă…', auto: 'Pagina se actualizează automat', tip: 'Comentează în limba ta — traducere automată. 🌐 pentru original.', other: 'Altă limbă…', langPh: 'Scrie limba ta' },
  tr: { title: "Cathy'nin Maç Videoları", sub: 'Her maç için video ve tartışma', comments: 'Yorumlar', send: 'Gönder', namePh: 'Yorum yazın…', none: 'Henüz video yok', general: 'Genel yorumlar', coach: 'Antrenör', family: 'Aile', loading: 'Yükleniyor…', auto: 'Sayfa otomatik güncellenir', tip: 'Kendi dilinizde yazın — otomatik çeviri. 🌐 orijinali gösterir.', other: 'Diğer dil…', langPh: 'Dilinizi yazın' }
};
const LANG_NAME = {
  zh: '中文', 'zh-TW': '繁體中文', en: 'English', it: 'italiano', fr: 'français',
  es: 'español', ar: 'العربية', de: 'Deutsch', ja: '日本語', ko: '한국어',
  ru: 'русский', hu: 'magyar', pt: 'português', uk: 'українська', pl: 'polski',
  fa: 'فارسی', ro: 'română', tr: 'Türkçe'
};
// 击剑主流语言选项（顺序 = 常见度）
const LANG_OPTIONS = ['en', 'it', 'fr', 'zh', 'zh-TW', 'ja', 'ko', 'ru', 'hu', 'es', 'ar', 'de', 'pt', 'uk', 'pl', 'fa', 'ro', 'tr'];
// 校验语言代码/自定义语言名
function validLang(l) { return typeof l === 'string' && /^[a-zA-Z\u4e00-\u9fff\u0600-\u06ff\- ]{2,30}$/.test(l) && l.length <= 30; }
// 非内置语言的 UI 文案：AI 翻译一次后缓存到 R2
async function getUILang(env, lang) {
  if (COACH_I18N[lang]) return COACH_I18N[lang];
  const cacheKey = `coach/ui_${encodeURIComponent(lang)}.json`;
  const cached = await readJson(env, cacheKey);
  if (cached) return cached;
  try {
    const res = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
      messages: [
        { role: 'system', content: `Translate this JSON's values into ${LANG_NAME[lang] || lang}. Keep keys unchanged. Output ONLY valid JSON.` },
        { role: 'user', content: JSON.stringify(COACH_I18N.en) }
      ],
      max_tokens: 1000
    });
    const raw = (res && res.response || '').trim();
    const m = raw.match(/\{[\s\S]*\}/);
    const ui = m ? JSON.parse(m[0]) : null;
    if (ui && ui.title) { await writeJson(env, cacheKey, ui); return ui; }
  } catch (e) {}
  return COACH_I18N.en;
}

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
        const t = await getUILang(env, meta.lang || 'en');
        return new Response(renderCoachPage(token, meta, t), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
      }

      // 教练页数据（feed + 该教练的留言串）
      if (request.method === 'GET' && reqUrl.pathname.startsWith('/coach-data/')) {
        const token = decodeURIComponent(reqUrl.pathname.slice('/coach-data/'.length)).replace(/\/+$/, '');
        if (!/^[a-z0-9]{16,64}$/i.test(token)) return json({ error: 'invalid' }, 403);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid' }, 404);
        const feed = await readJson(env, 'coach/feed.json') || { videos: [] };
        const comments = await readJson(env, `coach/comments_${token}.json`) || [];
        // 家长留言显示为教练语言版本；缺该语言翻译时现翻并缓存回写
        const lang = meta.lang || 'en';
        let dirty = false;
        const shown = [];
        for (const c of comments) {
          if (c.author === 'family' && lang !== 'zh' && c.text && c.text !== '🎤') {
            c.translations = c.translations || {};
            if (!c.translations[lang]) { c.translations[lang] = await translate(env, c.text, lang); dirty = true; }
            shown.push({ ...c, display: c.translations[lang], orig: c.text });
          } else {
            shown.push({ ...c, display: c.text, orig: null });
          }
        }
        if (dirty) await writeJson(env, `coach/comments_${token}.json`, comments);
        return json({ meta, feed, comments: shown, v: PAGE_VERSION });
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

      // 改名：同步教练页显示的名字
      if (body.action === 'coach_rename') {
        const token = String(body.token || '');
        const name = String(body.name || '').slice(0, 60).trim();
        if (!/^[a-z0-9]{16,64}$/i.test(token) || !name) return json({ error: 'bad request' }, 400);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid link' }, 404);
        meta.name = name;
        await writeJson(env, `coach/meta_${token}.json`, meta);
        return json({ ok: true });
      }

      if (body.action === 'coach_revoke') {
        const token = String(body.token || '');
        if (!/^[a-z0-9]{16,64}$/i.test(token)) return json({ error: 'bad request' }, 400);
        await env.VIDEOS.delete(`coach/meta_${token}.json`);
        return json({ ok: true });
      }

      // 教练自助切换语言（内置 18 种 + 自定义语言名）
      if (body.action === 'coach_setlang') {
        const token = String(body.token || '');
        const lang = String(body.lang || '');
        if (!/^[a-z0-9]{16,64}$/i.test(token) || !validLang(lang)) return json({ error: 'bad request' }, 400);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid link' }, 404);
        meta.lang = lang;
        await writeJson(env, `coach/meta_${token}.json`, meta);
        return json({ ok: true });
      }

      // 教练页打开后回写 lastSeen，用于「自上次访问新增视频」标记
      if (body.action === 'coach_seen') {
        const token = String(body.token || '');
        if (!/^[a-z0-9]{16,64}$/i.test(token)) return json({ error: 'bad request' }, 400);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid link' }, 404);
        meta.lastSeen = new Date().toISOString();
        await writeJson(env, `coach/meta_${token}.json`, meta);
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
        const feed = await readJson(env, 'coach/feed.json') || {};
        const familyLang = feed.familyLang || 'zh';
        const rec = {
          id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          videoId, author, text,
          ts: new Date().toISOString()
        };
        if (audioUrl) rec.audioUrl = audioUrl;
        rec.lang = author === 'family' ? familyLang : coachLang;
        // 双向翻译：家长留言 → 翻成教练语言（按语言缓存）；教练留言 → 翻成家长语言
        if (author === 'family' && coachLang !== familyLang && text && text !== '🎤') {
          rec.translations = { [coachLang]: await translate(env, text, coachLang) };
          rec.coachText = rec.translations[coachLang];
        }
        if (author === 'coach' && coachLang !== familyLang && text && text !== '🎤') {
          const tt = await translate(env, text, familyLang);
          rec.translations = Object.assign(rec.translations || {}, { [familyLang]: tt });
          rec.familyText = tt;
          if (familyLang === 'zh') rec.zhText = tt;
        }
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
// 版本指纹：页面代码变了就自动变（用于已打开页面的「点击更新」提示）
const _pvSrc = renderCoachPage.toString() + esc.toString() + JSON.stringify(COACH_I18N) + LANG_OPTIONS.join(',');
let _pvH = 0; for (let i = 0; i < _pvSrc.length; i++) _pvH = (_pvH * 31 + _pvSrc.charCodeAt(i)) >>> 0;
const PAGE_VERSION = _pvSrc.length.toString(36) + _pvH.toString(36);
// 布局：教练主页（教练名为主、学员副标）→ 赛事(可带官方链接,吸顶) → 对阵 → 视频片段缩略图 → 折叠留言
function renderCoachPage(token, meta, t) {
  t = Object.assign({}, COACH_I18N.en, t);
  const title = 'Coach ' + meta.name + ' — ' + t.title;
  return `<!DOCTYPE html><html lang="${esc(meta.lang)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;background:#f1f5f9;color:#1e293b}
  .wrap{max-width:640px;margin:0 auto;padding:12px}
  .langbar{display:flex;flex-direction:column;align-items:flex-end;margin-bottom:6px}
  .langbar select{font-size:0.85rem;padding:4px 8px;border:1px solid #d1d5db;border-radius:8px;background:#fff}
  .langbar select.pulse{animation:pulse 1.6s infinite}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(37,99,235,.55)}70%{box-shadow:0 0 0 10px rgba(37,99,235,0)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}
  .langhint{display:none;position:relative;margin-top:6px;background:#0f172a;color:#fff;font-size:0.78rem;padding:6px 12px;border-radius:10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}
  .langhint::before{content:'';position:absolute;top:-6px;right:34px;border:6px solid transparent;border-bottom-color:#0f172a;border-top:none}
  .hd{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;border-radius:14px;padding:16px 16px 12px;box-shadow:0 2px 8px rgba(30,58,138,.25)}
  .cname{font-size:1.35rem;font-weight:800;letter-spacing:.2px}
  .csub{font-size:0.82rem;opacity:.85;margin-top:3px}
  .stu{display:flex;align-items:center;gap:12px;background:#fff;border-radius:12px;padding:10px 14px;margin-top:10px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .stu .av{width:42px;height:42px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex:none}
  .stu .sname{font-weight:700;font-size:0.95rem}
  .stu .smeta{font-size:0.75rem;color:#64748b;margin-top:1px}
  .newb{display:inline-block;margin-top:8px;background:#22c55e;color:#fff;font-size:0.72rem;font-weight:700;padding:2px 10px;border-radius:999px}
  .tip{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;border-radius:10px;padding:8px 10px;font-size:0.76rem;margin:10px 0;line-height:1.5}
  .statusbar{display:flex;justify-content:space-between;align-items:center;font-size:0.72rem;color:#64748b;margin:2px 2px 10px}
  .statusbar button{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:4px 10px;font-size:0.75rem;cursor:pointer}
  .tgroup{margin-bottom:16px}
  .thead{position:sticky;top:0;z-index:5;background:#f1f5f9;padding:6px 0}
  .tname{font-weight:800;font-size:0.95rem}
  .tname a{color:#1d4ed8;text-decoration:none}
  .tname a:active{text-decoration:underline}
  .tmeta{font-size:0.72rem;color:#64748b;margin-top:1px}
  .bout{background:#fff;border-radius:12px;padding:10px 12px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .bhead{font-weight:700;font-size:0.85rem;margin-bottom:8px;color:#0f172a}
  .vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .vcell{position:relative;border-radius:10px;overflow:hidden;background:#000;aspect-ratio:16/9;cursor:pointer}
  .vcell video{width:100%;height:100%;object-fit:cover;display:block}
  .vcell .pov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.6rem;background:rgba(0,0,0,.18)}
  .vcell .dur{position:absolute;right:5px;bottom:5px;background:rgba(0,0,0,.72);color:#fff;font-size:0.65rem;padding:1px 6px;border-radius:6px}
  .vcell .newtag{position:absolute;left:5px;top:5px;background:#ef4444;color:#fff;font-size:0.62rem;font-weight:700;padding:1px 6px;border-radius:6px}
  .vcell .vname{position:absolute;left:5px;bottom:5px;right:5px;color:#fff;font-size:0.62rem;text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ytcell{display:block;border-radius:10px;background:#fee2e2;color:#991b1b;text-align:center;padding:16px 8px;font-weight:600;text-decoration:none;font-size:0.8rem}
  .cbtn{margin-top:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:5px 10px;font-size:0.76rem;color:#475569;cursor:pointer;width:100%;text-align:left}
  .cbody{display:none;margin-top:6px}
  .cbody.open{display:block}
  .cmt{font-size:0.84rem;padding:6px 8px;border-radius:8px;margin-bottom:4px}
  .cmt.coach{background:#eff6ff}.cmt.family{background:#f0fdf4}
  .cmt .who{font-size:0.68rem;color:#94a3b8;margin-bottom:2px}
  .cmt .tr{cursor:pointer;font-size:0.7rem;color:#3b82f6;margin-left:4px}
  .cmt .orig{margin-top:2px;padding:4px 6px;background:#f8fafc;border-radius:6px;font-size:0.78rem;color:#64748b}
  .box{display:flex;gap:6px;margin-top:6px}
  .box input{flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:16px;box-sizing:border-box}
  .box button{padding:8px 12px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:0.85rem;cursor:pointer}
  .box .mic{background:#dcfce7;color:#166534}
  .gen{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px;margin:14px 0}
  .note{font-size:0.72rem;color:#94a3b8;text-align:center;margin:16px 0}
  .empty{background:#fff;border-radius:12px;padding:24px;text-align:center;color:#94a3b8;font-size:0.85rem}
  .upd{display:none;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#2563eb;color:#fff;font-size:0.82rem;font-weight:600;padding:9px 18px;border-radius:999px;box-shadow:0 4px 14px rgba(37,99,235,.4);cursor:pointer;z-index:999;white-space:nowrap}
</style></head><body><div class="wrap">
<div class="langbar"><span>🌐 <select id="langSel" onchange="setLang(this.value)">${LANG_OPTIONS.map(l => `<option value="${esc(l)}"${meta.lang === l ? ' selected' : ''}>${esc(LANG_NAME[l])}</option>`).join('')}<option value="__custom"${LANG_OPTIONS.includes(meta.lang) ? '' : ' selected'}>${esc(t.other)}</option></select></span>
<div class="langhint" id="langHint">Choose your language / 选择语言 ▲</div></div>
<div class="hd">
  <div class="cname">🛡 Coach ${esc(meta.name)}</div>
  <span class="newb" id="newBadge" style="display:none"></span>
</div>
<div class="stu">
  <div class="av">🤺</div>
  <div><div class="sname" id="stuName">Cathy He</div><div class="smeta" id="stuLine">Foil · Vancouver · ${esc(t.videosHere)}</div></div>
</div>
<div class="tip">🤖 ${esc(t.tip)}</div>
<div class="statusbar"><span id="upd"></span><button onclick="load(true)">⟳ ${esc(t.refresh)}</button></div>
<div id="list"><div class="empty">${esc(t.loading)}</div></div>
<div class="gen"><b>💬 ${esc(t.general)}</b>
  <div id="gen-comments" style="margin-top:6px"></div>
  <div class="box"><input id="gen-input" placeholder="${esc(t.namePh)}" onkeydown="if(event.keyCode===13)sendCmt(this)"><button onclick="sendCmt(document.getElementById(&quot;gen-input&quot;))">${esc(t.send)}</button><button class="mic" onclick="toggleRec(this)" title="Voice">🎤</button></div>
</div>
<div class="note">Cathy Fencing · ${esc(t.auto)}</div>
</div>
<div class="upd" id="updBar" onclick="location.reload()">🔄 ${esc(t.update || 'Update available — tap to refresh')}</div>
<script>
const TOKEN = ${JSON.stringify(token)};
const PAGE_VER = ${JSON.stringify(PAGE_VERSION)};
const T = ${JSON.stringify(t)};
let vids = [], cmts = [], lastSeen = 0, boutVid = {};
const openCmts = {};
// 首开引导：气泡+脉冲指向语言选择器，点掉或选语言后不再出现
const hintKey = "langHinted_" + TOKEN;
function dismissHint(){
  try{ localStorage.setItem(hintKey, "1"); }catch(e){}
  const lh = document.getElementById("langHint"), sel = document.getElementById("langSel");
  if(lh) lh.style.display = "none";
  if(sel) sel.classList.remove("pulse");
}
try{
  if(!localStorage.getItem(hintKey)){
    const lh = document.getElementById("langHint"), sel = document.getElementById("langSel");
    if(lh && sel){ lh.style.display = "block"; sel.classList.add("pulse"); lh.onclick = dismissHint; }
  }
}catch(e){}
function escH(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","\\'":"&#39;"}[c]))}
function ago(ts){
  if(!ts) return "";
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if(s < 90) return Math.max(1, Math.round(s)) + "m";
  if(s < 3600) return Math.round(s/60) + "m";
  if(s < 86400) return Math.round(s/3600) + "h";
  return Math.round(s/86400) + "d";
}
async function load(manual){
  try{
    const r = await fetch("/coach-data/" + TOKEN);
    if(!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    if(!d.feed) throw new Error("no feed");
    lastSeen = d.meta && d.meta.lastSeen ? new Date(d.meta.lastSeen).getTime() : 0;
    const stu = d.feed.student;
    if(stu){
      const age = stu.birth ? Math.floor((Date.now() - new Date(stu.birth).getTime()) / 31557600000) : null;
      document.getElementById("stuName").textContent = stu.name || "Cathy He";
      document.getElementById("stuLine").textContent = [stu.weapon, stu.birth ? "🎂 " + stu.birth + (age ? " (" + age + ")" : "") : "", stu.home, T.videosHere].filter(Boolean).join(" · ");
    }
    vids = d.feed.videos || [];
    cmts = d.comments || [];
    render();
    document.getElementById("upd").textContent = T.updated + " " + new Date().toLocaleTimeString().slice(0,5);
    if(d.v && d.v !== PAGE_VER) document.getElementById("updBar").style.display = "block";
    if(manual !== true){
      // 首次加载后回写 lastSeen，下次访问可标 NEW
      fetch("/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"coach_seen", token:TOKEN})});
    }
  }catch(e){
    document.getElementById("list").innerHTML = "<div class='empty' style='color:#b91c1c'>Load failed: " + escH(e.message) + "</div>";
  }
}
let renderedSig = "";
function boutKey(v){ return [v.event||"", v.bout||"", v.opponent||"", v.score||""].join("|") || v.id; }
function render(){
  const list = document.getElementById("list");
  const sig = vids.map(v => v.id + ":" + (v.tournament||"")).join("|");
  if(sig !== renderedSig){
    renderedSig = sig;
    boutVid = {};
    if(!vids.length){
      list.innerHTML = "<div class='empty'>" + escH(T.none) + "</div>";
    } else {
      const groups = {};
      const order = [];
      vids.forEach(v => {
        const tk = v.tournament || "—";
        if(!groups[tk]){ groups[tk] = { date: v.date||"", place: v.place||"", tUrl: v.tUrl||"", bouts: {}, bord: [] }; order.push(tk); }
        const bk = tk + "||" + boutKey(v);
        if(!groups[tk].bouts[bk]){ groups[tk].bouts[bk] = { label: [v.event, v.bout, v.opponent ? "vs " + v.opponent : "", v.score].filter(Boolean).join(" · "), vids: [] }; groups[tk].bord.push(bk); }
        groups[tk].bouts[bk].vids.push(v);
        boutVid[v.id] = bk;
      });
      order.sort((a,b) => (groups[b].date||"").localeCompare(groups[a].date||""));
      let newCount = 0;
      vids.forEach(v => { if(v.uploadedAt && new Date(v.uploadedAt).getTime() > lastSeen) newCount++; });
      const nb = document.getElementById("newBadge");
      if(newCount){ nb.textContent = "● " + newCount + " " + T.newV; nb.style.display = "inline-block"; }
      else nb.style.display = "none";
      list.innerHTML = order.map(tname => {
        const g = groups[tname];
        const isNew = t => t && new Date(t).getTime() > lastSeen;
        const head = g.tUrl
          ? "<div class='tname'>🏆 <a href='" + escH(g.tUrl) + "' target='_blank' rel='noopener'>" + escH(tname) + " ↗</a></div>"
          : "<div class='tname'>🏆 " + escH(tname) + "</div>";
        const metaLine = [g.date, g.place].filter(Boolean).join(" · ");
        return "<div class='tgroup'><div class='thead'>" + head +
          (metaLine ? "<div class='tmeta'>" + escH(metaLine) + "</div>" : "") + "</div>" +
          g.bord.map(bk => {
            const b = g.bouts[bk];
            const bid = escH(bk);
            const n = cmts.filter(c => b.vids.some(v => v.id === c.videoId)).length;
            return "<div class='bout' data-bkey='" + bid + "'><div class='bhead'>" + escH(b.label || b.vids[0].name) + "</div>" +
              "<div class='vgrid'>" + b.vids.map(v => {
                const isN = isNew(v.uploadedAt);
                if(v.youtube) return "<a class='ytcell' href='" + escH(v.url) + "' target='_blank' rel='noopener'>▶ " + escH(v.name) + "</a>";
                return "<div class='vcell' onclick='playV(this)'>" +
                  "<video muted playsinline preload='metadata' src='" + escH(v.url) + "' onloadedmetadata='durSet(this)' onerror='vidErr(this)'></video>" +
                  "<div class='pov'>▶</div><div class='dur'></div>" +
                  (isN ? "<div class='newtag'>NEW</div>" : "") +
                  "<div class='vname'>" + escH(v.name) + "</div></div>";
              }).join("") + "</div>" +
              "<button class='cbtn' onclick='toggleCmts(this)'>💬 " + n + " " + T.cmtsOf + "</button>" +
              "<div class='cbody" + (openCmts[bk] ? " open" : "") + "'><div class='cmts' data-bkey='" + bid + "'></div>" +
              "<div class='box'><input placeholder='" + escH(T.namePh) + "' onkeydown='if(event.keyCode===13)sendCmt(this)'><button onclick='sendCmt(this.previousElementSibling)'>" + escH(T.send) + "</button><button class='mic' onclick='toggleRec(this)' title='Voice'>🎤</button></div></div></div>";
          }).join("") + "</div>";
      }).join("");
    }
  }
  // 留言原地更新 + 计数刷新
  document.querySelectorAll(".bout").forEach(el => {
    const bk = el.dataset.bkey;
    const bVids = vids.filter(v => boutVid[v.id] === bk);
    const list2 = bVids.map(v => v.id);
    const bc = cmts.filter(c => list2.includes(c.videoId));
    const ce = el.querySelector(".cmts");
    if(ce) ce.innerHTML = bc.map(cmtHtml).join("");
    const btn = el.querySelector(".cbtn");
    if(btn) btn.innerHTML = "💬 " + bc.length + " " + escH(T.cmtsOf) + (bc.length ? " · " + ago(bc[bc.length-1].ts) : "");
  });
  document.getElementById("gen-comments").innerHTML = cmts.filter(c => !c.videoId || !boutVid[c.videoId]).map(cmtHtml).join("");
}
function durSet(v){
  const d = v.duration;
  if(!isFinite(d)) return;
  const m = Math.floor(d/60), s = Math.round(d%60);
  const el = v.parentNode.querySelector(".dur");
  if(el) el.textContent = m + ":" + String(s).padStart(2,"0");
}
function playV(cell){
  const v = cell.querySelector("video");
  if(!v) return;
  v.muted = false; v.controls = true; v.setAttribute("preload","auto");
  cell.querySelectorAll(".pov,.dur,.vname,.newtag").forEach(e => e.style.display = "none");
  cell.style.cursor = "default"; cell.onclick = null;
  v.play().catch(function(){});
}
function vidErr(v){
  const cell = v.parentNode;
  cell.innerHTML = "<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#fca5a5;font-size:0.7rem;padding:8px;text-align:center'>Video failed to load</div>";
}
function toggleCmts(btn){
  const body = btn.nextElementSibling;
  const open = body.classList.toggle("open");
  const bk = btn.closest(".bout").dataset.bkey;
  openCmts[bk] = open;
}
function cmtHtml(c){
  const shown = c.display || c.text;
  const hasOrig = c.orig && c.orig !== shown;
  return "<div class='cmt " + c.author + "'><div class='who'>" + (c.author === "coach" ? escH(T.coach) : escH(T.family)) + " · " + ago(c.ts) +
    (hasOrig ? "<span class='tr' onclick='toggleOrig(this)'>🌐</span>" : "") + "</div>" +
    (hasOrig ? "<div class='orig' style='display:none'>" + escH(c.orig) + "</div>" : "") +
    (c.audioUrl ? "<audio controls preload='metadata' src='" + escH(c.audioUrl) + "' style='width:100%;margin:2px 0'></audio>" : "") +
    (shown && shown !== "🎤" ? escH(shown) : "") + "</div>";
}
function toggleOrig(el){
  const o = el.parentNode.parentNode.querySelector(".orig");
  if(o) o.style.display = (o.style.display === "block") ? "none" : "block";
}
async function setLang(v){
  if(v === "__custom"){
    v = prompt(T.langPh || "Your language?");
    if(!v || !v.trim()) return;
    v = v.trim();
  }
  dismissHint();
  try{
    await fetch("/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"coach_setlang", token: TOKEN, lang: v})});
    location.reload();
  }catch(e){}
}
function inputBkey(input){
  const bout = input.closest(".bout");
  if(!bout) return null;
  const bk = bout.dataset.bkey;
  const bv = vids.find(v => boutVid[v.id] === bk);
  return bv ? bv.id : null;
}
async function sendCmt(input){
  const text = input.value.trim();
  if(!text) return;
  const videoId = inputBkey(input);
  input.value = "";
  input.disabled = true;
  openCmts[input.closest(".bout") ? input.closest(".bout").dataset.bkey : ""] = true;
  cmts.push({ id: "tmp_" + Date.now(), videoId, author: "coach", text, display: text, ts: new Date().toISOString() });
  render();
  try{
    await fetch("/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"comment_add", token: TOKEN, videoId, author:"coach", text})});
    await load();
  }catch(e){ input.value = text; }
  input.disabled = false;
  input.focus();
}
// ===== 语音留言：MediaRecorder -> R2 -> comment_add(audioUrl) =====
let rec = null, recChunks = [];
async function toggleRec(btn){
  const videoId = inputBkey(btn);
  if(rec){ rec.stop(); return; }
  if(!navigator.mediaDevices || !window.MediaRecorder){ alert("Voice recording not supported"); return; }
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
setInterval(function(){ load(true); }, 45000);
</script></body></html>`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
