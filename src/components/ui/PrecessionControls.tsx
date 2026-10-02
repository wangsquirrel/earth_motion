import { useAppStore, getSyncedSimTimeMs, getWallNow } from '../../store/useAppStore';
import { getPrecessionCopy } from '../../utils/precessionCopy';
import { isPrecessionDateSupported, PRECESSION_MIN_YEAR, PRECESSION_MAX_YEAR, withEpochYear } from '../../utils/precession';

export default function PrecessionControls() {
  const language = useAppStore(s => s.scene.language);
  const enabled = useAppStore(s => s.display.showPrecession);
  const compare = useAppStore(s => s.display.showPrecessionToday);
  const date = useAppStore(s => s.clock.displayTime);
  const copy = getPrecessionCopy(language);
  const setYear = (year: number) => {
    const state = useAppStore.getState();
    state.setCurrentTime(withEpochYear(new Date(getSyncedSimTimeMs(state.clock, getWallNow())), year));
  };
  return <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-3 text-[11px] text-slate-200">
    <h3 className="mb-2 font-medium text-amber-100">{copy.title}</h3>
    <label className="flex items-center justify-between gap-2">{copy.enabled}
      <input type="checkbox" checked={enabled} onChange={e => useAppStore.getState().setShowPrecession(e.target.checked)} />
    </label>
    {enabled && <div className="mt-3 space-y-3">
      <label className="block">{copy.year}: <output>{date.getUTCFullYear()}</output>
        <input className="mt-2 w-full accent-amber-300" type="range" min={PRECESSION_MIN_YEAR} max={PRECESSION_MAX_YEAR}
          value={Math.max(PRECESSION_MIN_YEAR, Math.min(PRECESSION_MAX_YEAR, date.getUTCFullYear()))}
          aria-label={copy.year} onChange={e => setYear(Number(e.target.value))} />
      </label>
      <div className="flex justify-between text-slate-400"><span>1000 CE</span><span>2000</span><span>3000 CE</span></div>
      <label className="flex items-center justify-between">{copy.compare}
        <input type="checkbox" checked={compare} onChange={e => useAppStore.getState().setShowPrecessionToday(e.target.checked)} />
      </label>
      <p>{copy.legend}</p>
      {!isPrecessionDateSupported(date) && <p className="text-amber-200">{copy.outside}</p>}
      <div className="flex flex-wrap gap-2">
        {[1000, 1500, 2000].map(year => <button type="button" key={year} onClick={() => setYear(year)} className="rounded-lg bg-white/10 px-2 py-1.5">{year} CE</button>)}
        <button type="button" onClick={() => useAppStore.getState().setCurrentTime(new Date())} className="rounded-lg bg-white/10 px-2 py-1.5">{copy.now}</button>
      </div>
      <p className="leading-relaxed">{copy.context}</p>
      <button type="button" className="text-sky-200 underline" onClick={() => { const s = useAppStore.getState(); s.setShowStars(true); s.setSelectedCultureEntryId('ziwei'); }}>{copy.explore}</button>
      <p className="text-[10px] leading-relaxed text-slate-400">{copy.limits}</p>
    </div>}
  </section>;
}
