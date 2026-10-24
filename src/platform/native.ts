import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { lifecycle } from './lifecycle';

export async function bindNativeLifecycle() {
  if (!Capacitor.isNativePlatform()) return () => {};
  lifecycle.setActive('native', false);
  const handles: PluginListenerHandle[] = [];
  // pause fires on Android onPause, earlier than appStateChange's onStop.
  // resume is the matching onResume signal; no background simulation is performed.
  let revision = 0;
  const set = (active: boolean) => { revision++; lifecycle.setActive('native', active); };
  handles.push(await App.addListener('pause', () => set(false)));
  handles.push(await App.addListener('resume', () => set(true)));
  handles.push(await App.addListener('appStateChange', state => set(state.isActive)));
  handles.push(await App.addListener('backButton', () => {
    if (!lifecycle.requestBack()) void App.minimizeApp();
  }));
  const currentRevision = revision;
  const state = await App.getState();
  if (revision === currentRevision) lifecycle.setActive('native', state.isActive);
  return () => { for (const handle of handles) void handle.remove(); };
}
