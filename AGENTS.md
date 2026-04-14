# Earth Motion

基于 Vite 6 + React 18 + TypeScript + Three.js / R3F 的天文可视化单页应用。

- `Space View`：`observer` / `celestial` 两套参考系
- `Earth View`：地面视角天空半球

技术栈：Vite 6 · React 18 · TypeScript 5 · Three.js · `@react-three/fiber` · `@react-three/drei` · Zustand · Tailwind CSS · `astronomy-engine`

## 入口

`src/main.tsx` -> `src/App.tsx` -> `ControlPanel` + `SpaceView | EarthView`

## 关键目录

```text
public/
├── favicon.svg
└── fonts/
    └── noto-sans-sc-sc-400.woff*

src/
├── App.tsx
├── data/
│   └── mw.min.geojson
├── components/scene/
│   ├── SpaceView.tsx
│   ├── EarthView.tsx
│   ├── MoonPhaseDisc.tsx
│   ├── sceneLabel.constants.ts
│   ├── builders/
│   └── layers/
├── components/ui/ControlPanel.tsx
├── hooks/useSimulationTime.ts
├── store/useAppStore.ts
└── utils/
    ├── astronomy.ts
    ├── ephemeris.ts
    ├── milkyWay.ts
    ├── skyProjection.ts
    ├── starField.ts
    ├── stars.ts
    └── sunPaths.ts
```

## 状态

- `scene`: `viewMode`, `referenceFrame`, `skyCulture`, `language`
- `observer`: `latitude`（默认 `40`）
- `clock`: `currentTime`, `isPlaying`, `timeSpeed`, `playbackStartWallTime`, `playbackStartSimTimeMs`, `displayTime`
- `display`: `showDiurnalArc`, `showAnnualTrail`, `showMilkyWay`, `showStars`, `showCelestialObserverOverlay`, `showMoon`, `showPlanets`

## 场景约定

- `App.tsx` 保持唯一 `<Canvas>`，相机初始值 `position: [0, 5, 20], fov: 60`
- Space / Earth 共用同一个 Canvas，仅切换场景组件
- 背景色随 `viewMode` 和 `referenceFrame` 变化
- 场景内 `Text` 统一使用 `sceneLabel.constants.ts`，字体来自 `public/fonts/noto-sans-sc-sc-400.woff`
- `SpaceView` 使用 `OrbitControls`，并通过 `builders/` + `layers/` 组织图层
- `EarthView` 使用鼠标拖拽控制视角
- `SpaceView(observer)` 在低速播放（`<= 1时/秒`）时提高动态天层快照频率，优先保证连续旋转感；更重的年度轨迹仍保持节流
- `SpaceView(observer)` 的恒星/星座线/参考网格优先复用天球采样并通过四元数投影到地平系，避免在热路径里重复做整批三角换算
- observer 侧重快照按图层开关按需更新：隐藏的周年轨迹 / 周日轨迹不参与热路径重建；隐藏行星时不计算行星位置
- `language` 只控制界面文案和通用场景辅助标签；`skyCulture` 只控制中国传统星官 / 西方星座及恒星命名，不要混用
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
- 检查 `language=zh-CN/en` 与 `skyCulture=chinese/western` 的交叉组合，确认界面语言与星空文化各自独立
- 改动完成后用 Chrome DevTools MCP 打开页面，做验证！
- 验证不能只生成截图；要明确确认修改已经生效，且未影响无关逻辑
- 提交前运行：

```bash
npm run check
npm run build
```
