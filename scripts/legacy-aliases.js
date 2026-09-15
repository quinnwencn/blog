function redirectPage(target) {
  const escaped = target.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${escaped}">
  <link rel="canonical" href="${escaped}">
  <title>Redirecting...</title>
</head>
<body>
  <a href="${escaped}">Redirecting...</a>
</body>
</html>`;
}

hexo.extend.generator.register('legacy_aliases', function legacyAliases(locals) {
  const root = this.config.root || '/';
  const posts = locals.posts.toArray();

  return posts
    .filter((post) => post.path.includes('/legacy/') && post.date && post.date.clone)
    .map((post) => {
      const legacyDate = post.date.clone().subtract(1, 'day');
      const pathParts = post.path.split('/');
      const rest = pathParts.slice(3).join('/');
      const aliasPath = `${legacyDate.format('YYYY/MM/DD')}/${rest}`;

      if (aliasPath === post.path) {
        return null;
      }

      return {
        path: aliasPath,
        data: redirectPage(`${root}${post.path}`.replace(/\/+/g, '/'))
      };
    })
    .filter(Boolean);
});
