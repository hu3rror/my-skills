---
name: machine-environment
description: >-
  Use when a bash command on this Windows machine throws "Maximum call stack
  size exceeded" (or similar env errors) with no output — known-broken
  commands and working alternatives. Not for WSL/CI/remote, where they work.
---

# Machine environment — known traps on this Windows machine

本机（Windows + Git Bash）的已知环境故障。**换环境不适用**：WSL、CI、远程机器上没有这些故障，按各自环境判断即可。这里只记录本机验证过的事实。

## 已知故障

- `rg`、`find`、`sed`（及个别 `cat` 管道组合）在本机 Git Bash 可能直接抛 `Maximum call stack size exceeded` 且**不产出任何结果**。此类失败不是命令逻辑问题，重试只会重复失败——直接改用下面的替代。

## 替代方案

- 搜索文件内容 → 内置 `grep` 工具（pattern 为 Rust regex，无 lookahead/反向引用；字面搜索开 `literal`）
- 按 glob 找文件 → 内置 `find` 工具
- 文本替换 → `edit` 工具（精确 oldText 匹配，一处调用可含多个不重叠 edits）
- 读文件 → `read` 工具
- bash 仅用于内置工具表达不了的管道/组合，且优先 `ls`、`git`、`head`、`cat`（单文件）等在此环境可靠的命令
