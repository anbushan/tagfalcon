declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

export function trackPageview(url: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  window.gtag("config", measurementId, { page_path: url });
}

export function trackError(message: string, context: Record<string, unknown> = {}) {
  trackEvent("app_error", { message, ...context });
}
