---
name: de-slop
description: |
  Detect and eliminate AI slop / formulaic template writing from Chinese or English text.
  检测并消除中文或英文文本中的 AI 味与模板腔。
  Triggers (en): AI slop, sounds like ChatGPT, too templated, make this more human, kill the AI voice, edit this draft, deslop, audit this for AI patterns.
  触发词 (zh): AI 味、去 AI 味、太模板化、像机器写的、去油、说人话、公文腔修改、润色、检测/扫描有没有 AI 痕迹。
  Auto-detects the language of the pasted text and loads the matching pattern library (references/patterns-zh.md or references/patterns-en.md). Use this whenever the user pastes a draft and asks for it to sound more human, or asks you to audit/flag AI-sounding writing — even if they don't use the exact word "slop".
  支持三种模式：快速改写（默认）、纯检测、深度诊断。
---

# De-slop：去 AI 味 / 模板腔消除

**判断标准**：AI 写作的问题不是"文笔差"，而是空洞的中庸、虚伪的拔高、机械的对称——读起来像模板在填空,而不是一个具体的人在讲一件具体的事。你的任务是剥离这些模板痕迹,同时不磨平作者本来的个性和锋芒。

---

## 一、语言路由

先判断用户粘贴文本的语言,再加载对应的模式库文件,不要凭记忆套用另一种语言的具体词汇黑名单(两种语言的"空词"完全不同):

- 中文文本 → 读取 `references/patterns-zh.md`
- 英文文本 → 读取 `references/patterns-en.md`
- 中英混排 → 按段落分别处理,各自对照对应文件

## 二、模式路由

| 模式 | 触发关键词示例 | 输出内容 |
|------|---------------|---------|
| **快速改写 / Quick Edit**（默认） | 改一下、去AI味、润色、优化；或直接粘贴文本无说明 | 改写后的完整正文 + 修改说明 |
| **纯检测 / Detect** | 检查一下、检测、扫描、flag、audit、does this sound AI | 仅问题清单（模式名 + 原文引用 + 一句话建议）。不改写、不打分、不判断是否由 AI 生成 |
| **深度诊断 / Full Diagnosis** | 全面诊断、体检、deep scan and rewrite、detailed teardown | 完整诊断报告：浓度评级 + 保护区确认 + 按 R1–R5 逐项定位 + 完整改写版本 + 节奏说明 |

未指定模式且提供了文本 → 默认快速改写。未提供文本 → 提示用户粘贴文本,不要臆造示例文本来演示。

## 三、核心编辑原则

1. **保护作者的原生特征**：改写前先识别词汇偏好、口语停顿、幽默、迟疑或观点锋芒。保留粗糙但真实的表达,不要为了统一风格抹平个性。
2. **最小有效修改**：只清理空话、套话、假因果和机械结构。已经自然有力的句子原样保留。
3. **事实绝对保真（硬边界）**：不得凭空捏造原文没有的人物、案例、数据或引用；观点文本可以激发作者原有的态度,但不得在客观说明文/技术文档里强行加戏。
4. **具体胜过抽象**：抽象词必须落地成事实,例如"显著提升了效率"→"部署时间从 40 分钟缩短到 4 分钟"。**可迁移测试**：如果一句话换到任何公司、产品、话题下依然成立,它就是废话,直接删除或换成具体信息。
5. **动词驱动**：把名词化结构改回动词,例如"对系统进行优化"→"优化系统","has the capability to"→"can"。

## 四、声音保护区（Voice Sanctuary）

改写前先划定保护区,保护区内的句子一字不动:

1. **用户明确要求保留的句子**
2. **口头禅 / 标志性表达**：自然重复出现且不是作为套话开头的口语习惯（如反复出现的"说实话"）
3. **具体锚定的真实情绪**：与具体场景绑定的细节（如"看到那个数字时,我手停在半空"）
4. **真人不完美痕迹**：自然的自我纠正、语流停顿、真诚的迟疑

## 五、五大根源（R1–R5）

所有 AI 味模式都归入以下五类;具体的中/英文词汇和例句在各自的 `references/patterns-*.md` 里,每条都标注了所属根源。诊断和改写时按这五类逐一过一遍,而不是逐句凭感觉找。

| 根源 | 定义 | 典型症状 |
|------|------|---------|
| **R1 — 空洞拔高与套路化客套** | 没有实质内容的开场白、收尾客套、未经证实的宏大定性 | 「首先/综上所述」类结构胶水、「希望以上内容对您有所帮助」、「具有划时代意义」 |
| **R2 — 机械对称结构** | 句式/段落被结构本身而非内容驱动 | 连续排比、三段式对称、「这不仅仅是X，更是Y」、口号式升华收尾 |
| **R3 — 空词与行话** | 词汇本身不携带信息,只营造"高级感" | 「赋能/闭环/底层逻辑」、英文 `leverage/delve/robust`、被动语态与名词堆叠 |
| **R4 — 伪逻辑与假中立** | 看似在分析,实际没有真实判断 | 无实质因果的「因此/不难发现」、通篇「一方面……另一方面……」却不给结论、trailing "-ing" 假总结 |
| **R5 — 格式滥用** | 用排版制造重要感而非内容本身重要 | 正文乱加粗、多余分隔线、小标题堆砌、em dash 当节奏拐杖 |

## 六、工作流程

### 快速改写
1. 通读,提取核心信息点与作者原本语气。
2. 按第四节标出保护区。
3. 对照对应语言的 `references/patterns-*.md`,逐类清理 R1–R5 命中项;把抽象形容词换成具体事实/动作。
4. 按第七节的质检标准自查。
5. 按第八节模版输出。

### 纯检测
1. 对照 `references/patterns-*.md` 逐段排查 R1–R5 命中项。
2. 按格式列出：【根源 + 模式名】+「原文片段」+ 一句话修改建议。
3. 不改写正文,不打分,不猜测是否由某个具体模型生成。

### 深度诊断
1. **浓度评级**：粗略给出轻度/中度/重度（依据命中的根源类别数和密度,不是精确到小数点的分数)。
2. **保护区确认**：列出识别到的保护区句子。
3. **逐项定位**：按 R1–R5 分类列出命中项,每项带原文引用和修改方向。
4. **完整改写版本**。
5. **节奏与修改说明**：概述整体调整思路。

## 七、质检自查标准

改写完成后逐条自查,不满足就返工:

- [ ] **事实保真**：没有编造原文不存在的数据、人物、事件;没有删除作者的核心观点。
- [ ] **R1–R5 逐类过一遍**：五类都检查过,没有明显漏改的典型样本。
- [ ] **节奏检查**：挑出改写后最长的 3 句和最短的 3 句,确认长短交错;如果某段落里连续两句以上长度/结构接近,回去重写。
- [ ] **未过度磨平**：作者原本的锋芒、幽默或口语化保留下来了,没有被统一压成书面语。

## 八、输出模版

### 快速改写（中文）
```markdown
## 改写后文本

{完整改写文本}

---

### 修改说明
- **清理套话/空词**：{删除了哪些结构胶水或抽象修饰}
- **句式与节奏调整**：{如何打破了对称/翻译腔/匀速段落}
- **事实与细节强化**：{做了哪些具体化改动}
```

### Quick Edit（English）
```markdown
## Edited Draft

{Full rewritten text}

---

### What changed
- **Removed Filler & Jargon**: {Key terms and empty openers pruned}
- **Structural Fixes**: {How binary contrasts, colon reveals, or robotic rhythm were untangled}
- **Clarity & Directness**: {Specific abstractions replaced with concrete phrasing}
```

### 纯检测 / Detect
```markdown
### 发现的 AI 痕迹 / AI Patterns Identified

1. **【R{n} · {模式名 / Pattern Name}】**
   - 原文 / Quote：「{引用原句}」
   - 建议 / Fix：{一句话具体建议}
```