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
- 太阳周日运动弧线，随季节变化
- 赤纬圈、时圈网格
- 可调节观测纬度

## 操作

- 鼠标拖拽旋转视角（Space View 使用 OrbitControls）
- 底部控制面板切换模式、时间速度、显示选项、纬度

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
