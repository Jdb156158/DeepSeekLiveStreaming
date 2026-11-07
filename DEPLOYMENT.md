# 部署与运行

本文对应当前 Mac 本地预览实现。代码上传 GitHub 不等于服务已在公网部署。

## 支持范围

- 已验证环境：Apple Silicon Mac、16 GB 内存、Python 3.11；本地模型使用 Metal。
- `scripts/setup.sh`、`scripts/run.py` 下载和启动的是 macOS ARM64 版 llama.cpp。
- Mac 系统配音回退依赖 `/usr/bin/say`、`/usr/bin/afconvert` 和已安装的中文语音。
- 当前没有 Linux、Windows、Docker 或云服务器部署实现；不能直接把整个项目当成静态站点部署到 GitHub Pages。
- 只监听本机：网页/接口 `127.0.0.1:18080`，语言模型 `127.0.0.1:18081`。没有公网认证、反向代理或多用户隔离实现。

## 部署文件

| 文件 | 用途 |
| --- | --- |
| `scripts/setup.sh` | 新克隆的 Mac 仓库安装入口：检查平台、创建虚拟环境、安装依赖、下载素材与模型 |
| `requirements.txt` | 固定 Python 应用依赖版本 |
| `scripts/bootstrap.py` | 下载 Live2D 模型、运行时、海底背景、llama.cpp 和 Qwen GGUF |
| `scripts/run.py` | 解压 llama.cpp、生成本地模型密钥、启动/停止本项目服务 |
| `启动预览.command` / `停止预览.command` | Mac Finder 双击启动/停止入口；首次使用前仍需运行 setup |
| `deploy/settings.example.json` | 无密钥的配置示例；真实配置放在 `.local/settings.json` |
| `server.py` | 提供静态文件、聊天、语音、状态及 WebSocket 接口 |
| `tests/run.mjs` | 规则回归测试入口；运行测试才需要 Node.js |
| `.gitignore` | 排除私有配置、运行日志、模型、虚拟环境和本机评审截图 |

## 新电脑安装

先安装 Git 和 [uv](https://docs.astral.sh/uv/getting-started/installation/)，终端确认 `git --version` 和 `uv --version` 可运行。

```sh
git clone https://github.com/Jdb156158/DeepSeekLiveStreaming.git
cd DeepSeekLiveStreaming
./scripts/setup.sh
.venv/bin/python scripts/run.py
```

uv 会在需要时准备 Python 3.11。setup 不自动启动服务；成功后可使用 run.py 或双击启动入口。

没有 uv 时，也可以用已经安装的 Python 3.11 手动准备同样的目录：

```sh
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/bootstrap.py
.venv/bin/python scripts/run.py
```

首次下载需要访问 GitHub / raw.githubusercontent.com 和 Hugging Face。GGUF 约 470 MB，角色素材与运行时约 33 MB，另有 llama.cpp 压缩包。已存在且非空的下载会跳过；当前下载器没有校验和验证，损坏文件需删除对应文件后重新下载。

下载来源在 `scripts/bootstrap.py` 中：

- Live2D 模型、三份运行时与随附许可：`xkk6663/Mao` 固定 commit `93c133d430a9e6336ebce2665997794559421430`。
- 海底背景：参考项目 commit `fa93c083cae4`。
- llama.cpp：官方 `b12144` macOS ARM64 release。
- Qwen：官方 `Qwen2.5-0.5B-Instruct-GGUF` 的 `main` 分支文件；这个来源尚未固定 revision 或哈希。

新增的九张小院背景、太阳伞、小板凳、旧躺椅以及字体已经随代码提交，不需要重新运行图片生成工具。

## 页面与健康检查

| 地址 | 页面或用途 |
| --- | --- |
| `http://127.0.0.1:18080/bricks.html` | 当前主体验：扶砖小院、同页聊天、背景选择和坐凳休息 |
| `http://127.0.0.1:18080/` | 保留的海底聊天预览 |
| `http://127.0.0.1:18080/stage` | 原海底预览的纯净场景；当前没有对应的小院纯净路由 |
| `http://127.0.0.1:18080/api/status` | 对话来源、本地模型健康状态；不返回实际 API Key |
| `http://127.0.0.1:18081/health` | llama.cpp 健康检查 |

```sh
curl http://127.0.0.1:18080/api/status
curl http://127.0.0.1:18081/health
```

本地模式正常时，状态包含 `"provider":"local"`、`"local_ready":true`。`danmaku_connected` 当前应为 `false`，不表示启动故障。

run.py 默认打开海底首页；想直接体验最新功能，手动打开 `/bricks.html`。启动器最多等待约 90 秒。关闭网页不会停止后台进程。

## 配置对话与声音

默认使用本地 Qwen2.5 0.5B，无需 Key，不能把它称作 DeepSeek。小院顶部的聊天区支持 AI 问答、只朗读、语音口型、字幕及停止说话。

切换 DeepSeek：展开“对话模型设置”，选择 DeepSeek API，填写自己的 Key 和可用模型名称后保存。示例中的 `deepseek-flash` 是当前代码默认值，使用者应核对自己的接口可用模型。不要把真实 Key 写入示例文件、代码或 Git。

真实配置为 `.local/settings.json`，保存时权限设为 `0600`。也可以参考 `deploy/settings.example.json` 手动创建。没有配置文件时，后端会读取进程环境中的 `DEEPSEEK_API_KEY`；单独设置这个变量不会自动把默认 provider 从 local 切换为 deepseek。项目不自动加载 `.env`。

在线语音优先使用 Edge 晓晓，失败后尝试 macOS 婷婷。在线配音会发送待朗读文字；DeepSeek 模式会发送聊天内容。本地 Qwen 推理不需要联网。

首次发送会尝试开启声音；浏览器要求用户交互时，点击顶部“开启声音”。聊天比固定扶砖吐槽优先，避免同时说两句。最新开启声音的预览页取得播放权。

## 停止与更新

```sh
.venv/bin/python scripts/run.py --stop
```

启动器通过 `.local/processes.json` 和命令标记停止自己启动的进程，不安装开机启动项。

更新前先确认 `git status`，保留自己的修改。需要更新 Python 后端或部署依赖时：

```sh
.venv/bin/python scripts/run.py --stop
git pull --ff-only
./scripts/setup.sh
.venv/bin/python scripts/run.py
```

只改 HTML/CSS/JS 通常无需重启 Python，但需要刷新浏览器。WebView 曾缓存旧的 ES module：修改入口或引擎后，必要时同步更新 `web/bricks.html` 的入口版本参数和 `web/bricks.mjs` 的引擎 import 版本参数。当前值为 `20261107-rows`。

## 检查与验收

```sh
.venv/bin/python -m compileall -q server.py scripts
node tests/run.mjs
git diff --check
```

Node.js 只用于规则测试，不是运行网页/后端的依赖。当前 15 项测试覆盖长短砖排、连倒接触几何、扶砖时序、排队、暂停、重置、半蹲与坐姿。

浏览器手动验收：

1. 进入小院，确认角色加载，1～6号分别为4、5、6、7、8、9块，前端号码对齐。
2. 推1号，应只扶4块；再推6号，应扶9块，二者累计13块，结束后回板凳。
3. 九套背景均可选，换景保留当前队列及进度。
4. 同页发送聊天，检查回复、语音、口型、字幕和停止按钮；聊天时小院继续运行。
5. 只朗读、暂停/重置小院不误停聊天；窄屏输入框不溢出。

详见 `Verification/README.md`。其中 `.local/*.jpg` 和录制路径是开发机证据，不随 Git 分发，不是部署依赖。

## 常见故障

| 现象 | 排查方式 |
| --- | --- |
| 双击启动提示找不到 Python | 先运行 setup；虚拟环境不是 Git 仓库内容 |
| 角色加载失败 | 检查 `web/assets/model/`、`web/vendor/` 是否下载完整，重新运行 bootstrap |
| 模型未就绪 | 查看 `.local/model.log`，检查 GGUF、ARM64 二进制及 18081 端口 |
| 网页打不开 | 查看 `.local/server.log` 和 18080 端口；不要把别的项目进程直接杀掉 |
| 无声音 | 点击开启声音，查看页面反馈；在线语音失败时确认系统中文语音可用 |
| DeepSeek 返回错误 | 核对 provider、Key、模型名与 API 响应；不要把 Key 粘贴到日志或提交中 |
| 页面仍是旧砖数 | 刷新，并核对 HTML 与引擎的模块版本参数 |

日志和 `.local/llama-key` 含本机运行信息；不要整目录上传。第三方素材来源及限制见 `THIRD_PARTY_NOTICES.md`，接手流程见 `docs/HANDOFF.md`。
