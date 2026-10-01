import { memo, useId, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import { CHINESE_SKY_ENTRIES, CULTURE_GROUPS, CULTURE_SOURCES, getCultureEntry, searchCultureEntries } from '../../data/chineseSkyCulture';
import type { CultureGroupId } from '../../data/chineseSkyCulture';
import { getCultureCopy } from '../../utils/cultureCopy';

/** Isolated from the control panel's 10 Hz display clock; no astronomy work on UI ticks. */
function ChineseSkyExplorer() {
  const { language, skyCulture, viewMode, referenceFrame, showStars, selectedId, select, setShowStars } = useAppStore(useShallow((state) => ({
    language: state.scene.language, skyCulture: state.scene.skyCulture, viewMode: state.scene.viewMode,
    referenceFrame: state.scene.referenceFrame, showStars: state.display.showStars,
    selectedId: state.selectedCultureEntryId, select: state.setSelectedCultureEntryId, setShowStars: state.setShowStars,
  })));
  const [open, setOpen] = useState(() => selectedId !== null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<CultureGroupId | undefined>();
  const contentId = useId();
  const copy = getCultureCopy(language);
  const selected = getCultureEntry(selectedId);
  const selectedGroup = CULTURE_GROUPS.find((item) => item.id === selected?.group);
  const filtered = useMemo(() => searchCultureEntries(query, group), [query, group]);
  const selectedIndex = filtered.findIndex((entry) => entry.id === selectedId);
  const color = selectedGroup?.color ?? '#fcd34d';

  function moveSelection(direction: number) {
    if (filtered.length === 0) return;
    const index = selectedIndex < 0 ? (direction > 0 ? 0 : filtered.length - 1)
      : (selectedIndex + direction + filtered.length) % filtered.length;
    select(filtered[index].id);
  }

  return <section className="mt-3 border-t border-white/10 pt-3" aria-label={copy.title}>
    <button type="button" aria-expanded={open} aria-controls={contentId}
      aria-label={open ? copy.close : copy.open}
      className="flex w-full items-center gap-2 rounded-xl p-1.5 text-left hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
      onClick={() => { setOpen(!open); if (open) select(null); }}>
      <BookOpen size={17} className="shrink-0 text-amber-200" />
      <span className="min-w-0 flex-1"><span className="block text-[13px] tracking-widest text-amber-100">{copy.title}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{copy.subtitle}</span></span>
      <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id={contentId} className="mt-3 max-h-[25rem] space-y-3 overflow-y-auto overscroll-contain pr-1 text-xs leading-5">
      <p className="text-slate-300">{copy.intro}</p>
      <p className="text-[10px] leading-4 text-amber-100/70">{copy.legend}</p>
      <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-2.5 py-1.5">
        <Search size={13} className="shrink-0 text-slate-400" />
        <input type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder} value={query}
          onChange={(event) => setQuery(event.target.value)} className="min-w-0 w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500" />
      </label>
      <div className="flex flex-wrap gap-1" role="group" aria-label={copy.title}>
        <button type="button" onClick={() => setGroup(undefined)} aria-pressed={!group}
          className={`rounded-md px-2 py-1 ${!group ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'}`}>{copy.all}</button>
        {CULTURE_GROUPS.map((item) => <button type="button" key={item.id} onClick={() => setGroup(item.id)} aria-pressed={group === item.id}
          className={`rounded-md px-2 py-1 ${group === item.id ? 'bg-white/20' : 'bg-white/5'}`} style={{ color: item.color }}>{item.name}</button>)}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-7" aria-label={copy.select}>
        {filtered.map((entry) => <button type="button" key={entry.id} aria-pressed={selectedId === entry.id}
          title={entry.name} onClick={() => select(entry.id)}
          className={`min-h-[44px] rounded-md border px-0.5 py-1 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200 ${selectedId === entry.id ? 'border-amber-200/70 bg-amber-200/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
          {entry.name}<span className="block h-1 text-center leading-none text-amber-300" aria-hidden="true">{entry.stars.length > 0 ? '·' : ''}</span>
        </button>)}
      </div>
      {filtered.length === 0 && <p role="status" className="text-slate-400">{copy.emptySearch}</p>}
      {selected ? <article className="rounded-xl border bg-black/20 p-3" style={{ borderColor: `${color}55` }} aria-live="polite" aria-atomic="true">
        <div className="flex items-center justify-between gap-2">
          <div><span className="text-[10px] text-slate-400">{selectedGroup?.name} · {copy[selected.kind]}</span>
            <h3 className="text-lg tracking-widest" style={{ color }}>{selected.name}</h3></div>
          <div className="flex gap-1">
            <button type="button" title={copy.previous} aria-label={copy.previous} disabled={!filtered.length} onClick={() => moveSelection(-1)} className="rounded-md bg-white/5 p-1.5 disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button type="button" title={copy.next} aria-label={copy.next} disabled={!filtered.length} onClick={() => moveSelection(1)} className="rounded-md bg-white/5 p-1.5 disabled:opacity-30"><ChevronRight size={16} /></button>
            <button type="button" title={copy.hide} aria-label={copy.hide} onClick={() => select(null)} className="rounded-md bg-white/5 p-1.5"><X size={16} /></button>
          </div>
        </div>
        {selected.order && <p className="mt-1 text-[10px] text-slate-400">{copy.order}{selected.order}{language === 'zh-CN' ? '宿' : ' / 7'}</p>}
        <p className="mt-2 text-slate-300">{selected.summary?.[language] ?? selectedGroup?.description[language]}</p>
        {selected.stars.length > 0 ? <>
          <h4 className="mt-3 text-[10px] tracking-wider text-amber-200">{copy.sample}</h4>
          <ul className="mt-1 space-y-1">{selected.stars.map((star) => <li key={star.id} className="flex flex-wrap justify-between gap-x-2 rounded-md bg-white/5 px-2 py-1">
            <span>{star.chineseName}</span><span className="text-slate-400">{star.designation}{star.properName ? ` · ${star.properName}` : ''}</span>
          </li>)}</ul>
          <p className="mt-2 text-[10px] leading-4 text-slate-400">{copy.sampleNote}</p>
          {!showStars ? <div className="mt-2 text-amber-100"><p>{copy.hiddenStars}</p><button type="button" className="mt-1 rounded-md bg-amber-200/15 px-2 py-1" onClick={() => setShowStars(true)}>{copy.showStars}</button></div>
            : <p className="mt-2 text-[10px] leading-4 text-slate-400">{viewMode === 'space' && referenceFrame === 'celestial' ? copy.celestial : copy.horizon}</p>}
          {skyCulture === 'western' && <p className="mt-2 text-[10px] leading-4 text-sky-200">{copy.western}</p>}
        </> : <p className="mt-2 text-slate-400">{copy.emptyMapping}</p>}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">{selected.sourceIds.map((id) => <a key={id} href={CULTURE_SOURCES[id].url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-300 underline underline-offset-2">{CULTURE_SOURCES[id].label}</a>)}</div>
      </article> : <p className="text-slate-400">{copy.select}</p>}
      <details className="rounded-xl bg-white/5 p-2.5 text-[10px] leading-4 text-slate-400">
        <summary className="cursor-pointer text-slate-300">{copy.sources} · {CHINESE_SKY_ENTRIES.filter((entry) => entry.kind !== 'asterism').length}</summary>
        <p className="mt-2">{copy.history}</p><p className="mt-2">{copy.structure}</p>
        <a href={CULTURE_SOURCES.iau.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sky-300 underline">{CULTURE_SOURCES.iau.label}</a>
      </details>
    </div>}
  </section>;
}

export default memo(ChineseSkyExplorer);
