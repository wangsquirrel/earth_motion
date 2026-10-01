import type { AppLanguage } from '../../utils/i18n';
import { getSceneFallbackCopy } from '../../utils/sceneFallbackCopy';

export default function SceneUnavailable({ language, onRetry }: {
  language: AppLanguage;
  onRetry: () => void;
}) {
  const copy = getSceneFallbackCopy(language);

  return (
    <section
      aria-labelledby="scene-unavailable-title"
      className="absolute inset-x-3 top-[8.5rem] z-10 mx-auto max-w-xl rounded-2xl border border-amber-200/20 bg-[#0b1726]/95 p-4 shadow-xl lg:left-6 lg:right-[29rem] lg:top-1/2 lg:mx-0 lg:max-w-none lg:-translate-y-1/2 lg:p-5"
    >
      <div className="max-h-[max(4rem,calc(44svh-11.5rem))] overflow-y-auto overscroll-contain pr-1 lg:max-h-[max(4rem,calc(100svh-21rem))]">
        <div role="status" aria-live="polite">
          <h2 id="scene-unavailable-title" className="text-sm font-medium text-amber-100 lg:text-base">{copy.title}</h2>
          <p className="mt-2 text-xs leading-5 text-slate-200 lg:text-sm lg:leading-6">{copy.description}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{copy.help}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-sky-200/25 bg-sky-200/10 px-3 py-2 text-xs text-sky-100 transition-colors hover:bg-sky-200/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
        >
          {copy.retry}
        </button>
      </div>
    </section>
  );
}
