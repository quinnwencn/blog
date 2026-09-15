---
title: "[AI info] 基于Qwen配置使用claude code"
date: 2026-01-02 00:00:00
tags:
  - "AI"
categories:
  - "AI Infra"
---

<p>AI模型发展迅猛，claude code在众多ai模型中，以出色的ai编程助手和任务流处理出名，但是苦于需要账户限制以及高昂的价格，无法做到大众化使用和日常使用的目的。但是现在可以配置claude code使用qwen的api来完成工作流，从而达到日常免费使用的目的，下面是配置流程。</p>
<h1>安装nodejs</h1>
<p>``<code>bash</p>
<p>brew installl node</p>
</code>`<code>
<p>验证：</p>
</code>`<code>bash
<p>node -v</p>
<p>npm -v</p>
</code>`<code>
<p>由于claude code需要node版本在20以上，建议安装后确认node版本高于20.</p>
<h1>安装Qwen code</h1>
</code>`<code>bash
<p>npm install -g @qwen-code/qwen-code@latest</p>
</code>`<code>
<p>验证安装：</p>
</code>`<code>bash
<p>qwen --version</p>
</code>`<code>
<p>如果没有注册qwen，可以先到<a href="https://chat.qwen.ai/">这里</a>注册一个账号.</p>
<p>注册后，可以通过命令行通过oauth登录：</p>
</code>`<code>bash
<p>qwen</p>
</code>`<code>
<p>登录成功后，可以在</code>~/.qwen/<code>目录看到生成了 </code>oauth_creds.json<code>，该文件中包含了access token，该token会在claude-code配置中使用。</p>
<h1>安装claude-code router</h1>
</code>`<code>bash
<p>npm install -g @anthropic-ai/claude-code @musistudio/claude-code-router</p>
</code>`<code>
<h2>建立claude配置目录</h2>
</code>`<code>bash
<p>mkdir -p ~/.claude-code-router ~/.claude</p>
</code>`<code>
<h2> 配置claude-code-router使用qwen</h2>
</code>`<code>bash
<p>touch ~/.claude-code-router/config.json</p>
</code>`<code>
<p>将下面的内容中access key替换成前面生成的qwen的access code，并填入刚生成的config.json文件中：</p>
</code>`<code>bash
<p>{  </p>
<p>  "LOG": true,  </p>
<p>  "LOG_LEVEL": "info",  </p>
<p>  "HOST": "127.0.0.1",  </p>
<p>  "PORT": 3456,  </p>
<p>  "API_TIMEOUT_MS": 600000,  </p>
<p>  "Providers": [  </p>
<p>    {  </p>
<p>      "name": "qwen",  </p>
<p>      "api_base_url": "https://portal.qwen.ai/v1/chat/completions",  </p>
<p>      "api_key": "access token",  </p>
<p>      "models": [  </p>
<p>        "qwen3-coder-plus",  </p>
<p>        "qwen3-coder-plus",  </p>
<p>        "qwen3-coder-plus"  </p>
<p>      ]  </p>
<p>    }  </p>
<p>  ],  </p>
<p>  "Router": {  </p>
<p>    "default": "qwen,qwen3-coder-plus",  </p>
<p>    "background": "qwen,qwen3-coder-plus",  </p>
<p>    "think": "qwen,qwen3-coder-plus",  </p>
<p>    "longContext": "qwen,qwen3-coder-plus",  </p>
<p>    "longContextThreshold": 60000,  </p>
<p>    "webSearch": "qwen,qwen3-coder-plus"  </p>
<p>  }  </p>
<p>}</p>
</code>`<code>
<p>此时，claude code就配置完成了！</p>
<h1>启动Claude code</h1>
</code>`<code>bash
<p>ccr restart</p>
<p>ccr code</p>
</code>``
<img width="1338" height="544" alt="Image" src="https://github.com/user-attachments/assets/785e496a-c5a1-4786-aa93-61f55e3d512d" />
