const isPerfDebugEnabled = import.meta.env.DEV;

const loggedOnceLabels = new Set<string>();

export function perfNow() {
  return isPerfDebugEnabled ? performance.now() : 0;
}

export function reportPerf(
  label: string,
  durationMs: number,
  options?: {
    once?: boolean;
    thresholdMs?: number;
  }
) {
  if (!isPerfDebugEnabled) {
    return;
  }

  const once = options?.once ?? true;
  const thresholdMs = options?.thresholdMs ?? 0;

  if (durationMs < thresholdMs) {
    return;
  }

  if (once && loggedOnceLabels.has(label)) {
    return;
  }

  if (once) {
    loggedOnceLabels.add(label);
  }

  console.info(`[perf] ${label}: ${durationMs.toFixed(1)}ms`);
}

export function measurePerf<T>(
  label: string,
  fn: () => T,
  options?: {
    once?: boolean;
    thresholdMs?: number;
  }
) {
  if (!isPerfDebugEnabled) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  reportPerf(label, performance.now() - start, options);
  return result;
}
