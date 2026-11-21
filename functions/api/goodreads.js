// GET /api/goodreads
//
// Goodreads retired its public API, but public profiles still have RSS feeds
// per shelf. Browsers can't read those directly (no CORS), so this Pages
// Function fetches the three shelves server-side, trims them to what the
// library page needs, and caches the result at the edge.
//
// It never returns a 5xx: Cloudflare replaces 5xx responses with its own
// HTML error page, which would hide the real reason. Failures come back as
// HTTP 200 with an `error` field instead.
//
// Config (wrangler.toml [vars]):
//   GOODREADS_USER_ID  numeric id from your profile URL
//   GOODREADS_KEY      optional `key=` value, if the feed asks for one

const SHELVES = {
  reading: 'currently-reading',
  toRead: 'to-read',
  read: 'read'
};
const CACHE_SECONDS = 60 * 60;
const PER_PAGE = 200;
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };

function decode(text) {
  return text
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, e) => ENTITIES[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

// Value of <name>…</name>, unwrapping CDATA; '' if missing or empty.
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  if (!m) return '';
  const cdata = m[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return (cdata ? cdata[1] : decode(m[1])).trim();
}

function toIso(rfcDate) {
  const t = Date.parse(rfcDate);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

function parseShelf(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return items.map((block) => {
    const bookId = tag(block, 'book_id');
    return {
      id: bookId,
      title: tag(block, 'title'),
      author: tag(block, 'author_name'),
      url: bookId ? `https://www.goodreads.com/book/show/${bookId}` : '',
      cover: tag(block, 'book_medium_image_url') || tag(block, 'book_image_url'),
      rating: Number(tag(block, 'user_rating')) || 0, // 0 = unrated
      dateRead: toIso(tag(block, 'user_read_at')),
      dateAdded: toIso(tag(block, 'user_date_added'))
    };
  });
}

async function fetchShelf(env, shelf) {
  const url = new URL(
    `https://www.goodreads.com/review/list_rss/${encodeURIComponent(env.GOODREADS_USER_ID)}`
  );
  url.searchParams.set('shelf', shelf);
  url.searchParams.set('per_page', String(PER_PAGE));
  url.searchParams.set('sort', shelf === 'read' ? 'date_read' : 'date_added');
  url.searchParams.set('order', 'd');
  if (env.GOODREADS_KEY) url.searchParams.set('key', env.GOODREADS_KEY);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' }
  });
  if (!res.ok) throw new Error(`${shelf}: Goodreads returned ${res.status}`);
  const xml = await res.text();
  if (!xml.includes('<rss')) throw new Error(`${shelf}: response was not an RSS feed`);
  return parseShelf(xml);
}

function json(data, cacheControl) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl }
  });
}

export async function onRequestGet({ request, env, waitUntil }) {
  try {
    if (!env.GOODREADS_USER_ID) return json({ error: 'not_configured' }, 'no-store');

    const cache = globalThis.caches?.default;
    const cacheKey = new Request(new URL(request.url).origin + '/api/goodreads');
    const hit = cache ? await cache.match(cacheKey) : null;
    if (hit) return hit;

    const entries = Object.entries(SHELVES);
    const settled = await Promise.allSettled(entries.map(([, shelf]) => fetchShelf(env, shelf)));

    const body = { updated: new Date().toISOString(), reading: [], toRead: [], read: [], errors: [] };
    settled.forEach((r, i) => {
      if (r.status === 'fulfilled') body[entries[i][0]] = r.value;
      else body.errors.push(String(r.reason?.message || r.reason));
    });

    // Every shelf failed: report why, and don't cache it.
    if (body.errors.length === entries.length) {
      return json({ error: 'upstream_failed', errors: body.errors }, 'no-store');
    }

    // Partial results are cached briefly so a transient failure heals quickly.
    const ttl = body.errors.length ? 60 : CACHE_SECONDS;
    const res = json(body, `public, max-age=300, s-maxage=${ttl}`);
    if (cache && waitUntil) waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    return json({ error: 'function_failed', errors: [String(err?.message || err)] }, 'no-store');
  }
}
