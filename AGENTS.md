# Earth Motion

基于 Vite 6 + React 18 + TypeScript + Three.js / R3F 的天文可视化单页应用。

- `Space View`：包括`observer` / `celestial` 两套参考系
- `Earth View`：地面视角天空半球

技术栈：Vite 6 · React 18 · TypeScript 5 · Three.js · `@react-three/fiber` · `@react-three/drei` · Zustand · Tailwind CSS · `astronomy-engine`

## 入口

`src/main.tsx` -> `src/App.tsx` -> `ControlPanel` + `SpaceView | EarthView`

## 关键目录

```text
public/
├── favicon.svg                          # 应用图标
├── robots.txt                           # 允许搜索引擎抓取并声明 sitemap
├── sitemap.xml                          # 当前公开页面列表
└── fonts/                               # 静态字体资源
    └── noto-sans-sc-sc-400.woff*        # 场景 Text 统一使用的中文字体

src/
├── App.tsx                              # 应用总装层；唯一 Canvas、背景层、overlay、场景切换入口，以及非视觉 SEO 语义正文/动态 head 同步
├── data/
│   └── mw.min.geojson                   # 银河带原始空间数据，供银河纹理生成
├── components/scene/
│   ├── SpaceView.tsx                    # 空间视角主场景；observer/celestial 切换、相机控制、图层挂载
│   ├── EarthView.tsx                    # 地面视角主场景；天空半球、动态天体和 pointer 拖拽
│   ├── MoonPhaseDisc.tsx                # 月相圆盘渲染组件
│   ├── sceneLabel.constants.ts          # 场景标签字体、字号、锚点和天体标签常量
│   ├── builders/                        # 场景数据构建层；生成几何、快照、投影和采样结果
│   └── layers/                          # 渲染图层组件；把 builder 数据映射为 Three/R3F 节点
├── components/ui/ControlPanel.tsx       # 控制面板与移动端 overlay
├── hooks/
│   ├── useSimulationTime.ts             # 仿真时间推进与 UI 时间同步入口
│   └── useViewportLayout.ts             # 轻量 viewport/layout 判断，不进入业务 store
├── store/useAppStore.ts                 # 全局 Zustand store；维护 scene/observer/clock/display
└── utils/
    ├── astronomy.ts                     # 基础天文坐标换算
    ├── ephemeris.ts                     # 太阳/月亮/行星位置和月相计算
    ├── i18n.ts                          # 中英文界面文案、方向/月名标签
    ├── milkyWay.ts                      # 银河 GeoJSON -> 全天纹理生成
    ├── skyProjection.ts                 # 天球到观察空间的投影工具
    ├── starField.ts                     # 恒星、星座线、标签的可渲染数据构建
    ├── stars.ts                         # 恒星目录与中西星空文化数据源
    └── sunPaths.ts                      # 太阳周年/周日路径采样与辅助计算
```

## 状态

- `scene`: `viewMode`, `referenceFrame`, `skyCulture`, `language`
- `observer`: `latitude`（默认 `40`）
- `clock`: `currentTime`, `isPlaying`, `timeSpeed`, `playbackStartWallTime`, `playbackStartSimTimeMs`, `displayTime`
- `display`: `showDiurnalArc`, `showAnnualTrail`, `showMilkyWay`, `showStars`, `showCelestialObserverOverlay`, `showMoon`, `showPlanets`

## 场景约定

- `App.tsx` 保持唯一 `<Canvas>`，相机初始值 `position: [0, 5, 20], fov: 60`
- Space / Earth 共用同一个 Canvas，仅切换场景组件
- 首屏性能优化优先保持场景级懒加载与独立 chunk，避免两个重场景及其星表/银河数据同时进入初始包
- 首屏优化优先做“根因级”修复：减少首批 `Text` 的 glyph/SDF 构建、避免无效 warmup、保证 fallback 字体资源本地可用；不要默认依赖分步 reveal 掩盖卡顿
- 默认首屏场景不要自己再走 `lazy + Suspense(null)` 空白等待；优先保证当前默认视图能直接进入，非默认视图再按需懒加载
- 类似银河纹理这类辅助重图层，不要在首帧用过高分辨率或不必要的同步计算阻塞基础球体出现
- 场景初始化快照要直接对齐当前同步后的仿真时间和当前显示开关；不要用 `new Date()` 或空图层占位让首帧与 remount 首帧出现错时/缺层
- `useViewportLayout.ts` 作为共享 viewport 信息入口时，应保持单例订阅/单组 window 监听；不要让每个图层实例各自挂 resize listener 和挂载即二次 setState
- 全屏 Canvas 的 DPR 需要设合理上限；桌面端不要直接无上限吃原生 `devicePixelRatio`
- 背景色随 `viewMode` 和 `referenceFrame` 变化
- SEO 增强优先放在非视觉层：`index.html` 的 meta / structured data / noscript，以及 `App.tsx` 中不影响布局的语义文本；不要为了 SEO 改现有视觉效果
- 移动端竖屏采用“顶部状态 + 底部控制”的 overlay；中部画面优先留给天球，桌面端仍保持右侧常驻控制栏；expanded 面板保持固定高度并内部滚动，不通过整页上推侵占顶部状态区
- 场景内 `Text` 统一使用 `sceneLabel.constants.ts`，字体来自 `public/fonts/noto-sans-sc-sc-400.woff`
- Troika 场景文字预热必须带实际会出现的字符集；只 preload 字体文件而不预热 glyph/SDF，不能解决首帧文字卡顿
- 场景文字预热统一走 `src/utils/sceneTextPreload.ts`，并在场景挂载后尽快启动；不要把实际 glyph/SDF warmup 放到根节点首帧渲染前阻塞 Canvas，也不要再延后到 `requestIdleCallback`
- troika `Text` 的 Unicode fallback 数据走本地 `public/unicode-fonts/`；新增场景字符集时要同步补齐 `codepoint-index / font-meta / font-files` 成套资源，避免本地 miss 后回退 CDN
- 移动端场景标签统一按桌面端的 `1.8x` 放大；新增或调整场景文字时优先复用 `useViewportLayout.ts`
- `SpaceView` 使用 `OrbitControls`，并通过 `builders/` + `layers/` 组织图层
- `EarthView` 使用 pointer 拖拽控制视角；移动端触摸拖拽需避免与底部控制区手势冲突
- `SpaceView(observer)` 在低速播放（`<= 1时/秒`）时提高动态天层快照频率，优先保证连续旋转感；更重的年度轨迹仍保持节流
- `SpaceView(observer)` 的恒星/星座线/参考网格优先复用天球采样并通过四元数投影到地平系，避免在热路径里重复做整批三角换算
- observer 侧重快照按图层开关按需更新：隐藏的周年轨迹 / 周日轨迹不参与热路径重建；隐藏行星时不计算行星位置
- `language` 只控制界面文案和通用场景辅助标签；`skyCulture` 只控制中国传统星官 / 西方星座及恒星命名，不要混用
- `utils/stars.ts` 的名称字段要区分来源可信度：没有明确依据时，不要把 `westernSystemName` 的中文翻法回填为 `chineseAsterism`，也不要把中文占位名写进 `westernDesignation`
- `utils/stars.ts` 的 `names` 字段按语义分层维护：`chineseAsterism` 只放中国传统星官/星名，不当作泛中文翻译字段；`westernProper` 只放西方专名（proper name）；`westernDesignation` 只放 Bayer / Flamsteed 这类稳定标准编号；`westernSystemName` 只放面向界面的西方星座系统中文名（如“天鹰座α”“金牛座17”）
- `utils/stars.ts` 里 `StarData.catalog` 是项目内部的展示分组，不是天文学星表来源；补星时要把“名称映射”和“数值来源”分开处理，优先用 Stellarium sky culture / HIP 锁定身份，再用正式星表数值回填 RA/Dec/magnitude
- `utils/stars.ts` 的星官/星座连线优先参考公开 sky culture 数据（当前以 Stellarium skycultures 为准）手工转写到现有 `lines` 结构；缺少中间星时保持保守，只保留有公开依据的线段，不凭视觉直觉跨星直连
- 银河是独立物理天空层，统一由 `utils/milkyWay.ts` 生成；`EarthView`、`Space(observer)`、`Space(celestial)` 共用同一数据源与投影逻辑
- 银河使用真实数据生成的全天纹理，默认弱化显示，并由 `display.showMilkyWay` 独立控制开关
- 英文界面下，农历内容和中国传统星官名称保持中文，不做英文翻译

## 开发约束

1. 优先复用现有 store、builders、utils，不新增状态库或路由。
2. 改 `store` 订阅、`useFrame`、节流快照、memo 依赖时，按高风险行为改动处理。
3. 用户输入不能被低频时间节流吞掉；时间推进和用户输入分开设计。
4. 改坐标/投影逻辑时，同时检查 `observer` 和 `celestial` 两种 frame。
5. 视觉修复做局部修正，不随意改相机、交互、默认展示语义。
6. 做双语相关修改时，优先集中到文案层；避免把 `language` 判断散落到星表和文化数据里。

## 验证

- 至少检查 `slider/toggle -> store -> scene`
- 检查拖动中、切换瞬间、播放中三个时序
- 检查移动端竖屏下顶部状态条、底部控制区和中央天球的占位关系；确认 compact / expanded 两档切换合理，expanded 面板为固定高度 + 内部滚动，且顶部状态条始终可见
- 检查 `language=zh-CN/en` 与 `skyCulture=chinese/western` 的交叉组合，确认界面语言与星空文化各自独立
- 改动完成后用 Chrome DevTools MCP 打开页面，做验证！
- 验证不能只生成截图；要明确确认修改已经生效，且未影响无关逻辑
- 提交前运行：

```bash
npm run check
npm run build
```
