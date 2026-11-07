# Integrating a game

Create a review branch in a clean checkout and read the project's instructions. Run `node scripts/detect-engine.mjs --repo ../game` from the toolkit root. If needed, add `--project game`. Run the native baseline first.

```text
node scripts/integrate.mjs --repo ../game --project . --profile web --dry-run
node scripts/integrate.mjs --repo ../game --project . --profile web --apply
```

Review the paths, actions and SHA-256 digests before applying. Each add comes from the toolkit's corresponding source path. A conflicting destination blocks the full apply. The installer uses exclusive creation and attempts to roll back files from a failed call. Run it while the checkout is otherwise idle. For an interrupted process, inspect the file plan and Git diff before retrying. Byte-identical entries are skipped. The named profiles are `web`, `android` (Capacitor web), `godot` and `blender`. The web skill covers visual QA.

For upgrades, review the upstream file diff against the installed commit. Move or merge conflicts manually, then rerun the plan. To uninstall a dedicated installation commit, revert that commit on a branch and resolve subsequent edits deliberately. Optionally use the provided AGENTS snippet and explicitly mirror skills with `node .game-toolkit/scripts/sync-claude.mjs --repo . --apply`. The mirror reports conflicts when local bytes differ.

A draft PR should give the baseline commit, changed files, tests and exact limitations. Keep build and screenshot outputs in local evidence or CI artifacts and exclude secrets.
