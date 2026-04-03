import { useAppStore } from '../../store/useAppStore';
import { Globe, Play, Pause, Settings, MapPin } from 'lucide-react';
import { useEffect } from 'react';

function formatUtcDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatUtcTime(date: Date) {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatLunarDate(date: Date) {
  try {
    const raw = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

    const chineseDigits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const toChineseDay = (value: number) => {
      if (value <= 10) return `初${value === 10 ? '十' : chineseDigits[value]}`;
      if (value < 20) return `十${chineseDigits[value % 10]}`;
      if (value === 20) return '二十';
      if (value < 30) return `廿${chineseDigits[value % 10]}`;
      if (value === 30) return '三十';
      return `三十${chineseDigits[value % 10]}`;
    };

    const yearMatch = raw.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]年)/);
    const monthMatch = raw.match(/(闰?[正一二三四五六七八九十冬腊]+月)/);
    const dayMatch = raw.match(/(\d+)$/);
    if (!yearMatch || !monthMatch || !dayMatch) {
      return raw;
    }

    return `${yearMatch[1]}${monthMatch[1]}${toChineseDay(Number(dayMatch[1]))}`;
  } catch {
    return null;
  }
}

interface ToggleCardProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleCard({ label, checked, onChange }: ToggleCardProps) {
  return (
    <label
      className="flex min-w-0 cursor-pointer items-center justify-between gap-1.5 px-1 py-1"
    >
      <span className="min-w-0 truncate whitespace-nowrap text-[11px] font-medium leading-4 text-slate-100">{label}</span>
      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sky-400/80' : 'bg-white/14'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`absolute top-[2px] h-3 w-3 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </label>
  );
}

export default function ControlPanel() {
  const { 
    setViewMode, 
    setReferenceFrame,
    setSkyCulture,
    setLatitude,
    setIsPlaying,
    setTimeSpeed,
    setShowDiurnalArc,
    setShowAnnualTrail,
    setShowStars,
    setShowCelestialObserverOverlay,
    setShowMoon,
    setShowPlanets,
    advanceTime
  } = useAppStore();
  const { viewMode, referenceFrame, skyCulture } = useAppStore((state) => state.scene);
  const { latitude } = useAppStore((state) => state.observer);
  const { currentTime, isPlaying, timeSpeed } = useAppStore((state) => state.clock);
  const {
    showDiurnalArc,
    showAnnualTrail,
    showStars,
    showCelestialObserverOverlay,
    showMoon,
    showPlanets,
  } = useAppStore((state) => state.display);

  const isCelestialFrame = viewMode === 'space' && referenceFrame === 'celestial';
  const lunarDate = formatLunarDate(currentTime);

  // Animation loop for time progression
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;

    const tick = (now: number) => {
      advanceTime(now);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, advanceTime]);

  const displayPanel = (
    <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(12,21,34,0.76),rgba(7,13,24,0.9))] p-3.5 text-white shadow-[0_20px_56px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Display</div>
        {viewMode === 'space' && (
          <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
            {referenceFrame === 'observer' ? 'Horizon' : 'Celestial'}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">View</div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setViewMode('earth')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-all ${viewMode === 'earth' ? 'bg-sky-500/30 text-white shadow-[0_8px_20px_rgba(81,141,255,0.24)]' : 'text-slate-300 hover:bg-white/10'}`}
            >
              <Globe size={16} />
              <span>Earth</span>
            </button>
            <button
              onClick={() => setViewMode('space')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-all ${viewMode === 'space' ? 'bg-sky-500/30 text-white shadow-[0_8px_20px_rgba(81,141,255,0.24)]' : 'text-slate-300 hover:bg-white/10'}`}
            >
              <Settings size={16} />
              <span>Space</span>
            </button>
          </div>

          {viewMode === 'space' ? (
            <div className="mt-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Frame</div>
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                <button
                  onClick={() => setReferenceFrame('observer')}
                  className={`flex-1 rounded-xl px-3 py-2 text-[13px] transition-all ${referenceFrame === 'observer' ? 'bg-amber-400/85 text-slate-950 shadow-[0_6px_16px_rgba(245,180,70,0.34)]' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  Horizon
                </button>
                <button
                  onClick={() => setReferenceFrame('celestial')}
                  className={`flex-1 rounded-xl px-3 py-2 text-[13px] transition-all ${referenceFrame === 'celestial' ? 'bg-sky-400/85 text-slate-950 shadow-[0_6px_16px_rgba(115,197,255,0.34)]' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  Celestial
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {viewMode === 'space' ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
            <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Sky Culture</div>
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              <button
                onClick={() => setSkyCulture('chinese')}
                className={`rounded-xl px-3 py-2 text-[13px] transition-all ${skyCulture === 'chinese' ? 'bg-emerald-400/85 text-slate-950 shadow-[0_6px_16px_rgba(90,214,177,0.28)]' : 'text-slate-300 hover:bg-white/10'}`}
              >
                Chinese
              </button>
              <button
                onClick={() => setSkyCulture('western')}
                className={`rounded-xl px-3 py-2 text-[13px] transition-all ${skyCulture === 'western' ? 'bg-sky-400/85 text-slate-950 shadow-[0_6px_16px_rgba(115,197,255,0.34)]' : 'text-slate-300 hover:bg-white/10'}`}
              >
                Western
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Layers</div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            <ToggleCard
              label={isCelestialFrame ? 'Horizon Overlay' : 'Diurnal Arc'}
              checked={isCelestialFrame ? showCelestialObserverOverlay : showDiurnalArc}
              onChange={isCelestialFrame ? setShowCelestialObserverOverlay : setShowDiurnalArc}
            />
            <ToggleCard
              label="Stars"
              checked={showStars}
              onChange={setShowStars}
            />
            <ToggleCard
              label="Moon"
              checked={showMoon}
              onChange={setShowMoon}
            />
            <ToggleCard
              label="Planets"
              checked={showPlanets}
              onChange={setShowPlanets}
            />
            <ToggleCard
              label="Ecliptic"
              checked={showAnnualTrail}
              onChange={setShowAnnualTrail}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const controlsPanel = (
    <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(11,20,33,0.8),rgba(7,13,24,0.94))] p-3.5 text-white shadow-[0_20px_56px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Time Controls</div>
        <div className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
          UTC
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/18"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="h-7 w-px bg-white/12" />

          <div className="grid flex-1 grid-cols-2 gap-1.5">
            {[1, 3600, 86400, 604800].map((speed) => (
              <button
                key={speed}
                onClick={() => setTimeSpeed(speed)}
                className={`rounded-xl px-2.5 py-1.5 text-[11px] font-mono transition-all ${timeSpeed === speed ? 'bg-slate-100/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]' : 'text-slate-300 hover:bg-white/10'}`}
              >
                {speed === 1 ? '1x' : speed === 3600 ? '1Hr/s' : speed === 86400 ? '1Day/s' : '1Wk/s'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(138,196,255,0.12),_transparent_58%),rgba(255,255,255,0.05)] px-4 py-3 text-center shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
          <div className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Time (UTC)</div>
          <div className="mt-1.5 text-[1.45rem] font-light tracking-[0.12em] font-mono text-sky-50">
            {formatUtcDate(currentTime)}
          </div>
          <div className="mt-0.5 text-[13px] font-mono text-sky-200/75">
            {formatUtcTime(currentTime)} UTC
          </div>
          {lunarDate ? (
            <div className="mt-2.5 border-t border-white/10 pt-2.5">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Lunar</div>
              <div className="mt-1 text-[13px] text-slate-100/90">
                {lunarDate}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
          <div className="rounded-full bg-sky-300/10 p-1.5 text-sky-200">
            <MapPin size={16} />
          </div>
          <div className="flex w-full flex-col">
            <div className="mb-1.5 flex justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <span>Latitude</span>
              <span className="font-mono text-slate-100">{latitude > 0 ? `${latitude.toFixed(1)}°N` : `${Math.abs(latitude).toFixed(1)}°S`}</span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              step="0.1"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="w-full accent-sky-400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="absolute right-6 top-6 z-20 hidden w-[min(26rem,calc(100vw-4rem))] lg:block">
        <div className="space-y-3">
          {displayPanel}
          {controlsPanel}
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-20 lg:hidden">
        <div className="space-y-4">
          {displayPanel}
          {controlsPanel}
        </div>
      </div>
    </>
  );
}
