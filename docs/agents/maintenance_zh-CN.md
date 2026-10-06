# my-skills 维护指南（中文）

> 本聚合仓库的**日常运行手册**——人类或代理查“怎么验证 / 每种场景该做什么”的单一入口。各处单一事实源只引用不复制：逐补丁记录规范在 `patches/README.md`，可度量预算在 `docs/maintenance-budget.md`，关 issue 约定在 `docs/agents/issue-tracker.md`，设计决策在 `docs/adr/`。
>
> 你既可按下方命令手动操作，也可直接对代理说「同步 / 回收游离技能 / 记这笔补丁 / 查 freshness / 分发」——统一技能 `my-skills-maintenance` 按分支执行同一套流程，默认只读，一切写入前先征求你确认。
>
> 英文版：`docs/agents/maintenance.md`。

## 1. 健康检查 / 验证 — 相信一个状态前先跑

一套轻量本地命令，加一手补丁记录的机器验证：

```bash
# (a) 全量脚本套件：fixture 测试 + 维护预算守卫 + 技能卫生
node --test scripts/*.test.mjs            # 期望：全部通过（85 个测试）

# (b) 补丁记录验证器 —— map #18 的核心验收：每条 diff 记录都必须能从
#     其 pin 的 upstream blob 逐字节重建（需联网，克隆上游抓 pin）
node scripts/verify-patch-records.mjs     # 期望：ALL CHECKS PASS，退出码 0

# (c) 两个干跑 —— 任何维护动作之后的回读闸
node scripts/vendor-sync.mjs --dry-run    # 期望 changed:false，无 patchedDiffers/patchedRemoved/missing
node scripts/consolidate-strays.mjs       # 期望 0 new stray, 0 modified stray
```

**何时跑**：改过 `scripts/` 或 `patches/` 里任何文件→`(a)`；写/改过补丁记录或 `vendor/*.json` 的 pin→`(b)`；每次 sync / 回收 / bump pin 结束、提 commit 前→`(c)`。CI（`script-tests.yml`）已随每次 push 跑 `(a)` 与 `(b)`——本地这一套是给「提交前」用的。

## 2. 各场景维护流程

| 场景 | 流程 |
|---|---|
| **上游有更新**（每日 CI freshness 已开 `pending-update` issue） | 跑 `node scripts/vendor-sync.mjs --dry-run` 分类 → `node scripts/vendor-sync.mjs`（真实 sync；绝不碰补丁文件、绝不删除）→ 对每个被上游改过的补丁文件跑 `node scripts/vendor-sync.mjs merge`（只写干净且补丁存活的合并）→ 把 `vendor/<source>.json` 的 pin bump 到实际合并所用的 commit → 重新验证（上述电池）→ 提 commit / push / close 该 pending-update issue。 |
| **新增 / 变形 / 被上游采纳一笔补丁** | 在 `patches/<source>/` 写或更新记录（格式见 `patches/README.md`；同一文件的多条记录用 `after:` DAG 编排），随后 `node scripts/verify-patch-records.mjs` 是唯一检查。 |
| **本地改过技能（stray）** | 下次分发前先跑 stray 干跑；modified stray 必须先把偏差记为逐补丁记录再覆盖 copy（record-first，ADR-0002）——技能的 `stray-recovery` 分支按序执行。 |
| **重设某来源的 pin / 排除项** | 改 `vendor/<source>.json`（单一数据源——是数据，不是代码）。 |
| **往 store 加 / 退役技能** | `my-skills-maintenance` → `distribute` 分支；CLI 固定版本（`npx skills@1.7.0`）。退役 = `git rm` 仓库副本 **并** `npx skills remove -g <name>`（仅删仓库不会清掉 store）。 |
| **提高维护预算** | 改 `scripts/maintenance-budget.test.mjs` 的 `CODE_TESTS_BUDGET` **并** 在 `docs/maintenance-budget.md` 记日期 + 理由（ADR-0007）——只涨不记视为 review 缺陷。 |

## 3. 常用 CLI

```bash
# 预演 / 真实同步
node scripts/vendor-sync.mjs --dry-run
node scripts/vendor-sync.mjs

# 对被上游改动的补丁文件做三方合并
node scripts/vendor-sync.mjs merge

# 游离技能回收（默认 dry-run；apply 某个新 stray）
node scripts/consolidate-strays.mjs
node scripts/consolidate-strays.mjs --apply <name> [--to self]

# 分发到 canonical store（~/.agents/skills）——固定版本
npx skills@1.7.0 add hu3rror/my-skills -a universal -s '*' -g -y
```

## 4. 走统一技能而非手敲

对 `my-skills-maintenance` 说一句普通请求即可：「同步这个仓库」「回收游离技能」「记这笔补丁」「查 freshness」「分发 / 退役某个技能」。Router 会：
- 恒先跑只读 stray 干跑；
- 按请求加载五条已披露分支之一（`vendor-sync` / `stray-recovery` / `patch-record` / `freshness` / `distribute`）执行；
- 对一切远程 / 破坏性写（git push、gh issue 操作、store 变更）先提方案，等你确认。

## 5. 备注与诚实坑点

- **store 侧的技能变更永远不会出现在仓库树里。** 退役技能到 store 是一次实时的 `npx skills remove`，无法提交。若你依赖干净的 `consolidate-strays` 报告（`0 stray`），任何 store 变更后都要重跑该干跑。
- **行为型补丁记录（`patches/self/`）里的「人工重跑」配方不受 CI 覆盖**——静态断言是 CI 的，命令行人工重跑不是。改过某个行为型记录的目标文件时，请人工重跑一次。
- **已知 feature gap（早已存在，非本次迁移引入）**：ADR-0007 的决策描述了 vendor-sync 在干净 sync 时自动 bump pin，脚本目前尚未实现——pin 仍按 vendor-sync 流程手动改 JSON。在那之前「一条命令 + 一条 check」是目标而非现状（干净 sync 现在为：sync → bump pin → dry-run 读 `changed=false`）。
- **编码**：本仓库涉及中文（README_zh-CN.md、中文摘要评论）。Windows Git Bash 下读写中文前，用 `zh-encoding` 技能保证 Unicode 语义正确。

---

## 相关

- 记录格式规范：`patches/README.md`
- 预算口径与提升规则：`docs/maintenance-budget.md`
- 关 issue 约定：`docs/agents/issue-tracker.md`
- 设计决策：`docs/adr/`