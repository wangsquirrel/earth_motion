import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback: (retry: () => void) => ReactNode;
};

/** Isolate graphics initialization/render errors from the surrounding DOM UI. */
export default class CanvasErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  // Do not reset on scene, language or viewport changes: an unavailable graphics
  // context must not turn normal UI interaction into an automatic retry loop.
  private retry = () => {
    this.setState({ failed: false });
  };

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}
