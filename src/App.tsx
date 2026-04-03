import { Canvas } from '@react-three/fiber';
import { useAppStore } from './store/useAppStore';
import SpaceView from './components/scene/SpaceView';
import EarthView from './components/scene/EarthView';
import ControlPanel from './components/ui/ControlPanel';

function App() {
  const viewMode = useAppStore((state) => state.scene.viewMode);
  const referenceFrame = useAppStore((state) => state.scene.referenceFrame);
  const frameLabel = referenceFrame === 'observer' ? 'Horizon Frame' : 'Celestial Frame';
  const spaceDescription = referenceFrame === 'observer'
    ? 'Observing the Sun in the local horizon frame.'
    : 'Observing the Sun against the celestial sphere in the celestial frame.';
  const sceneBackground = viewMode === 'space'
    ? (referenceFrame === 'observer' ? '#10273f' : '#09162a')
    : '#050510';
  const githubHandle = import.meta.env.VITE_GITHUB_HANDLE ?? '@wangsquirrel';
  const githubUrl = import.meta.env.VITE_GITHUB_URL ?? 'https://github.com/wangsquirrel';
  const year = new Date().getFullYear();

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#08111d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,191,255,0.18),_transparent_40%),radial-gradient(circle_at_20%_80%,_rgba(255,210,120,0.08),_transparent_28%),linear-gradient(180deg,_#11243a_0%,_#0b1726_45%,_#08111d_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,_rgba(255,255,255,0.04)_0%,_transparent_18%,_transparent_82%,_rgba(0,0,0,0.28)_100%)]" />

      {/* 3D Scene */}
      <Canvas 
        camera={{ position: [0, 5, 20], fov: 60 }}
        className="w-full h-full relative z-10"
      >
        <color attach="background" args={[sceneBackground]} />
        
        {viewMode === 'space' ? <SpaceView /> : <EarthView />}
      </Canvas>

      <div className="absolute inset-x-0 top-0 z-20 h-40 pointer-events-none bg-[linear-gradient(180deg,_rgba(7,16,28,0.8)_0%,_rgba(7,16,28,0.2)_60%,_transparent_100%)]" />

      {/* UI Overlay */}
      <ControlPanel />
      
      {/* Title/Info Overlay */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none max-w-lg">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-sky-100/90 shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-amber-300/90" />
          <span>{viewMode === 'space' ? frameLabel : 'Earth View'}</span>
        </div>
        <h1 className="mt-4 text-3xl font-light tracking-[0.28em] text-white/95">EARTH MOTION</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300/88">
          {viewMode === 'space' 
            ? spaceDescription
            : 'Observing the apparent motion of the Sun from a specific latitude on Earth.'}
        </p>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-3">
        <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/28 px-4 py-2 text-xs text-slate-200/90 backdrop-blur-md">
          <span>© {year} Earth Motion</span>
          <span className="text-slate-400/90">•</span>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sky-200 transition-colors hover:text-sky-100"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
              <path d="M12 0C5.37 0 0 5.5 0 12.28c0 5.42 3.44 10.01 8.2 11.63.6.11.82-.27.82-.6 0-.3-.01-1.08-.02-2.12-3.34.75-4.05-1.67-4.05-1.67-.55-1.43-1.34-1.8-1.34-1.8-1.1-.77.08-.76.08-.76 1.22.09 1.87 1.3 1.87 1.3 1.08 1.92 2.84 1.37 3.53 1.05.11-.81.42-1.37.76-1.68-2.67-.31-5.47-1.37-5.47-6.11 0-1.35.47-2.44 1.24-3.3-.13-.31-.54-1.56.12-3.26 0 0 1.01-.33 3.3 1.26a11.2 11.2 0 0 1 6 0c2.29-1.59 3.3-1.26 3.3-1.26.66 1.7.25 2.95.12 3.26.77.86 1.24 1.95 1.24 3.3 0 4.75-2.8 5.79-5.48 6.1.43.39.82 1.14.82 2.3 0 1.66-.02 2.99-.02 3.39 0 .33.22.72.83.6A12.3 12.3 0 0 0 24 12.28C24 5.5 18.63 0 12 0z" />
            </svg>
            <span>{githubHandle}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
