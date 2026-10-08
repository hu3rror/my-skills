# npm 发布工作流:故障排查(实战沉淀)

每条按"症状 → 原因 → 处理"组织。首次接入发布工作流时,先在演练阶段对照本清单。

## OIDC 短期 token 权限边界

- **症状**:CI 里 `npm publish` 成功,但同一 workflow 中其他 npm 操作(如 `npm unpublish` / `npm deprecate` / `npm access`)报认证失败。
- **原因**:Trusted Publisher 签发的短期 OIDC token 只能用于发布类操作(`npm publish`、`npm stage publish`、dist-tag 操作);其余 npm 命令(含暂存流的 `npm stage approve` / `reject` / `list` / `view`)需要真实登录态(本地 `npm login` 或持久的 GAT token),approve/reject 还需 2FA。
- **处理**:workflow 内只放发布动作;回滚、弃用、权限管理等操作由维护者本地执行。

## workflow 文件名与 npmjs 配置不匹配

- **症状**:CI 里 `npm stage publish` / `npm publish` 报 401 或 403,本地却正常。
- **原因**:npmjs.com Trusted Publisher 按仓库 + **workflow 文件名**精确匹配(如 `publish.yml`)。
- **处理**:workflow 文件名与 npmjs.com 配置保持一致;改名后需回 npmjs.com 重新配置。

## Trusted Publisher 未允许直接发布

- **症状**:CI `npm publish` 报 401/403,本地 `npm login` 后正常;或 workflow 此前走 stage 成功、改成直接发布后 403。
- **原因**:npmjs 的 Trusted Publisher 配置里 `npm stage publish` 与 `npm publish` 是**独立权限**(Allowed actions);只允许前者时,CI 的 OIDC 身份能 stage 但不能直接发布。workflow 文件名不匹配也会报同类错误(见上一条)。
- **处理**:npmjs.com → 包 → Settings → Trusted publishing → 编辑该配置 → 勾选 Allow npm publish(仅用户可操作,agent 不代操作);workflow 无需改动。

## npm ci 失败:缺少 lockfile

- **症状**:`npm ci` 报 lockfile 缺失。
- **处理**:仓库没有 `package-lock.json` 时改用 `npm install`(或先提交 lockfile 再切回 `npm ci`)。

## provenance 生成失败

- **前置条件**(全满足才生成):npm CLI 9.5.0+、仓库公开、`package.json` 的 `repository` 字段匹配(大小写敏感)、workflow 有 `permissions: id-token: write`、运行在 GitHub-hosted runner。
- **处理**:Trusted Publishing 下 provenance 自动生成,**无需** `--provenance` 旗标;显式传旗标亦无冲突。某一步前置不满足时去掉旗标或修前置。

## Linux runner 上构建脚本崩溃

- **症状**:测试/打包脚本在 ubuntu runner 报 `TypeError: Path must be a string`,本地 Windows 正常。
- **原因**:脚本用 `process.env.USERPROFILE` 拼路径,Linux 上该变量为空,`path.join(undefined, ...)` 直接抛错(数组字面量构造时即崩)。
- **处理**:改用 `os.homedir()`;工具路径通过 env 注入(如 `PI_ESBUILD_DIR`)。

## tag 签名超时(tag.gpgsign=true)

- **症状**:`git tag -a` 报 `gpg: signing failed: Timeout`,留下 `.git/TAG_EDITMSG`。
- **原因**:gpg-agent 弹窗等待 passphrase,无人输入超时。
- **处理**:先查既有 tag 是否签名(`git for-each-ref refs/tags/<上一版本tag> --format="%(contents:signature)"`,非空即签名):
  - 既有 tag **已签名**(多数个人仓库):直接 `git tag -a vX.Y.Z -m "vX.Y.Z"`——gpg-agent 缓存了 passphrase 时能直接成功;若超时说明 passphrase 未缓存,要么让用户在本机亲自打 tag(输入 passphrase),要么明确请示用户后以 `git -c tag.gpgsign=false` 打破惯例并说明原因。agent 无法代输 passphrase。
  - 既有 tag **未签名**:用 `git -c tag.gpgsign=false tag -a vX.Y.Z -m "vX.Y.Z"` 保持一致。
  - 超时后清理残留的 `.git/TAG_EDITMSG`(避免下次 `git tag -a` 读到半截消息)。

## 发布报版本已存在

- **症状**:`npm publish` 拒绝,提示版本已存在。
- **原因**:已发布版本占用 semver 唯一索引,同一版本号不能重复发布;之前 stage 流遗留的暂存版本(staged 但未 approve)同样占用该索引。
- **处理**:换新版本号。遗留暂存需维护者本地 `npm stage list` 查看、`npm stage approve` / `npm stage reject` 清理(需本地登录态,见「OIDC 短期 token 权限边界」)。

## 新包首发:CI 发不了不存在的包

- **症状**:CI `npm publish --provenance` 先报 `EUSAGE ... you must set access to public`(缺 `publishConfig.access: "public"`);补上后报 `404 Not Found - PUT registry.npmjs.org/<name>`。
- **原因**:Trusted Publisher 按「已存在的包」绑定,首次发布时包不存在,CI 的 OIDC 身份对不存在的包没有建包权限——OIDC 只能发布已绑定 trusted publisher 的包的新版本。对比:本地 `npm stage publish` 现已支持新包,但会产生公开的 placeholder 版本 `0.0.0-stage`,且 TP 绑定仍要求包已存在,CI 场景不受益。
- **处理**:首发由维护者本地 `npm login` + `npm publish`(配 `publishConfig.access: "public"` 防 EUSAGE;本地发布无 provenance,可接受);随后在 npmjs.com 包页面绑定 Trusted Publisher(仓库 + workflow 文件名,Allowed actions 允许 `npm publish`);之后版本才走 CI。

## 发布后回滚(deprecate / unpublish)

- **症状**:tag push 已直接发布,发现版本有问题需要撤回。
- **处理**:72 小时内可 `npm unpublish <version>`(已有使用方依赖时慎用);超期或已有人安装用 `npm deprecate <pkg>@<version> <message>` 标记弃用。两者都需要本地登录态(OIDC token 只够发布,见「OIDC 短期 token 权限边界」)。对比暂存流:`npm stage reject` 在发布前可无副作用撤回,直接流没有这个窗口——这是直接发布的主要代价。

## npm 版本不够新(暂存流)

- **症状**:`npm stage` 不是有效命令。
- **原因**:`npm stage publish` 需 npm CLI 11.15.0+ / Node 22.14.0+(官方要求;npm 11.15.0 于 2026-05 发布)。Node 24.19+ 自带 npm ≥ 11.17 满足;Node 22 系只带 npm 10,不满足。
- **处理**:setup-node 指定 `node-version: 24` 或更高;老 Node 环境经 `npx npm@latest` 调用。

## stage 前置不满足(暂存流)

- **症状**:`npm stage publish` 拒绝,提示包不存在或无写权限。
- **原因**:暂存流要求包**已存在于 registry**、账号对该包有写权限。
- **处理**:首次发布(包从未上过 npm)不适用暂存流,按「新包首发」条目处理(维护者本地发布后绑定 Trusted Publisher)。
