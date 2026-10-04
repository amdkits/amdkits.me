const WINDOW_SECONDS = 60 * 60;
const POST_LIMIT = 5;
const GET_LIMIT = 60;
const MIN_FORM_TIME_MS = 2500;

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function clientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function response(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

async function rateLimit(env, key, limit) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    'SELECT count, window_start FROM guestbook_rate_limits WHERE key = ?'
  ).bind(key).first();

  if (!row || now - row.window_start >= WINDOW_SECONDS) {
    await env.DB.prepare(
      `INSERT INTO guestbook_rate_limits (key, count, window_start)
       VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`
    ).bind(key, now).run();
    return true;
  }

  if (row.count >= limit) return false;

  await env.DB.prepare(
    'UPDATE guestbook_rate_limits SET count = count + 1 WHERE key = ?'
  ).bind(key).run();
  return true;
}

function validWebsite(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function suspicious(name, message, website) {
  const text = `${name} ${message} ${website}`;
  const links = text.match(/https?:\/\/\S+/gi) || [];

  // Keep the guestbook human-focused: one optional link, no obvious spam terms,
  // and reject repeated-character garbage.
  if (links.length > 1) return true;
  if (/(.)\1{14,}/i.test(message)) return true;
  if (/\b(casino|viagra|porn|pornhub|crypto giveaway|free money|seo service)\b/i.test(text)) return true;
  return false;
}

export async function onRequestGet({ request, env }) {
  const ip = clientIP(request);
  if (!(await rateLimit(env, `get:${ip}`, GET_LIMIT))) {
    return response({ error: 'Too many requests. Please try again later.' }, 429);
  }

  const { results = [] } = await env.DB.prepare(
    `SELECT id, name, website, message, created_at
     FROM guestbook
     WHERE approved = 1
     ORDER BY id DESC
     LIMIT 100`
  ).all();

  return response({ entries: results });
}

export async function onRequestPost({ request, env }) {
  const ip = clientIP(request);
  if (!(await rateLimit(env, `post:${ip}`, POST_LIMIT))) {
    return response({ error: 'Too many submissions. Please try again later.' }, 429);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return response({ error: 'Invalid request.' }, 400);
  }

  // Honeypot. Real visitors never fill this field.
  if (clean(body.website_confirm, 100)) {
    return response({ ok: true });
  }

  // Very fast submissions are likely automated. Silently accept them so bots
  // don't learn which anti-spam check caught them.
  const started = Number(body.form_started_at);
  if (Number.isFinite(started) && Date.now() - started < MIN_FORM_TIME_MS) {
    return response({ ok: true });
  }

  const name = clean(body.name, 40);
  const message = clean(body.message, 500);
  const website = clean(body.website, 200);

  if (!name || !message) {
    return response({ error: 'Name and message are required.' }, 400);
  }

  if (!validWebsite(website)) {
    return response({ error: 'Website must start with http:// or https://.' }, 400);
  }

  // Do not publish suspicious submissions automatically.
  const approved = suspicious(name, message, website) ? 0 : 0;

  await env.DB.prepare(
    `INSERT INTO guestbook
      (name, website, message, created_at, approved)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(name, website || null, message, new Date().toISOString(), approved).run();

  return response({
    ok: true,
    pending: true,
    message: 'Thanks! Your message is waiting for approval.'
  });
}
