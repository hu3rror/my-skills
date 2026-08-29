# my-skills

我的自建 Agent Skills 集合（通用、跨 harness 可用的技能）。

## 技能

| 技能 | 说明 |
|---|---|
| `de-slop-zh` | 中文文本去 AI 味（改写 / 检测 / 深度诊断） |
| `de-slop-en` | 英文文本去 AI 味（Quick Edit / Detect / Full Diagnosis） |
| `web-debug` | 用实时浏览器驱动调试前端（auth、CORS、JWT、表单、白屏等） |

## 安装

```bash
# 装到全局（~/.agents/skills），为已检测到的 agent 建链接
npx skills add hu3rror/my-skills --all -g
```

## 约定

- 每个技能一个目录，内含 `SKILL.md`（Agent Skills 规范：目录 + SKILL.md，兼容所有支持该规范的 harness）
- 脚本使用相对 skill 目录的路径，不写死 `~/.pi` 等具体 harness 路径
- pi 专属、依赖 pi 内部机制的技能（如 analyze-sessions）不放在这里，留在 pi 配置仓库
