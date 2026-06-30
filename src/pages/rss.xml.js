import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts');
  
  const sortedPosts = posts.sort((a, b) => new Date(b.data.date) - new Date(a.data.date));

  return rss({
    title: 'amdkits',
    description: 'a small house in the internet',
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      // Matches your [category]/[slug].astro structure
      link: `/${post.data.category}/${post.id}/`, 
    })),
  });
}
