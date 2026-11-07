# 本地预览素材与组件

本项目只将下列素材下载到本机预览，不代表已取得商业直播、软件销售或重新分发授权。素材目录和本地模型不进入 Git。

| 内容 | 来源 | 许可说明 |
| --- | --- | --- |
| 大肥鱼 Live2D 模型 | xkk6663/Mao，commit `93c133d430a9e6336ebce2665997794559421430` 的 `澪Agent应用/dist/live2d-pet/models/da-feiyu` | 作者 Mao绒绒家园，非官方二创公皮，非商业用途；扶砖页按用户要求使用模型原生 `Paramcol_3` 隐藏身前文字，画面内不显示作者署名，来源记录保留在项目文档，原始模型文件未改动 |
| 海底背景 | zbsdsb/dafeiyu-ai-vtuber，commit `fa93c083cae4` 的 `Live2D/assets/aquarium-portrait-20261028.png` | 来自参考项目，限本地效果验证；未独立核验美术资产授权链 |
| PixiJS / pixi-live2d-display | 上述 Mao 仓库 `libs` 目录 | MIT，许可原文下载至 `web/vendor/licenses/` |
| Live2D Cubism Core | 同一仓库 runtime，© Live2D Inc. | Live2D 专有许可；保留文件头和随附 notice。发布前按实际 SDK 用途核对官方许可 |
| llama.cpp | ggml-org/llama.cpp，官方 release `b12144` | MIT，原文位于 `.local/llama-b12144/LICENSE` |
| Qwen2.5-0.5B-Instruct-GGUF | Hugging Face 官方 Qwen 组织，Q4_K_M | Apache-2.0；只用于本地轻量对话，不是 DeepSeek |
| edge-tts | PyPI `edge-tts` | LGPL-3.0，在线语音接口的使用范围另按服务条款 |
| 站酷快乐体 ZCOOL KuaiLe | Google Fonts 官方仓库 `ofl/zcoolkuaile` | SIL Open Font License 1.1，原文保留在 `web/fonts/OFL.txt` |

扶砖场景的新背景 `web/art/garden-courtyard.png` 由本次会话使用内置 imagegen 工具生成，并非原项目的海底背景；生成记录见 `web/art/README.md`。

模型作者原始展示：[Bilibili BV1yep465EQz](https://www.bilibili.com/video/BV1yep465EQz/)。
Live2D 发布许可：[官方说明](https://www.live2d.com/en/sdk/license/)。
Qwen 模型：[官方页面](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF)。
