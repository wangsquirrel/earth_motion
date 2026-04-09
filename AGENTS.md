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
    ├── skyProjection.ts
    ├── starField.ts
    ├── stars.ts
    └── sunPaths.ts
```

## 状态

- `scene`: `viewMode`, `referenceFrame`, `skyCulture`
- `observer`: `latitude`（默认 `40`）
- `clock`: `currentTime`, `isPlaying`, `timeSpeed`, `playbackStartWallTime`, `playbackStartSimTimeMs`, `displayTime`
- `display`: `showDiurnalArc`, `showAnnualTrail`, `showStars`, `showCelestialObserverOverlay`, `showMoon`, `showPlanets`

## 场景约定

- `App.tsx` 保持唯一 `<Canvas>`，相机初始值 `position: [0, 5, 20], fov: 60`
- Space / Earth 共用同一个 Canvas，仅切换场景组件
- 背景色随 `viewMode` 和 `referenceFrame` 变化
- 场景内 `Text` 统一使用 `sceneLabel.constants.ts`，字体来自 `public/fonts/noto-sans-sc-sc-400.woff`
- `SpaceView` 使用 `OrbitControls`，并通过 `builders/` + `layers/` 组织图层
- `EarthView` 使用鼠标拖拽控制视角

## 开发约束

1. 优先复用现有 store、builders、utils，不新增状态库或路由。
2. 改 `store` 订阅、`useFrame`、节流快照、memo 依赖时，按高风险行为改动处理。
3. 用户输入不能被低频时间节流吞掉；时间推进和用户输入分开设计。
4. 改坐标/投影逻辑时，同时检查 `observer` 和 `celestial` 两种 frame。
5. 视觉修复做局部修正，不随意改相机、交互、默认展示语义。

## 验证

- 至少检查 `slider/toggle -> store -> scene`
- 检查拖动中、切换瞬间、播放中三个时序
- 改动完成后用 Chrome DevTools MCP 打开页面，做验证！
- 验证不能只生成截图；要明确确认修改已经生效，且未影响无关逻辑
- 提交前运行：

```bash
npm run check
npm run build
```
