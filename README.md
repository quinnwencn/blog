# Quinn's Blog

Hexo source for Quinn's technical blog:

https://quinnwencn.github.io/blog/

## Writing posts

- General posts: `source/_posts/legacy/` or another topic directory under `source/_posts/`
- AI Infra posts: `source/_posts/AI/`
- Post images: put images in a same-name folder next to the post and reference them with a relative path

Example:

```text
source/_posts/AI/linear_algebra/my-post.md
source/_posts/AI/linear_algebra/my-post/diagram.png
```

```markdown
![diagram](my-post/diagram.png)
```

## Local preview

```bash
npm install
npm run server
```

## Build

```bash
npm run clean
npm run build
```
