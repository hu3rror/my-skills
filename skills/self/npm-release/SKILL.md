---
disable-model-invocation: true
name: npm-release
description: Sets up npm package release automation — a GitHub Actions publish workflow that stages or publishes to npmjs on tag push, authenticated via npmjs Trusted Publisher (OIDC, zero tokens, provenance auto-generated). Supports staged publishing (CI stages, maintainer approves with 2FA) or direct publish. Use when the user asks to automate npm publishing, add a release/publish workflow (publish.yml), configure trusted publishing / npm stage / OIDC publish, or set up tag-push CI publishing for an npm package.
---

# npm 包自动发布(Trusted Publisher + GitHub Actions)

为 npm 包项目落地"push v* 标签 → 自动发布到 npmjs"的发布工作流。认证走 npmjs.com 的 **Trusted Publisher(OIDC)**:workflow 内**零 token、零 secret**,并自动生成 provenance。`npm stage publish` 需 npm 11+(Node 24 自带)。

## 执行须知(重要,先读)

npm 发布链路里有几步一旦执行就不可逆(`git push --tags`、`npm publish`、`npm stage approve`),而排查一次 401/403 往往要来回改 workflow、重新绑定 Trusted Publisher、重新 tag,比多花十秒核对便宜得多。所以本 skill 的每一步都按"先核对、再执行"的顺序写,执行前务必做到:

- **每个"完成判据"都要用命令的实际输出核对,不要凭上一步的记忆判断"应该没问题"。** 例如步骤 1 摸底完的每一项,都应该是刚跑完对应命令、亲眼看到输出后填的值,而不是根据文件名或项目类型推测的。
- **命令与旗标只从本 skill 正文、[references/workflow-template.yml](references/workflow-template.yml)、[references/troubleshooting.md](references/troubleshooting.md) 里取,不要凭印象改写或补充(尤其是 `npm stage` 子命令和 `gh` 参数)。** 这两个工具改动较快,凭记忆拼出的旗标很容易是过时或不存在的;不确定时先 `npm stage --help` / `gh release create --help` 核实存在,再使用。
- **git push / npm publish / npm stage approve 这类不可逆操作前,先把"我即将执行 X,因为 Y"说给用户听一遍,拿到当轮的明确授权再动手**,不要因为前面步骤顺利就自动往下推进到发布。
- 遇到报错时,先去 [references/troubleshooting.md](references/troubleshooting.md) 按症状查,不要凭经验改一个旗标就重试——同一条错误往往有好几种表面相似但处理方式不同的原因(比如 401 既可能是 token 权限边界,也可能是 workflow 文件名不匹配)。

## 模式选择(先定,再动手)

| | A. 暂存流(staged publishing) | B. 直接流 |
|---|---|---|
| CI 动作 | `npm stage publish --provenance` | `npm publish --provenance` |
| 发布闸门 | 维护者本地 `npm stage approve <stage-id>`(2FA) | 无(OIDC 仓库所有权即信任) |
| 适合 | 团队约定"发布由维护者亲自执行" | 全自动、tag push 即发布可接受 |

默认 A。用户明确要求全自动才选 B。决策后记入步骤 8 的项目文档。

## 步骤

### 1. 摸底
**完成判据**:下面每一项都已实际执行对应命令并记下输出,而不是靠猜测填的。
逐项核对:
- `cat package.json`:name / version / repository 字段 / files / scripts(有无 `test`、根目录有无 `package-lock.json`)
- `gh repo view --json visibility`:仓库可见性(provenance 需要 public)
- `npm view <name> version`:包是否已存在于 npm(决定能不能走 stage 流,见"定制点"与故障排查里的"新包首发")
- `ls .github/workflows/`:CI 现状,是否已有同名 workflow 会冲突
- 读 `package.json` 的 `scripts.test`(以及它调用到的构建脚本):是否依赖 Windows PowerShell / `System.Drawing` 等平台特性,决定步骤 4 的 `runs-on`

### 2. 决策模式
**完成判据**:用户明确确认 A 或 B。
按上表与用户确认。若项目 AGENTS.md 已有"发布由维护者执行"类约定,选 A 并在步骤 8 同步。

### 3. 配置 Trusted Publisher(仅用户可做)
**完成判据**:用户确认在 npmjs.com 配置完成。
给用户列出操作,不代操作:
- 前置:包已存在于 registry、仓库公开、npm 账号已开 2FA(approve 需要)
- npmjs.com → 包 Access → Publishing access → Trusted publishers,绑定仓库 owner/repo + **workflow 文件名(必须与步骤 4 生成的文件名一致,如 `publish.yml`)**

### 4. 生成 publish.yml
**完成判据**:文件就位且每个定制点已核对。
复制 [references/workflow-template.yml](references/workflow-template.yml) 到 `.github/workflows/`,按"定制点"逐项调整,并按步骤 2 选定的模式保留 `npm stage publish` 或改 `npm publish`。

### 5. 本地验证
**完成判据**:项目测试全绿(workflow 含测试步骤时);无测试则跳过并在交付说明中注明。
检查构建脚本路径探测是否可移植(`os.homedir()` 而非 `USERPROFILE`,否则 Linux runner 崩溃——见 [references/troubleshooting.md](references/troubleshooting.md))。

### 6. 演练
**完成判据**:一次 tag push 跑通到暂存/发布,且用 `gh run view` 的实际输出确认成功(不是"应该跑完了")。
1. **定版本号,再 bump。** semver 三问逐条过,档位由结论推出:
   - **破坏?**调用方依赖的契约被改(tool/command 的参数、schema、`details` 形状,或移除了什么)→ major;
   - **新能力?**调用方能调起以前调不起的东西(新 tool/command/参数/schema/入口)→ minor;
   - **都不是 → patch**。修复错误信号、类型对齐、纯内部重构都算 patch——把行为修对正是 patch 的语义;SDK 对齐(sync)类发布默认 patch。
   把"档位 + 一句话理由"陈述给用户(push 授权同轮即可),再改 `package.json` version。
   **完成判据**:档位与三问结论一致且已陈述给用户。
2. bump 版本(`package.json` version)→ commit。多行 commit message 用 `git commit -F <临时文件>` 提交(PowerShell 双引号会拆坏内嵌引号/换行的多行消息);`gh` 的 `--json` + jq 过滤器在 PowerShell 里用单引号包裹,避免 `"` 转义问题。
3. **查既有 tag 是否签名**(`git for-each-ref refs/tags/<上一版本tag> --format="%(contents:signature)"`,非空即签名):既有 tag 签名时直接 `git tag -a vX.Y.Z -m "vX.Y.Z"`(gpg-agent 缓存了 passphrase 时能直接成功,失败超时按故障排查处理);既有 tag 未签名时用 `git -c tag.gpgsign=false tag -a vX.Y.Z -m "vX.Y.Z"` 保持一致。
4. **push 前先向用户复述一句**"即将 push `main` 分支 + tag `vX.Y.Z`,会触发发布 workflow",拿到当轮授权后再执行:`git push origin main` + `git push origin refs/tags/vX.Y.Z`(push 属受限操作)。
5. `gh run watch` 跟随本次 run,run 结束后额外 `gh run view --log-failed`(即使显示成功也建议扫一眼,确认没有静默跳过的 step)。
6. A 流:从日志里的 `npm stage publish` 输出取 stage-id——`gh run view <id> --log | Select-String "staged with id"`,行格式 `+ <name>@<version> (staged with id <uuid>)`;stage-id 交付给用户,approve/reject 由用户本人执行(见"后续人工步骤",需 2FA)。B 流:确认 `npm publish` 成功,`npm view <name> version` 核实新版本已可见。

### 7. 发布说明(Release Notes)
**完成判据**:GitHub Release 里有分类整理过的说明,而不只是 `gh release create --generate-notes` 生成的 `Full Changelog: vX...vY` 一行比较链接。
**先问仓库约定**:不少仓库只是 tag + npm 暂存、**从不建 GitHub Release**(`gh release list` 为空或历史版本无 release)——这种仓库按约定跳过本步骤,不要自作主张建 release;只有用户确认要 release(或仓库已有惯例)才执行下面流程。
`--generate-notes` 只是"有没有发布说明"的兜底,不是"发布说明写得够不够好"——它不理解变更的语义,只会拼 PR 标题或 commit 列表。这一步需要 agent 自己读一遍改动、按用户能看懂的方式分类总结:
1. `git log <上一个 tag>..HEAD --oneline` 拿到本次改动的提交列表;仓库用 PR 合并的话再 `gh pr list --state merged --search "merged:>=<上次发布日期>"` 补充 PR 描述作为素材。
2. 按 [references/release-notes-guide.md](references/release-notes-guide.md) 的模板分类整理(Features / Fixes / Docs-Chore / Breaking Changes),每条都写清"对用户来说变了什么",不要直接堆 commit 标题。
3. 写成本地文件(如 `/tmp/release-notes-vX.Y.Z.md`),`gh release view vX.Y.Z` 看看步骤 6 的 workflow 有没有已经建了 release:
   - 没有 → `gh release create vX.Y.Z --title vX.Y.Z --notes-file /tmp/release-notes-vX.Y.Z.md`
   - 已有(如 workflow 里带了兜底的 `--generate-notes` 步骤)→ `gh release edit vX.Y.Z --notes-file /tmp/release-notes-vX.Y.Z.md`
4. `gh release view vX.Y.Z` 确认发布说明已经是整理过的版本,不是原始的 compare 链接。

### 8. 沉淀
**完成判据**:AGENTS.md 发布约定与相关文档已同步。
更新 AGENTS.md 发布约定段:触发条件、谁负责 bump/tag/push、发布闸门(A 流 approve 2FA / B 流全自动)、错误回滚(`npm stage reject`)、发布说明由 agent 在步骤 7 撰写(而非只依赖 CI 自动生成)。仓库有 CONTEXT.md 等领域文档时补发布流词条。

## 定制点

生成 workflow 时逐项核对:
- **触发 tag 模式**:仓库约定(如 `v*`)与 package.json version 的对应;保留模板内 tag↔版本一致性校验
- **node 版本**:setup-node `node-version`;npm stage 需 npm 11+,Node 24 自带 npm 11
- **runner**:默认 `ubuntu-latest`;测试依赖 Windows 特性(PowerShell/System.Drawing)时 `windows-latest`
- **依赖安装**:有 `package-lock.json` 用 `npm ci`,无则 `npm install`
- **测试命令**:有测试则在 workflow 内跑;构建脚本需工具路径时在该 step 加 env(如 `PI_ESBUILD_DIR`)
- **认证**:Trusted Publishing 下零 token;仅当项目坚持 GAT token 认证时才需要 `NODE_AUTH_TOKEN` env + secret
- **发布说明**:workflow 可保留 `gh release create --generate-notes` 兜底步骤;正式分类说明按步骤 7 撰写,用 `gh release edit` 覆盖占位内容

## 后续人工步骤(A 流)

```bash
npm stage download <stage-id>   # 可选:发布前检查 tarball
npm stage approve <stage-id>    # 2FA 后真正发布
npm stage reject <stage-id>     # 错误暂存回滚
```

## Related skills

- **pi-extension-sync** — 当本次发布是为了发布一次 pi SDK 同步(版本对齐/镜像语义跟进)时,验收要点(行为级改动都需用户签过字、README 兼容性说明、ADR)在 sync skill 里;发布前先用它核对改动是否齐整。SDK 同步/类型修复类发布默认 patch(semver 三问见步骤 6)。
