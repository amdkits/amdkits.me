---
title: System Refactor Test
date: "2026-07-01"
tag: dev
category: blogs
---

# It works!

If you can see this post at `/blogs/testing-refactor`, your unified routing system is fully operational. 

This post proves that:
1. The **`posts` collection** is correctly configured in `content.config.ts`.
2. The **Universal Route `[category]/[slug].astro`** is successfully catching the request.
3. The **`category` frontmatter** is driving the URL structure.

Go ahead and try changing the category to `coding` or `projects` in the frontmatter above and save it—watch the URL change automatically to `/coding/testing-refactor`.
