---
layout: home
title: Welcome to My Blog
---

# Welcome to Quinn's Blog

Hello! I'm Quinn, and this is my personal blog where I share thoughts, projects, and ideas.

## Recent Posts

{% for post in site.posts limit:5 %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%Y-%m-%d" }}
{% endfor %}

## About Me

I'm passionate about technology, programming, and learning new things. This blog is a space for me to document my journey and share knowledge.

[View all posts](/posts)