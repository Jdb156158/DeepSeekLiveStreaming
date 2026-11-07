# 扶砖小院背景

## 当前太阳伞与小板凳

当前页面使用 `rest-parasol.png` 和 `rest-stool.png`，角色并膝坐凳看手机，不再显示躺姿。小板凳为内置 imagegen 生成的透明素材（1355×1161 RGBA），提示词见 [stool-prompt.json](stool-prompt.json)。手机由代码绘制，姿态由运行时网格与模型参数实现。

所有提示词记录中的 `file` 指向本目录实际部署素材，`source` 只保留生成物标识，不依赖制作电脑上的绝对路径。恢复应用无需访问原始图片工具目录。

## 保留的躺椅探索素材

`rest-lounge-cream.png` 是保留的历史方案：在原条纹躺椅上用内置 imagegen 编辑配色，换成浅奶油色椅垫、蜜桃色靠枕和浅木框，降低纹理干扰。原蓝白素材也保留。最终编辑提示词见 [lounge-cream-prompt.json](lounge-cream-prompt.json)。

2026-11-06 使用内置 imagegen 工具分别生成 `rest-parasol.png` 和 `rest-lounge.png`，均为 1254×1254 RGBA 透明素材，已保存到本目录。蓝白像素画风与二次元海边背景搭配，图片不含角色、手机或文字；手机与角色休息/起身由代码实现。最终提示词和生成来源路径见 [rest-prop-prompts.json](rest-prop-prompts.json)。

## 新增二次元像素背景

2026-11-06 使用内置 imagegen 工具独立生成三张背景。原六套素材全部保留。新素材使用蓝白与靛蓝色系、阶梯轮廓及有限色阶，前景保留连续平地供角色和砖块叠加；应用与缩略图使用最近邻方式呈现像素边缘。

| 控制台名称 | 素材 | 场景 |
| --- | --- | --- |
| 像素·海边 | `pixel-seaside.png` | 海边街角、蓝瓦白墙、绣球花 |
| 像素·樱庭 | `pixel-sakura.png` | 樱花校园、冷灰石地 |
| 像素·天台 | `pixel-rooftop.png` | 星夜天台、城市远景 |

完整最终提示词、工具模式与生成来源路径见 [pixel-scene-prompts.json](pixel-scene-prompts.json)。三张文件均已存入本目录，运行时无需外部图片服务。

- 文件：`garden-courtyard.png`。
- 生成方式：内置 imagegen 工具；未使用 CLI 或外部 API Key。
- 日期：2026-11-06。
- 用途：PixiJS 场景中的完整庭院底图，与动态砖块和角色共用 1000 × 1000 的逻辑坐标。
- 图内不含角色、砖块、文字或交互按钮；这些均由实际代码绘制。
- 字体：站酷快乐体，从 [Google Fonts 官方仓库](https://github.com/google/fonts/tree/main/ofl/zcoolkuaile) 下载，许可见 `../fonts/OFL.txt`。

## 六套可切换背景

| 场景 | 本地文件 |
| --- | --- |
| 海边小院 | `garden-courtyard.png` |
| 樱花庭院 | `sakura-courtyard.png` |
| 蘑菇森林 | `forest-courtyard.png` |
| 糖果乐园 | `candy-courtyard.png` |
| 雪顶小镇 | `snow-courtyard.png` |
| 星光花园 | `starlight-courtyard.png` |

新增五张使用内置 imagegen 工具，以原小院作为画风与镜头参考分别生成。完整最终提示词在 [scene-prompts.json](scene-prompts.json)。素材均复制到本项目中使用，不依赖外部图片链接。每个背景保留相同的开阔地面区域。

## 最终生成提示词

```text
Use case: stylized-concept. Asset type: finished background artwork for a playable cute cartoon live-stream minigame, NOT a UI mockup. Create one square 1024x1024 full-bleed environment image. A cozy pastel seaside cottage garden for an anime whale-girl who tidies colorful toy domino blocks. Premium hand-painted 3D toy diorama / cozy Nintendo-style mobile game environment, soft rounded chunky shapes, warm cream sand, peach stone, mint grass, pale sky blue, coral flowers. Camera elevated about 35 degrees, looking slightly down over the entire garden from the front, moderate perspective, not a top-down map. Layout essential: top 0-17% pale blue sky and rounded fluffy clouds; top-left a tiny cream and mint cottage with curved peach roof and round window, top-right a rounded flowering tree and a small blue whale-shaped garden watering decoration; around the outer left/right borders low rounded bushes, daisies and a low wooden garden fence. The central playable ground must be EMPTY and very spacious: from x 10%-95%, y 43%-94%, a broad flat uninterrupted pale warm sandy/peach courtyard, seamlessly extending to and beyond the bottom edge of the image. Some very subtle sand texture and a few tiny pebbles only at outer edges. No objects or markings on the central ground, no obvious circle or rectangular pad. All elements firmly rest on the same ground with soft ambient contact shadows, gentle light from upper left. No floating islands, no raised platform, no visible platform thickness, no tabletop, no aquarium, no interior room. Avoid cinematic realism, dark colors, hard sharp shapes or excessive decorative clutter. Absolutely no people or characters, no dominoes or bricks, no text, no labels, no letters, no logos, no watermark. Crisp beautiful detailed game environment, charming illustration, usable spacious foreground for overlaying actual game objects.
```
