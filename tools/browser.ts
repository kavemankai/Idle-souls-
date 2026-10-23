import { existsSync } from 'node:fs';
/** System Chromium in the cloud; Playwright-managed Chromium on fresh local installs. */
export const browserLaunchOptions={
  executablePath:process.env.CHROMIUM_PATH??(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),
  headless:true,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
};
