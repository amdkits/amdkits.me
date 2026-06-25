import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(), // e.g. "2026-06-20"
    tag: z.string(),  // e.g. "OS", "LeetCode", "Guitar"
  }),
});

export const collections = { blog };
