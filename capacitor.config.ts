import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.kavemankai.idlesouls',
  appName: 'Idle Souls',
  webDir: 'dist-player',
  backgroundColor: '#121f1d',
  android: { allowMixedContent: false, backgroundColor: '#121f1d' },
  plugins: { SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'DARK' } },
};
export default config;
