---
name: zh-encoding
description: >-
  Windows 中文/Unicode 编码处理：输出乱码（GBK/cp936）、中文检测/统计结果可疑、
  grep -P \x{...} 报错，或需要按 Unicode 语义读写中文文本时使用。
---

# 中文/Unicode 编码处理（Windows）

处理中文文本遇到乱码、检测/统计结果可疑，或要写的命令含 Unicode 码点时，用本技能的已验证做法。

## 用哪种工具

| 目标 | 做法 |
|---|---|
| 检测/统计中文 | python：Unicode 语义，与 shell locale 无关，首选 |
| grep 内按 Unicode 匹配 | PCRE 属性类 `\p{Han}`（需 UTF-8 locale） |
| 管道/文件输出中文 | python（本机 `PYTHONUTF8` 已生效）或显式 `encoding=` |

## 统计/检测中文：python 一行

```bash
python - <<'EOF'
import glob, re
for f in sorted(glob.glob('src/*.rs')):
    n = sum(1 for l in open(f, encoding='utf-8')
            if re.search(r'[\u4e00-\u9fff]', l))
    print(f, n)
EOF
```

完成判据：中文输出可读，行数与手数一两个文件的结果吻合。

## 环境验证与修复（PYTHONUTF8）

```bash
python -c "import sys; print(sys.stdout.encoding)"   # 期望 utf-8
```

持久化修改（`setx` 写注册表、`config.toml` 写配置）是写盘操作，动手前：
- 先读 `~/.config/mise/config.toml`，确认里面没有密钥/Token 等敏感内容再做修改；
- 优先会话内临时生效——只在当前命令前加 `PYTHONUTF8=1`，或本次会话 `export PYTHONUTF8=1`，不写盘；
- 确需持久化时，先向用户展示将追加的 `[env]` 段与 `setx` 命令，取得明确同意后再写；撤销方法见本节末尾。

若不是 utf-8（locale 回退 GBK/cp936 的典型症状）：

```powershell
setx PYTHONUTF8 1
```

并在 `~/.config/mise/config.toml` 追加：

```toml
[env]
PYTHONUTF8 = "1"
```

重启 pi 后生效。撤销：

```powershell
reg delete "HKCU\Environment" /v PYTHONUTF8 /f
```

并删除 `config.toml` 中的 `[env]` 段。

## 陷阱与机制

- `grep -P '[\x{4e00}-\x{9fff}]'`
  - C locale：PCRE 按 8-bit 字节模式编译，`\x{}` 码点 > 0xFF 报 `character value in \x{} or \o{} is too large`——每处理一行报一次，且 `grep -q` 返回非零污染统计；
  - UTF-8 locale 但 grep 的 PCRE 无 UTF 支持：不报错但静默匹配不到（exit 1），统计出假的 0——比报错更隐蔽。
- 逐行 `while read ... | grep` 循环统计：每行启动一个子进程，上千行即数十秒（1255 行 ≈ 56s）。
- python 管道输出未按 UTF-8 编码时中文乱码——管道编码与交互终端是两回事，排查乱码先对齐"输出方字节编码 vs 消费方解码假设"。