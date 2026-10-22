---
name: pi-rightclick-paste-patch
description: >-
  显式触发：给已安装的最新 pi 打"Windows Terminal / WSL 下 fullscreen 模式右键粘贴失效"
  的临时补丁。pi 更新会覆盖补丁，更新后重跑本 skill 即可。已打过则幂等跳过。
compatibility: >-
  WSL-only——仅非 win32 宿主（WSL / Linux / SSH 终端）需要；Windows 原生 pi
  （process.platform === "win32"）门禁天然通过，无需本补丁，脚本会在非 Linux 下提示并跳过。
---

# pi 右键粘贴临时补丁（Windows Terminal / WSL）

## 背景（根因）

pi 的 fullscreen（alt-screen）TUI 会开启鼠标捕获（SGR mouse `?1000h ?1002h ?1006h`）。
鼠标捕获开启时，Windows Terminal 把右键事件转发给应用、自己不再粘贴。因此 fullscreen
下的右键粘贴由 pi 自己实现——但 pi-tui 的 `TuiAltScreen.handleRightClickPaste()` 有
`process.platform !== "win32"` 硬门禁：

- 原生 Windows（pwsh7）：platform=win32 → 门禁通过 → 粘贴正常。
- WSL：platform=linux → 门禁拦截 → 右键事件被 pi 吞掉却无人处理 → 死点击。
- regular 模式：不捕获鼠标 → WT 自己粘贴 → 两个环境都正常。

上游（`earendil-works/pi`，issue #10345 同根因）**尚未修复**，npm 1.1.0 仍有门禁。
本 skill 是临时方案，pi 一更新就被覆盖，需重跑。

## 修复方式

**删掉 `process.platform !== "win32"` 门禁，保留 `TERM_PROGRAM === "vscode"` 例外**：

```js
// 旧
if (!this.onRightClickPaste ||
    process.platform !== "win32" || ...
// 新（删门禁版）
if (!this.onRightClickPaste ||
    process.env.TERM_PROGRAM?.toLowerCase() === "vscode" || ...
```

为什么删门禁是安全且彻底的（该修法经调研确认）：

- `handleRightClickPaste` 是**被动触发**——只有终端把右键事件转发给应用时 pi 才收得到。
- 终端分三类：**转发右键但不自己粘**（Windows Terminal、WezTerm、VTE/GNOME Terminal、
  kitty 默认）→ pi 粘贴（正确）；**不转发右键**（macOS Terminal.app）→ 事件到不了
  pi，无副作用；**转发 + 自己粘**→ 唯一双粘贴风险，目前实证只有 VS Code 集成终端
  （issue #8186），已有 `TERM_PROGRAM=vscode` 例外兜底。
- 白名单方案（按 `WT_SESSION`/`TERM_PROGRAM=wezterm` 识别）救不了 SSH 远程场景，已弃用；
  早期打过的 WT_SESSION 版补丁会被本脚本自动收敛到删门禁版。

## 执行

```bash
bash <skill 目录>/patch.sh
```

`patch.sh` 用 `BASH_SOURCE[0]` 定位自身所在目录（= 技能目录），不依赖 cwd；本机分发后的技能目录通常是 `~/.agents/skills/pi-rightclick-paste-patch/`，仓库内为 `skills/self/pi-rightclick-paste-patch/`。

脚本只处理 **mise 安装的最新版本**（三点版本目录，排除 `latest`/`1.x` 等别名），
对两个位置打补丁：

1. `dist/bundle/chunks/chunk-*.js`（用户实际运行的入口，bundle 内联 pi-tui 代码）
2. `@earendil-works/pi-tui/dist/tui-alt-screen.js`（非 bundle 运行路径，缺失则跳过）

幂等：目标文件已含补丁标记（`handleRightClickPaste` 后直接是 `process.env.TERM_PROGRAM` 检查，即删门禁形态）则跳过；含旧 win32 门禁或早前 `WT_SESSION` 版补丁则**收敛**到删门禁版；片段匹配不到则告警并继续处理其余目标（由验证节判定失败）。

## 完成判据

- 脚本输出最新版本号与 `already patched (skip)` 或 `patched`；
- 验证节输出 `ok: bundle chunks clean of the old gate`，无 FAIL；
- 重启 pi 后在 WT 的 WSL fullscreen 模式右键，能粘贴剪贴板内容（手动确认）。
- 回归驱动器：`/tmp/pi-clip-probe/rightclick-loop.mjs`（fake terminal + SGR 右键事件，
  断言非 vscode 终端收到右键即触发）。

## 恢复与注意

- 补丁前的**原始**文件备份在 `backups/` 目录，命名 `<basename>.orig`
  （如 `chunk-OTL6MGLJ.js.orig`、`tui-alt-screen.js.orig`）；只保留第一份
  pristine 副本、不覆盖。需要时可还原，但还原后需重跑本脚本重新打补丁。
- `mise upgrade` 后补丁丢失属预期，重跑本 skill 即可；脚本会按最新版本重新定位
  （chunk 文件名是内容哈希，更新后可能变化，脚本用内容匹配定位，不写死文件名）。
- 上游修好后（issue #10345 或新 PR 合并、npm 发版）本 skill 应停用。
