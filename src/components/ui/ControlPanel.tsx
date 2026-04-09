import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { Globe, Play, Pause, Settings, MapPin } from 'lucide-react';

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
  } = useAppStore(
    useShallow((state) => ({
      setViewMode: state.setViewMode,
      setReferenceFrame: state.setReferenceFrame,
      setSkyCulture: state.setSkyCulture,
      setLatitude: state.setLatitude,
      setIsPlaying: state.setIsPlaying,
      setTimeSpeed: state.setTimeSpeed,
      setShowDiurnalArc: state.setShowDiurnalArc,
      setShowAnnualTrail: state.setShowAnnualTrail,
      setShowStars: state.setShowStars,
      setShowCelestialObserverOverlay: state.setShowCelestialObserverOverlay,
      setShowMoon: state.setShowMoon,
      setShowPlanets: state.setShowPlanets,
    }))
  );
  const { viewMode, referenceFrame, skyCulture } = useAppStore(useShallow((state) => state.scene));
  const latitude = useAppStore((state) => state.observer.latitude);
  const { isPlaying, timeSpeed, displayTime } = useAppStore(
    useShallow((state) => ({
      isPlaying: state.clock.isPlaying,
      timeSpeed: state.clock.timeSpeed,
      displayTime: state.clock.displayTime,
    }))
  );
  const {
    showDiurnalArc,
    showAnnualTrail,
    showStars,
    showCelestialObserverOverlay,
    showMoon,
    showPlanets,
  } = useAppStore(
    useShallow((state) => ({
      showDiurnalArc: state.display.showDiurnalArc,
      showAnnualTrail: state.display.showAnnualTrail,
      showStars: state.display.showStars,
      showCelestialObserverOverlay: state.display.showCelestialObserverOverlay,
      showMoon: state.display.showMoon,
      showPlanets: state.display.showPlanets,
    }))
  );

  const isCelestialFrame = viewMode === 'space' && referenceFrame === 'celestial';
  const lunarDate = formatLunarDate(displayTime);
  const handleLatitudeInput = (value: string) => {
    setLatitude(parseFloat(value));
  };

  // NOTE: The rAF-based advanceTime loop has been removed.
  // Time progression is now driven by `useSimulationTime()` inside the Canvas,
  // which updates `displayTime` at ~10fps for this panel.

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

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Layers</div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            {viewMode === 'space' && (
              <ToggleCard
                label={isCelestialFrame ? 'Horizon Overlay' : 'Diurnal Arc'}
                checked={isCelestialFrame ? showCelestialObserverOverlay : showDiurnalArc}
                onChange={isCelestialFrame ? setShowCelestialObserverOverlay : setShowDiurnalArc}
              />
            )}
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
    <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(11,20,33,0.8),rgba(7,13,24,0.94))] p-3 text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Time Controls</div>
        <div className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
          UTC
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-2.5 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/18"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <div className="h-6 w-px bg-white/12" />

          <div className="grid flex-1 grid-cols-4 gap-1">
            {[1, 3600, 86400, 604800].map((speed) => (
              <button
                key={speed}
                onClick={() => setTimeSpeed(speed)}
                className={`rounded-xl px-2 py-1.5 text-[10px] font-mono transition-all ${timeSpeed === speed ? 'bg-slate-100/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]' : 'text-slate-300 hover:bg-white/10'}`}
              >
                {speed === 1 ? '1x' : speed === 3600 ? '1Hr/s' : speed === 86400 ? '1Day/s' : '1Wk/s'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(138,196,255,0.12),_transparent_58%),rgba(255,255,255,0.05)] px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] sm:items-center">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Time (UTC)</div>
              <div className="mt-1 text-[1.2rem] font-light tracking-[0.1em] font-mono text-sky-50">
                {formatUtcDate(displayTime)}
              </div>
              <div className="text-[12px] font-mono text-sky-200/75">
                {formatUtcTime(displayTime)} UTC
              </div>
              {lunarDate ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="uppercase tracking-[0.22em] text-slate-500">Lunar</span>
                  <span className="text-slate-100/90">{lunarDate}</span>
                </div>
              ) : null}
            </div>

            <div className="border-t border-white/10 pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded-full bg-sky-300/10 p-1 text-sky-200">
                    <MapPin size={12} />
                  </span>
                  Latitude
                </span>
                <span className="font-mono text-[11px] normal-case tracking-[0.08em] text-slate-100">
                  {latitude > 0 ? `${latitude.toFixed(1)}°N` : `${Math.abs(latitude).toFixed(1)}°S`}
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="0.1"
                value={latitude}
                onInput={(e) => handleLatitudeInput((e.target as HTMLInputElement).value)}
                onChange={(e) => handleLatitudeInput(e.target.value)}
                className="w-full accent-sky-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="absolute right-6 top-6 z-20 hidden max-h-[calc(100svh-3rem)] w-[min(26rem,calc(100vw-4rem))] overflow-y-auto pr-1 lg:block">
        <div className="space-y-3 pb-2">
          {displayPanel}
          {controlsPanel}
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-3 z-20 max-h-[calc(100svh-1.5rem)] overflow-y-auto lg:hidden">
        <div className="space-y-3 pb-2">
          {displayPanel}
          {controlsPanel}
        </div>
      </div>
    </>
  );
}
