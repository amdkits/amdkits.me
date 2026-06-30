import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tag: z.string(),
    // The magic field that drives the routing:
    category: z.enum(['blogs', 'projects', 'literature', 'coding', 'life']), 
  }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

const gpg = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gpg' }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

export const collections = { posts, about, gpg};
