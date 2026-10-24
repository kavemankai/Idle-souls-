import { lifecycle } from './lifecycle';

/** Also runs inside the WebView: native and DOM signals must both permit play. */
export function bindBrowserLifecycle() {
  const visibility = () => lifecycle.setActive('document', !document.hidden);
  const hide = () => lifecycle.setActive('page', false);
  const show = () => lifecycle.setActive('page', true);
  const back = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && lifecycle.requestBack()) event.preventDefault();
  };
  visibility();
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  window.addEventListener('keydown', back);
  return () => {
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', hide);
    window.removeEventListener('pageshow', show);
    window.removeEventListener('keydown', back);
  };
}
