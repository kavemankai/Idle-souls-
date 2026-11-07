import { doctor } from './doctor-lib.mjs';
import { print, run } from './lib.mjs';
run(() => {
  const result = doctor();
  print(result);
  if (!result.supported) process.exitCode = 1;
}, {});
