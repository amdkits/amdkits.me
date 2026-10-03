#!/usr/bin/env node
import {mkdirSync, writeFileSync} from 'node:fs';
const [, , kind='blog', ...parts] = process.argv;
const title=parts.join(' ').trim();
if(!title) throw new Error('usage: npm run new:blog -- "title"');
const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const date=new Date().toISOString().slice(0,10);
const map={
 blog:[`src11ty/blog/${slug}.md`,`---\ntitle: "${title.replaceAll('"','\\"')}"\ndate: "${date}"\ntag: note\ncategory: blogs\npermalink: /blogs/${slug}/\n---\n\nWrite here.\n`],
 video:[`src11ty/videos/${slug}.md`,`---\ntitle: "${title.replaceAll('"','\\"')}"\ndate: "${date}"\nyoutubeId: ""\ndescription: ""\npermalink: /youtube/${slug}/\ntag: youtube\n---\n\nAdd notes about the video here.\n`],
 garden:[`src11ty/garden/${slug}.md`,`---\ntitle: "${title.replaceAll('"','\\"')}"\nupdated: "${date}"\nstatus: seedling\npermalink: /garden/${slug}/\ntag: garden\n---\n\nStart thinking here.\n`]};
if(!map[kind]) throw new Error(`unknown kind: ${kind}`);
mkdirSync(map[kind][0].split('/').slice(0,-1).join('/'),{recursive:true});
writeFileSync(map[kind][0],map[kind][1]); console.log(`created ${map[kind][0]}`);
