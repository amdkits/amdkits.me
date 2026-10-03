# Cloudflare Pages + D1 guestbook (free setup)

This site uses a Pages Function at `/api/guestbook` and expects a D1 binding named `DB`.

## 1. Create the D1 database

In Cloudflare Dashboard, open **Workers & Pages** and create a D1 database named `amdkits-guestbook`.

## 2. Create the table

Open the D1 database's SQL/console and run the contents of `schema.sql`.

You should end up with a `guestbook` table.

## 3. Bind D1 to your Pages project

Open **Workers & Pages -> your Pages project -> Settings -> Bindings -> Add -> D1 database**.

Set:

- Variable name: `DB`
- D1 database: `amdkits-guestbook`

Save it and redeploy the Pages project. The Function accesses it as `context.env.DB`.

## 4. Pages build settings

For Git-connected deployment:

- Production branch: `main`
- Build command: `npx @11ty/eleventy`
- Build output directory: `_site`

## 5. Test

After deployment, open `/guestbook` and submit a test entry.

If the page says `guestbook API not connected yet`, open `/api/guestbook` directly. A working binding should return JSON such as `{"entries":[]}` rather than a 500 error.

## 6. Free plan

D1 has a Workers Free plan. It is enough for a tiny personal guestbook. If the daily free-tier row limits are ever exceeded, D1 requests fail until the daily limit resets; the stored data is not deleted.
