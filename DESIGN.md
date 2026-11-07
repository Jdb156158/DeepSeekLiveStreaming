---
name: 大肥鱼 · 本地预览与扶砖小院
description: 保留海底聊天身份，以连续地面的可爱海边小院承载扶砖互动。
colors:
  garden-ink: "#4e5745"
  garden-muted: "#6a745e"
  garden-line: "#e5e8d8"
  garden-paper: "#fffdf6"
  garden-surface: "#f0f3e7"
  garden-accent: "#b5543c"
  garden-accent-dark: "#91412f"
  garden-secondary: "#e6eddc"
  garden-secondary-hover: "#d8e4c9"
  garden-focus: "#9a583d"
  garden-title: "#355466"
  lane-coral: "#ef947e"
  lane-gold: "#e6bd63"
  lane-sage: "#83b9a0"
  lane-blue: "#90b5d1"
  lane-lilac: "#b5a2ce"
  lane-pink: "#e6a4b6"
  chat-ink: "#173949"
  chat-muted: "#526d7a"
  chat-line: "#d9e4e7"
  chat-paper: "#fff"
  chat-surface: "#f1f6f6"
  chat-accent: "#087c8a"
  chat-accent-dark: "#05616c"
  chat-danger: "#ad3849"
  chat-focus: "#24a7ba"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'
    fontSize: "14px"
  garden-display:
    fontFamily: '"Garden Happy", sans-serif'
    fontSize: "clamp(27px, 3.3vw, 46px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: ".025em"
  garden-title:
    fontFamily: '"Garden Happy", sans-serif'
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.3
  chat-title:
    fontSize: "18px"
    letterSpacing: "-.02em"
rounded:
  chat-button: "8px"
  chat-container: "14px"
  garden-button: "11px"
  garden-field: "10px"
  garden-lane: "13px"
  garden-stage: "18px"
  garden-panel: "20px"
  garden-preview: "24px"
spacing:
  compact: "8px"
  related: "10px"
  garden-mobile-gutter: "14px"
  garden-column-gap: "26px"
components:
  garden-button-primary:
    backgroundColor: "{colors.garden-accent}"
    textColor: "#fffef7"
    rounded: "{rounded.garden-button}"
    padding: "11px 14px"
  garden-button-primary-hover:
    backgroundColor: "{colors.garden-accent-dark}"
  garden-button-secondary:
    backgroundColor: "{colors.garden-secondary}"
    textColor: "#506449"
    rounded: "{rounded.garden-button}"
    padding: "10px 15px"
  garden-button-secondary-hover:
    backgroundColor: "{colors.garden-secondary-hover}"
  garden-command-field:
    backgroundColor: "#fffefa"
    textColor: "{colors.garden-ink}"
    rounded: "{rounded.garden-field}"
    padding: "11px 10px"
  garden-panel:
    backgroundColor: "{colors.garden-paper}"
    rounded: "{rounded.garden-panel}"
    padding: "25px 23px"
  chat-button-primary:
    backgroundColor: "{colors.chat-accent}"
    textColor: "{colors.chat-paper}"
    rounded: "{rounded.chat-button}"
    padding: "10px 15px"
  chat-button-primary-hover:
    backgroundColor: "{colors.chat-accent-dark}"
  chat-button-stop:
    backgroundColor: "#f9edef"
    textColor: "{colors.chat-danger}"
    rounded: "{rounded.chat-button}"
    padding: "10px 15px"
---

# Design System: 大肥鱼

## Overview

**Creative North Star: "大肥鱼的海边小院"**

扶砖页是一座可以玩耍的可爱卡通小院：奶油色沙地连接小屋、花树与鲸鱼浇水壶，六排带笑脸的彩砖和大肥鱼站在同一片地面。柔和的鼠尾草色操作区让出视觉中心，砖排的编号、颜色与状态把玩耍意图说清楚。当前视觉由实现代码及已审阅画面确立，没有独立的批准设计稿。

这是两个有边界的场景身份。原聊天预览继续使用海底图、青蓝操作强调和系统字体；小院身份限定在扶砖页的 `.garden-room` 内。两者保留原角色与本地状态提示，作者来源记录保留在项目文档，不把小院配色扩散到聊天页。

**Key Characteristics:**
- 连续沙地与投影接触阴影，让角色和砖真正落地。
- 六色笑脸砖配六个号码，颜色与文字共同识别。
- 手写感标题配清楚的系统正文，操作面板安静而紧凑。
- 真实小屋、花树与鲸鱼浇水壶插画构成场景，互动对象留在可玩的空地。

## Colors

### Primary
- **小院珊瑚土色**（`garden-accent`）：提交“推一下”的主操作；较深变体用于悬停。
- **聊天海水青**（`chat-accent`）：仅用于原聊天页的发送操作与输入提示，深色变体用于悬停和文字链接。

### Secondary
- **鼠尾草操作色**（`garden-secondary`）：声音、暂停和重置按钮；较深变体用于悬停。
- **六排彩砖**（`lane-coral` 至 `lane-pink`）：按珊瑚、金黄、青绿、浅蓝、淡紫、粉色固定对应 1～6 号；画布砖、地面号码牌和操作按钮号码保持一致。

### Neutral
- **小院奶油纸与浅绿底**（`garden-paper`、`garden-surface`）：前者承载面板和画面外框，后者是页面底色。
- **小院叶色文字与分隔**（`garden-ink`、`garden-muted`、`garden-line`）：正文、次要说明、功能区分界。
- **小院海蓝标题**（`garden-title`）：仅用于插画上方标题，搭配浅奶油描边保持可读。
- **聊天冷白与深海文字**（`chat-paper`、`chat-surface`、`chat-ink`、`chat-muted`、`chat-line`）：维持海底聊天页的原有身份。
- **交互状态**：小院和聊天分别使用自己的焦点色；聊天停止操作使用 `chat-danger`。

**The Scope Rule.** 小院颜色只作用于扶砖页，原聊天页继续以青蓝色为操作强调。

## Typography

正文沿用系统中文字体栈。小院的 Garden Happy 由本地 ZCOOL KuaiLe 字体文件提供，适用于标题、号码牌和加载／暂停提示；正文、状态与长说明继续使用系统字体。

- **小院展示标题**：使用 `garden-display`；桌面随视口缩放，窄屏改为 `clamp(25px, 6.2vw, 39px)`。
- **小院功能标题**：使用 `garden-title`；扶砖日记桌面为 20px，移动端恢复 22px。
- **小院页头**：手写字体 23px，移动端 22px；副标题是系统字体 12px。
- **正文与说明**：基础 14px；操作说明 13px，号码状态及表单标签 12px，辅助标签与页脚 11px。
- **聊天标题**：功能标题沿用 `chat-title`；聊天正文与表单继续采用原系统字体层级。

## Layout

小院桌面是主画面加操作栏的两列网格，最大宽度 1260px，操作栏 330px，列间距使用 `garden-column-gap`。宽度达到 1450px 后，容器为 1420px、操作栏 350px、间距 30px；不超过 1020px 时操作栏收至 300px。画面保持正方形，桌面最大宽度为 `calc(100vh - 142px)`，以完整场景为主要阅读单位。

不超过 760px 时变为上下排列，页边使用 `garden-mobile-gutter`，操作栏放在画面下方，场景不裁成长条。六个指令始终保持三列两行；按钮内部垂直排列号码、动作和当前状态。页头操作换行，窄屏隐藏画布内的本地状态角标，操作区页脚继续说明本地试玩状态。

插画 `web/art/garden-courtyard.png` 与砖、角色位于同一个 1000×1000 世界中，再整体缩放进画布。透视同时影响砖、角色与地面接触阴影；前后对象依地面纵坐标排序。该空间模型属于扶砖场景，不是普通表单或聊天区的布局规则。

原聊天页保留左侧海底画面、右侧配置／聊天栏：最大宽度 1480px，默认操作栏 390px、间距 28px；900px 以下收紧，680px 以下上下排列。

## Elevation & Depth

小院使用柔和面板阴影和地面接触阴影。外框与操作栏的轻阴影只分隔纸色 UI 与页面底色；砖的侧面明暗、随旋转改变的投影足迹与底边接触阴影，以及角色脚下多层阴影负责空间关系。砖和角色落在连续地面上，不增加抬高的台板。原聊天页继续依赖海底插画及深色字幕层，与小院分别处理。

- **画面外框**：`0 7px 26px #545c3d0d`。
- **操作面板**：`0 6px 22px #545c3d0a`。
- **号码按钮压边**：默认 `inset 0 -3px 0 #e7dfcc`；不可用时减为 `inset 0 -2px 0 #e4e3d7`。

**The Ground Contact Rule.** 扶砖场景中的砖、角色及其阴影必须共享投影地面，不能靠悬浮平台补出深度。

## Shapes

小院采用软圆角而不是胶囊化所有元素：外框、面板和舞台使用前述大圆角，按钮与输入框使用较紧的圆角。号码按钮为 13px，内嵌号码砖为 7px；画布地面牌为 12px。场内笑脸砖采用高 1.04、宽 0.46、厚 0.16 的修长牌形，侧面为连续的直边四边形，按可见面绘制，保留清楚的厚度。牌面表情与牌体共用旋转投影，倒下后不突然消失。对话泡泡一角较紧并带尾巴，字幕条圆润且居中。

聊天页保留原来的 14px 容器、8px 操作按钮以及海底画面裁切。

## Components

### 小院内聊天

“和本鱼聊聊”放在控制台第一段，沿用小院奶油/草绿配色，聊天记录固定 150px 高并可滚动。提供三个快捷话题、最多 400 字的输入框、只朗读开关、发送与停止说话；等待回复和播放时禁止重复发送，错误保留输入以便重试。模型状态以“本地 Qwen”或“DeepSeek”标明，配置表单默认折叠。顶部聊天链接仅锚定本页。桌面预览随页面滚动保持可见，窄屏自然堆叠。

聊天复用原 `/api/chat` 服务，结果由小院当前角色以同一音频分析器驱动口型；画面字幕允许换行，并随音频时长近似推进，非逐音素对齐。聊天时暂不播放固定吐槽或覆盖字幕；暂停和重置只作用于小院游戏。跨预览页沿用声音归属机制，避免两页同时说话。旧海底聊天页及其视觉保留。

### 逐排加长的彩砖

六排砖前端与号码牌对齐，1至6号依次使用4、5、6、7、8、9块，保持原砖尺寸、间距和6号总长。后端逐排延伸形成阶梯轮廓。地面阴影、倒下末块、扶砖路径和面板进度均按各排实际长度计算。

### 太阳伞下的休息角

左侧设置蓝白像素太阳伞、浅木色小板凳和蓝色手机。伞与板凳使用透明 PNG（`web/art/rest-parasol.png`、`web/art/rest-stool.png`），以接触阴影和凳面支撑承接角色，浅暖木色衬托大肥鱼的深蓝发色与裙子；旧躺椅素材和原九套背景保留。六排砖的投影整体向右移 90 个逻辑像素，为休息角留出空间；号码牌、阴影和工作路径使用同一投影。伞位于互动对象后方，保持扶砖动作可见。

角色空闲时并膝坐凳看手机，上身直立，不再整体旋转。坐姿通过腿部折叠、髋部下沉与双膝轻收表现，保持脚底及上身比例。约 0.65 秒平滑起身后去扶砖，任务完成后走回固定位置，再约 0.65 秒坐下。手机随休息姿态淡入淡出，与手部一起定位。休息过渡可被新指令打断，保持当前姿态连续。角色、手机与路径均为程序化近似，未修改原模型素材。

扶砖画布使用 2 倍分辨率绘制。休息姿态使用与站立相同的模型缩放（变形前高度 268 逻辑像素），给脸部和服装保留显示像素；板凳位于角色后方，脚底与凳脚同处地面。

### 背景选择

扶砖控制台顶部采用 3×3 缩略图按钮，原海边小院、樱花庭院、蘑菇森林、糖果乐园、雪顶小镇、星光花园六套素材保留，第三行新增像素·海边、像素·樱庭、像素·天台。三套新素材采用蓝白、靛蓝配色和块状像素边缘，与角色的二次元形象搭配；背景纹理使用最近邻采样，原六套保持线性采样。`aria-pressed` 表示唯一当前选择，当前名称与加载反馈另以文字显示。选择框使用 `--scene-accent` 描边，场景标题使用 `--scene-ink`，其余操作面板保持既有奶油/草绿色。九套素材都与角色及砖块共用 1000×1000 场景；换景不更改游戏对象状态。

### Buttons

小院主操作使用珊瑚土色，次操作使用鼠尾草浅底。共享 550 字重；焦点沿用 3px 外描边与 3px 间距，小院只替换描边颜色。按钮文字始终明确说明动作；声音和暂停按钮随实际状态改为“声音已开启”和“继续”。原聊天页保留青蓝主按钮和独立停止按钮。

### Numbered Row Controls

每个号码按钮至少 88px 高，三列排列；彩色号码砖为 31×34px，下面保留“1号倒”等动作与逐排状态。悬停上移 2px，过渡 0.15 秒。倒下、排队、修复以及暂停时按钮不可重复触发；不可用时保留颜色与清晰文本，不用整体透明化掩盖状态。支持减少动态效果时取消这类悬停移动。

### Inputs / Fields

小院命令框为暖白底、细边框（`#d5d7c3`）与紧圆角，和主操作在同一行；输入区可缩放，按钮文字保持单行。焦点描边显式可见，错误信息作为状态文字显示。聊天仍使用原多行输入框与配置字段。

### Cards / Containers

主操作、扶砖日记与帮助共处一个纸色操作栏，内部用细线分区；不把每个统计项再包装成卡片。状态标签使用浅叶色底，日记数字采用等宽数字特性，避免更新时跳动。

### Navigation

页头用带下划线的文字链接往返聊天与小院。保留声音和暂停的次操作优先级；移动端操作横向分配在独立一行。

### Playable Courtyard

操作按钮和场内号码牌触发同一排。界面用连续倒下、角色走近、半蹲扶正和队列状态解释动作。每块动作 1.4 秒，依次停步、半蹲伸手、抓稳、抬砖站起；砖在伸手阶段结束前保持原角度。半蹲以脚底为固定点，下腿与大腿分别位移，双膝轻轻收拢并保持间距，取消膝盖向外撑开的形态，重心下沉约身高的 8.5%；同一条腿在相同高度的横向位移一致，避免腿部被拉宽。上身最多约 7° 轻微前倾，头部、衣裙保持原比例，原生低头、视线和右肩/肘/腕参数配合伸手。每帧先恢复 SDK 顶点再叠加当前变形，避免累积漂移，并同步更新裁切网格。此为现有模型的程序化半蹲近似，未新增原生腿部骨骼。原模型文件与造型素材不变；扶砖页通过模型原生 `Paramcol_3=1` 隐藏身前文字，画面内不显示作者署名，来源记录保留在项目文档。原聊天预览不加载这套动作。字幕及泡泡承载短句，帮助区说明语音为固定台词。作者署名保留在项目来源记录中。

连倒采用加速旋转，下一块的启动间隔由首次接触角度确定；前一块的角度受下一块牌面约束，形成连续搭压，末块完全贴地。接触几何参考 [The Domino Effect，第 2 节](https://arxiv.org/html/physics/0401018)。这是轻量几何动画，不包含完整刚体动力学或摩擦求解。逐块扶起从各块实际停留角度开始，避免跳回 90°。

## Do's and Don'ts

### Do:
- **Do** 将小院插画、互动对象与接触阴影作为同一世界整体缩放。
- **Do** 让 1～6 号在画布和操作区使用相同颜色、号码及真实状态。
- **Do** 把手写字体留给短标题和号码，把系统字体留给说明和状态。
- **Do** 保留角色原貌、项目文档中的模型作者署名与真实本地试玩提示。

### Don't:
- **Don't** 为扶砖场景增加悬空台板，或让脚和砖底脱离共同地面。
- **Don't** 用小院暖色覆盖原聊天页的青蓝身份。
- **Don't** 只靠颜色区分砖排，或以模拟状态暗示已接入真实弹幕。
