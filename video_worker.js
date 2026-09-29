// Cathy 视频 Worker —— R2 视频上传/播放 + 教练视频页（每教练独立链接/语言/留言串）
// 绑定：VIDEOS (r2_bucket -> cathy-videos)、AI (Workers AI，留言翻译)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ===== 教练页多语言 =====
const COACH_I18N = {
  zh: { title: 'Cathy 比赛视频', sub: '每场对阵的视频与讨论', comments: '留言', send: '发送', namePh: '留言…', none: '还没有视频', general: '总体留言', coach: '教练', family: '家长', loading: '加载中…', auto: '页面会自动更新新视频', tip: '用你的母语留言即可——系统会自动翻译成中文给家长，家长的回复会翻译成你的语言。点 🌐 查看原文。', other: '其他语言…', langPh: '输入你的语言（如 Hrvatski）' },
  'zh-TW': { title: 'Cathy 比賽影片', sub: '每場對陣的影片與討論', comments: '留言', send: '發送', namePh: '留言…', none: '還沒有影片', general: '總體留言', coach: '教練', family: '家長', loading: '載入中…', auto: '頁面會自動更新新影片', tip: '用你的母語留言即可——系統會自動翻譯成中文給家長，家長的回覆會翻譯成你的語言。點 🌐 查看原文。', other: '其他語言…', langPh: '輸入你的語言' },
  en: { title: "Cathy's Bout Videos", sub: 'Videos and discussion per bout', comments: 'Comments', send: 'Send', namePh: 'Write a comment…', none: 'No videos yet', general: 'General comments', coach: 'Coach', family: 'Family', loading: 'Loading…', auto: 'This page updates automatically', tip: 'Write in your own language — your comments are auto-translated to Chinese for the family, and their replies appear here in yours. Tap 🌐 to see the original.', other: 'Other language…', langPh: 'Type your language (e.g. Hrvatski)' },
  it: { title: 'Video dei match di Cathy', sub: 'Video e discussione per ogni assalto', comments: 'Commenti', send: 'Invia', namePh: 'Scrivi un commento…', none: 'Nessun video ancora', general: 'Commenti generali', coach: 'Coach', family: 'Famiglia', loading: 'Caricamento…', auto: 'La pagina si aggiorna automaticamente', tip: 'Scrivi nella tua lingua — i commenti sono tradotti automaticamente in cinese per la famiglia, e le loro risposte appaiono qui nella tua. Tocca 🌐 per l\u2019originale.', other: 'Altra lingua…', langPh: 'Scrivi la tua lingua' },
  fr: { title: 'Vidéos des matchs de Cathy', sub: 'Vidéos et discussion par assaut', comments: 'Commentaires', send: 'Envoyer', namePh: 'Écrire un commentaire…', none: 'Pas encore de vidéos', general: 'Commentaires généraux', coach: 'Coach', family: 'Famille', loading: 'Chargement…', auto: 'La page se met à jour automatiquement', tip: 'Écrivez dans votre langue — vos commentaires sont traduits automatiquement en chinois pour la famille, et leurs réponses apparaissent ici dans la vôtre. Touchez 🌐 pour l\u2019original.', other: 'Autre langue…', langPh: 'Tapez votre langue' },
  es: { title: 'Videos de combates de Cathy', sub: 'Vídeos y discusión por asalto', comments: 'Comentarios', send: 'Enviar', namePh: 'Escribe un comentario…', none: 'Aún no hay vídeos', general: 'Comentarios generales', coach: 'Entrenador', family: 'Familia', loading: 'Cargando…', auto: 'La página se actualiza automáticamente', tip: 'Escribe en tu idioma — tus comentarios se traducen automáticamente al chino para la familia, y sus respuestas aparecen aquí en el tuyo. Toca 🌐 para ver el original.', other: 'Otro idioma…', langPh: 'Escribe tu idioma' },
  ar: { title: 'فيديوهات مباريات كاثي', sub: 'فيديوهات ومناقشة لكل نزال', comments: 'التعليقات', send: 'إرسال', namePh: 'اكتب تعليقاً…', none: 'لا توجد فيديوهات بعد', general: 'تعليقات عامة', coach: 'المدرب', family: 'العائلة', loading: 'جارٍ التحميل…', auto: 'تتحدث الصفحة تلقائياً', tip: 'اكتب بلغتك — تُترجم تعليقاتك تلقائياً إلى الصينية للعائلة، وتظهر ردودهم هنا بلغتك. اضغط 🌐 لرؤية الأصل.', other: 'لغة أخرى…', langPh: 'اكتب لغتك' },
  de: { title: 'Cathys Gefechtsvideos', sub: 'Videos und Diskussion pro Gefecht', comments: 'Kommentare', send: 'Senden', namePh: 'Kommentar schreiben…', none: 'Noch keine Videos', general: 'Allgemeine Kommentare', coach: 'Trainer', family: 'Familie', loading: 'Lädt…', auto: 'Die Seite aktualisiert sich automatisch', tip: 'Schreiben Sie in Ihrer Sprache — Ihre Kommentare werden automatisch ins Chinesische für die Familie übersetzt, und deren Antworten erscheinen hier in Ihrer Sprache. Tippen Sie auf 🌐 für das Original.', other: 'Andere Sprache…', langPh: 'Ihre Sprache eingeben' },
  ja: { title: 'Cathyの試合動画', sub: '各試合の動画とディスカッション', comments: 'コメント', send: '送信', namePh: 'コメントを入力…', none: 'まだ動画がありません', general: '全体へのコメント', coach: 'コーチ', family: '家族', loading: '読み込み中…', auto: 'ページは自動更新されます', tip: '母国語でコメントしてください——自動で中国語に翻訳され家族に届き、家族の返信はあなたの言語で表示されます。🌐で原文を表示。', other: 'その他の言語…', langPh: '言語を入力' },
  ko: { title: 'Cathy 경기 영상', sub: '경기별 영상과 토론', comments: '댓글', send: '보내기', namePh: '댓글을 입력하세요…', none: '아직 영상이 없습니다', general: '전체 댓글', coach: '코치', family: '가족', loading: '로딩 중…', auto: '페이지가 자동으로 업데이트됩니다', tip: '모국어로 작성하세요 — 댓글은 자동으로 중국어로 번역되어 가족에게 전달되고, 가족의 답글은 여기에 당신의 언어로 표시됩니다. 🌐을 눌러 원문을 확인하세요.', other: '기타 언어…', langPh: '언어를 입력하세요' },
  ru: { title: 'Видео боёв Cathy', sub: 'Видео и обсуждение каждого боя', comments: 'Комментарии', send: 'Отправить', namePh: 'Написать комментарий…', none: 'Видео пока нет', general: 'Общие комментарии', coach: 'Тренер', family: 'Семья', loading: 'Загрузка…', auto: 'Страница обновляется автоматически', tip: 'Пишите на своём языке — комментарии автоматически переводятся на китайский для семьи, а их ответы появляются здесь на вашем языке. Нажмите 🌐 чтобы увидеть оригинал.', other: 'Другой язык…', langPh: 'Введите ваш язык' },
  hu: { title: 'Cathy mérkőzés videói', sub: 'Videók és beszélgetés mérkőzésenként', comments: 'Hozzászólások', send: 'Küldés', namePh: 'Írj hozzászólást…', none: 'Még nincs videó', general: 'Általános hozzászólások', coach: 'Edző', family: 'Család', loading: 'Betöltés…', auto: 'Az oldal automatikusan frissül', tip: 'Írj az anyanyelveden — a hozzászólásaid automatikusan kínaiul jelennek meg a családnak, az ő válaszaik pedig itt a te nyelveden. 🌐 az eredetihez.', other: 'Más nyelv…', langPh: 'Írd be a nyelved' },
  pt: { title: 'Vídeos dos combates da Cathy', sub: 'Vídeos e discussão por combate', comments: 'Comentários', send: 'Enviar', namePh: 'Escreva um comentário…', none: 'Ainda não há vídeos', general: 'Comentários gerais', coach: 'Treinador', family: 'Família', loading: 'A carregar…', auto: 'A página atualiza-se automaticamente', tip: 'Escreva no seu idioma — os comentários são traduzidos automaticamente para chinês para a família, e as respostas aparecem aqui no seu. Toque 🌐 para ver o original.', other: 'Outro idioma…', langPh: 'Escreva o seu idioma' },
  uk: { title: 'Відео поєдинків Cathy', sub: 'Відео та обговорення кожного поєдинку', comments: 'Коментарі', send: 'Надіслати', namePh: 'Написати коментар…', none: 'Відео поки немає', general: 'Загальні коментарі', coach: 'Тренер', family: 'Родина', loading: 'Завантаження…', auto: 'Сторінка оновлюється автоматично', tip: 'Пишіть своєю мовою — коментарі автоматично перекладаються китайською для родини, а їхні відповіді з\u2019являються тут вашою. Натисніть 🌐 щоб побачити оригінал.', other: 'Інша мова…', langPh: 'Введіть вашу мову' },
  pl: { title: 'Wideo walk Cathy', sub: 'Wideo i dyskusja dla każdej walki', comments: 'Komentarze', send: 'Wyślij', namePh: 'Napisz komentarz…', none: 'Brak wideo', general: 'Komentarze ogólne', coach: 'Trener', family: 'Rodzina', loading: 'Ładowanie…', auto: 'Strona aktualizuje się automatycznie', tip: 'Pisz w swoim języku — komentarze są automatycznie tłumaczone na chiński dla rodziny, a ich odpowiedzi pojawiają się tutaj w Twoim języku. Dotknij 🌐, aby zobaczyć oryginał.', other: 'Inny język…', langPh: 'Wpisz swój język' },
  fa: { title: 'ویدیوهای مبارزه کتی', sub: 'ویدیو و بحث برای هر مبارزه', comments: 'نظرات', send: 'ارسال', namePh: 'نظر بنویسید…', none: 'هنوز ویدیویی نیست', general: 'نظرات کلی', coach: 'مربی', family: 'خانواده', loading: 'در حال بارگذاری…', auto: 'صفحه به‌صورت خودکار به‌روزرسانی می‌شود', tip: 'به زبان خودتان بنویسید — نظرات شما به‌صورت خودکار به چینی برای خانواده ترجمه می‌شود و پاسخ‌های آن‌ها به زبان شما نمایش داده می‌شود. برای دیدن متن اصلی روی 🌐 بزنید.', other: 'زبان دیگر…', langPh: 'زبان خود را بنویسید' },
  ro: { title: 'Videoclipuri meciuri Cathy', sub: 'Videoclipuri și discuții pentru fiecare asalt', comments: 'Comentarii', send: 'Trimite', namePh: 'Scrie un comentariu…', none: 'Încă nu sunt videoclipuri', general: 'Comentarii generale', coach: 'Antrenor', family: 'Familie', loading: 'Se încarcă…', auto: 'Pagina se actualizează automat', tip: 'Scrie în limba ta — comentariile sunt traduse automat în chineză pentru familie, iar răspunsurile lor apar aici în limba ta. Apasă 🌐 pentru original.', other: 'Altă limbă…', langPh: 'Scrie limba ta' },
  tr: { title: "Cathy'nin Maç Videoları", sub: 'Her maç için video ve tartışma', comments: 'Yorumlar', send: 'Gönder', namePh: 'Yorum yazın…', none: 'Henüz video yok', general: 'Genel yorumlar', coach: 'Antrenör', family: 'Aile', loading: 'Yükleniyor…', auto: 'Sayfa otomatik güncellenir', tip: 'Kendi dilinizde yazın — yorumlarınız aile için otomatik olarak Çinceye çevrilir ve onların yanıtları burada sizin dilinizde görünür. Orijinal için 🌐 dokunun.', other: 'Diğer dil…', langPh: 'Dilinizi yazın' }
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
        rec.lang = author === 'family' ? 'zh' : coachLang;
        // 双向翻译：写中文的人 → 翻成教练语言（按语言缓存）；写教练语言的人 → 翻成中文
        if (author === 'family' && coachLang !== 'zh' && text && text !== '🎤') {
          rec.translations = { [coachLang]: await translate(env, text, coachLang) };
          rec.coachText = rec.translations[coachLang];
        }
        if (author === 'coach' && coachLang !== 'zh' && text && text !== '🎤') rec.zhText = await translate(env, text, 'zh');
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
  .langbar{display:flex;justify-content:flex-end;align-items:center;gap:6px;margin-bottom:8px}
  .langbar select{font-size:0.85rem;padding:4px 8px;border:1px solid #d1d5db;border-radius:8px;background:#fff}
  .tip{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;border-radius:8px;padding:8px 10px;font-size:0.78rem;margin-bottom:12px;line-height:1.5}
  .cmt .tr{cursor:pointer;font-size:0.7rem;color:#3b82f6;margin-left:4px}
  .cmt .orig{margin-top:2px;padding:4px 6px;background:#f8fafc;border-radius:6px;font-size:0.78rem;color:#64748b}
</style></head><body><div class="wrap">
<div class="langbar">🌐 <select onchange="setLang(this.value)">${LANG_OPTIONS.map(l => `<option value="${esc(l)}"${meta.lang === l ? ' selected' : ''}>${esc(LANG_NAME[l])}</option>`).join('')}<option value="__custom"${LANG_OPTIONS.includes(meta.lang) ? '' : ' selected'}>${esc(t.other)}</option></select></div>
<h1>🤺 ${esc(t.title)}</h1>
<div class="sub">${esc(meta.name)} · ${esc(t.sub)} · ${esc(t.auto)}</div>
<div class="tip">🤖 ${esc(t.tip)}</div>
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
  const shown = c.display || c.text;
  const hasOrig = c.orig && c.orig !== shown;
  return '<div class="cmt ' + c.author + '"><div class="who">' + (c.author === 'coach' ? escH(T.coach) : escH(T.family)) + ' · ' + String(c.ts||'').slice(5,16).replace('T',' ') +
    (hasOrig ? '<span class="tr" onclick="toggleOrig(this)">🌐</span>' : '') + '</div>' +
    (hasOrig ? '<div class="orig" style="display:none">' + escH(c.orig) + '</div>' : '') +
    (c.audioUrl ? '<audio controls preload="metadata" src="' + escH(c.audioUrl) + '" style="width:100%;margin:2px 0"></audio>' : '') +
    (shown && shown !== '🎤' ? escH(shown) : '') + '</div>';
}
function toggleOrig(el){
  const o = el.parentNode.parentNode.querySelector('.orig');
  if(o) o.style.display = (o.style.display === 'block') ? 'none' : 'block';
}
async function setLang(v){
  if(v === '__custom'){
    v = prompt(T.langPh || 'Your language?');
    if(!v || !v.trim()) return;
    v = v.trim();
  }
  try{
    await fetch('/', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'coach_setlang', token: TOKEN, lang: v})});
    location.reload();
  }catch(e){}
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
