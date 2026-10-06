# my-skills 维护指南（中文）

本聚合仓库的**单一维护手册**。**要维护，直接调技能 `my-skills-maintenance`**——它自动选分支、默认只读、一切写入前先征求确认。想手敲命令也行，下面都有。

各单点事实源只引用不复制：记录格式 `patches/README.md`，预算 `docs/maintenance-budget.md`，关 issue 约定 `docs/agents/issue-tracker.md`，设计决策见 `docs/adr/`。

## 适用范围

`my-skills-maintenance` 是**仓库维护流程的唯一入口**（五条分支），替代了 `consolidate-strays` + `my-skills-vendor-sync`。它**不**替代其它技能：写技能正文时加载独立的参考技能 `writing-for-agents`，日常技能（web、debug、发布说明……）一律不受影响。

## 1. 使用 — 说一句，进分支

| 你说 | 分支 | 它做什么 | 结束标志 |
|---|---|---|---|
| 「同步这个仓库」/「处理 pending update」 | vendor-sync | dry-run 分类 → sync → 三方合并补丁文件 → bump pin → 验证 | dry-run 读 `changed=false`，pending issue 关闭 |
| 「回收游离技能」/「consolidate」 | stray-recovery | 扫描 → 采纳 new stray → modified 先记补丁再覆盖 | `0 new stray, 0 modified stray` |
| 「记这笔补丁」 | patch-record | 在 `patches/<source>/` 写/改记录 → 验证 | 验证器 `ALL CHECKS PASS` |
| 「查 freshness」/ 关 stale 的 pending issue | freshness | 读 + 重推导 pending 状态；关闭已过期的 | 得到准确、最新的待办图景 |
| 「分发」/「退役某个技能」 | distribute | 对 store 做 `npx skills@` add/remove | store 与 lock 与仓库一致 |

所有分支：先跑只读 stray 干跑；结束时统一提「commit → push → 关 issue / 分发」；远程或破坏性写一律先等你确认。

## 2. 验证

```bash
node --test scripts/*.test.mjs            # 期望：全部通过
node scripts/verify-patch-records.mjs     # 期望：ALL CHECKS PASS（需联网）
node scripts/vendor-sync.mjs --dry-run    # 期望：changed:false，无待处理
node scripts/consolidate-strays.mjs       # 期望：0 new stray, 0 modified stray
```

CI（`script-tests.yml`）已在每次 push 跑前两条——本地这套是**提交前**自查。动过 `scripts/`、`patches/`、`vendor/*.json` 或任何 `skills/` 内容后就跑它。

## 3. 备注

- **store 侧的变更永远不进仓库树。** 退役技能是一次实时的 `npx skills remove`；任何 store 变更后请重跑 stray 干跑。
- **行为型补丁记录的「人工重跑」配方不受 CI 覆盖**——CI 只跑静态断言。
- **提高预算是有意动作**：改 `CODE_TESTS_BUDGET` 并在 `docs/maintenance-budget.md` 记日期+理由（ADR-0007）。
- **干净 sync 自动 bump pin 是已知缺口**（ADR-0007 的目标，代码未实现）：目前仍按 sync 分支手动改 pin。

## 相关

- 记录格式：`patches/README.md` · 预算：`docs/maintenance-budget.md`
- 设计决策：`docs/adr/` · 关 issue 约定：`docs/agents/issue-tracker.md`
- 英文版：`docs/agents/maintenance.md`