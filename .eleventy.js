export default function (eleventyConfig) {
  eleventyConfig.addFilter('rssDate', (value) => new Date(value).toUTCString());

  eleventyConfig.addFilter('postDate', (value) => {
    const date = new Date(value);
    return date.toISOString().slice(0, 10);
  });
  // Static assets
  for (const [from, to] of [
    ['src/styles.css', 'styles.css'],
    ['src/music.js', 'music.js'],
    ['src/webrings.js', 'webrings.js'],
    ['src/guestbook.js', 'guestbook.js'],
    ['src/oneko.js', 'oneko.js'],
    ['src/oneko.gif', 'oneko.gif'],
    ['src/kits.gif', 'kits.gif'],
    ['src/favicon.ico', 'favicon.ico'],
    ['src/friendsbadges', 'friendsbadges'],
    ['src/music', 'music'],
    ['src/_headers', '_headers']
  ])
    eleventyConfig.addPassthroughCopy({ [from]: to });

  const md = (item) => item.inputPath.endsWith('.md');
  const newest = (a, b) =>
    new Date(b.data.date || b.data.updated || 0) -
    new Date(a.data.date || a.data.updated || 0);

  eleventyConfig.addCollection('posts', (api) =>
    api
      .getAll()
      .filter((item) => item.inputPath.includes('/src/blog/') && md(item))
      .sort(newest)
  );

  eleventyConfig.addCollection('videos', (api) =>
    api
      .getAll()
      .filter((item) => item.inputPath.includes('/src/videos/') && md(item))
      .sort(newest)
  );

  eleventyConfig.addCollection('garden', (api) =>
    api
      .getAll()
      .filter((item) => item.inputPath.includes('/src/garden/') && md(item))
      .sort(newest)
  );

  eleventyConfig.addCollection('changelog', (api) =>
    api
      .getAll()
      .filter((item) => item.inputPath.includes('/src/changelog/') && md(item))
      .sort(newest)
  );

  // One unified stream for the homepage.
  eleventyConfig.addCollection('updates', (api) =>
    api
      .getAll()
      .filter((item) => {
        if (!md(item)) return false;
        const p = item.inputPath;
        return (
          p.includes('/src/blog/') ||
          p.includes('/src/videos/') ||
          p.includes('/src/changelog/')
        );
      })
      .sort(newest)
  );

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site'
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk', 'html']
  };
}
