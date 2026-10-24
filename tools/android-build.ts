import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const mode = process.argv[2];
if (mode !== 'debug' && mode !== 'release') throw new Error('Expected debug or release');
const java = process.env.JAVA_HOME
  ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';
const result = spawnSync(java, [
  '-classpath', 'gradle/wrapper/gradle-wrapper.jar', 'org.gradle.wrapper.GradleWrapperMain',
  '--no-daemon', ...(mode === 'debug' ? ['assembleDebug'] : ['assembleRelease', 'bundleRelease']),
], { cwd: join(import.meta.dirname, '../android'), stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
