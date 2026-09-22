# my-skills

跨 harness 共享的 Agent Skills 聚合仓库：按**上游来源**分目录组织并纳入版本控制，是本机 `~/.agents/skills` 的种子源。直接编辑 `~/.agents/skills` 会在下次 `npx skills update` 时被上游覆盖；本仓库是可持续的维护形态（补丁以 fork 语义落在技能文件里）。

## 目录结构（按来源组织）

| 目录 | 来源 | 说明 |
|---|---|---|
| `skills/mattpocock/{engineering,productivity,in-progress}/<name>/` | [mattpocock/skills](https://github.com/mattpocock/skills) | 23 个技能，保留上游 `engineering` / `productivity` / `in-progress` 分类 |
| `skills/kill-ai-slop/<name>/` | [yetone/kill-ai-slop](https://github.com/yetone/kill-ai-slop) | kill-ai-slop（上游路径为 `skill/`，聚合后归一为来源目录） |
| `skills/cloudflare/<name>/` | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | security-audit（来源已溯源，记录于本机 `~/.agents/.skill-lock.json`） |
| `skills/self/<name>/` | 自建 | de-slop、web-debug（通用；de-slop 带 `disable-model-invocation: true`，仅显式调用）；npm-release、pi-extension-sync（pi 专属，带 `disable-model-invocation: true`，避免其他 harness 自动触发） |

**发现深度约束**：`vercel-labs/skills` CLI 的发现规则只约束**技能目录**（含 `SKILL.md` 的目录）的深度——`skills/` 容器下最多三层（`skills/<cat>/<cat>/<name>/`）。本仓库技能目录最深为 `skills/mattpocock/<category>/<name>/`，在规则之内；技能目录内部的辅助文件（`agents/`、`references/`、`scripts/`）不受此限，可再往下嵌套。

## 基线播种

仓库以本机 `~/.agents/skills` 当前快照**逐字节播种**（105 个文件），因而天然携带快照里已有的 4 处本地补丁（相对上游的唯一差异，已对上游逐文件校验）：

- `research/SKILL.md`：pi 后台 research agent 完成即推送的机制说明（+2 行）
- `wayfinder/SKILL.md`：research 子代理完成推送的处理方式（+1 行）
- `setup-matt-pocock-skills/issue-tracker-github.md`：`--add-assignee "@me"` 加引号 + Windows PowerShell splatting 警告
- `kill-ai-slop/SKILL.md`：`disable-model-invocation: true`

两个 pi 专属技能（`npm-release`、`pi-extension-sync`）从 Windows pi 配置复制进 `skills/self/`，原处副本保留（后续迁移/移除在独立 ticket 中处理）。

## 安装 / 分发

```bash
# 装到全局（~/.agents/skills），为已检测到的 agent 建链接
npx skills add hu3rror/my-skills --all -g
```

分发链保持不变：canonical 目录 + pi junctions 都由 CLI 生成。

## 约定

- 每个技能一个目录，内含 `SKILL.md`（目录 + SKILL.md，兼容所有支持该规范的 harness）
- 脚本使用相对 skill 目录的路径，不写死 `~/.pi` 等具体 harness 路径
- pi 专属技能放 `skills/self/`，必须保留 `disable-model-invocation: true`
- 技能目录（含 `SKILL.md` 的目录）深度不得超过 `skills/<cat>/<cat>/<name>/`（CLI 发现规则上限）；目录内的辅助文件不受此限

## 相关文档

- 维护规范与迁移计划：`docs/specs/powershell-portability-and-maintenance.md`
- 仓库协作约定：`AGENTS.md`、`docs/agents/`