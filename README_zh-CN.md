# my-skills

[English](README.md) | [中文](README_zh-CN.md)

跨 harness 共享的 Agent Skills 聚合仓库：按**上游来源**分目录组织并纳入版本控制，是本机 `~/.agents/skills` 的来源。直接编辑 `~/.agents/skills` 会在下次 `npx skills update` 时被上游覆盖；本仓库是可持续的维护形态（补丁以 fork 语义落在技能文件里）。

## 目录结构（按来源组织）

| 目录 | 来源 | 说明 |
|---|---|---|
| `skills/mattpocock/{engineering,productivity,in-progress}/<name>/` | [mattpocock/skills](https://github.com/mattpocock/skills) | 23 个技能，保留上游 `engineering` / `productivity` / `in-progress` 分类 |
| `skills/kill-ai-slop/<name>/` | [yetone/kill-ai-slop](https://github.com/yetone/kill-ai-slop) | kill-ai-slop（上游路径为 `skill/`，聚合后归一为来源目录） |
| `skills/cloudflare/<name>/` | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | security-audit（来源已溯源，记录于本机 `~/.agents/.skill-lock.json`） |
| `skills/self/<name>/` | 自建 | de-slop、web-debug、consolidate-strays（通用；de-slop 带 `disable-model-invocation: true`，仅显式调用；consolidate-strays 为模型调用——description 限定在 stray 回收请求，且默认跑只读 dry-run，避免其他 harness 误触发）；write-release-notes（通用，模型调用——description 限定在 GitHub Release 发布说明请求，只在写发布说明时触发）；setup-repo（通用，`disable-model-invocation: true`——一次性仓库 setup，驱动 `setup-matt-pocock-skills` 再 `setup-coding-standards`，见 ADR-0005）；npm-release、pi-extension-sync（pi 专属，带 `disable-model-invocation: true`，避免其他 harness 自动触发） |

**发现深度约束**：`vercel-labs/skills` CLI 的发现规则只约束**技能目录**（含 `SKILL.md` 的目录）的深度——`skills/` 容器下最多三层（`skills/<cat>/<cat>/<name>/`）。本仓库技能目录最深为 `skills/mattpocock/<category>/<name>/`，在规则之内；技能目录内部的辅助文件（`agents/`、`references/`、`scripts/`）不受此限，可再往下嵌套。

## 基线导入

仓库以本机 `~/.agents/skills` 当前快照**逐字节导入**（105 个文件），因而天然携带快照里已有的 4 处基线补丁。相对上游的全部差异（基线补丁与新增 A 类补丁，以及 B 类环境备忘）记录在根目录 [`PATCHES.md`](PATCHES.md)（`self/` 为自建技能，无上游）；上游来源技能已逐文件校验。基线 4 处为：

- `research/SKILL.md`：pi 后台 research agent 完成即推送的机制说明（+2 行）
- `wayfinder/SKILL.md`：research 子代理完成推送的处理方式（+1 行）
- `setup-matt-pocock-skills/issue-tracker-github.md`：`--add-assignee "@me"` 加引号 + Windows PowerShell splatting 警告
- `kill-ai-slop/SKILL.md`：`disable-model-invocation: true`

两个 pi 专属技能（`npm-release`、`pi-extension-sync`）从 Windows pi 配置迁移进 `skills/self/`，`~/.pi` 不再托管技能副本（junction-only；迁移见 ticket #5）。

## 安装 / 分发

```bash
# Install globally (~/.agents/skills), create links for pi only.
# Do NOT use --all: it links every agent detected on this machine.
# -a pi universal keeps the CLI in symlink (junction) mode; a single
# -a target silently falls back to copy mode (real dirs, not junctions).
npx skills add hu3rror/my-skills -a pi universal -s '*' -g -y
```

分发链保持不变：canonical 目录 + pi junctions 都由 CLI 生成。`-a pi universal` 只对 pi 建链接——追加 `universal` 是为了让 CLI 保持 junction 模式（单一 `-a` 目标会静默退化为 copy 模式，把 pi 目录写成本地副本而不是 junction）；`--all` 会对本机所有已检测 agent 建链接，本仓库只需要 pi，不要用。

## 同步上游

```bash
# 预演：只报告会同步什么、哪些补丁文件被跳过，不写任何文件
node scripts/vendor-sync.mjs --dry-run

# 实际同步：浅克隆各上游，写入 skills/<source>/，跳过 PATCHES.md 列出的补丁文件
node scripts/vendor-sync.mjs
```

补丁文件（`PATCHES.md` A 类）永不被覆盖，会报告为需要手动合并；上游删除的文件只报告、不删除，由维护者手动 `git rm`。GitHub Actions 提供同名 `vendor-sync` 手动工作流（`workflow_dispatch`，无定时），在日志中输出脚本摘要。

## 回收游离技能（分发前）

canonical store 是派生目标：直接写进 `~/.agents/skills` 的内容会被下一次分发或更新静默覆盖。每次跑分发链之前——或本地改动过任何技能之后——先跑一次回收（consolidation），把分发链不追踪的内容救回聚合仓库：

- **new stray（新游离技能）**——lock 文件与仓库都没有记录的 store 技能（直接写进 store 或 pi junction farm）——按需复制进仓库：自创内容放 `skills/self/<name>`，来源不明放 `skills/other/<name>`；
- **modified stray（修改过的游离技能）**——内容与 consolidated copy 不一致的 tracked 技能——输出 diff 摘要与 `PATCHES.md` 行模板；补丁行要先补进清单再回收（ADR-0002），consolidation 永不自动复制 modified stray。

对 pi 说 "consolidate stray skills"（`skills/self/consolidate-strays`，模型调用、description 限定范围，其他 harness 不会误触发），或直接跑脚本：

```bash
node scripts/consolidate-strays.mjs             # dry-run 报告（默认，只读）
node scripts/consolidate-strays.mjs --apply <name> [--to self]  # 把某个 new stray 复制进仓库
```

默认 dry-run 不写任何文件；apply 保留 store 副本不动；回收的内容要真正生效，还需 commit + push + 再分发一次。

## 约定

- 每个技能一个目录，内含 `SKILL.md`（目录 + SKILL.md，兼容所有支持该规范的 harness）
- 脚本使用相对 skill 目录的路径，不写死 `~/.pi` 等具体 harness 路径；分发技能正文不得出现机器专属路径（由 `scripts/skill-hygiene.test.mjs` 强制）
- pi 专属技能放 `skills/self/`，必须保留 `disable-model-invocation: true`
- 技能目录（含 `SKILL.md` 的目录）深度不得超过 `skills/<cat>/<cat>/<name>/`（CLI 发现规则上限）；目录内的辅助文件不受此限

## 相关文档

- 维护规范与迁移计划：`docs/specs/powershell-portability-and-maintenance.md`
- 仓库协作约定：`AGENTS.md`、`docs/agents/`