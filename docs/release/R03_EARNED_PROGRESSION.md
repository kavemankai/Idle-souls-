# R03 — earned permanent progression (engineering record)

Status: **draft PR #30**, stacked on R02 PR #29, in turn stacked on merged Android CI PR #28. Do not merge R03 before the durable settlement and replay PR has independently passed.

## Design: campaign progression, never a debug grant

A new save starts at design level 1 and with zero ranks, gold and mastery. Level XP earned **inside** an expedition remains temporary; the Broken Pump sanctuary still gives only temporary upgrades and its existing rules are unchanged.

The following rank prices are in **banked** resources, not carried loot:

| Permanent upgrade | Rank 1 | Rank 2 | Rank 3 | Effect |
| --- | --- | --- | --- | --- |
| Training | 8 mastery | 20 mastery | 40 mastery | +1 initial design level/rank (maximum initial level 4) |
| Sharpen sword | 20 gold + 4 mastery | 45 gold + 10 mastery | — | +2 swingSkill/rank |
| Reinforce shield | 20 gold + 4 mastery | 45 gold + 10 mastery | — | +2 guardStrength/rank |

These are **trial prices** pending measured campaign balance. Existing combat stat ceiling remains 20. Effective starting power is derived from checked `SaveV3.camp.permanent` and frozen into `ExpeditionConfig` on dispatch. The world runner applies these points through the existing stat-allocation path. It does not modify combat mechanics, AI, RNG or golden files.

## Economic and transaction invariants

- Upgrade purchases call `commitPurchase`, an atomic durable revision + idempotency-ID transaction. No success is displayed until persisted; a storage failure grants nothing.
- Purchase requires the current expected rank, an available next rank, enough banked gold **and** mastery, and **no active expedition**. It rejects stale input, rank cap, unknown upgrades, negative funds and invalid IDs.
- Extracted loot is first awarded by the original simulator and `settle`, never an XP/debug endpoint. Carried loot and death caches cannot buy permanent ranks.
- Duplicate purchase IDs are accepted only as no-ops. Repeated settlement IDs are also no-ops.
- The developer harness retains its fixed-level/seed controls; the packaged player ignores these query parameters. Production builds use saved paid ranks.

## Verification

- Unit tests cover clean zero-rank start, unfunded rejection, all prices/caps, stale rank rejection, failed commit, duplicate transaction, no purchase during expedition and changed effective launch stats.
- The real-campaign economic test `tests/earnedCampaign.test.ts` starts at zero money and zero ranks, runs the first **24 sequential seeds** without HP override or a debug level, settles actual Chronicles, and attempts to buy training **only after enough mastery has been banked**. This sample is intentionally not hand-selected for favourable outcomes.
- `tests/durableSave.test.ts` covers the prerequisite exactly-once settlement and replay. Existing simulator goldens must be unchanged.
- Required evidence before sign-off: observed extraction/death rate and mastery income, one real fresh-save purchase, reload persistence, power applied to a subsequent expedition, paid upgrade retained after death, player UI under touch, and low-end Android performance.
- Do not claim organic upgrade acquisition, device retention or campaign pacing based solely on the presence of a test file. The test must execute and pass. Any failed economics test requires a documented design decision, not rewriting expected values.

## Release gate

R03 remains open until R02 has been approved and end-to-end fresh-campaign evidence plus basic device validation are available. Price tuning is a product-design decision; do not alter the simulator or pre-existing golden outputs to manufacture affordable upgrades.
