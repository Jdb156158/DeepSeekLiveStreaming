# Claude 娘舞蹈素材

扶砖小院背景里打拍子的角色使用这里的立绘。她只跳舞，不说话，不参与推砖和扶砖，也不接收聊天。

## 来源

- 项目：[Chaosnap/Claude_Overdose](https://github.com/Chaosnap/Claude_Overdose)，同人 MV「INTERNET OVERDOSE」Claude-chan 版。
- 立绘制作：原项目使用 OpenAI Codex 图像生成，绿幕抠图后保存为透明 `webp`（原仓库 `public/assets/chars/`）。
- 本项目只复制了所需文件，未修改像素内容。

## 许可

- 原仓库代码与立绘为 **MIT License**，Copyright (c) 2026 Yuki。
- 原仓库另注明：歌曲「INTERNET OVERDOSE」、游戏 `NEEDY GIRL OVERDOSE` 相关内容和 "Claude" 商标不在该 MIT 许可范围内。本项目未使用歌曲、歌词或原作画面，只使用角色立绘。
- "Claude" 是 Anthropic 的商标；这里仅作角色描述使用，本项目与原作、Anthropic 均无关联，也不代表其认可。

## 文件

| 文件 | 用途 |
| --- | --- |
| `dance_00.webp` ～ `dance_10.webp` | 舞蹈关键姿势，按 00→10 循环播放，前一帧交叉淡出 |
| `char_full_angel.webp`、`char_full_book.webp`、`char_stand_wave.webp`、`char_stand_curtsy.webp`、`char_full_shy.webp`、`char_sad_stand.webp` | 备用全身站立姿势，当前未在页面使用 |

## 播放方式

原仓库每个节拍切一张关键帧，并在相邻姿势之间做约 0.22 拍时长的短暂交叉淡入，加上随节拍起伏的上下弹跳。本项目沿用同一做法，节拍由代码按固定 BPM 计算，不依赖音频文件：即使还没开启声音，画面也在按拍子动。
