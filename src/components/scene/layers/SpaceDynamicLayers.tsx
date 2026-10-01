import { useAppStore } from '../../../store/useAppStore';
import type { AppLanguage } from '../../../utils/i18n';
import SceneBodiesLayer from './SceneBodiesLayer';
import SpaceSunLayer from './SpaceSunLayer';
import SpaceDiurnalLayer from './SpaceDiurnalLayer';

type SimulationDateRef = { current: Date };

export default function SpaceDynamicLayers({ simDateRef, language, showDiurnalArc }: {
  simDateRef: SimulationDateRef; language: AppLanguage; showDiurnalArc: boolean;
}) {
  const showOtherBodies = useAppStore((state) => state.display.showMoon || state.display.showPlanets);
  return <>
    <SpaceSunLayer simDateRef={simDateRef} language={language} showRay={showDiurnalArc} />
    {showOtherBodies && <SceneBodiesLayer simDateRef={simDateRef} language={language} />}
    {showDiurnalArc && <SpaceDiurnalLayer simDateRef={simDateRef} />}
  </>;
}
