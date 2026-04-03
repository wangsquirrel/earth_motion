# Earth Motion

基于 Vite 6 + React 18 + TypeScript + Three.js / R3F 的天文可视化单页应用。

- **Space View**：在 `observer` 或 `celestial` 参考系下观察太阳、月亮、行星、恒星和参考网格
- **Earth View**：站在地面观察天空半球中的太阳周日运动

技术栈：Vite 6 · React 18 · TypeScript 5 · Three.js · `@react-three/fiber` · `@react-three/drei` · Zustand · Tailwind CSS · `astronomy-engine` · Lucide React

## 入口链路

`src/main.tsx` -> `src/App.tsx` -> `ControlPanel` + `SpaceView/EarthView`

## 目录结构

```text
src/
├── App.tsx                          # Canvas + 标题/footer
├── components/scene/
│   ├── SpaceView.tsx                # 主场景，两套参考系可视化
│   ├── SpaceView.constants.ts       # SpaceView 共享常量
│   ├── spaceView.types.ts           # SpaceView 共享类型
│   ├── builders/                    # SpaceView 数据构建与几何辅助
│   ├── layers/                      # SpaceView 图层渲染组件
│   └── EarthView.tsx                # 地面视角，鼠标拖拽控制
├── components/ui/ControlPanel.tsx   # 模式切换、时间、显示开关、农历、纬度
├── store/useAppStore.ts             # 唯一状态源
└── utils/
    ├── astronomy.ts                 # 基础坐标转换
    ├── ephemeris.ts                 # astronomy-engine 封装
    ├── stars.ts                     # 星表 + 中西星官定义
    ├── starField.ts                 # 星点/连线渲染数据（celestial/observer 双框架）
    ├── skyProjection.ts             # 赤道 -> 双 frame 投影
    ├── observerGrid.ts              # observer 网格采样
    └── sunPaths.ts                  # 周日弧采样 + 可见分段
```

## 状态（useAppStore）

- `scene`: `viewMode`, `referenceFrame`, `skyCulture`（默认 `'chinese'`）
- `observer`: `latitude`（默认 `30`）
- `clock`: `currentTime`, `isPlaying`（默认 `true`）, `timeSpeed`（默认 `3600`）, `playbackStartWallTime`, `playbackStartSimTimeMs`
- `display`: `showDiurnalArc`, `showAnnualTrail`（"Show Ecliptic"）, `showStars`, `showCelestialObserverOverlay`, `showMoon`, `showPlanets`

## 场景约定

- App.tsx 建唯一 `<Canvas>`，相机 `position: [0, 5, 20], fov: 60`
- Space/Earth 共用 Canvas，只切换场景组件
- 背景色随 `viewMode` 和 `referenceFrame` 变化
- SpaceView：OrbitControls + `builders/` 组装场景数据 + `layers/` 渲染两套参考系图层
- EarthView：鼠标拖拽(yaw/pitch) + 天空半球 + 赤纬/时圈网格 + 周日弧 + 天地星 + 方向/天顶标签

## 天文约定

- 时间 UTC，经度固定 0°
- `astronomy.ts`: `getJulianDay`, `getGMST`, `equatorialToHorizontal`, `horizontalToCartesian`, `equatorialToCartesian`
- `ephemeris.ts`: `getSunPosition`, `getMoonPosition`, `getPlanetPosition`, `PLANET_BODIES`
- `skyProjection.ts`: `celestialPosition` + `observerPosition` + `isVisible`

## 星图约定

- `CATALOG`：恒星，`id` 稳定
- `CONSTELLATIONS_BY_CULTURE`：中西分组的连线
- `getStarDisplayName`：按文化切换

## 开发命令

```bash
npm run dev    # 开发
npm run check  # 类型检查
npm run build  # 构建
npm run lint   # lint
```

提交前跑 `npm run check` + `npm run build`。

## 协作约束

1. 优先复用已有状态和 utils 函数
2. 视觉修复做局部修正，不改配色/相机/交互
3. 改坐标逻辑时同时检查 observer 和 celestial 两种 frame
4. 不引入 React Router 或新的状态库
5. 改动完成后用 Chrome DevTools MCP 打开浏览器验证生效，且不影响其他功能
