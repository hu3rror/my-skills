---
disable-model-invocation: true
name: npm-release
description: Sets up npm package release automation — a GitHub Actions publish workflow that publishes to npmjs on tag push, authenticated via npmjs Trusted Publisher (OIDC, zero tokens, provenance auto-generated). Supports two flows, direct by default: direct publish (tag push releases immediately) or staged publish (CI stages, maintainer approves with 2FA). Use when the user asks to automate npm publishing, add a release/publish workflow (publish.yml), configure trusted publishing / npm stage / OIDC publish, or set up tag-push CI publishing for an npm package.
---

# npm 包自动发布(Trusted Publisher + GitHub Actions)

为 npm 包项目落地"push v* 标签 → 自动发布到 npmjs"的发布工作流。认证走 npmjs.com 的 **Trusted Publisher(OIDC)**:workflow 内**零 token、零 secret**,并自动生成 provenance。本 skill 备两套发布流:**直接流**(tag push 即发布,无人工闸门,**默认**)与 **暂存流**(CI 暂存,维护者本地 `npm stage approve` 2FA 放行,按仓库约定选用)。

## 执行须知(重要,先读)

npm 发布链路里有几步一旦执行就不可逆(`git push --tags`、`npm publish`、`npm stage approve`),而排查一次 401/403 往往要来回改 workflow、重新绑定 Trusted Publisher、重新 tag,比多花十秒核对便宜得多。所以本 skill 的每一步都按"先核对、再执行"的顺序写,执行前务必做到:

- **每个"完成判据"都要用命令的实际输出核对,不要凭上一步的记忆判断"应该没问题"。** 例如步骤 1 摸底完的每一项,都应该是刚跑完对应命令、亲眼看到输出后填的值,而不是根据文件名或项目类型推测的。
- **命令与旗标只从本 skill 正文、[references/workflow-template.yml](references/workflow-template.yml)、[references/workflow-template-staged.yml](references/workflow-template-staged.yml)、[references/troubleshooting.md](references/troubleshooting.md) 里取,不要凭印象改写或补充(尤其是 `npm stage` 子命令和 `gh` 参数)。** 这两个工具改动较快,凭记忆拼出的旗标很容易是过时或不存在的;不确定时先 `npm stage --help` / `npm publish --help` / `gh release create --help` 核实存在,再使用。
- **git push / npm publish / npm stage approve 这类不可逆操作前,先把"我即将执行 X,因为 Y"说给用户听一遍,拿到当轮的明确授权再动手**,不要因为前面步骤顺利就自动往下推进到发布。
- 遇到报错时,先去 [references/troubleshooting.md](references/troubleshooting.md) 按症状查,不要凭经验改一个旗标就重试——同一条错误往往有好几种表面相似但处理方式不同的原因(比如 401 既可能是 token 权限边界,也可能是 workflow 文件名不匹配)。

## 步骤

### 1. 摸底
**完成判据**:下面每一项都已实际执行对应命令并记下输出,而不是靠猜测填的。
逐项核对:
- `cat package.json`:name / version / repository 字段 / files / scripts(有无 `test`、根目录有无 `package-lock.json`)
- `gh repo view --json visibility`:仓库可见性(provenance 需要 public)
- `npm view <name> version`:包是否已存在于 npm(决定是否触发"新包首发"例外,见"定制点"与故障排查里的"新包首发")
- `ls .github/workflows/`:CI 现状,是否已有同名 workflow 会冲突
- 读 `package.json` 的 `scripts.test`(以及它调用到的构建脚本):是否依赖 Windows PowerShell / `System.Drawing` 等平台特性,决定步骤 4 的 `runs-on`

### 2. 确认发布方式
**完成判据**:用户明确确认用哪一套。
默认**直接流**。仅当项目 AGENTS.md 明确要求"发布由维护者亲自执行/人工闸门"时选**暂存流**(stage)。选定后记入步骤 8 的项目文档;从暂存流切到直接流(或反之)需用户明确同意并同步步骤 8。

### 3. 配置 Trusted Publisher(仅用户可做)
**完成判据**:用户确认在 npmjs.com 配置完成。
给用户列出操作,不代操作:
- 前置:包已存在于 registry、仓库公开
- npmjs.com → 包 Access → Publishing access → Trusted publishers,绑定仓库 owner/repo + **workflow 文件名(必须与步骤 4 生成的文件名一致,如 `publish.yml`)**
- **Allowed actions 按所选流核对**(npmjs 把 `npm stage publish` 与 `npm publish` 设为独立权限):直接流需勾选 Allow npm publish,否则 CI 直接发布会 401/403(见 troubleshooting「Trusted Publisher 未允许直接发布」);暂存流下 `npm stage publish` 恒允许,无需额外勾选

### 4. 生成 publish.yml
**完成判据**:文件就位且每个定制点已核对。
按步骤 2 选定的流复制对应模板到 `.github/workflows/`:**直接流**用 [references/workflow-template.yml](references/workflow-template.yml),**暂存流**用 [references/workflow-template-staged.yml](references/workflow-template-staged.yml),按"定制点"逐项调整。两模板除发布步骤与 permissions 外结构一致。

### 5. 本地验证
**完成判据**:项目测试全绿(workflow 含测试步骤时);无测试则跳过并在交付说明中注明。
检查构建脚本路径探测是否可移植(`os.homedir()` 而非 `USERPROFILE`,否则 Linux runner 崩溃——见 [references/troubleshooting.md](references/troubleshooting.md))。

### 6. 演练
**完成判据**:一次 tag push 跑通到发布/暂存,且用 `gh run view` 的实际输出确认成功(不是"应该跑完了")。
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
6. **直接流**:确认 `npm publish` 成功(run 结束后第 5 步已扫过 `--log-failed`)再 `npm view <name> version` 核实新版本已可见。**暂存流**:从日志取 stage-id——`gh run view <id> --log | Select-String "staged with id"`,行格式 `+ <name>@<version> (staged with id <uuid>)`;stage-id 交付给用户,approve/reject 由用户本人执行(见"后续人工步骤",需 2FA)。

### 7. 发布说明(Release Notes)
**完成判据**:GitHub Release 里有分类整理过的说明,而不只是 `gh release create --generate-notes` 生成的 `Full Changelog: vX...vY` 一行比较链接。
按 [write-release-notes](../write-release-notes/SKILL.md) skill 写发布说明:素材、分类模板、create/edit、验证都在那里,版本号直接用步骤 6 bump 出的 vX.Y.Z。npm 差异就一条:**直接流**下 workflow 已建占位 Release(`--generate-notes`),步骤 6 发布成功后用 `gh release edit` 覆盖为分类说明即可;**暂存流**下 workflow 不建 Release,维护者 approve 发布后由 agent 手动 `gh release create`。仓库若约定不建 Release,跳过与否按 write-release-notes 步骤 1 的仓库约定检查执行。

### 8. 沉淀
**完成判据**:AGENTS.md 发布约定与相关文档已同步。
更新 AGENTS.md 发布约定段:触发条件、谁负责 bump/tag/push、发布闸门(直接流全自动 / 暂存流 approve 2FA)、错误回滚(直接流 `npm unpublish <version>`,72 小时内可撤回,超期用 `npm deprecate`;暂存流 `npm stage reject` 发布前可撤回)、发布说明由 agent 在步骤 7 撰写(而非只依赖 CI 自动生成)。仓库有 GLOSSARY.md 等领域文档时补发布流词条。

## 定制点

生成 workflow 时逐项核对:
- **触发 tag 模式**:仓库约定(如 `v*`)与 package.json version 的对应;保留模板内 tag↔版本一致性校验
- **node 版本**:setup-node `node-version`;模板默认 Node 24(LTS,自带 npm ≥ 11.17)。**暂存流**需 npm 11.15.0+(官方要求,Node 22 系只带 npm 10 不满足);**直接流**无 npm 11 门槛(provenance 需 npm 9.5.0+)
- **runner**:默认 `ubuntu-latest`;测试依赖 Windows 特性(PowerShell/System.Drawing)时 `windows-latest`
- **依赖安装**:有 `package-lock.json` 用 `npm ci`,无则 `npm install`
- **测试命令**:有测试则在 workflow 内跑;构建脚本需工具路径时在该 step 加 env(如 `PI_ESBUILD_DIR`)
- **认证**:Trusted Publishing 下零 token(setup-node v7 起不再注入 dummy `NODE_AUTH_TOKEN`,OIDC 流更干净);仅当项目坚持 GAT token 认证时才需要 `NODE_AUTH_TOKEN` env + secret
- **发布说明**:直接流模板保留 `gh release create --generate-notes` 兜底步骤;暂存流模板不建(发布前版本未真正发布),approve 后由 agent 手动 `gh release create`。正式分类说明按步骤 7 撰写,用 `gh release edit` 覆盖占位内容

## 后续人工步骤(暂存流)

```bash
npm stage download <stage-id>   # 可选:发布前检查 tarball
npm stage approve <stage-id>    # 2FA 后真正发布
npm stage reject <stage-id>     # 错误暂存回滚
```


## Related skills

- **my-pi-extension-maintenance** — 当本次发布是为了发布一次 pi SDK 同步(版本对齐/镜像语义跟进)时,验收要点(行为变化无法避免时才需用户确认、README 兼容性说明)在 maintenance skill 里;发布前先用它核对改动是否齐整。SDK 同步/类型修复类发布默认 patch(semver 三问见步骤 6)。
