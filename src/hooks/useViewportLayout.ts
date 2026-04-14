import { useEffect, useState } from 'react';

function getViewportSize() {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function useViewportLayout() {
  const [viewport, setViewport] = useState(getViewportSize);

  useEffect(() => {
    const updateViewport = () => {
      setViewport(getViewportSize());
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return {
    ...viewport,
    isDesktop: viewport.width >= 1024,
  };
}
