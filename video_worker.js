// Cathy 视频 Worker —— R2 视频上传/播放 + 教练视频页（每教练独立链接/语言/留言串）
// 绑定：VIDEOS (r2_bucket -> cathy-videos)、AI (Workers AI，留言翻译)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ===== 教练页多语言 =====
const COACH_I18N = {
  zh: { title: 'Cathy 比赛视频', sub: '每场对阵的视频与讨论', comments: '留言', send: '发送', namePh: '留言…', none: '还没有视频', general: '总体留言', coach: '教练', family: '家长', loading: '加载中…', auto: '页面会自动更新新视频', tip: '先选你的语言，留言自动互译。点 🌐 看原文。', other: '其他语言…', langPh: '输入你的语言（如 Hrvatski）', student: '学员', refresh: '刷新', updated: '已更新', newV: '个新视频', cmtsOf: '条留言', videosHere: '这个链接里的比赛视频', update: '有新版本，点击更新', boutCmt: '本场留言', clipCmt: '片段留言', vidFail: '视频加载失败', loadFail: '加载失败', noVoice: '不支持语音录制', noMic: '麦克风不可用', voice: '语音留言', del: '删除' },
  'zh-TW': { title: 'Cathy 比賽影片', sub: '每場對陣的影片與討論', comments: '留言', send: '發送', namePh: '留言…', none: '還沒有影片', general: '總體留言', coach: '教練', family: '家長', loading: '載入中…', auto: '頁面會自動更新新影片', tip: '先選你的語言，留言自動互譯。點 🌐 看原文。', other: '其他語言…', langPh: '輸入你的語言', student: '學員', refresh: '重新整理', updated: '已更新', newV: '個新影片', cmtsOf: '則留言', videosHere: '這個連結裡的比賽影片', update: '有新版本，點擊更新', boutCmt: '本場留言', clipCmt: '片段留言', vidFail: '影片載入失敗', loadFail: '載入失敗', noVoice: '不支援語音錄製', noMic: '麥克風不可用', voice: '語音留言', del: '刪除' },
  en: { title: "Cathy's Bout Videos", sub: 'Videos and discussion per bout', comments: 'Comments', send: 'Send', namePh: 'Write a comment…', none: 'No videos yet', general: 'General comments', coach: 'Coach', family: 'Family', loading: 'Loading…', auto: 'This page updates automatically', tip: 'Pick your language above — comments auto-translate both ways. 🌐 shows the original.', other: 'Other language…', langPh: 'Type your language (e.g. Hrvatski)', student: 'Your student', refresh: 'Refresh', updated: 'Updated', newV: 'new since last visit', cmtsOf: 'comments', videosHere: 'bout videos under this link', update: 'Update available — tap to refresh', boutCmt: 'match comments', clipCmt: 'clip comments', vidFail: 'Video failed to load', loadFail: 'Load failed', noVoice: 'Voice recording not supported', noMic: 'Mic unavailable', voice: 'Voice note', del: 'Delete' },
  it: { title: 'Video dei match di Cathy', sub: 'Video e discussione per ogni assalto', comments: 'Commenti', send: 'Invia', namePh: 'Scrivi un commento…', none: 'Nessun video ancora', general: 'Commenti generali', coach: 'Coach', family: 'Famiglia', loading: 'Caricamento…', auto: 'La pagina si aggiorna automaticamente', tip: 'Scegli la tua lingua — i commenti si traducono automaticamente. 🌐 mostra l’originale.', other: 'Altra lingua…', langPh: 'Scrivi la tua lingua', student: 'allieva', refresh: 'Aggiorna', updated: 'Aggiornato', newV: 'nuovi dalla tua ultima visita', cmtsOf: 'commenti', videosHere: 'video dei match in questo link', update: 'Nuova versione — tocca per aggiornare', boutCmt: 'commenti sul match', clipCmt: 'commenti sul video', vidFail: 'Video non caricato', loadFail: 'Caricamento fallito', noVoice: 'Registrazione vocale non supportata', noMic: 'Microfono non disponibile' },
  fr: { title: 'Vidéos des matchs de Cathy', sub: 'Vidéos et discussion par assaut', comments: 'Commentaires', send: 'Envoyer', namePh: 'Écrire un commentaire…', none: 'Pas encore de vidéos', general: 'Commentaires généraux', coach: 'Coach', family: 'Famille', loading: 'Chargement…', auto: 'La page se met à jour automatiquement', tip: 'Choisissez votre langue — les commentaires sont traduits automatiquement. 🌐 affiche l’original.', other: 'Autre langue…', langPh: 'Tapez votre langue', student: 'élève', refresh: 'Actualiser', updated: 'Actualisé', newV: 'nouvelles depuis votre dernière visite', cmtsOf: 'commentaires', videosHere: 'vidéos de matchs sous ce lien', update: 'Nouvelle version — touchez pour actualiser', boutCmt: 'commentaires du match', clipCmt: 'commentaires de la vidéo', vidFail: 'Échec du chargement de la vidéo', loadFail: 'Échec du chargement', noVoice: 'Enregistrement vocal non pris en charge', noMic: 'Micro indisponible' },
  es: { title: 'Videos de combates de Cathy', sub: 'Vídeos y discusión por asalto', comments: 'Comentarios', send: 'Enviar', namePh: 'Escribe un comentario…', none: 'Aún no hay vídeos', general: 'Comentarios generales', coach: 'Entrenador', family: 'Familia', loading: 'Cargando…', auto: 'La página se actualiza automáticamente', tip: 'Elige tu idioma — los comentarios se traducen automáticamente. 🌐 muestra el original.', other: 'Otro idioma…', langPh: 'Escribe tu idioma', student: 'alumna', refresh: 'Actualizar', updated: 'Actualizado', newV: 'nuevos desde tu última visita', cmtsOf: 'comentarios', videosHere: 'videos de combates en este enlace', update: 'Nueva versión — toca para actualizar', boutCmt: 'comentarios del combate', clipCmt: 'comentarios del clip', vidFail: 'Error al cargar el vídeo', loadFail: 'Error de carga', noVoice: 'Grabación de voz no compatible', noMic: 'Micrófono no disponible' },
  ar: { title: 'فيديوهات مباريات كاثي', sub: 'فيديوهات ومناقشة لكل نزال', comments: 'التعليقات', send: 'إرسال', namePh: 'اكتب تعليقاً…', none: 'لا توجد فيديوهات بعد', general: 'تعليقات عامة', coach: 'المدرب', family: 'العائلة', loading: 'جارٍ التحميل…', auto: 'تتحدث الصفحة تلقائياً', tip: 'اختر لغتك — تُترجم التعليقات تلقائياً. اضغط 🌐 للأصل.', other: 'لغة أخرى…', langPh: 'اكتب لغتك', student: 'الطالبة', refresh: 'تحديث', updated: 'تم التحديث', newV: 'جديدة منذ زيارتك الأخيرة', cmtsOf: 'تعليقات', videosHere: 'فيديوهات المباريات في هذا الرابط', update: 'إصدار جديد — اضغط للتحديث', boutCmt: 'تعليقات المباراة', clipCmt: 'تعليقات المقطع', vidFail: 'فشل تحميل الفيديو', loadFail: 'فشل التحميل', noVoice: 'التسجيل الصوتي غير مدعوم', noMic: 'الميكروفون غير متاح' },
  de: { title: 'Cathys Gefechtsvideos', sub: 'Videos und Diskussion pro Gefecht', comments: 'Kommentare', send: 'Senden', namePh: 'Kommentar schreiben…', none: 'Noch keine Videos', general: 'Allgemeine Kommentare', coach: 'Trainer', family: 'Familie', loading: 'Lädt…', auto: 'Die Seite aktualisiert sich automatisch', tip: 'Sprache oben wählen — Kommentare werden automatisch übersetzt. 🌐 zeigt das Original.', other: 'Andere Sprache…', langPh: 'Ihre Sprache eingeben', student: 'Schülerin', refresh: 'Aktualisieren', updated: 'Aktualisiert', newV: 'neu seit deinem letzten Besuch', cmtsOf: 'Kommentare', videosHere: 'Gefechtsvideos unter diesem Link', update: 'Neue Version — zum Aktualisieren tippen', boutCmt: 'Kommentare zum Gefecht', clipCmt: 'Kommentare zum Clip', vidFail: 'Video konnte nicht geladen werden', loadFail: 'Laden fehlgeschlagen', noVoice: 'Sprachaufnahme nicht unterstützt', noMic: 'Mikrofon nicht verfügbar' },
  ja: { title: 'Cathyの試合動画', sub: '各試合の動画とディスカッション', comments: 'コメント', send: '送信', namePh: 'コメントを入力…', none: 'まだ動画がありません', general: '全体へのコメント', coach: 'コーチ', family: '家族', loading: '読み込み中…', auto: 'ページは自動更新されます', tip: '上で言語を選択 — コメントは自動で相互翻訳。🌐で原文表示。', other: 'その他の言語…', langPh: '言語を入力', student: '生徒', refresh: '更新', updated: '更新済み', newV: '前回の訪問以降の新着', cmtsOf: '件のコメント', videosHere: 'このリンク内の試合動画', update: '新しいバージョン — タップして更新', boutCmt: 'この試合へのコメント', clipCmt: 'この動画へのコメント', vidFail: '動画を読み込めません', loadFail: '読み込み失敗', noVoice: '音声録音はサポートされていません', noMic: 'マイクが使えません' },
  ko: { title: 'Cathy 경기 영상', sub: '경기별 영상과 토론', comments: '댓글', send: '보내기', namePh: '댓글을 입력하세요…', none: '아직 영상이 없습니다', general: '전체 댓글', coach: '코치', family: '가족', loading: '로딩 중…', auto: '페이지가 자동으로 업데이트됩니다', tip: '위에서 언어 선택 — 댓글 자동 번역. 🌐 원문 보기.', other: '기타 언어…', langPh: '언어를 입력하세요', student: '학생', refresh: '새로고침', updated: '업데이트됨', newV: '마지막 방문 이후 새 영상', cmtsOf: '댓글', videosHere: '이 링크의 경기 영상', update: '새 버전 — 탭하여 새로고침', boutCmt: '이 경기 댓글', clipCmt: '이 영상 댓글', vidFail: '영상 로드 실패', loadFail: '로드 실패', noVoice: '음성 녹음을 지원하지 않습니다', noMic: '마이크 사용 불가' },
  ru: { title: 'Видео боёв Cathy', sub: 'Видео и обсуждение каждого боя', comments: 'Комментарии', send: 'Отправить', namePh: 'Написать комментарий…', none: 'Видео пока нет', general: 'Общие комментарии', coach: 'Тренер', family: 'Семья', loading: 'Загрузка…', auto: 'Страница обновляется автоматически', tip: 'Выберите язык — комментарии переводятся автоматически. 🌐 — оригинал.', other: 'Другой язык…', langPh: 'Введите ваш язык', student: 'ученица', refresh: 'Обновить', updated: 'Обновлено', newV: 'новых с прошлого визита', cmtsOf: 'комментариев', videosHere: 'видео боёв по этой ссылке', update: 'Новая версия — нажмите для обновления', boutCmt: 'комментарии к бою', clipCmt: 'комментарии к видео', vidFail: 'Видео не загрузилось', loadFail: 'Ошибка загрузки', noVoice: 'Голосовые сообщения не поддерживаются', noMic: 'Микрофон недоступен' },
  hu: { title: 'Cathy mérkőzés videói', sub: 'Videók és beszélgetés mérkőzésenként', comments: 'Hozzászólások', send: 'Küldés', namePh: 'Írj hozzászólást…', none: 'Még nincs videó', general: 'Általános hozzászólások', coach: 'Edző', family: 'Család', loading: 'Betöltés…', auto: 'Az oldal automatikusan frissül', tip: 'Válaszd ki a nyelved — a hozzászólások automatikusan fordulnak. 🌐 az eredetihez.', other: 'Más nyelv…', langPh: 'Írd be a nyelved', student: 'tanítvány', refresh: 'Frissítés', updated: 'Frissítve', newV: 'új a legutóbbi látogatás óta', cmtsOf: 'hozzászólás', videosHere: 'mérkőzés videók ezen a linken', update: 'Új verzió — koppints a frissítéshez', boutCmt: 'mérkőzés hozzászólások', clipCmt: 'videó hozzászólásai', vidFail: 'A videó nem tölthető be', loadFail: 'Betöltés sikertelen', noVoice: 'A hangfelvétel nem támogatott', noMic: 'A mikrofon nem érhető el' },
  pt: { title: 'Vídeos dos combates da Cathy', sub: 'Vídeos e discussão por combate', comments: 'Comentários', send: 'Enviar', namePh: 'Escreva um comentário…', none: 'Ainda não há vídeos', general: 'Comentários gerais', coach: 'Treinador', family: 'Família', loading: 'A carregar…', auto: 'A página atualiza-se automaticamente', tip: 'Escolha o seu idioma — os comentários são traduzidos automaticamente. 🌐 mostra o original.', other: 'Outro idioma…', langPh: 'Escreva o seu idioma', student: 'aluna', refresh: 'Atualizar', updated: 'Atualizado', newV: 'novos desde a última visita', cmtsOf: 'comentários', videosHere: 'vídeos de combates neste link', update: 'Nova versão — toque para atualizar', boutCmt: 'comentários do combate', clipCmt: 'comentários do clipe', vidFail: 'Falha ao carregar o vídeo', loadFail: 'Falha ao carregar', noVoice: 'Gravação de voz não suportada', noMic: 'Microfone indisponível' },
  uk: { title: 'Відео поєдинків Cathy', sub: 'Відео та обговорення кожного поєдинку', comments: 'Коментарі', send: 'Надіслати', namePh: 'Написати коментар…', none: 'Відео поки немає', general: 'Загальні коментарі', coach: 'Тренер', family: 'Родина', loading: 'Завантаження…', auto: 'Сторінка оновлюється автоматично', tip: 'Оберіть мову — коментарі перекладаються автоматично. 🌐 — оригінал.', other: 'Інша мова…', langPh: 'Введіть вашу мову', student: 'учениця', refresh: 'Оновити', updated: 'Оновлено', newV: 'нових з останнього візиту', cmtsOf: 'коментарів', videosHere: 'відео поєдинків за цим посиланням', update: 'Нова версія — натисніть для оновлення', boutCmt: 'коментарі до поєдинку', clipCmt: 'коментарі до відео', vidFail: 'Відео не завантажилось', loadFail: 'Помилка завантаження', noVoice: 'Голосові повідомлення не підтримуються', noMic: 'Мікрофон недоступний' },
  pl: { title: 'Wideo walk Cathy', sub: 'Wideo i dyskusja dla każdej walki', comments: 'Komentarze', send: 'Wyślij', namePh: 'Napisz komentarz…', none: 'Brak wideo', general: 'Komentarze ogólne', coach: 'Trener', family: 'Rodzina', loading: 'Ładowanie…', auto: 'Strona aktualizuje się automatycznie', tip: 'Wybierz język — komentarze tłumaczą się automatycznie. 🌐 pokazuje oryginał.', other: 'Inny język…', langPh: 'Wpisz swój język', student: 'uczennica', refresh: 'Odśwież', updated: 'Zaktualizowano', newV: 'nowe od ostatniej wizyty', cmtsOf: 'komentarzy', videosHere: 'wideo walk pod tym linkiem', update: 'Nowa wersja — dotknij, aby odświeżyć', boutCmt: 'komentarze do walki', clipCmt: 'komentarze do klipu', vidFail: 'Nie udało się wczytać wideo', loadFail: 'Błąd ładowania', noVoice: 'Nagrywanie głosu nieobsługiwane', noMic: 'Mikrofon niedostępny' },
  fa: { title: 'ویدیوهای مبارزه کتی', sub: 'ویدیو و بحث برای هر مبارزه', comments: 'نظرات', send: 'ارسال', namePh: 'نظر بنویسید…', none: 'هنوز ویدیویی نیست', general: 'نظرات کلی', coach: 'مربی', family: 'خانواده', loading: 'در حال بارگذاری…', auto: 'صفحه به‌صورت خودکار به‌روزرسانی می‌شود', tip: 'زبان خود را انتخاب کنید — نظرات خودکار ترجمه می‌شوند. 🌐 متن اصلی.', other: 'زبان دیگر…', langPh: 'زبان خود را بنویسید', student: 'شاگرد', refresh: 'به‌روزرسانی', updated: 'به‌روزرسانی شد', newV: 'جدید از آخرین بازدید', cmtsOf: 'نظر', videosHere: 'ویدیوهای مبارزه در این لینک', update: 'نسخه جدید — برای به‌روزرسانی بزنید', boutCmt: 'نظرات این مبارزه', clipCmt: 'نظرات این ویدیو', vidFail: 'ویدیو بارگیری نشد', loadFail: 'بارگیری ناموفق', noVoice: 'ضبط صدا پشتیبانی نمی‌شود', noMic: 'میکروفون در دسترس نیست' },
  ro: { title: 'Videoclipuri meciuri Cathy', sub: 'Videoclipuri și discuții pentru fiecare asalt', comments: 'Comentarii', send: 'Trimite', namePh: 'Scrie un comentariu…', none: 'Încă nu sunt videoclipuri', general: 'Comentarii generale', coach: 'Antrenor', family: 'Familie', loading: 'Se încarcă…', auto: 'Pagina se actualizează automat', tip: 'Alege limba — comentariile se traduc automat. 🌐 arată originalul.', other: 'Altă limbă…', langPh: 'Scrie limba ta', student: 'elevă', refresh: 'Reîmprospătare', updated: 'Actualizat', newV: 'noi de la ultima vizită', cmtsOf: 'comentarii', videosHere: 'videoclipuri de meciuri pe acest link', update: 'Versiune nouă — atinge pentru reîmprospătare', boutCmt: 'comentarii despre meci', clipCmt: 'comentarii despre clip', vidFail: 'Videoclipul nu s-a încărcat', loadFail: 'Încărcare eșuată', noVoice: 'Înregistrarea vocală nu este acceptată', noMic: 'Microfon indisponibil' },
  tr: { title: "Cathy'nin Maç Videoları", sub: 'Her maç için video ve tartışma', comments: 'Yorumlar', send: 'Gönder', namePh: 'Yorum yazın…', none: 'Henüz video yok', general: 'Genel yorumlar', coach: 'Antrenör', family: 'Aile', loading: 'Yükleniyor…', auto: 'Sayfa otomatik güncellenir', tip: 'Dilinizi seçin — yorumlar otomatik çevrilir. 🌐 orijinali gösterir.', other: 'Diğer dil…', langPh: 'Dilinizi yazın', student: 'öğrenci', refresh: 'Yenile', updated: 'Güncellendi', newV: 'son ziyaretten beri yeni', cmtsOf: 'yorum', videosHere: 'bu linkteki maç videoları', update: 'Yeni sürüm — yenilemek için dokunun', boutCmt: 'maç yorumları', clipCmt: 'video yorumları', vidFail: 'Video yüklenemedi', loadFail: 'Yükleme başarısız', noVoice: 'Ses kaydı desteklenmiyor', noMic: 'Mikrofon kullanılamıyor' }
};
const LANG_NAME = {
  zh: '中文', 'zh-TW': '繁體中文', en: 'English', it: 'italiano', fr: 'français',
  es: 'español', ar: 'العربية', de: 'Deutsch', ja: '日本語', ko: '한국어',
  ru: 'русский', hu: 'magyar', pt: 'português', uk: 'українська', pl: 'polski',
  fa: 'فارسی', ro: 'română', tr: 'Türkçe'
};
// 击剑主流语言选项（顺序 = 常见度）
const LANG_OPTIONS = ['en', 'it', 'fr', 'zh', 'zh-TW', 'ja', 'ko', 'ru', 'hu', 'es', 'ar', 'de', 'pt', 'uk', 'pl', 'fa', 'ro', 'tr'];
// 项目名本地化：只翻「性别+剑种」短语，赛事名/人名保持原文
const EV_I18N = {
  zh: { "Women's Foil": '女子花剑', "Men's Foil": '男子花剑', "Women's Epee": '女子重剑', "Men's Epee": '男子重剑', "Women's Sabre": '女子佩剑', "Men's Sabre": '男子佩剑' },
  'zh-TW': { "Women's Foil": '女子花劍', "Men's Foil": '男子花劍', "Women's Epee": '女子重劍', "Men's Epee": '男子重劍', "Women's Sabre": '女子佩劍', "Men's Sabre": '男子佩劍' },
  it: { "Women's Foil": 'fioretto femminile', "Men's Foil": 'fioretto maschile', "Women's Epee": 'spada femminile', "Men's Epee": 'spada maschile', "Women's Sabre": 'sciabola femminile', "Men's Sabre": 'sciabola maschile' },
  fr: { "Women's Foil": 'fleuret femmes', "Men's Foil": 'fleuret hommes', "Women's Epee": 'épée femmes', "Men's Epee": 'épée hommes', "Women's Sabre": 'sabre femmes', "Men's Sabre": 'sabre hommes' },
  es: { "Women's Foil": 'florete femenino', "Men's Foil": 'florete masculino', "Women's Epee": 'espada femenina', "Men's Epee": 'espada masculina', "Women's Sabre": 'sable femenino', "Men's Sabre": 'sable masculino' },
  de: { "Women's Foil": 'Damenflorett', "Men's Foil": 'Herrenflorett', "Women's Epee": 'Damendegen', "Men's Epee": 'Herrendegen', "Women's Sabre": 'Damensäbel', "Men's Sabre": 'Herrensäbel' },
  ja: { "Women's Foil": '女子フルーレ', "Men's Foil": '男子フルーレ', "Women's Epee": '女子エペ', "Men's Epee": '男子エペ', "Women's Sabre": '女子サーベル', "Men's Sabre": '男子サーベル' },
  ko: { "Women's Foil": '여자 플뢰레', "Men's Foil": '남자 플뢰레', "Women's Epee": '여자 에페', "Men's Epee": '남자 에페', "Women's Sabre": '여자 사브르', "Men's Sabre": '남자 사브르' },
  ru: { "Women's Foil": 'женская рапира', "Men's Foil": 'мужская рапира', "Women's Epee": 'женская шпага', "Men's Epee": 'мужская шпага', "Women's Sabre": 'женская сабля', "Men's Sabre": 'мужская сабля' },
  hu: { "Women's Foil": 'női tőr', "Men's Foil": 'férfi tőr', "Women's Epee": 'női párbajtőr', "Men's Epee": 'férfi párbajtőr', "Women's Sabre": 'női kard', "Men's Sabre": 'férfi kard' },
  pt: { "Women's Foil": 'florete feminino', "Men's Foil": 'florete masculino', "Women's Epee": 'espada feminina', "Men's Epee": 'espada masculina', "Women's Sabre": 'sabre feminino', "Men's Sabre": 'sabre masculino' },
  uk: { "Women's Foil": 'жіноча рапіра', "Men's Foil": 'чоловіча рапіра', "Women's Epee": 'жіноча шпага', "Men's Epee": 'чоловіча шпага', "Women's Sabre": 'жіноча шабля', "Men's Sabre": 'чоловіча шабля' },
  pl: { "Women's Foil": 'floret kobiet', "Men's Foil": 'floret mężczyzn', "Women's Epee": 'szpada kobiet', "Men's Epee": 'szpada mężczyzn', "Women's Sabre": 'szabla kobiet', "Men's Sabre": 'szabla mężczyzn' },
  fa: { "Women's Foil": 'فلوره زنان', "Men's Foil": 'فلوره مردان', "Women's Epee": 'اپه زنان', "Men's Epee": 'اپه مردان', "Women's Sabre": 'سابر زنان', "Men's Sabre": 'سابر مردان' },
  ro: { "Women's Foil": 'floretă feminin', "Men's Foil": 'floretă masculin', "Women's Epee": 'spadă feminin', "Men's Epee": 'spadă masculin', "Women's Sabre": 'sabie feminin', "Men's Sabre": 'sabie masculin' },
  tr: { "Women's Foil": 'kadınlar flöre', "Men's Foil": 'erkekler flöre', "Women's Epee": 'kadınlar epe', "Men's Epee": 'erkekler epe', "Women's Sabre": 'kadınlar kılıç', "Men's Sabre": 'erkekler kılıç' },
  ar: { "Women's Foil": 'سلاح الشيش سيدات', "Men's Foil": 'سلاح الشيش رجال', "Women's Epee": 'سلاح المبارزة سيدات', "Men's Epee": 'سلاح المبارزة رجال', "Women's Sabre": 'سلاح السيف سيدات', "Men's Sabre": 'سلاح السيف رجال' }
};
// 点评标签：优点/问题/步法/进攻/防守/时机/距离/战术（key 固定，按语言显示）
const TAG_I18N = {
  zh: { good: '优点', issue: '问题', footwork: '步法', attack: '进攻', defense: '防守', timing: '时机', distance: '距离', tactic: '战术' },
  'zh-TW': { good: '優點', issue: '問題', footwork: '步法', attack: '進攻', defense: '防守', timing: '時機', distance: '距離', tactic: '戰術' },
  en: { good: 'Good', issue: 'Issue', footwork: 'Footwork', attack: 'Attack', defense: 'Defense', timing: 'Timing', distance: 'Distance', tactic: 'Tactics' },
  it: { good: 'Bene', issue: 'Da correggere', footwork: 'Gioco di gambe', attack: 'Attacco', defense: 'Difesa', timing: 'Tempo', distance: 'Distanza', tactic: 'Tattica' },
  fr: { good: 'Bien', issue: 'À corriger', footwork: 'Jeu de jambes', attack: 'Attaque', defense: 'Défense', timing: 'Timing', distance: 'Distance', tactic: 'Tactique' },
  es: { good: 'Bien', issue: 'A corregir', footwork: 'Juego de pies', attack: 'Ataque', defense: 'Defensa', timing: 'Tiempo', distance: 'Distancia', tactic: 'Táctica' },
  de: { good: 'Gut', issue: 'Verbessern', footwork: 'Beinarbeit', attack: 'Angriff', defense: 'Verteidigung', timing: 'Timing', distance: 'Distanz', tactic: 'Taktik' },
  ja: { good: '良い点', issue: '課題', footwork: 'フットワーク', attack: '攻撃', defense: '防御', timing: 'タイミング', distance: '距離', tactic: '戦術' },
  ko: { good: '좋은 점', issue: '개선점', footwork: '풋워크', attack: '공격', defense: '수비', timing: '타이밍', distance: '거리', tactic: '전술' },
  ru: { good: 'Хорошо', issue: 'Ошибка', footwork: 'Работа ног', attack: 'Атака', defense: 'Защита', timing: 'Тайминг', distance: 'Дистанция', tactic: 'Тактика' },
  hu: { good: 'Jó', issue: 'Hiba', footwork: 'Lábmunka', attack: 'Támadás', defense: 'Védekezés', timing: 'Időzítés', distance: 'Táv', tactic: 'Taktika' },
  pt: { good: 'Bom', issue: 'A corrigir', footwork: 'Jogo de pés', attack: 'Ataque', defense: 'Defesa', timing: 'Tempo', distance: 'Distância', tactic: 'Tática' },
  uk: { good: 'Добре', issue: 'Помилка', footwork: 'Робота ніг', attack: 'Атака', defense: 'Захист', timing: 'Таймінг', distance: 'Дистанція', tactic: 'Тактика' },
  pl: { good: 'Dobrze', issue: 'Błąd', footwork: 'Praca nóg', attack: 'Atak', defense: 'Obrona', timing: 'Timing', distance: 'Dystans', tactic: 'Taktyka' },
  fa: { good: 'خوب', issue: 'مشکل', footwork: 'کار پا', attack: 'حمله', defense: 'دفاع', timing: 'زمان‌بندی', distance: 'فاصله', tactic: 'تاکتیک' },
  ro: { good: 'Bine', issue: 'De corectat', footwork: 'Mișcarea picioarelor', attack: 'Atac', defense: 'Apărare', timing: 'Timing', distance: 'Distanță', tactic: 'Tactică' },
  tr: { good: 'İyi', issue: 'Düzeltilecek', footwork: 'Ayak çalışması', attack: 'Saldırı', defense: 'Savunma', timing: 'Zamanlama', distance: 'Mesafe', tactic: 'Taktik' },
  ar: { good: 'جيد', issue: 'ملاحظة', footwork: 'حركة القدمين', attack: 'هجوم', defense: 'دفاع', timing: 'التوقيت', distance: 'المسافة', tactic: 'الخطة' }
};
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
        // 家长留言显示为教练语言版本；同语言直接显示原文，缺翻译时现翻并缓存回写
        const lang = meta.lang || 'en';
        const familyLang = feed.familyLang || 'zh';
        let dirty = false;
        const shown = [];
        for (const c of comments) {
          if (c.author === 'family' && lang !== familyLang && c.text && c.text !== '🎤') {
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
        // 打点点评：视频时间点（秒）+ 标签（可多选）
        if (typeof body.vt === 'number' && isFinite(body.vt) && body.vt >= 0 && body.vt < 86400) rec.vt = +body.vt.toFixed(2);
        if (typeof body.tag === 'string' && /^[a-z]{2,12}$/.test(body.tag)) rec.tag = body.tag;
        if (Array.isArray(body.tags)) rec.tags = body.tags.filter(t => typeof t === 'string' && /^[a-z]{2,12}$/.test(t)).slice(0, 6);
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

      if (body.action === 'comment_del') {
        const token = String(body.token || '');
        const id = String(body.id || '');
        if (!/^[a-z0-9]{16,64}$/i.test(token) || !/^[a-z0-9_]{4,40}$/i.test(id)) return json({ error: 'bad request' }, 400);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid link' }, 404);
        const key = `coach/comments_${token}.json`;
        const list = (await readJson(env, key)) || [];
        const kept = list.filter(c => c.id !== id);
        if (kept.length !== list.length) await writeJson(env, key, kept);
        return json({ ok: true });
      }

      if (body.action === 'comment_tags') {
        const token = String(body.token || '');
        const id = String(body.id || '');
        const tags = Array.isArray(body.tags) ? body.tags.filter(t => typeof t === 'string' && /^[a-z]{2,12}$/.test(t)).slice(0, 8) : [];
        if (!/^[a-z0-9]{16,64}$/i.test(token) || !/^[a-z0-9_]{4,40}$/i.test(id)) return json({ error: 'bad request' }, 400);
        const meta = await readJson(env, `coach/meta_${token}.json`);
        if (!meta) return json({ error: 'invalid link' }, 404);
        const key = `coach/comments_${token}.json`;
        const list = (await readJson(env, key)) || [];
        const c = list.find(c => c.id === id);
        if (c) { c.tags = tags; delete c.tag; await writeJson(env, key, list); }
        return json({ ok: true, tags });
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
const _pvSrc = renderCoachPage.toString() + esc.toString() + JSON.stringify(COACH_I18N) + JSON.stringify(EV_I18N) + JSON.stringify(TAG_I18N) + LANG_OPTIONS.join(',');
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
  .vwrap{display:flex;flex-direction:column;gap:4px}
  .vbtn{border:1px solid #e2e8f0;background:#f8fafc;border-radius:7px;font-size:0.68rem;color:#475569;padding:3px 0;cursor:pointer}
  .vbtn.on{background:#dbeafe;border-color:#93c5fd;color:#1d4ed8}

  .cmt{font-size:0.84rem;padding:6px 8px;border-radius:8px;margin-bottom:4px}
  .cmt.coach{background:#eff6ff}.cmt.family{background:#f0fdf4}
  .cmt .who{font-size:0.68rem;color:#94a3b8;margin-bottom:2px}
  .cmt .tr{cursor:pointer;font-size:0.7rem;color:#3b82f6;margin-left:4px}
  .cmt .orig{margin-top:2px;padding:4px 6px;background:#f8fafc;border-radius:6px;font-size:0.78rem;color:#64748b}
  .box{display:flex;gap:6px;margin-top:6px}
  .box input{flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:16px;box-sizing:border-box}
  .box button{padding:8px 12px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:0.85rem;cursor:pointer}
  .box .mic{background:#dcfce7;color:#166534}
  .apcbtns{display:flex;gap:8px;margin-top:8px}
  .apcbtns button{flex:1;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:12px;padding:12px 8px;font-size:.9rem;font-weight:600;cursor:pointer;min-height:48px}
  .rect{color:#ef4444;font-weight:700;align-self:center;flex:1;font-size:.95rem}
  .gen{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px;margin:14px 0}
  .note{font-size:0.72rem;color:#94a3b8;text-align:center;margin:16px 0}
  .empty{background:#fff;border-radius:12px;padding:24px;text-align:center;color:#94a3b8;font-size:0.85rem}
  .upd{display:none;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#2563eb;color:#fff;font-size:0.82rem;font-weight:600;padding:9px 18px;border-radius:999px;box-shadow:0 4px 14px rgba(37,99,235,.4);cursor:pointer;z-index:999;white-space:nowrap}
  /* ===== 分析播放器（点评用）===== */
  .ap{display:none;position:fixed;inset:0;background:rgba(2,6,23,.95);z-index:100;overflow:auto}
  .apbox{max-width:640px;margin:0 auto;padding:12px 12px 30px;position:relative;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
  .apstick{position:sticky;top:0;z-index:60;background:rgba(2,6,23,.97);padding-top:4px;border-radius:12px}
  .apv{position:relative;background:#000;border-radius:12px;overflow:hidden;touch-action:none}
  .apv video{width:100%;display:block;max-height:52vh}
  .apflash{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.4rem;opacity:0;pointer-events:none;transition:opacity .35s}
  .apload{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#e2e8f0;font-size:.9rem;background:rgba(2,6,23,.55);pointer-events:none;z-index:5}
  .apreset{position:absolute;right:8px;bottom:8px;background:rgba(37,99,235,.9);color:#fff;border:none;border-radius:999px;padding:7px 14px;font-size:.78rem;font-weight:600;z-index:6;display:none;cursor:pointer}
  .apseek{position:relative;height:20px;margin-top:6px}
  .apseek input{width:100%;-webkit-appearance:none;appearance:none;height:4px;background:#334155;border-radius:4px;outline:none;margin:8px 0}
  .apmarks{position:absolute;left:0;right:0;top:7px;height:8px;pointer-events:none}
  .apmark{position:absolute;width:8px;height:8px;border-radius:50%;background:#ef4444;transform:translateX(-50%);pointer-events:auto;cursor:pointer}
  .aptime{color:#94a3b8;font-size:.72rem;text-align:right}
  .apctl{display:flex;gap:6px;margin-top:8px}
  .apctl button{background:#1e293b;color:#e2e8f0;border:none;border-radius:12px;padding:16px 4px;font-size:1.05rem;font-weight:600;flex:1;cursor:pointer;min-height:52px;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:none}
  .apctl button:active,.apctl button.hold{background:#2563eb;color:#fff}
  .apsp{display:flex;gap:6px;justify-content:center;margin-top:6px}
  .apsp button{background:#0f172a;color:#94a3b8;border:1px solid #334155;border-radius:999px;padding:7px 14px;font-size:.85rem;cursor:pointer;min-height:36px}
  .apsp button.on{background:#2563eb;color:#fff;border-color:#2563eb}
  .aplbl{color:#64748b;font-size:.75rem;align-self:center;margin:0 2px 0 8px}
  .apvol{display:flex;align-items:center;gap:8px;margin-top:8px;color:#94a3b8;font-size:.82rem}
  .apvol input{flex:1}
  .aptags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  .aptags button{background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:999px;padding:7px 12px;font-size:.82rem;cursor:pointer;min-height:36px}
  .aptags button.on{background:#065f46;border-color:#10b981;color:#fff}
  .apclose{position:fixed;top:10px;right:12px;background:#334155;color:#fff;border:none;border-radius:50%;width:34px;height:34px;font-size:1rem;z-index:101;cursor:pointer}
  .tag{display:inline-block;background:#e0e7ff;color:#3730a3;font-size:.66rem;font-weight:600;padding:0 7px;border-radius:999px;margin-right:4px}
  .anchor{color:#2563eb;font-size:.72rem;font-weight:700;margin-right:4px;cursor:pointer}
  .au{display:flex;align-items:center;gap:8px;margin:4px 0}
  .aub{background:#2563eb;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:.8rem;cursor:pointer;flex-shrink:0;padding:0}
  .aubar{flex:1;height:4px;background:#e2e8f0;border-radius:4px;overflow:hidden}
  .aupg{height:100%;background:#2563eb;width:0;transition:width .3s linear}
  .autm{font-size:.68rem;color:#64748b;min-width:62px;text-align:right;white-space:nowrap}
  .cmtcog{float:right;color:#94a3b8;cursor:pointer;padding:0 2px 0 10px;font-size:.85rem;font-weight:700}
  .cmtmenu{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0}
  .cmtmenu button{background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:999px;padding:5px 12px;font-size:.75rem;cursor:pointer;min-height:32px}
  .cmtmenu button.on{background:#065f46;border-color:#10b981;color:#fff}
  .cmtmenu button.del{background:#fee2e2;color:#b91c1c;border-color:#fecaca}
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
<div class="note">Cathy Fencing · ${esc(t.auto)}</div>
</div>
<div class="ap" id="ap" oncontextmenu="return false"><div class="apbox">
<button class="apclose" onclick="closeAnalysis()">✕</button>
<div class="apstick">
<div class="apv"><video id="apVideo" playsinline preload="auto" onclick="apToggle()"></video><div class="apload" id="apLoad" style="display:none">⏳ ${esc(t.loading)}</div><button class="apreset" id="apReset" onclick="apZoomReset()">⟲ 1x</button><div class="apflash" id="apFlash"></div></div>
<div class="apseek"><input type="range" id="apSeek" min="0" max="1000" value="0" oninput="apSeekIn(this)"><div class="apmarks" id="apMarks"></div></div>
<div class="aptime" id="apTime">0:00 / 0:00</div>
<div class="apctl">
  <button id="apBack" onpointerdown="hStart('s',-1,this)" onpointerup="hEnd(this)" onpointerleave="hEnd(this)" onpointercancel="hEnd(this)" oncontextmenu="return false">⏪ 5s</button>
  <button id="apFrB" onpointerdown="hStart('f',-1,this)" onpointerup="hEnd(this)" onpointerleave="hEnd(this)" onpointercancel="hEnd(this)" oncontextmenu="return false" title="点=退1帧 · 按住=连续退">⏮</button>
  <button id="apPlayBtn" onclick="apToggle()">▶</button>
  <button id="apFrF" onpointerdown="hStart('f',1,this)" onpointerup="hEnd(this)" onpointerleave="hEnd(this)" onpointercancel="hEnd(this)" oncontextmenu="return false" title="点=进1帧 · 按住=连续进">⏭</button>
  <button id="apFwd" onpointerdown="hStart('s',1,this)" onpointerup="hEnd(this)" onpointerleave="hEnd(this)" onpointercancel="hEnd(this)" oncontextmenu="return false">5s ⏩</button>
</div>
<div class="apsp" id="apSp"></div>
</div>
<div class="apvol" id="apVolRow">🔊 <input type="range" id="apVol" min="0" max="100" value="80" oninput="apVolIn(this)"></div>
<div class="apcbtns"><button onclick="apShowTxt()">💬 ${esc(t.comments)}</button><button onclick="apStartRec()">🎤 ${esc(t.voice || 'Voice')}</button></div>
<div class="aptags" id="apTags"></div>
<div class="box" id="apTxtBox" style="display:none;margin-top:6px"><input id="apInput" placeholder="${esc(t.namePh)}" oncontextmenu="event.stopPropagation()" onkeydown="if(event.keyCode===13)apSend()"><button onclick="apSend()">${esc(t.send)}</button></div>
<div class="box" id="apRecBox" style="display:none;margin-top:6px"><span class="rect" id="apRecT">● 0:00</span><button onclick="apStopRec()">⏹ ${esc(t.send)}</button><button onclick="apCancelRec()" style="background:#475569">✕</button></div>
<div class="cmts" id="apCmts" style="margin-top:8px"></div>
</div></div>
<div class="upd" id="updBar" onclick="location.reload()">🔄 ${esc(t.update || 'Update available — tap to refresh')}</div>
<script>
const TOKEN = ${JSON.stringify(token)};
const PAGE_VER = ${JSON.stringify(PAGE_VERSION)};
const T = ${JSON.stringify(t)};
const EV = ${JSON.stringify(EV_I18N[meta.lang] || {})};
const TAGS = ${JSON.stringify(TAG_I18N[meta.lang] || TAG_I18N.en)};
const TAG_ORDER = ["good","issue","footwork","attack","defense","timing","distance","tactic"];
function fmtT(s){ s=Math.max(0,s||0); return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"); }
// 项目名本地化：只替换「性别+剑种」，赛事名/人名不动
function locEvent(s){ return String(s||"").replace(/(Women's|Men's) (Foil|Epee|Sabre)/g, x => EV[x] || x); }
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
    document.getElementById("list").innerHTML = "<div class='empty' style='color:#b91c1c'>" + escH(T.loadFail || "Load failed") + ": " + escH(e.message) + "</div>";
  }
}
let renderedSig = "";
function boutKey(v){ return [v.event||"", v.bout||"", v.opponent||"", v.score||""].join("|") || v.id; }
// 对阵级留言 id 的 bout 部分：全部为空时退化为视频 id，避免串组
function bcmtKey(v){
  const k = [v.event||"", v.bout||"", v.opponent||"", v.score||""].join("~");
  return k === "~~~" ? "#" + v.id : k;
}
// ===== 分析播放器：无遮挡控制条 + 打点点评 =====
let apVid = null, apV = null, apTags = [], apStepN = 5, apZoom = 1;
let acCtx = null, acGain = null, acSrc = null;
function openAnalysis(vid){
  const v = vids.find(x => x.id === vid);
  if(!v) return;
  if(v.youtube){ window.open(v.url, "_blank"); return; }
  apVid = vid; apTags = [];
  document.getElementById("ap").style.display = "block";
  apV = document.getElementById("apVideo");
  const ld = document.getElementById("apLoad");
  const ldShow = function(){ if(apV && (apV.seeking || apV.readyState < 3)) ld.style.display = "flex"; };
  const ldHide = function(){ if(!apV || (!apV.seeking && apV.readyState >= 3)) ld.style.display = "none"; };
  if(apV.dataset.src !== v.url){ apV.dataset.src = v.url; ld.style.display = "flex"; apV.src = v.url; apV.load(); }
  else ldHide();
  apV.onloadstart = ldShow;
  apV.onwaiting  = ldShow;
  apV.onseeking  = ldShow;
  apV.oncanplay  = ldHide;
  apV.onplaying  = ldHide;
  apV.onseeked   = ldHide;
  apV.onerror    = ldHide;
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  document.getElementById("apVolRow").style.display = iOS ? "none" : "flex";
  if(!iOS) apVolIn(document.getElementById("apVol"));
  apV.ontimeupdate = apTick; apV.onloadedmetadata = apTick;
  apV.onended = function(){ document.getElementById("apPlayBtn").textContent = "▶"; };
  const sp = document.getElementById("apSp");
  sp.innerHTML = [0.25,0.5,1,1.5,2].map(x => "<button data-sp='" + x + "' onclick='apSpeed(" + x + ",this)'>" + x + "x</button>").join("");
  sp.querySelector("[data-sp='1']").classList.add("on"); apSpd = 1;

  document.getElementById("apTags").innerHTML = TAG_ORDER.map(k =>
    "<button data-tag='" + k + "' onclick='apTagSet(this)'>" + escH(TAGS[k] || k) + "</button>").join("");
  apRenderCmts();
}
function closeAnalysis(){
  document.getElementById("ap").style.display = "none";
  if(apV) apV.pause();
  apVid = null;
}
function apWake(){ if(acCtx && acCtx.state === "suspended") acCtx.resume().catch(function(){}); }
function apToggle(){
  apWake();
  if(Date.now() - (window._pzT || 0) < 500) return;   // 捏合缩放刚结束，忽略误触单击
  const b = document.getElementById("apPlayBtn");
  if(apV.paused){ apV.play().catch(function(){}); b.textContent = "❚❚"; apFlash("▶"); }
  else { apV.pause(); b.textContent = "▶"; apFlash("❚❚"); }
}
function apFlash(s){
  const f = document.getElementById("apFlash");
  f.textContent = s; f.style.opacity = 1;
  setTimeout(function(){ f.style.opacity = 0; }, 400);
}
function apSkip(dir){
  if(!apV || !apV.duration) return;
  apV.currentTime = Math.max(0, Math.min(apV.duration, apV.currentTime + dir * apStepN));
  apFlash((dir < 0 ? "-" : "+") + apStepN + "s");
}
function apStep(dir){ if(!apV) return; apV.pause(); document.getElementById("apPlayBtn").textContent = "▶"; apV.currentTime = Math.max(0, apV.currentTime + dir / 25); }
// 点按跳秒=跳后自动播放（前后对称）；按住前进=变速播放，按住后退=大步连续回扫
let hT = null, hI = null, hBtn = null, apSpd = 1;
function hStart(mode, dir, btn){
  apWake();
  hEnd();
  hBtn = btn;
  if(btn) btn.classList.add('hold');
  if(!apV) return;
  if(mode === 'f') apStep(dir);
  else {                                                    // 点按跳秒：跳完自动播放
    apSkip(dir);
    apV.playbackRate = apSpd;
    apV.play().catch(function(){});
    document.getElementById("apPlayBtn").textContent = "❚❚";
  }
  if(dir > 0){
    hT = setTimeout(function(){                             // 按住前进：变速播放，画面流畅移动
      apV.playbackRate = mode === 'f' ? 0.25 : 4;
      apV.play().catch(function(){});
      document.getElementById("apPlayBtn").textContent = "❚❚";
    }, 350);
  } else {
    const dt = mode === 'f' ? 0.08 : apStepN / 8;           // 回退步幅：帧键≈0.5x倒放，跳秒≈4x回扫
    hT = setTimeout(function(){
      apV.pause();
      document.getElementById("apPlayBtn").textContent = "▶";
      hI = setInterval(function(){
        if(!apV) return;
        apV.currentTime = Math.max(0, apV.currentTime - dt);
      }, 150);
    }, 350);
  }
}
function hEnd(){
  clearTimeout(hT); clearInterval(hI); hT = hI = null;
  if(apV && !apV.paused){ apV.playbackRate = apSpd; apV.pause(); document.getElementById("apPlayBtn").textContent = "▶"; }
  if(hBtn){ hBtn.classList.remove('hold'); hBtn = null; }
}

let pzX = 0, pzY = 0;
function apXf(){
  const box = document.querySelector(".apv");
  if(!box || !apV) return;
  const mx = Math.max(0, (apZoom - 1) / 2) * box.clientWidth;
  const my = Math.max(0, (apZoom - 1) / 2) * box.clientHeight;
  pzX = Math.max(-mx, Math.min(mx, pzX)); pzY = Math.max(-my, Math.min(my, pzY));
  apV.style.transform = apZoom > 1.02 ? "translate(" + pzX + "px," + pzY + "px) scale(" + apZoom + ")" : "";
  const r = document.getElementById("apReset");
  if(r) r.style.display = apZoom > 1.02 ? "block" : "none";
}
function apZoomReset(){
  apZoom = 1; pzX = pzY = 0;
  const misc = document.getElementById("apMisc");
  if(misc) misc.querySelectorAll("[data-z]").forEach(b => b.classList.toggle("on", b.dataset.z === "1"));
  apXf();
}

// 双指捏合缩放 + 放大后单指拖动平移（只动视频画面）
(function(){
  const box = document.querySelector(".apv");
  if(!box) return;
  let d0 = 0, z0 = 1, pinching = false, panning = false, moved = false, sx = 0, sy = 0, px0 = 0, py0 = 0;
  const dist = function(e){ return Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); };
  box.addEventListener("touchstart", function(e){
    if(e.touches.length === 2){ pinching = true; panning = false; d0 = dist(e); z0 = apZoom; }
    else if(e.touches.length === 1 && apZoom > 1.02){ panning = true; moved = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY; px0 = pzX; py0 = pzY; }
  }, {passive:true});
  box.addEventListener("touchmove", function(e){
    if(pinching && e.touches.length === 2){
      e.preventDefault();
      apZoom = Math.max(1, Math.min(3, z0 * dist(e) / d0));
      apXf();
    } else if(panning && e.touches.length === 1){
      const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if(!moved && Math.abs(dx) + Math.abs(dy) < 8) return;   // 轻点不当作拖动
      moved = true;
      e.preventDefault();
      pzX = px0 + dx; pzY = py0 + dy;
      apXf();
    }
  }, {passive:false});
  box.addEventListener("touchend", function(e){
    if(e.touches.length < 2){ if(pinching) window._pzT = Date.now(); pinching = false; }
    if(e.touches.length === 0){ if(panning && moved) window._pzT = Date.now(); panning = false; }
  }, {passive:true});
})();
function apSpeed(x, btn){ apSpd = x; if(apV) apV.playbackRate = x; btn.parentNode.querySelectorAll("[data-sp]").forEach(b => b.classList.toggle("on", b === btn)); }
// 背景音量：iOS 忽略 video.volume，用 WebAudio 增益节点控制（失败则退回 volume）
function apVolIn(el){
  const v = el.value / 100;
  if(!apV) return;
  try{
    if(!acCtx){
      acCtx = new (window.AudioContext || window.webkitAudioContext)();
      acSrc = acCtx.createMediaElementSource(apV);
      acGain = acCtx.createGain();
      acSrc.connect(acGain); acGain.connect(acCtx.destination);
    }
    apWake();
    acGain.gain.value = v;
  }catch(e){ apV.volume = v; }
}
function apSeekIn(el){ if(apV && apV.duration) apV.currentTime = el.value / 1000 * apV.duration; }
function apSeekTo(t){ if(apV) apV.currentTime = t; }
function apTick(){
  if(!apV || !apV.duration) return;
  const ld = document.getElementById("apLoad");
  if(ld && !apV.seeking && apV.readyState >= 3) ld.style.display = "none";   // 兜底：画面在动就关掉加载层
  document.getElementById("apSeek").value = Math.round(apV.currentTime / apV.duration * 1000);
  document.getElementById("apTime").textContent = fmtT(apV.currentTime) + " / " + fmtT(apV.duration);
  // 进度条上的点评红点
  document.getElementById("apMarks").innerHTML = cmts.filter(c => c.videoId === apVid && c.vt != null)
    .map(c => "<span class='apmark' style='left:" + Math.min(99, c.vt / apV.duration * 100) + "%' onclick='apSeekTo(" + c.vt + ")' title='" + fmtT(c.vt) + "'></span>").join("");
}
function apTagSet(btn){
  btn.classList.toggle("on");
  const k = btn.dataset.tag;
  if(btn.classList.contains("on")) apTags.push(k);
  else apTags = apTags.filter(x => x !== k);
}
function apRenderCmts(){
  const el = document.getElementById("apCmts");
  if(el){ el.innerHTML = cmts.filter(c => c.videoId === apVid).map(c => cmtHtml(c, true)).join(""); auSync(); auTickA(); }
}
async function apSend(){
  const input = document.getElementById("apInput");
  const text = input.value.trim();
  if(!text) return;
  const vt = apV ? +apV.currentTime.toFixed(2) : null;
  input.value = ""; input.disabled = true;
  cmts.push({ id: "tmp_" + Date.now(), videoId: apVid, author: "coach", text, display: text, vt, tags: apTags.slice(), ts: new Date().toISOString() });
  apRenderCmts(); render();
  try{
    await fetch("/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"comment_add", token: TOKEN, videoId: apVid, vt, tags: apTags, author:"coach", text})});
    await load();
  }catch(e){ input.value = text; }
  input.disabled = false; input.focus();
}
// 分析面板留言：💬文字 / 🎤语音 两个按钮各展开一条操作栏
function apShowTxt(){
  document.getElementById("apTxtBox").style.display = "flex";
  document.getElementById("apRecBox").style.display = "none";
  document.getElementById("apInput").focus();
}
let recTimer = null, recStartT = 0, recCancel = false, recVt = null;
async function apStartRec(){
  if(rec) return;
  if(!navigator.mediaDevices || !window.MediaRecorder){ alert(T.noVoice || "Voice recording not supported"); return; }
  recVt = apV ? +apV.currentTime.toFixed(2) : null;
  if(apV){ apV.pause(); document.getElementById("apPlayBtn").textContent = "▶"; }
  const rb = document.getElementById("apRecBox"), rt = document.getElementById("apRecT");
  rb.style.display = "flex";
  document.getElementById("apTxtBox").style.display = "none";
  rt.textContent = "● …";
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "");
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
    recChunks = []; recCancel = false;
    rec.ondataavailable = e => { if(e.data && e.data.size) recChunks.push(e.data); };
    rec.onstop = async () => {
      clearInterval(recTimer); recTimer = null;
      stream.getTracks().forEach(t => t.stop());
      if(recCancel){ rec = null; rb.style.display = "none"; return; }
      rt.textContent = "⏳";
      try{
        const blob = new Blob(recChunks, { type: rec.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? ".m4a" : ".webm";
        const init = await (await fetch("/", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"video_init", name:"voice"+ext, contentType:blob.type }) })).json();
        const pr = await fetch("/video-part?key=" + encodeURIComponent(init.key) + "&uploadId=" + encodeURIComponent(init.uploadId) + "&part=1", { method:"POST", headers:{"Content-Type":"application/octet-stream"}, body: blob });
        const part = await pr.json();
        const comp = await (await fetch("/", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"video_complete", key:init.key, uploadId:init.uploadId, parts:[part] }) })).json();
        if(comp.url){
          cmts.push({ id:"tmp_"+Date.now(), videoId:apVid, author:"coach", text:"", audioUrl:comp.url, vt:recVt, tags:apTags.slice(), ts:new Date().toISOString() });
          apRenderCmts(); render();
          await fetch("/", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"comment_add", token:TOKEN, videoId:apVid, vt:recVt, tags:apTags, author:"coach", text:"🎤", audioUrl:comp.url }) });
          await load();
        }
      }catch(e){}
      rb.style.display = "none"; rec = null;
    };
    recStartT = Date.now();
    recTimer = setInterval(function(){
      rt.textContent = "● " + fmtT(Math.floor((Date.now() - recStartT) / 1000));
    }, 500);
    rec.start();
    rt.textContent = "● 0:00";
  }catch(e){ rb.style.display = "none"; alert((T.noMic || "Mic unavailable") + " (" + (e.name || e.message || e) + ")"); }
}
function apStopRec(){ if(rec) rec.stop(); }
function apCancelRec(){ recCancel = true; if(rec) rec.stop(); else document.getElementById("apRecBox").style.display = "none"; }
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
            // 对阵级留言挂在稳定 key：b:赛事~回合~对手~比分（与家长端公式一致）
            const bcid = "b:" + tname + "~" + bcmtKey(b.vids[0]);
            const n = cmts.filter(c => c.videoId === bcid).length;
            const cbox = "<div class='box'><input placeholder='" + escH(T.namePh) + "' onkeydown='if(event.keyCode===13)sendCmt(this)'><button onclick='sendCmt(this.previousElementSibling)'>" + escH(T.send) + "</button><button class='mic' onclick='toggleRec(this)' title='Voice'>🎤</button></div>";
            return "<div class='bout' data-bkey='" + bid + "' data-bcid='" + escH(bcid) + "'><div class='bhead'>" + escH(locEvent(b.label || b.vids[0].name)) + "</div>" +
              "<div class='vgrid'>" + b.vids.map(v => {
                const isN = isNew(v.uploadedAt);
                const vc = cmts.filter(c => c.videoId === v.id).length;
                const cell = v.youtube
                  ? "<a class='ytcell' href='" + escH(v.url) + "' target='_blank' rel='noopener'>▶ " + escH(v.name) + "</a>"
                  : "<div class='vcell' data-vid='" + escH(v.id) + "' onclick='openAnalysis(this.dataset.vid)'>" +
                    "<video muted playsinline preload='metadata' src='" + escH(v.url) + "' onloadedmetadata='durSet(this)' onerror='vidErr(this)'></video>" +
                    "<div class='pov'>▶</div><div class='dur'></div>" +
                    (isN ? "<div class='newtag'>NEW</div>" : "") +
                    "<div class='vname'>" + escH(v.name) + "</div></div>";
                return "<div class='vwrap'>" + cell +
                  "<button class='vbtn' data-vid='" + escH(v.id) + "' onclick='openAnalysis(this.dataset.vid)'>💬 " + vc + "</button></div>";
              }).join("") + "</div>" +
              "<button class='cbtn' onclick='toggleCmts(this)'>💬 " + n + " " + escH(T.boutCmt) + "</button>" +
              "<div class='cbody" + (openCmts[bk] ? " open" : "") + "'><div class='cmts'></div>" + cbox + "</div></div>";
          }).join("") + "</div>";
      }).join("");
    }
  }
  // 留言原地更新 + 计数刷新
  document.querySelectorAll(".bout").forEach(el => {
    const bcid = el.dataset.bcid;
    const bc = cmts.filter(c => c.videoId === bcid);
    const ce = el.querySelector(".cbody .cmts");
    if(ce){ ce.innerHTML = bc.map(cmtHtml).join(""); auSync(); auTickA(); }
    const btn = el.querySelector(".cbtn");
    if(btn) btn.innerHTML = "💬 " + bc.length + " " + escH(T.boutCmt) + (bc.length ? " · " + ago(bc[bc.length-1].ts) : "");
    el.querySelectorAll(".vbtn").forEach(b => {
      const list3 = cmts.filter(c => c.videoId === b.dataset.vid);
      b.innerHTML = "💬 " + list3.length + (list3.length ? " · " + ago(list3[list3.length-1].ts) : "");
    });
  });
  // 分析面板打开时同步刷新其留言
  if(apVid) apRenderCmts();
}
function durSet(v){
  const d = v.duration;
  if(!isFinite(d)) return;
  const m = Math.floor(d/60), s = Math.round(d%60);
  const el = v.parentNode.querySelector(".dur");
  if(el) el.textContent = m + ":" + String(s).padStart(2,"0");
}

function vidErr(v){
  const cell = v.parentNode;
  cell.innerHTML = "<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#fca5a5;font-size:0.7rem;padding:8px;text-align:center'>" + escH(T.vidFail || "Video failed to load") + "</div>";
}
function toggleCmts(btn){
  const body = btn.nextElementSibling;
  const open = body.classList.toggle("open");
  const bk = btn.closest(".bout").dataset.bkey;
  openCmts[bk] = open;
}
function cmtHtml(c, anchor){
  const shown = c.display || c.text;
  const hasOrig = c.orig && c.orig !== shown;
  const tagList = Array.isArray(c.tags) && c.tags.length ? c.tags : (c.tag ? [c.tag] : []);
  const tag = tagList.map(k => "<span class='tag'>" + escH(TAGS[k] || k) + "</span>").join("");
  const anch = c.vt != null ? "<span class='anchor'>⏱" + fmtT(c.vt) + "</span>" : "";
  // 分析面板里：整条带锚点的留言可点击跳转到该视频时间点
  const canSeek = anchor && c.vt != null;
  return "<div class='cmt " + c.author + "' data-cid='" + escH(c.id) + "'" + (canSeek ? " onclick='apSeekTo(" + c.vt + ")' style='cursor:pointer'" : "") + "><div class='who'>" + tag + anch + (c.author === "coach" ? escH(T.coach) : escH(T.family)) + " · " + ago(c.ts) +
    "<span class='cmtcog' onclick='event.stopPropagation();cmtMenu(this)' title='⋯'>⋯</span>" +
    (hasOrig ? "<span class='tr' onclick='event.stopPropagation();toggleOrig(this)' title='查看原文 / Original'>🌐</span>" : "") + "</div>" +
    (hasOrig ? "<div class='orig' style='display:none'>" + escH(c.orig) + "</div>" : "") +
    (c.audioUrl ? "<div class='au'><button class='aub' id='auB_" + auSan(c.id) + "' data-key='" + auSan(c.id) + "' data-url='" + escH(c.audioUrl) + "'" + (canSeek ? " data-vt='" + c.vt + "'" : "") + " onclick='event.stopPropagation();auPlay(this)'>▶</button><div class='aubar'><div class='aupg' id='auP_" + auSan(c.id) + "'></div></div><span class='autm' id='auT_" + auSan(c.id) + "'>0:00</span></div>" : "") +
    (shown && shown !== "🎤" ? escH(shown) : "") + "</div>";
}
// ===== 语音留言统一播放器：全局一个 Audio 实例，点另一个自动停、轮询重建不打断播放 =====
let auO = null, auKey = null;
function auSan(id){ return String(id).replace(/[^a-zA-Z0-9_]/g, "_"); }
function auPlay(btn){
  const key = btn.dataset.key, url = btn.dataset.url;
  const vt = parseFloat(btn.dataset.vt || "");
  if(!isNaN(vt) && apV){ apV.pause(); document.getElementById("apPlayBtn").textContent = "▶"; apV.currentTime = vt; }   // 语音定位：跳到它说的那个视频点
  if(auO && auKey === key){ if(auO.paused) auO.play().catch(function(){}); else auO.pause(); auSync(); return; }
  if(!auO){
    auO = new Audio();
    auO.addEventListener("timeupdate", auTickA);
    auO.addEventListener("loadedmetadata", auTickA);
    auO.addEventListener("ended", function(){ auSync(); });
  }
  auO.pause();
  auKey = key;
  auO.src = url;
  auO.play().catch(function(){});
  auSync();
}
function auTickA(){
  if(!auO || !auKey) return;
  const tm = document.getElementById("auT_" + auKey), pg = document.getElementById("auP_" + auKey);
  if(tm) tm.textContent = fmtT(auO.currentTime) + " / " + (isFinite(auO.duration) ? fmtT(auO.duration) : "…");
  if(pg && isFinite(auO.duration) && auO.duration > 0) pg.style.width = Math.min(100, auO.currentTime / auO.duration * 100) + "%";
}
function auSync(){
  document.querySelectorAll(".aub").forEach(function(b){ b.textContent = "▶"; });
  const b = document.getElementById("auB_" + auKey);
  if(b && auO) b.textContent = auO.paused ? "▶" : "❚❚";
}
// ===== 留言 ⋯ 菜单：删除 + 勾选标签（服务端保存） =====
function cmtMenu(btn){
  const host = btn.closest(".cmt");
  const c = cmts.find(x => x.id === host.dataset.cid);
  if(!c) return;
  const had = host.querySelector(".cmtmenu");
  if(had){ had.remove(); return; }
  document.querySelectorAll(".cmtmenu").forEach(function(e){ e.remove(); });
  const cur = Array.isArray(c.tags) ? c.tags : (c.tag ? [c.tag] : []);
  const m = document.createElement("div");
  m.className = "cmtmenu";
  m.innerHTML = TAG_ORDER.map(k => "<button data-tag='" + k + "'" + (cur.includes(k) ? " class='on'" : "") + ">" + escH(TAGS[k] || k) + "</button>").join("") +
    "<button class='del'>" + escH(T.del || "Delete") + "</button>";
  m.addEventListener("click", function(e){
    e.stopPropagation();
    const b = e.target.closest("button");
    if(!b) return;
    if(b.classList.contains("del")) cmtDel(host); else cmtTagToggle(host, b);
  });
  host.appendChild(m);
}
function cmtTagToggle(host, btn){
  const id = host.dataset.cid;
  const c = cmts.find(x => x.id === id);
  if(!c) return;
  btn.classList.toggle("on");
  const tags = Array.from(host.querySelectorAll(".cmtmenu button.on[data-tag]")).map(b => b.dataset.tag);
  c.tags = tags; delete c.tag;
  fetch("/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"comment_tags", token:TOKEN, id, tags})}).catch(function(){});
  render(); if(apVid) apRenderCmts();
}
function cmtDel(host){
  const id = host.dataset.cid;
  cmts = cmts.filter(c => c.id !== id);
  fetch("/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"comment_del", token:TOKEN, id})}).catch(function(){});
  render(); if(apVid) apRenderCmts();
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
// 对阵留言区输入框 → b: 前缀的对阵 key（片段留言在分析面板里直接走 apVid）
function inputTarget(el){
  const b = el.closest(".bout");
  return b ? b.dataset.bcid : null;
}
async function sendCmt(input){
  const text = input.value.trim();
  if(!text) return;
  const videoId = inputTarget(input);
  input.value = "";
  input.disabled = true;
  const b = input.closest(".bout");
  if(b && input.closest(".cbody")) openCmts[b.dataset.bkey] = true;
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
  const videoId = inputTarget(btn);
  if(rec){ rec.stop(); return; }
  if(!navigator.mediaDevices || !window.MediaRecorder){ alert(T.noVoice || "Voice recording not supported"); return; }
  try{
    btn.textContent = "⏳";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
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
  }catch(e){ btn.textContent = "🎤"; alert((T.noMic || "Mic unavailable") + " (" + (e.name || e.message || e) + ")"); }
}
load();
setInterval(function(){ load(true); }, 15000);
</script></body></html>`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
