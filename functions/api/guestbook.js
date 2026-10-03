export async function onRequestGet({ env }) {
  const { results = [] } = await env.DB.prepare('SELECT id,name,website,message,created_at FROM guestbook WHERE approved = 1 ORDER BY id DESC LIMIT 100').all();
  return Response.json({ entries: results });
}
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const clean = (v, n) => typeof v === 'string' ? v.trim().slice(0,n) : '';
  if (clean(body?.website_confirm,100)) return Response.json({ok:true});
  const name=clean(body?.name,40), message=clean(body?.message,500), website=clean(body?.website,200);
  if (!name || !message) return Response.json({error:'name and message are required.'},{status:400});
  if (website && !/^https?:\/\//i.test(website)) return Response.json({error:'website must start with http:// or https://.'},{status:400});
  await env.DB.prepare('INSERT INTO guestbook (name,website,message,created_at,approved) VALUES (?,?,?,?,1)').bind(name,website||null,message,new Date().toISOString()).run();
  return Response.json({ok:true});
}
