# ΛΟΓΟΣ · 道

**圣经原文逐词形态分析与文学肌理研读**  
约翰福音 · SBLGNT · 和合本 · Strong's · 互涉背景 · 母题雷达

这是一个**纯静态网页**：不需要后端、不需要构建。把本目录全部文件上传到 GitHub 仓库根目录，开启 GitHub Pages 即可分享。

## 入口

| 页面 | 内容 |
|---|---|
| `index.html` | 1:1–5 深度研读示范：逐词形态、互涉、母题、语法术语、内嵌辞典 |
| `john.html` | **约翰福音全书**：21 章 / 879 节 / 15,438 词位；每节默认显示四栏人工研读 |
| `john-study.html` | **文学肌理研读库**：21 章，每章结构、关键词、语法修辞、分段细读、和合本差异 |
| `john-literary.html` | 第 1 章 1:1–51 文学肌理长页（序言 + 见证与门徒） |

## 全书阅读器

### 逐节四栏

`john.html` 的每一节正文下面默认显示：

- **读法**：本节在段落中的位置与神学/文学要点
- **语法 / 结构**：实际希腊词形、格/数/性、时态/语态/语气、语序与连接词
- **互涉 / 背景**：旧约、第二圣殿背景、约翰福音内部呼应
- **和合本差异**：SBLGNT 与和合本的语序、用词、增补或弱化

全书 **879 节**均为人工精读；未使用自动模板填充。

### 其他功能

- 点击任意希腊词：形态解析、词元、Strong 编号、STEPBible 英文简释
- 常用词中文简释：350 个高频 Strong's 编号，覆盖约 93% 词位
- 桌面端右侧词形面板；手机端底部浮层，不跳转
- 章节切换、上一章 / 下一章、`?chapter=7` 直达
- 研读台三标签：词形分析 / 互涉背景 / 母题雷达
- 8 个母题与 21 章分布
- 12 个重点段落研读卡
- **互涉背景分级**：直接引用 / LXX 词语复用 / 预表类型 / 主题回响 / 新约内部呼应；每条附“判断依据”，不把主题回响冒充成逐字引用
- 文学肌理入口
- 字号 A− / A+，默认 116%
- SBLGNT 未收的 5:4 与 7:53–8:11 仅列和合本，并在正文明确标注，不伪造希腊文

## 文学肌理

`john-study.html` 收录 21 章：

- 第 1 章：1:1–51（独立长页 `john-literary.html`）
- 第 2–21 章：每章 5 个研读段
  - 结构
  - 关键词
  - 语法与修辞
  - 分段细读
  - 和合本差异与结论

## 文件结构

```text
index.html
john.html
john.css
john.js
john-gloss.js
john-study.html
john-study.css
john-literary.html
john-literary.css
notice.html
.nojekyll
data/john/
  john-data.js
  zh-extra.js
  john-chapters.js
  john-intertexts.js
  john-motifs.js
  john-study.js
  john-study-library.js
  john-deep.js
  john-deep-1b.js
  john-deep-2.js ... john-deep-21.js
  john-literary-2.js ... john-literary-21.js
```

`john.html`、`john-study.html`、`john-literary.html` 必须和 `data/john/` 保持在同一个站点根目录下。

## 发布到 GitHub Pages

1. 新建 Public 仓库，例如 `logos-study`。
2. 把本目录**全部内容**上传到仓库根目录；不要只上传 ZIP，GitHub 不会自动解压。
3. 进入 **Settings → Pages**：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. 保存后等待 1–3 分钟。

访问：

```text
https://你的用户名.github.io/logos-study/
https://你的用户名.github.io/logos-study/john.html
https://你的用户名.github.io/logos-study/john-study.html
```

## 数据与版权

- 希腊文：SBLGNT（CC BY 4.0）
- 形态：SBLGNT / MorphGNT 标注
- 中文：和合本（CUV / CUNPS 简体，公版）
- 简释：STEPBible TBESG（CC BY 4.0）与人工整理
- 内嵌辞典：《圣经新辞典》16 条，版权归原出版方；公开部署前请确认授权
- 文学肌理与逐节研读为编者整理，不替代专业释经书或校勘本

SBLGNT 未收约翰福音 5:4 与 7:53–8:11；这些节次仅列和合本。
