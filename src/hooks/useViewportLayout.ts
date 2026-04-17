import { useSyncExternalStore } from 'react';

type ViewportSize = {
  width: number;
  height: number;
};

const FALLBACK_VIEWPORT: ViewportSize = {
  width: 1440,
  height: 900,
};

const viewportListeners = new Set<() => void>();

function getViewportSize() {
  if (typeof window === 'undefined') {
    return FALLBACK_VIEWPORT;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

let viewportSnapshot = getViewportSize();
let removeViewportSubscriptions: (() => void) | null = null;

function emitViewportChange(nextViewport: ViewportSize) {
  if (
    viewportSnapshot.width === nextViewport.width
    && viewportSnapshot.height === nextViewport.height
  ) {
    return;
  }

  viewportSnapshot = nextViewport;
  viewportListeners.forEach((listener) => listener());
}

function ensureViewportSubscriptions() {
  if (removeViewportSubscriptions || typeof window === 'undefined') {
    return;
  }

  const handleViewportChange = () => {
    emitViewportChange(getViewportSize());
  };

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);

  removeViewportSubscriptions = () => {
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('orientationchange', handleViewportChange);
    removeViewportSubscriptions = null;
  };
}

function subscribeViewport(listener: () => void) {
  viewportListeners.add(listener);
  ensureViewportSubscriptions();

  return () => {
    viewportListeners.delete(listener);

    if (viewportListeners.size === 0) {
      removeViewportSubscriptions?.();
    }
  };
}

function getViewportSnapshot() {
  return viewportSnapshot;
}

function getServerViewportSnapshot() {
  return FALLBACK_VIEWPORT;
}

export function useViewportLayout() {
  const viewport = useSyncExternalStore(
    subscribeViewport,
    getViewportSnapshot,
    getServerViewportSnapshot
  );

  return {
    ...viewport,
    isDesktop: viewport.width >= 1024,
  };
}
