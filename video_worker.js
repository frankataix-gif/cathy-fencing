// Cathy 视频 Worker —— R2 视频上传/播放专用（无密钥依赖，可独立部署）
// 绑定：VIDEOS (r2_bucket -> cathy-videos)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

      const reqUrl = new URL(request.url);

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

      return json({ error: 'unknown action' }, 400);
    } catch (e) {
      return json({ error: e.message || 'internal error' }, 500);
    }
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
