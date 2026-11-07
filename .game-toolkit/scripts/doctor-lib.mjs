import { spawnSync } from 'node:child_process';
import { delimiter, join } from 'node:path';
import { statSync } from 'node:fs';

export function doctor(env = process.env, platform = process.platform, node = process.versions.node) {
  const windows = platform === 'win32';
  const extensions = windows ? ['.exe', '.cmd', '.bat'] : [''];
  const dirs = (env.PATH ?? '').split(delimiter).filter(Boolean);
  const commands = {
    git: ['git'], npm: ['npm'], godot: ['godot', 'godot4', 'godot_console'],
    blender: ['blender'], java: ['java'], adb: ['adb']
  };
  const tools = Object.fromEntries(Object.entries(commands).map(([name, candidates]) => {
    const found = dirs.flatMap(dir => candidates.flatMap(binary => extensions.map(ext => join(dir, binary + ext))))
      .find(file => statSync(file, { throwIfNoEntry: false })?.isFile());
    return [name, found ? 'on PATH' : 'unavailable on PATH'];
  }));
  const git = spawnSync('git', ['--version'], { encoding: 'utf8', timeout: 5000, env });
  return { node, supported: Number(node.split('.')[0]) >= 22, platform, tools,
    gitVersion: git.status === 0 ? git.stdout.trim() : null,
    androidSdkConfigured: Boolean(env.ANDROID_HOME || env.ANDROID_SDK_ROOT),
    javaHomeConfigured: Boolean(env.JAVA_HOME) };
}
