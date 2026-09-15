---
title: "[AI info] 基于Qwen配置使用claude code"
date: 2026-01-02 00:00:00
tags:
  - "AI"
categories:
  - "AI Infra"
---

AI模型发展迅猛，claude code在众多ai模型中，以出色的ai编程助手和任务流处理出名，但是苦于需要账户限制以及高昂的价格，无法做到大众化使用和日常使用的目的。但是现在可以配置claude code使用qwen的api来完成工作流，从而达到日常免费使用的目的，下面是配置流程。

# 安装nodejs
```bash
brew installl node
```
验证：
```bash
node -v

npm -v
```
由于claude code需要node版本在20以上，建议安装后确认node版本高于20.

# 安装Qwen code
```bash
npm install -g @qwen-code/qwen-code@latest
```
验证安装：
```bash
qwen --version
```
如果没有注册qwen，可以先到[这里](https://chat.qwen.ai/)注册一个账号.
注册后，可以通过命令行通过oauth登录：
```bash
qwen
```
登录成功后，可以在`~/.qwen/`目录看到生成了 `oauth_creds.json`，该文件中包含了access token，该token会在claude-code配置中使用。

# 安装claude-code router
```bash
npm install -g @anthropic-ai/claude-code @musistudio/claude-code-router
```
## 建立claude配置目录
```bash 
mkdir -p ~/.claude-code-router ~/.claude
```

##  配置claude-code-router使用qwen
```bash
touch ~/.claude-code-router/config.json
```

将下面的内容中access key替换成前面生成的qwen的access code，并填入刚生成的config.json文件中：
```bash
{  
  "LOG": true,  
  "LOG_LEVEL": "info",  
  "HOST": "127.0.0.1",  
  "PORT": 3456,  
  "API_TIMEOUT_MS": 600000,  
  "Providers": [  
    {  
      "name": "qwen",  
      "api_base_url": "https://portal.qwen.ai/v1/chat/completions",  
      "api_key": "access token",  
      "models": [  
        "qwen3-coder-plus",  
        "qwen3-coder-plus",  
        "qwen3-coder-plus"  
      ]  
    }  
  ],  
  "Router": {  
    "default": "qwen,qwen3-coder-plus",  
    "background": "qwen,qwen3-coder-plus",  
    "think": "qwen,qwen3-coder-plus",  
    "longContext": "qwen,qwen3-coder-plus",  
    "longContextThreshold": 60000,  
    "webSearch": "qwen,qwen3-coder-plus"  
  }  
}
```
此时，claude code就配置完成了！

# 启动Claude code
```bash
ccr restart
ccr code
```
<img width="1338" height="544" alt="Image" src="https://github.com/user-attachments/assets/785e496a-c5a1-4786-aa93-61f55e3d512d" />

[source issue](https://github.com/quinnwencn/blog/issues/129)
