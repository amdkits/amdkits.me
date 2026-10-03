# amdkits.me → 11ty

This is the 11ty/static version of the site. The visual language and content are preserved, but Astro is gone from the runtime.

## 1. Install

Node 20+ is enough:

```sh
npm install
npm run dev
```

Build with `npm run build`; output is `_site/`.

## 2. Where things live

- `src11ty/blog/*.md` → `/blogs/...`
- `src11ty/garden/*.md` → `/garden/...`
- `src11ty/videos/*.md` → `/youtube/...`
- `src11ty/changelog/*.md` → `/changelog/...`
- `src11ty/_includes/` → layouts/components
- `src11ty/styles.css` → all site CSS
- `src11ty/_data/site.js` → navigation, friends, webrings, music

## 3. Publishing

```sh
npm run new:blog -- "my new post"
npm run new:video -- "my new video"
npm run new:garden -- "a garden thought"
```

Edit the generated Markdown, then commit/push. 11ty regenerates the pages.

## 4. Guestbook

The site itself is static, so the guestbook needs a tiny external/serverless API. The UI is already included. Set `window.GUESTBOOK_API` before `guestbook.js`, or use `/api/guestbook` on your host.

For Cloudflare Pages, the cleanest version is a Pages Function backed by D1. The static site remains fast; only `/api/guestbook` is dynamic.

## 5. Deploy

Upload `_site/` to any static host. Cloudflare Pages, Netlify, GitHub Pages, or an ordinary web server all work. Do not upload `node_modules`.
