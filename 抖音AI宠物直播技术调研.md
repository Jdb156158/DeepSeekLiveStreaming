# 抖音二次元 AI 宠物直播：Mac / 网页端技术调研

调研日期：2026-11-06（Asia/Singapore）  
目标：让类似“大肥鱼”的二次元角色出现在抖音直播画面中，读取观众弹幕，按固定人设生成回答，播放语音，并同步口型、表情和字幕。

> 调研范围：GitHub 仓库、部分实现文件、项目许可证，以及抖音、OBS、DeepSeek、Live2D 等官方资料。本文没有安装这些项目，也没有使用真实抖音账号测试弹幕接收、开播或端到端延迟。下文区分“资料已确认”“工程建议”和“仍需实测”；开发时间、设备配置和性能目标均为估算。

## 1. 结论与推荐

**技术上可以实现。对你目前的需求，建议先做“Mac 本机后端 + 网页角色画面 + 云端大模型 / 配音 + 抖音直播伴侣”，验证成功后再封装 Mac App。**

你不需要重新开发一个抖音客户端，也不必先训练自己的大模型。真正需要打通的是这条链路：

```text
观众发弹幕
    ↓
弹幕接入 → 去重、筛选、排队 → AI 按人设生成短回复
                                      ↓
                               文本审核 → 语音合成
                                              ↓
                               网页播放音频 + 驱动角色 + 字幕
                                              ↓
                                  直播伴侣 / OBS → 抖音观众
```

最关键的四个发现：

1. **有几乎同题的“大肥鱼”项目。** `zbsdsb/dafeiyu-ai-vtuber` 已有弹幕、配音、海底场景、字幕、口型的设计，但文档和部分实现依赖 Windows，不能直接视为 Mac 成品。[项目](https://github.com/zbsdsb/dafeiyu-ai-vtuber)、[使用说明](https://github.com/zbsdsb/dafeiyu-ai-vtuber/blob/dafeiyu/docs/大肥鱼定制版使用说明.md)
2. **Mac 现在有官方开播工具。** 抖音直播伴侣官方确认支持 Intel / Apple 芯片、macOS 13 及以上，支持摄像头、桌面、程序窗口及图片采集和开播推流。[官方通知](https://streamingtool.douyin.com/docs/8uxkey2t_mac)
3. **最大接入难点是弹幕。** 官方评论互动能力限定于挂载玩法的直播间及包含特殊指令的评论，不能直接理解成“任意直播间全量聊天接口”。非官方采集项目另有失效、使用条款和授权问题。[官方评论能力](https://partner.open-douyin.com/docs/resource/zh-CN/interaction/jierushuoming/hudongshuju/pinglunshuju/)
4. **代码、模型、音色要分别确认授权。** 已发现“大肥鱼”模型的非商业使用声明，以及部分框架前后端许可证不同的情况。自己直播和出售软件也可能适用不同条款，不能用一个仓库的 LICENSE 覆盖全部素材。[模型来源说明](https://github.com/xkk6663/dsh-live2d-mao#-许可与致谢)、[Open-LLM-VTuber 前端许可](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber-Web/blob/main/LICENSE)

## 2. 先把“读取字幕”分清楚

本文主要按“读取观众在直播间发送的弹幕 / 评论”设计。

| 实际输入 | 需要的技术 | 是否建议首版加入 |
| --- | --- | --- |
| 观众发的弹幕、评论 | 平台事件接口或弹幕接入程序 | 是，核心输入 |
| 视频画面里已经显示的字幕 | 截屏 + OCR 文字识别 + 去重 | 仅在没有结构化输入时考虑 |
| 主播 / 连麦观众说的话 | 音频采集 + ASR 语音识别 | 后续扩展 |
| AI 自己说话时显示的字幕 | 将审核后的回复文本随播放进度显示 | 是，核心输出 |

**只读弹幕就不需要 ASR；输出字幕也不需要先把合成语音再识别一遍。**

如果你指的确实是“看视频字幕并回答”，可以增加 OCR 输入适配层；如果是“听直播声音并回答”，则增加 ASR。`whisper.cpp` 是可调研的 Mac 本地 ASR 方案，提供 Apple Silicon / Core ML 等支持。两条链路都应与宠物自身播放声音隔离，避免自问自答。[whisper.cpp](https://github.com/ggml-org/whisper.cpp)

## 3. 需要哪些技术支持

| 模块 | 作用 | 首版建议 | 主要验证点 |
| --- | --- | --- | --- |
| 抖音弹幕输入 | 接收评论并转为统一事件 | 优先评估官方能力；非官方方案仅作独立验证候选 | 能否收到你需要的自然语言消息 |
| 消息调度 | 去重、限频、选择问题、管理播放队列 | Python 异步队列即可 | 高峰时不会越积越多、回复错人 |
| 人设与大模型 | 理解问题并生成符合角色的回答 | DeepSeek 云 API，短回复 | 人设稳定、首句等待时间 |
| TTS 语音合成 | 把回答变成声音 | 有授权音色的云端流式 TTS | 中文效果、延迟、价格、可商用范围 |
| 角色资产 | 提供“大肥鱼”或原创角色形象 | 有明确授权的 Live2D 模型 | 是否允许直播、打赏和软件分发 |
| 角色渲染 | 呼吸、眨眼、口型、表情、动作 | 网页 + Cubism SDK；简单版本也可用 PNG 状态切换 | 音画同步、模型兼容性 |
| 控制台 | 开始、暂停、选问题、试音、切换场景 | 本机网页 | 主播能随时停止自动回复 |
| 画面与声音输出 | 把角色和声音送入直播间 | Mac 直播伴侣；复杂合成再加 OBS | 观众端同时收到画面和声音 |

DeepSeek 官方接口提供兼容格式和流式文本输出，可承担上表中的对话生成部分；配音和 Live2D 动画是另外的模块。[首次调用 API](https://api-docs.deepseek.com/zh-cn/)

## 4. GitHub 项目筛选

以下排序按“对当前需求的参考价值”，不是按 Star 数。仓库可访问、最近有提交，都不等于当前能在你的账号和 Mac 上跑通。

### 4.1 大肥鱼定制版：需求最接近，适合参考功能与实现

- 仓库：[zbsdsb/dafeiyu-ai-vtuber](https://github.com/zbsdsb/dafeiyu-ai-vtuber)
- 默认分支：`dafeiyu`。
- 已确认的设计：抖音弹幕回复、Fish Audio 配音、横竖屏场景、字幕和口型。
- 不是一个只需填 Key 就能用的 Mac 包：模型和弹幕工具需另外准备。

**Mac 移植的具体障碍：**

| 原项目实现 | Mac 需要处理什么 |
| --- | --- |
| `.bat`、PowerShell 启动流程 | 改为跨平台进程启动方式 |
| `WssBarrageServer.exe` 弹幕程序 | 换为可在 Mac 运行的输入适配器，或官方接入 |
| Windows 音频会话音量采集 | 直接分析网页正在播放的 TTS 音频，或重写 Mac 音频采集 |
| Windows 开播操作说明 | 改用 Mac 版直播伴侣，并实际验证声音路由 |

上述 Windows 环境、程序名和口型采集方式均可在[定制版使用说明](https://github.com/zbsdsb/dafeiyu-ai-vtuber/blob/dafeiyu/docs/大肥鱼定制版使用说明.md)核对；口型服务还有 `msvcrt` 等 Windows 依赖。[口型服务代码](https://github.com/zbsdsb/dafeiyu-ai-vtuber/blob/dafeiyu/tools/songroom_lipsync.py)

**判断：**值得优先读它的场景、字幕和口型设计，但不建议把整套 Windows 工具直接搬过来作为 Mac 产品基础。其代码标为 GPL-3.0，上游另有商用声明；模型也有非商业声明。用于盈利直播或二次分发前，需把这些边界确认清楚。[来源与许可](https://github.com/zbsdsb/dafeiyu-ai-vtuber#来源与许可)

### 4.2 Open-LLM-VTuber：优先评估的 Mac 原型框架

- 仓库：[Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber)
- 前端：[Open-LLM-VTuber-Web](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber-Web)
- 适用点：Live2D、语音互动、可替换 LLM / TTS、网页与 Electron 形态；发布页提供过 macOS 桌面前端。
- 抖音仍需接入工作：已查阅发布说明明确列出 Bilibili 弹幕客户端，不能据此认定已有可直接使用的抖音接入。[发布说明](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber/releases)

**授权特别注意：**主仓库代码为 MIT，示例模型另有条款；前端采用附加条件许可，明确允许以内容创作为主要收入的 VTuber 直播，但付费托管、软件销售、商业重包装等需另行商业许可。[后端许可](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber/blob/main/LICENSE)、[前端许可](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber-Web/blob/main/LICENSE)

**判断：**适合先验证“角色能说话、能换人设、能在 Mac 显示”的体验；如果目标是卖 Mac 软件，需要先评估前端许可，再决定复用还是自建。其文档建议使用 Chrome，首轮验证可按这个组合进行。[快速开始](https://github.com/Open-LLM-VTuber/open-llm-vtuber.github.io/blob/main/docs/quick-start.md)

### 4.3 Luna AI / AI-Vtuber：直播功能整合参考

- 仓库：[Ikaros-521/AI-Vtuber](https://github.com/Ikaros-521/AI-Vtuber)
- 当前默认分支：`v4`。
- 项目声明支持抖音等直播平台和多种 LLM、TTS；是上述大肥鱼项目的上游。
- 适合研究：弹幕到回复的处理流程、多种语音服务适配和直播管理。
- 需要注意：功能和依赖较多；README 标有个人免费、商用需联系作者及抽成说明，而仓库同时标为 GPL-3.0。商业采用前应确认其许可边界，不能简单写成“免费商用”。[README 与许可入口](https://github.com/Ikaros-521/AI-Vtuber/tree/v4)

**判断：**适合参考直播工作流，暂不认定全功能 Mac 兼容；首版不需要引入它的全部平台和语音后端。

### 4.4 DouyinLiveWebFetcher：抖音事件接入研究候选

- 仓库：[saermart/DouyinLiveWebFetcher](https://github.com/saermart/DouyinLiveWebFetcher)
- Python 项目，依赖包含 WebSocket、Protobuf 相关组件及 JavaScript 执行组件。
- README 展示聊天、礼物、进场等消息；环境说明以 Windows 为例，Mac 兼容性仍需实测。
- LICENSE 为 AGPL-3.0，同时 README 有仅供学习研究、禁止商业谋利等声明。应保留这一不一致，商业接入前澄清；不能把它当成有平台授权的正式 API。
- README 中历史“测试成功”的日期，只代表作者当时的测试，不能证明 2026-11-06 的实际可用性。[README](https://github.com/saermart/DouyinLiveWebFetcher/blob/main/README.MD)、[许可证](https://github.com/saermart/DouyinLiveWebFetcher/blob/main/LICENSE)

**判断：**可用于评估消息格式和接入难度。真正产品化前，还要核实平台条款、代码许可和持续维护方案。

### 4.5 AITuberKit：网页角色产品参考

- 仓库：[tegnike/aituber-kit](https://github.com/tegnike/aituber-kit)
- 网页 AI 角色工具，支持 Live2D / VRM、多个 LLM 和语音服务，并提供外部消息 / WebSocket 连接能力。
- 直播评论功能主要文档示例为 YouTube / OneComme，抖音需要单独适配。
- 当前版本为自定义许可，商业使用需要另行授权。[许可证](https://github.com/tegnike/aituber-kit/blob/main/LICENSE)

**判断：**适合参考网页产品形态；不能直接按早期宽松开源印象决定商用。

### 4.6 VTube Studio：不自己开发 Live2D 渲染器的替代方案

- API 仓库：[DenchiSoft/VTubeStudio](https://github.com/DenchiSoft/VTubeStudio)
- 官方 Wiki 提供 Windows / macOS 软件下载入口；本地 WebSocket API 可用于模型参数、表情和热键等控制。[软件下载入口](https://github.com/DenchiSoft/VTubeStudio/wiki/)、[插件 API](https://github.com/DenchiSoft/VTubeStudio/wiki/Plugins)
- 可采用：你开发“弹幕 + AI + TTS”，把嘴型参数和动作发给 VTube Studio，再采集它的窗口。
- 该仓库是 API 开发资料，不能把它理解成整个 VTube Studio 客户端的 MIT 开源代码。

**判断：**适合自己开播、希望少做渲染开发的路线；代价是多一个运行中的应用，并需验证 Mac 窗口和声音采集。

### 4.7 语音与渲染基础组件

| 项目 | 可以解决什么 | 采用建议 |
| --- | --- | --- |
| [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) | 小样本音色定制、TTS；文档有 macOS / Apple Silicon 安装说明 | 后期追求独特音色再评估；支持安装不等于实时性能达标 |
| [CosyVoice](https://github.com/QwenAudio/CosyVoice) | 语音生成，支持流式输入 / 输出 | 可评估服务器部署；不要把项目宣称的低延迟当成 Mac 实测结果 |
| [edge-tts](https://github.com/rany2/edge-tts) | 从 Python 使用 Edge 在线语音服务 | 可做原型音效验证；它不是商业云服务的 SLA 承诺 |
| [CubismWebSamples](https://github.com/Live2D/CubismWebSamples) | 官方网页 Live2D 渲染样例 | 自建网页时参考，SDK 和模型授权分开核对 |
| [OBS Studio](https://github.com/obsproject/obs-studio) | 画面合成、浏览器来源、录制、虚拟摄像头 | 需要合成时接入，简单单场景可以先验证直播伴侣窗口采集 |

GPT-SoVITS 代码为 MIT、CosyVoice 代码为 Apache-2.0，不代表外部模型权重、参考录音和第三方音色自动获得同样授权。[GPT-SoVITS 许可](https://github.com/RVC-Boss/GPT-SoVITS/blob/main/LICENSE)、[CosyVoice 许可](https://github.com/QwenAudio/CosyVoice/blob/main/LICENSE)

## 5. 抖音弹幕接入：要先验证的核心问题

### 路线 A：官方直播玩法 / 互动能力

官方文档确认：能力申请与已通过评估的玩法方案关联；评论能力涉及已挂载玩法的直播间及特殊指令消息；数据开放文档也要求直播间正在挂载该玩法才可启动对应数据任务。[能力申请](https://partner.open-douyin.com/docs/resource/zh-CN/interaction/introduction/introduction/capabilitieslist)、[评论能力](https://partner.open-douyin.com/docs/resource/zh-CN/interaction/jierushuoming/hudongshuju/pinglunshuju/)、[数据开放说明](https://developer.open-douyin.com/docs/resource/zh-CN/interaction/develop/server/live/danmu)

**对这个产品的影响：**

- 如果玩法方案获批，可以尝试设计成观众发“问鱼 + 问题”等明确触发格式。
- “包含触发词后，能否拿到完整问题”“AI 自由回复是否在获批范围”都需要按具体方案确认。
- 不能先假设接个 App ID 就能读所有弹幕，也不能把玩法能力推广为任意账号的直播数据接口。
- 官方互动工具也值得继续评估，但本次没有确认你这个“自由聊天 AI 宠物”能获批的能力范围。[互动工具开发指南](https://partner.open-douyin.com/docs/resource/zh-CN/live-interactive-tools/development/tutorial/app-interaction-guide)

### 路线 B：非官方弹幕采集

GitHub 上可找到对抖音网页直播事件进行采集的项目，适合了解协议、消息结构和原型可行性。但它们不提供平台对接保证，协议、签名、登录态或风控变化都可能让连接失效。应把输入层做成可替换模块，并先单独验证，不与角色渲染绑定。[采集项目与历史更新记录](https://github.com/saermart/DouyinLiveWebFetcher/blob/main/README.MD)

### 路线 C：窗口文字读取或人工选择

如果暂时拿不到合适的正式接口，可以先让主播把问题送进控制台，验证 AI 宠物的回复效果。OCR 也可以研究，但屏幕上看得见的文字不等于完整消息流：滚动、遮挡、重复和昵称识别都会影响正确率。它不能被视为对平台规则限制的替代许可。

**建议先做一个很小的接入验证：**只显示收到的消息、时间、类型和连接状态，不接大模型。确认目标账号可接入、字段足够、重连不重复后，再继续投入角色与配音。

## 6. Mac 与网页怎么选

| 方案 | 优势 | 成本 / 限制 | 适合阶段 |
| --- | --- | --- | --- |
| 本机后端 + 网页画面 | 容易调试，可用于浏览器和 OBS，能在 Mac 运行 | 需要启动本地服务；弹幕仍需适配 | 推荐首版 |
| Electron Mac App | 可复用网页，便于统一启动服务、置顶和管理窗口 | 打包、签名、公证及依赖分发增加工作 | 体验跑通以后 |
| 原生 SwiftUI + WebView | 更好地整合 Mac 权限、窗口和系统行为 | WebView / Live2D / 音频兼容性需单独验证，开发成本较高 | 有明确原生需求时 |
| 云端网站 + 本机浏览器 | 便于远程配置、集中更新 | 后端、鉴权、数据成本；开播画面和声音仍需送到推流端 | 多主播服务后期再做 |

这里的“网页端”指：**角色和控制台是网页，另有本机或服务器后端。** 不应理解成一个静态 HTML 文件独立完成所有环节。大模型 / TTS 密钥、官方回调以及弹幕采集连接都更适合放到后端，网页再通过 WebSocket 接收状态与音频。

### 首版建议技术栈

- 后端：Python 3.11 + FastAPI + WebSocket + 内存异步队列。
- 页面：TypeScript + 简单网页框架；角色画面与控制台分成两个页面。
- 角色：Cubism SDK for Web；若模型暂未获授权，先用可用的测试素材或简单 PNG 状态验证链路。
- 对话：DeepSeek 云 API，流式输出；实际模型名以接入时官方文档为准。
- 配音：有明确音色权限的云 TTS；先选现成声音，暂不训练。
- 本地保存：首版只存配置和必要运行记录，短期对话放内存即可。
- 开播：先验证 Mac 直播伴侣采集角色窗口和声音，复杂合成再加 OBS。

这是工程建议，并非声称上述组件已在当前电脑联调成功。

## 7. Mac 画面和声音如何进入抖音

### 方案 1：直播伴侣直接采集角色网页窗口

```text
角色网页窗口 ──窗口采集──→ Mac 直播伴侣 ──→ 抖音
TTS 实际声音 ──音频输入──→ Mac 直播伴侣
```

官方已确认 Mac 版支持程序窗口采集与开播。是否能稳定获取选定浏览器声音、窗口被遮挡或缩小后是否正常，要在实际版本里验证；不要仅凭 Windows 教程照搬。[Mac 版官方支持范围](https://streamingtool.douyin.com/docs/8uxkey2t_mac)

### 方案 2：OBS 合成后送给直播伴侣

```text
角色网页 → OBS 浏览器来源 → OBS 合成画面 → 虚拟摄像头 → 直播伴侣
TTS 音频 ───────────────────→ 单独配置音频路由 → 直播伴侣
```

OBS 官方支持浏览器来源和虚拟摄像头。Mac 版直播伴侣是否能识别当前 OBS 虚拟摄像头，仍需实测；如果不行，可评估采集 OBS 投影窗口。[浏览器来源](https://obsproject.com/kb/browser-source)、[虚拟摄像头指南](https://obsproject.com/kb/virtual-camera-guide)

**声音要单独核对。**上述大肥鱼项目的说明特别指出，虚拟摄像头本身不带声音。OBS 在 macOS 13 及以上有桌面 / 应用声音采集方式，但“OBS 收到声音”不等于“声音已经送到直播伴侣”。必要时再增加虚拟音频设备，最终以另一台设备观看直播的结果为准。[大肥鱼开播说明](https://github.com/zbsdsb/dafeiyu-ai-vtuber/blob/dafeiyu/docs/大肥鱼定制版使用说明.md)、[OBS Mac 音频采集](https://obsproject.com/kb/macos-desktop-audio-capture-guide)

如果账号本身获准使用第三方推流，也可评估 OBS 直接推流；本报告没有确认你的账号能拿到推流地址和密钥，因此不把它作为默认前提。

## 8. “会聊天”和“像一个活的宠物”之间还缺什么

以下为工程设计建议。

### 8.1 人设与回复调度

- 固定角色身份、语言习惯和称呼，回答以一两句为主。
- 从可回答的消息中挑选，不要求逐条回复；同一用户设置冷却时间。
- 表情、动作优先用固定白名单，例如 `happy / shy / thinking / idle`，不允许模型输出任意执行指令。
- 弹幕作为不可信输入，不能覆盖系统人设、读取密钥或触发系统命令。
- 对输入和待播出的文本都做必要过滤；昵称也要处理，不能只过滤问题正文。
- 模型 / TTS 超时就跳过或使用短提示，不播放堆积很久的旧问题。

### 8.2 队列比“每条弹幕都调 AI”更重要

建议首版最多保留 3～5 个待答问题，按时间过期；一个声音通道串行播放，避免多段回复同时响起。普通问题不打断当前一句，人工停止优先级最高。

例如每条语音需要 15 秒，即使不计生成耗时，理论上也只有约 4 条 / 分钟。实际应更保守，还要给停顿和互动留空间。因此直播间人多以后，“挑问题”是必要能力，不能通过无限加模型并发解决。

### 8.3 口型、表情和字幕

首版不必做复杂音素识别：读取**正在播放的语音**的音量包络，驱动嘴巴开合；给嘴巴参数做平滑，配上眨眼、呼吸和少量动作即可。需要更准的口型时，再评估音素 / viseme / MotionSync。

字幕必须对应最终审核并实际播放的文本。只有文本与音频时间信息时才能做到更准确的逐字同步；没有对齐数据时，先按音频分段显示，避免把匀速打字动画宣传成精确同步。

### 8.4 流式回复的正确位置

模型逐步输出 → 缓冲到可审核的短句 → 审核通过 → 送 TTS → 播放并显示对应字幕。

不要把未经审核的 token 立即播出去。DeepSeek 官方有流式输出和思考模式开关；直播短回复可以先评估非思考模式以减少等待，只播最终回答，不把推理过程送去朗读。[API 流式说明](https://api-docs.deepseek.com/zh-cn/)、[思考模式](https://api-docs.deepseek.com/zh-cn/guides/thinking_mode/)

云 TTS 可评估支持双向流式输入 / 输出的服务，例如火山引擎官方文档中的相应接口；具体音色、账号权限和费用另行核对。[双向流式 TTS 文档](https://docs.volcengine.com/docs/doubao-voice/websocket-bidirectional-streaming-v3?lang=zh)

## 9. 设备、延迟和费用估算

### 9.1 设备

使用云端 LLM + 云端 TTS 时，本机主要负责页面渲染、声音播放和推流。**工程建议是先用现有 Mac 测试；若采购，Apple Silicon、16 GB 内存可作为起点参考，并非官方最低要求。** 不建议因为这个原型直接购买独立 GPU。

本地同时跑大模型、定制 TTS、角色渲染和推流，会显著增加性能与兼容性变量。尤其是“项目支持 macOS 安装”与“可连续低延迟直播”应分开验证。

### 9.2 延迟

首轮可设目标：**在空队列、消息已到达后端之后，2～5 秒内听到第一句声音。** 这只是工程目标，不是现成项目的实测保证。

要分别记录：弹幕到达、开始生成、短句生成完成、TTS 首包、实际开始播放。观众还会经历抖音直播传输延迟，因此“观众发出消息到听见回复”的时间可能更长，必须用观众端实测。

### 9.3 大模型费用：一个可复算例子

本次读取的 DeepSeek 官方价格页列出 `deepseek-flash`：输入缓存未命中高峰价 2 元 / 百万 tokens、输出高峰价 8 元 / 百万 tokens；空闲时段为其一半。这里仅采用该模型作预算示例，价格变化后应重新计算。[官方模型与价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)

假设每小时回复 180 次，每次总输入 1,200 tokens、输出 100 tokens，全部按缓存未命中计算：

```text
输入费用 = 180 × 1,200 ÷ 1,000,000 × 2 = 0.432 元 / 小时
输出费用 = 180 ×   100 ÷ 1,000,000 × 8 = 0.144 元 / 小时
高峰合计 = 0.576 元 / 小时，约 0.58 元
空闲合计 = 0.288 元 / 小时，约 0.29 元
```

这是固定短上下文、单次生成的示例，不包含额外审核模型、重复生成和不断增长的历史；180 次 / 小时也只是预算输入，不是吞吐量承诺。

### 9.4 配音和其他费用

若每条回复 60 个字、每小时 180 条，则约合成 10,800 字 / 小时。若某服务按每万字 P 元计费，则这部分约为 `1.08 × P 元 / 小时`。部分服务按 tokens、音频时长或模型计费，不能直接套此公式；本次没有核实统一的 TTS 报价。

还需按选型计入：角色立绘与绑定、模型授权、定制音色授权、服务器（如采用云部署）、Mac 软件分发成本及后续弹幕适配维护。**不要只看 LLM 单价判断总预算，模型和声音通常更影响角色最终效果。**

## 10. 大肥鱼形象与直播规则

### 10.1 “免费模型”不能直接推导为“可以盈利直播”

已查阅的模型分发仓库将大肥鱼标为非官方二创、非商业用途，并禁止盗用与出售。这是分发方的说明，不是本次独立取得的完整版权授权链。[模型说明](https://github.com/xkk6663/dsh-live2d-mao#-许可与致谢)

如果计划开打赏、接广告或销售软件，建议先向权利人确认对应授权，或制作自己的鱼系角色。声音也一样：现成音色名称、可调用的接口、开源训练代码，分别不能代替真人声音或角色音色的使用许可。

Live2D SDK 官方还区分 VTuber、AI / Chatbot、可扩展应用等发布类型；若要出售可导入模型的宠物软件，需按实际产品形态核对适用条款，不应只凭“个人项目”判断。[SDK 发布许可](https://www.live2d.com/en/sdk/license/)

### 10.2 AI 内容标识和实际开播资格

抖音官方公告要求对 AI 生成内容进行显著标识，也对误导性仿冒等滥用行为进行治理。上线时应核对账号、直播类别和当前标识入口的要求。[抖音安全与信任中心公告](https://trust.douyin.com/article/15868)、[抖音用户服务协议](https://www.douyin.com/draft/douyin_agreement/douyin_agreement_user.html?id=6773906068725565448)

首版建议真人值守，提供一键静音、清空队列和人工接管。这个建议用于控制直播运行风险，**不表示真人值守就自动满足所有平台准入条件，也不表示 AI 宠物天然拥有无人值守直播资格。** 本次没有确认你的账号及该内容形态的最终审核结果。

如果采用官方小玩法能力，其准入和内容展示规则还要单独遵守；比如文档对未经认可直接展示玩法评论内容有具体限制，不能未经核对就把原始弹幕全部上墙。[玩法准入规则](https://partner.open-douyin.com/docs/resource/zh-CN/interaction/introduction/live-play/creation)

## 11. 建议的开发顺序与验收标准

以下为单人、已有 Web / Python 开发经验时的粗略工作量，按全职工作日估算，不含美术制作、商业授权、平台审核等待及复杂协议修复。

| 阶段 | 交付物 | 验收标准 | 工作量估算 |
| --- | --- | --- | --- |
| 1. 输入与开播验证 | 弹幕消息查看器 + 测试窗口和声音 | 确认目标账号的接入路径；另一个设备能看到测试画面、听到声音 | 1～3 天，外部权限等待另计 |
| 2. 本地角色原型 | 手动输入 → AI → TTS → 角色 + 字幕 | 连续输入 20 个问题，顺序正确、无重叠播放，可立即停止 | 2～4 天 |
| 3. 弹幕闭环 | 消息筛选、限频、短期上下文、断线处理 | 自有测试直播中跑通；重复事件不重复回复；队列有上限 | 3～7 天 |
| 4. 长时间试播 | 运行记录、异常恢复、主播接管 | 连续试播 2 小时；记录内存、延迟和失败；停止后没有残留语音 | 2～4 天 |
| 5. 可选 Mac 打包 | 安装包、统一启动与配置 | 新用户环境能启动；钥匙和配置不出现在直播画面 | 另估 3～7 天 |

这些阶段可以部分复用现有框架，但弹幕权限、模型授权、音频路由可能改变进度。一个能演示的原型与一个可以稳定给别人使用的产品，验收范围不同。

**建议首版只包含：**一个授权角色、一种声音、一个直播间、弹幕短回复、口型和字幕、主播暂停与接管。点歌、唱歌、礼物数值玩法、跨场次长期记忆、多主播管理，先不纳入首版。

## 12. 对这个项目的具体选择建议

1. **如果主要是自己在 Mac 上开播：**先评估 Open-LLM-VTuber 或 VTube Studio，快速验证角色和声音；参考大肥鱼项目的演出设计，单独解决抖音输入。
2. **如果希望后续做成可销售的 Mac App / 网页工具：**先确定框架与素材商业许可；必要时做小型自有 Web 前后端，先跑通闭环，再增加桌面封装。
3. **如果一定要使用现有“大肥鱼”模型和相似声音：**优先确认素材来源与使用范围；技术接入可以并行研究，但不能把分发仓库的可下载状态当作商用授权。

当前最值得先做的，不是训练模型，而是验证三个问题：**你的账号能否按合适的方式接收问题、Mac 开播时观众能否听到角色声音、目标形象和音色能否用于你的直播用途。** 这三项确定之后，剩余部分可按上面的模块逐步实现。

## 附：核心仓库复核记录

以下是调研时 GitHub API 返回的默认分支最新提交日期（UTC）和短 SHA，仅用于复查资料版本；不等于版本发布日期、持续维护承诺或本次运行验证。

| 仓库 | 默认分支 | 最新提交日期（UTC） | 短 SHA |
| --- | --- | --- | --- |
| [大肥鱼定制版](https://github.com/zbsdsb/dafeiyu-ai-vtuber) | `dafeiyu` | 2026-10-29 | `fa93c083cae4` |
| [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) | `main` | 2026-05-15 | `992309c0aa19` |
| [Open-LLM-VTuber-Web](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber-Web) | `main` | 2025-09-05 | `d176e7df2366` |
| [AI-Vtuber](https://github.com/Ikaros-521/AI-Vtuber) | `v4` | 2026-10-31 | `c430ee71f208` |
| [DouyinLiveWebFetcher](https://github.com/saermart/DouyinLiveWebFetcher) | `main` | 2026-09-08 | `40a904bdb056` |
| [AITuberKit](https://github.com/tegnike/aituber-kit) | `main` | 2026-10-04 | `91890921e862` |

后续实施时应固定实际选用的 commit，按该版本的代码、依赖和许可证重新核对。
