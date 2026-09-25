# Earth Motion

天文可视化单页应用，在浏览器中观察太阳、月亮、行星、恒星和天球网格的运行规律。

## 功能

**Space View（空间视角）**
- 以"观测者"或"天球"两种参考系展示太阳系天体和恒星
- 支持赤道网格、黄道、至日/分点标记
- 中西星官星图切换（中国星官 / 西方星座）
- 展示行星位置、太阳周年视运动轨迹

**Earth View（地面视角）**
- 站在地面观察天空半球
- 太阳周日运动，随时间变化
- 赤纬圈、时圈网格
- 可调节观测纬度、经度，并提供常用城市预设

**观测设置**
- 使用 UTC 日期时间输入、“现在”按钮和前后 1 小时 / 1 天步进控制仿真时间
- 通过经纬度或城市预设切换观测位置

## 操作

- 鼠标拖拽旋转视角（Space View 使用 OrbitControls）
- 控制面板切换模式、时间、观测位置、播放速度和显示选项

## 技术栈

- Vite 6 + React 18 + TypeScript 5
- Three.js / @react-three/fiber / @react-three/drei
- Zustand（状态管理）、Tailwind CSS（样式）
- astronomy-engine（天文计算）

## 开始

```bash
npm install
npm run dev
```

## 项目结构

```
src/
├── App.tsx                          # Canvas 入口
├── components/
│   ├── scene/
│   │   ├── SpaceView.tsx            # 空间视角场景
│   │   ├── EarthView.tsx            # 地面视角场景
│   │   ├── builders/                # 场景数据构建
│   │   └── layers/                  # 参考系图层
│   └── ui/
│       └── ControlPanel.tsx         # 控制面板
├── store/
│   └── useAppStore.ts               # 状态管理
└── utils/
    ├── astronomy.ts                 # 基础坐标转换
    ├── ephemeris.ts                 # 天体位置计算
    ├── stars.ts                     # 星表数据
    ├── starField.ts                 # 星点渲染
    ├── skyProjection.ts             # 天球投影
    └── sunPaths.ts                  # 太阳路径
```

## 数值与渲染约定

- 天体、恒星与天球网格统一使用地心 J2000 赤道坐标；地平投影包含岁差、章动和视恒星时，支持南北极与天顶。当前为几何天空演示，未加入站心视差或大气折射。
- 稳定天空通过整体旋转更新，月相由 shader 绘制；暂停后按需刷新，仍可拖动视角和修改观测设置。

## 验证

```bash
npm run test
npm run check
npm run lint
npm run build
```

自动回归覆盖投影、坐标历元、时钟和城市更新；交互与视觉效果还需在浏览器中检查。
