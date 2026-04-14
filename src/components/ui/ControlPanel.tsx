import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Pause,
  Play,
  Settings,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useViewportLayout } from '../../hooks/useViewportLayout';
import { useAppStore } from '../../store/useAppStore';
import { getLanguageCopy } from '../../utils/i18n';

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

interface LanguageSwitchProps {
  isEnglish: boolean;
  onToggle: () => void;
  ariaLabel: string;
  compact?: boolean;
}

function ToggleCard({ label, checked, onChange }: ToggleCardProps) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center justify-between gap-1.5 px-1 py-1">
      <span className="min-w-0 truncate whitespace-nowrap text-[11px] font-medium leading-4 text-slate-100">
        {label}
      </span>
      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sky-400/80' : 'bg-white/14'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
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

function LanguageSwitch({ isEnglish, onToggle, ariaLabel, compact = false }: LanguageSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      className={`group inline-flex items-center rounded-full border border-white/10 bg-black/24 text-slate-200/92 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md transition-colors hover:border-white/16 hover:bg-black/30 ${
        compact ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1.5 text-[11px]'
      }`}
    >
      <span
        className={`relative flex items-center rounded-full border transition-colors ${
          compact ? 'h-5 w-[3rem]' : 'h-6 w-[3.5rem]'
        } ${
          isEnglish ? 'border-sky-300/30 bg-sky-400/14' : 'border-amber-300/24 bg-amber-300/10'
        }`}
      >
        <span className="absolute left-1 text-[8px] font-medium tracking-[0.14em] text-slate-300/80">中</span>
        <span className="absolute right-1 text-[8px] font-medium tracking-[0.14em] text-slate-300/80">EN</span>
        <span
          className={`absolute rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.16)] transition-all ${
            compact ? 'top-[2px] h-3.5 w-[1.35rem]' : 'top-[2px] h-4 w-[1.55rem]'
          } ${
            isEnglish
              ? compact
                ? 'left-[1.35rem] bg-sky-400/95'
                : 'left-[1.55rem] bg-sky-400/95'
              : 'left-[2px] bg-amber-400/95'
          }`}
        />
      </span>
    </button>
  );
}

export default function ControlPanel() {
  const {
    setViewMode,
    setReferenceFrame,
    setSkyCulture,
    setLanguage,
    setLatitude,
    setIsPlaying,
    setTimeSpeed,
    setShowDiurnalArc,
    setShowAnnualTrail,
    setShowMilkyWay,
    setShowStars,
    setShowCelestialObserverOverlay,
    setShowMoon,
    setShowPlanets,
  } = useAppStore(
    useShallow((state) => ({
      setViewMode: state.setViewMode,
      setReferenceFrame: state.setReferenceFrame,
      setSkyCulture: state.setSkyCulture,
      setLanguage: state.setLanguage,
      setLatitude: state.setLatitude,
      setIsPlaying: state.setIsPlaying,
      setTimeSpeed: state.setTimeSpeed,
      setShowDiurnalArc: state.setShowDiurnalArc,
      setShowAnnualTrail: state.setShowAnnualTrail,
      setShowMilkyWay: state.setShowMilkyWay,
      setShowStars: state.setShowStars,
      setShowCelestialObserverOverlay: state.setShowCelestialObserverOverlay,
      setShowMoon: state.setShowMoon,
      setShowPlanets: state.setShowPlanets,
    }))
  );
  const { viewMode, referenceFrame, skyCulture, language } = useAppStore(useShallow((state) => state.scene));
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
    showMilkyWay,
    showStars,
    showCelestialObserverOverlay,
    showMoon,
    showPlanets,
  } = useAppStore(
    useShallow((state) => ({
      showDiurnalArc: state.display.showDiurnalArc,
      showAnnualTrail: state.display.showAnnualTrail,
      showMilkyWay: state.display.showMilkyWay,
      showStars: state.display.showStars,
      showCelestialObserverOverlay: state.display.showCelestialObserverOverlay,
      showMoon: state.display.showMoon,
      showPlanets: state.display.showPlanets,
    }))
  );

  const { height: viewportHeight, isDesktop } = useViewportLayout();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const isCelestialFrame = viewMode === 'space' && referenceFrame === 'celestial';
  const lunarDate = formatLunarDate(displayTime);
  const copy = getLanguageCopy(language);
  const isEnglish = language === 'en';
  const prefersCompactMobile = viewportHeight < 860;
  const showExpandedMobile = !isDesktop && isMobileExpanded;

  useEffect(() => {
    if (!isDesktop) {
      setIsMobileExpanded(!prefersCompactMobile);
    }
  }, [isDesktop, prefersCompactMobile]);

  const handleLatitudeInput = (value: string) => {
    setLatitude(parseFloat(value));
  };

  const latitudeLabel = latitude >= 0
    ? `${Math.abs(latitude).toFixed(1)}°${copy.latitudeDirection.north}`
    : `${Math.abs(latitude).toFixed(1)}°${copy.latitudeDirection.south}`;
  const frameStatusLabel = viewMode === 'space'
    ? (referenceFrame === 'observer' ? copy.app.frameObserver : copy.app.frameCelestial)
    : copy.app.earthView;

  const displayPanel = (
    <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(12,21,34,0.76),rgba(7,13,24,0.9))] p-3.5 text-white shadow-[0_20px_56px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">{copy.panel.display}</div>
        {viewMode === 'space' ? (
          <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
            {referenceFrame === 'observer' ? copy.controls.observer : copy.controls.celestial}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">{copy.panel.view}</div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setViewMode('earth')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-all ${
                viewMode === 'earth'
                  ? 'bg-sky-500/30 text-white shadow-[0_8px_20px_rgba(81,141,255,0.24)]'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Globe size={16} />
              <span>{copy.controls.earth}</span>
            </button>
            <button
              onClick={() => setViewMode('space')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-all ${
                viewMode === 'space'
                  ? 'bg-sky-500/30 text-white shadow-[0_8px_20px_rgba(81,141,255,0.24)]'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Settings size={16} />
              <span>{copy.controls.space}</span>
            </button>
          </div>

          {viewMode === 'space' ? (
            <div className="mt-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">{copy.panel.frame}</div>
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                <button
                  onClick={() => setReferenceFrame('observer')}
                  className={`flex-1 rounded-xl px-3 py-2 text-[13px] transition-all ${
                    referenceFrame === 'observer'
                      ? 'bg-amber-400/85 text-slate-950 shadow-[0_6px_16px_rgba(245,180,70,0.34)]'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {copy.controls.observer}
                </button>
                <button
                  onClick={() => setReferenceFrame('celestial')}
                  className={`flex-1 rounded-xl px-3 py-2 text-[13px] transition-all ${
                    referenceFrame === 'celestial'
                      ? 'bg-sky-400/85 text-slate-950 shadow-[0_6px_16px_rgba(115,197,255,0.34)]'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {copy.controls.celestial}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">{copy.panel.skyCulture}</div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setSkyCulture('chinese')}
              className={`rounded-xl px-3 py-2 text-[13px] transition-all ${
                skyCulture === 'chinese'
                  ? 'bg-emerald-400/85 text-slate-950 shadow-[0_6px_16px_rgba(90,214,177,0.28)]'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {copy.controls.chinese}
            </button>
            <button
              onClick={() => setSkyCulture('western')}
              className={`rounded-xl px-3 py-2 text-[13px] transition-all ${
                skyCulture === 'western'
                  ? 'bg-sky-400/85 text-slate-950 shadow-[0_6px_16px_rgba(115,197,255,0.34)]'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {copy.controls.western}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">{copy.panel.layers}</div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            {viewMode === 'space' ? (
              <ToggleCard
                label={isCelestialFrame ? copy.controls.horizonOverlay : copy.controls.diurnalArc}
                checked={isCelestialFrame ? showCelestialObserverOverlay : showDiurnalArc}
                onChange={isCelestialFrame ? setShowCelestialObserverOverlay : setShowDiurnalArc}
              />
            ) : null}
            <ToggleCard
              label={copy.controls.milkyWay}
              checked={showMilkyWay}
              onChange={setShowMilkyWay}
            />
            <ToggleCard
              label={copy.controls.stars}
              checked={showStars}
              onChange={setShowStars}
            />
            <ToggleCard
              label={copy.controls.moon}
              checked={showMoon}
              onChange={setShowMoon}
            />
            <ToggleCard
              label={copy.controls.planets}
              checked={showPlanets}
              onChange={setShowPlanets}
            />
            <ToggleCard
              label={copy.controls.ecliptic}
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
        <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">{copy.panel.timeControls}</div>
        <div className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
          {copy.panel.utcBadge}
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
                className={`rounded-xl px-2 py-1.5 text-[10px] font-mono transition-all ${
                  timeSpeed === speed
                    ? 'bg-slate-100/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {copy.speed[speed]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(138,196,255,0.12),_transparent_58%),rgba(255,255,255,0.05)] px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] sm:items-center">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{copy.panel.timeUtc}</div>
              <div className="mt-1 text-[1.2rem] font-light tracking-[0.1em] font-mono text-sky-50">
                {formatUtcDate(displayTime)}
              </div>
              <div className="text-[12px] font-mono text-sky-200/75">
                {formatUtcTime(displayTime)} {copy.panel.utcBadge}
              </div>
              {lunarDate ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="uppercase tracking-[0.22em] text-slate-500">{copy.panel.lunar}</span>
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
                  {copy.panel.latitude}
                </span>
                <span className="font-mono text-[11px] normal-case tracking-[0.08em] text-slate-100">
                  {latitudeLabel}
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="0.1"
                value={latitude}
                onInput={(event) => handleLatitudeInput((event.target as HTMLInputElement).value)}
                onChange={(event) => handleLatitudeInput(event.target.value)}
                className="w-full accent-sky-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const desktopLanguageSwitch = (
    <div className="absolute bottom-16 left-4 z-30 hidden lg:block lg:bottom-4 lg:left-6">
      <LanguageSwitch
        isEnglish={isEnglish}
        onToggle={() => setLanguage(isEnglish ? 'zh-CN' : 'en')}
        ariaLabel={copy.panel.language}
        compact
      />
    </div>
  );

  const mobileStatusBar = (
    <div className="absolute inset-x-3 top-0 z-30 mx-auto max-w-xl pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
      <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,18,31,0.86),rgba(7,13,24,0.72))] p-3 text-white shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-sky-100/90">
                {frameStatusLabel}
              </span>
              <span className="truncate text-[11px] uppercase tracking-[0.24em] text-slate-400">
                {copy.app.title}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-200/92">
              <span className="font-mono tracking-[0.08em] text-sky-50">
                {formatUtcTime(displayTime)} {copy.panel.utcBadge}
              </span>
              <span className="text-slate-500">•</span>
              <span>{latitudeLabel}</span>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500">
              {formatUtcDate(displayTime)}
            </div>
          </div>

          <LanguageSwitch
            isEnglish={isEnglish}
            onToggle={() => setLanguage(isEnglish ? 'zh-CN' : 'en')}
            ariaLabel={copy.panel.language}
          />
        </div>
      </div>
    </div>
  );

  const mobileCompactBar = (
    <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,18,31,0.86),rgba(7,13,24,0.94))] p-3.5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/18"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="grid min-w-0 flex-1 grid-cols-4 gap-1">
          {[1, 3600, 86400, 604800].map((speed) => (
            <button
              key={speed}
              onClick={() => setTimeSpeed(speed)}
              className={`rounded-xl px-2 py-2 text-[10px] font-mono transition-all ${
                timeSpeed === speed
                  ? 'bg-slate-100/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {copy.speed[speed]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileExpanded(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-100 transition-colors hover:bg-white/10"
          aria-label={copy.panel.mobileControlsExpand}
        >
          <ChevronUp size={18} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{copy.panel.timeUtc}</div>
          <div className="truncate text-[12px] font-mono tracking-[0.08em] text-sky-50">
            {formatUtcDate(displayTime)} {formatUtcTime(displayTime)}
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] text-slate-100">
          {latitudeLabel}
        </div>
      </div>
    </div>
  );

  const mobileExpandedBar = (
    <div className="h-[min(56svh,34rem)] overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,18,31,0.84),rgba(7,13,24,0.96))] p-3 text-white shadow-[0_22px_56px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/[0.05] px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{copy.panel.mobileControls}</div>
          <div className="truncate text-[12px] font-mono tracking-[0.08em] text-sky-50">
            {formatUtcDate(displayTime)} {formatUtcTime(displayTime)} {copy.panel.utcBadge}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileExpanded(false)}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/16 px-3 py-1.5 text-[11px] text-slate-200 transition-colors hover:bg-white/10"
          aria-label={copy.panel.mobileControlsCollapse}
        >
          <ChevronDown size={16} />
          <span>{copy.panel.mobileMinimize}</span>
        </button>
      </div>

      <div
        className="h-[calc(100%-4.5rem)] overflow-y-auto pr-1 overscroll-contain"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="space-y-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {displayPanel}
          {controlsPanel}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktopLanguageSwitch}

      <div className="absolute right-6 top-6 z-20 hidden max-h-[calc(100svh-3rem)] w-[min(26rem,calc(100vw-4rem))] overflow-y-auto pr-1 lg:block">
        <div className="space-y-3 pb-2">
          {displayPanel}
          {controlsPanel}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 lg:hidden">
        <div className="pointer-events-auto">{mobileStatusBar}</div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-0 z-30 mx-auto max-w-xl pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.35rem))] lg:hidden">
        <div className="pointer-events-auto" style={{ touchAction: showExpandedMobile ? 'pan-y' : 'manipulation' }}>
          {showExpandedMobile ? mobileExpandedBar : mobileCompactBar}
        </div>
      </div>
    </>
  );
}
