const ANALYZE_EVENT = "vidplex:analyze";

export function requestAnalyze(url: string) {
  if (!url) return;
  window.dispatchEvent(new CustomEvent<string>(ANALYZE_EVENT, { detail: url }));
}

export function onAnalyze(handler: (url: string) => void) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(ANALYZE_EVENT, listener);
  return () => window.removeEventListener(ANALYZE_EVENT, listener);
}
