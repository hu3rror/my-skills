---
name: write-release-notes
description: "Write GitHub Release notes for a just-tagged version and fill them in via gh (create or edit): gather material from git log + merged PRs, categorize per the template (Features / Fixes / Docs & Chore / Breaking Changes), then verify. Use when the user asks to write or publish release notes, or fill in a GitHub Release description, for an npm package or a non-npm project (desktop software)."
---

# GitHub Release 发布说明

为刚打 tag 的版本写一份分类整理过的 GitHub Release 发布说明并写回 Release:素材 → 分类 → 落盘 → `gh release create`/`edit` → 验证。适用于任何 tag-push → GitHub Release 的项目——npm 包或非 npm 项目(桌面软件)。模板与反模式在 [references/release-notes-guide.md](references/release-notes-guide.md),本文件只定流程。

## 执行须知

发布说明直接公开发布,读者是最终用户(npm 场景是调用方开发者)。质量红线:每条都写"对读者来说变了什么",不堆 commit 标题;没有的分类整节删掉,不空占位。`gh release create`/`edit` 前先 `--help` 核实旗标,不凭记忆拼。

## 步骤

### 1. 摸底与素材
**完成判据**:素材齐备——完整提交列表、PR 上下文(若走 PR 合并)、仓库的 Release 约定已确认,且 tag 名与要发布的版本一致(桌面项目若在 manifest 里维护版本,一并核对)。
- 先确认仓库约定:这个仓库建 GitHub Release 吗?`gh release list` 为空或历史版本从无 release → 按仓库约定跳过本 skill,不要自作主张建 release。
- `git log <上一个 tag>..HEAD --oneline` 拿完整提交列表,先拿全再动笔,不要边读边写。
- 仓库走 PR 合并 → `gh pr list --state merged --search "merged:>=<上次发布日期>"` 补 PR 描述作为素材。
- 素材来源的细节按 guide 的"素材来源"节。

### 2. 分类整理
**完成判据**:每条都对读者成立(不是文件名/函数名堆砌);Breaking Changes 写了迁移方法;空分类已删。
- 按 guide 的结构模板分类(Features / Fixes / Docs & Chore / Breaking Changes)。
- 亮点段用一两句话说清"这个版本对读者来说变了什么",不是改了哪些代码。
- 修 bug 条目写清之前症状,让读者能判断是不是自己遇到的那个。

### 3. 落盘
**完成判据**:整理版说明写成本地文件(如 `$env:TEMP\release-notes-<tag>.md`)。
不要写进仓库目录——发布说明不是仓库内容,临时文件路径即可。

### 4. 写入 Release
**完成判据**:`gh release view <tag>` 确认 Release 里的说明已是整理版,不是一行 compare 链接。
- 先查 `gh release view <tag>` 是否存在:不存在 → `gh release create <tag> --title <tag> --notes-file <文件>`;已存在 → `gh release edit <tag> --notes-file <文件>`。
- 桌面 workflow 几乎总会先建好带产物的 Release,只能 edit;对已存在的 Release 用 create 会报错或建出无产物的空 Release。

### 5. 验证与收尾
**完成判据**:`gh release view <tag>` 输出确认;交付说明注明版本号、验证方式与跳过项。

## 上下文差异

- **版本来源**:版本已定,本 skill 只读 tag 名。npm 流程里版本由发布 skill 的 bump 步骤决定;桌面项目 tag 即版本。
- **create / edit 概率**:流程一律"先查再决定";桌面 workflow 几乎总会先建好带产物的 Release(→ edit),npm 仓库常从不建(→ create)。概率只影响预期,不影响流程。
- **Breaking Changes 语义**:桌面软件 = 需要用户行动的变化(系统要求提升、配置文件格式变化、移除功能);npm 包 = API 契约变化。写法见 guide 模板节。

## Related skills

- **npm-release** — npm 包发布流程的步骤 7 委托本 skill 写发布说明,版本号已由它的 bump 步骤决定。
