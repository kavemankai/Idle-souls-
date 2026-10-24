# Baseline evidence, 2026-10-24

Source: `d4219b1` plus milestone-1 tooling/documentation repairs, branch `milestone-1-baseline`. Run environment, reproduction commands, changes between samples, and limitations are recorded in [BASELINE.md](../BASELINE.md).

- `O1_REPORT.md`: 300 seeds per opponent/doctrine at simulator level 80, balanced focus.
- `pacing-routes.json`, `pacing-farming.json`, `pacing-retreat.json`: 30 seeds per row with the corrected pacing harness. Farming here means repeated active expeditions.
- `pacing-campaign-*.json`: one campaign per policy/start, seed group 1, cap 120 expeditions. Start 9 is a diagnostic, not earned progression.
- `CALIBRATION_NUMBERS.md`: assembled from those isolated pacing files, without the historical curve-fit input. Raw input paths refer to the original run directory; the JSON files are retained alongside this file.
- `boss-report.md`: 30 seeds per row, measured doctrine/balanced focus, starting design levels 1, 5 and 9.
- `perf-report.json`: five timed headless expeditions and the built JS size.
- `browser-repeat.log`: 21 targeted repetitions of O1 dispatch, parity and camera checks.
- `browser-initial.log`: initial complete browser run and its performance measurements.
- `check-final.log`: complete ordered software baseline, including browser checks.

Log line endings and incidental trailing whitespace are normalized for Git.

These are local software measurements, not physical-device or human acceptance evidence. Balance samples do not satisfy the release requirement for 1,000 complete campaigns.
