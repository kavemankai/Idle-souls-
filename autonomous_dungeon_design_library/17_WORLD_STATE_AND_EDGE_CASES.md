# 17 — Persistence, World State and Edge-Case Rules
**Owner:** Data/model design at gameplay level; no code  
**Status:** Persistence principles LOCKED; detailed event ordering PROPOSED

## State partitions
1. **Permanent account/campaign:** mapped terrain, permanently opened gates, first-time boss defeats, campaign flags, unique treasure extracted, banked resources/mastery, unlocked equipment choices, optional rematch records.
2. **Active expedition:** current location, ordered objectives, doctrine, exploration policy, health/stamina/consumables, temporary levels and buffs, carried items/gold/mastery, living enemy groups, patrol positions, active environmental conditions, task progress.
3. **Recoverable death cache:** eligible carried content, valid world position, latest death identity and recovery status (one-cache proposal).
4. **Presentation/Chronicle:** recent combat/world event explanations, route history, observations, notification state.

The game should never use UI visibility as proof an item is secured. A carried item has a different state from a banked item irrespective of screen layout or app pause.

## Event boundaries and precedence
- Map discovery may become permanent as soon as valid exploration occurs.
- Gate activation becomes permanent only after real interaction completes.
- First-world boss defeat commits world-clear and alteration immediately once valid victory is resolved.
- Combat reward transfers into carried inventory at eligible defeat/loot resolution.
- Camp arrival banks current eligible carried assets exactly once.
- Death transfers current eligible carried assets to a cache and closes current expedition; no banking.
- Rematch state is temporary, with results tracked separately from first clear.

## Save and restore invariants
Never allow a pending save/restore, closed browser, crash or offline switch to be treated as victory, physical extraction or death without a corresponding valid game event. Restored run must not duplicate purchases, awarded loot or boss rewards. Previously mapped terrain, opened connections and world alterations survive interruptions.

The prototype should favour suspending active simulation cleanly when app/browser is not actively presenting it. Continuous server-side unattended expeditions are **not a locked feature** and cannot be assumed from hosting platform support.

## Conflict cases
| Case | Required outcome |
|---|---|
| Boss dies as player dies | First defeat remains committed if valid; carried payout follows death rule |
| App closes after cache pick-up but before home | Cache remains in carried state on resume; not banked |
| App closes during camp extraction | Exactly one eligible bank event, no lost or doubled inventory |
| New run starts with prior cache outstanding | Prior marker remains unless replaced by next death under adopted rule |
| Character dies while carrying recovered prior cache | New death cache contains still-carried assets once, not two copies |
| Sanctuary rest interrupted by attack | Heal/upgrade applies only if legitimate safe interaction completed |
| Enemy investigation ends | Enemy returns to normal, no persistent vigilance flag |
| Rematch won/lost | No change to first boss-clear flag or permanent gate state |
| Region conditions reroll | Only per-expedition variables change; geography and secured uniques remain |
| Gate known but not opened | Map shows gate, pathfinder does not treat it as traversable |

## Undo/exploit protection
The player must not be able to reload a save to duplicate rare loot, purchases, banked currency or recovery cache contents. A crash must not require a paid remedy or generate unavoidable loss. Consider autosave at safe boundaries and major event commits, but exact technical persistence cadence is an implementation topic.

## Chronicle consistency
History events should carry stable labels and logical ordering: expedition start, objective change, map discovery, gate action, encounter, resource spend, retreat order, boss outcome, cache pick-up, extraction/death. This is a design information requirement, not a prescribed storage schema. Keep records compact and user-visible where they explain consequence.

## Testing against locked guarantees
Assert after every abnormal exit: no resource automatically banked, no previously opened gate reclosed, no defeated first-world boss revived, no phantom region alarm, no lost starter kit and no duplicated recovery cache.

## Workshop 09 — Plan persistence and validity (hybrid model LOCKED; detail PROPOSED)
The active expedition must retain **objective list and status, chosen waypoints, region avoidances, travel preference, retreat triggers, pending safe-point edits, confirmed versus frontier route segments, current location and return intent**. These are distinct from permanently mapped topology and live encounter state. Reopening the game must revalidate the itinerary against the current known gates and conditions without changing the user's mission silently.

| Edge case | Design invariant |
|---|---|
| Save during prelaunch editing | Draft survives if supported; Launch rechecks path legality |
| New permanent shortcut opens in run | Can be used for return but does not change mandatory waypoints already completed |
| Player marks an impossible avoid/waypoint combination | Conflict shown; cannot silently ignore either; absolute Avoid remains binding even on retreat |
| Danger appears on known safe road | Route may be reassessed; threat observation is current, not permanent map edit |
| Saved last-seen enemy becomes stale | Remove/de-emphasize certainty, preserve last observation if useful |
| A previously viable waypoint becomes inaccessible | Try known permitted alternates; if truly impossible, L14 writes `Skipped — Blocked`, then resumes next permitted ordered task |
| Retreat during active field-order edit | Retreat priority wins; no old task auto-restarts after withdrawal |
| Recovery cache replaced by subsequent death (if adopted) | Existing recovery objective invalidated visibly on next planning session |
| Boss rematch attempted | Original permanent boss-clear state remains untouched |
| Browser interrupted mid-decision | Never count missing input as consent to spend, bank, teleport or face boss |

## Workshop 10 — Persisted absolute-avoidance invariants (LOCK L13)
- Exclusion set belongs to the **active expedition order state**. Save/restore and reprioritising from `Explore` to `Retreat` may not delete or soften it.
- An explicit player removal must be distinguishable from an internal route recalculation, default selection, loading old data or unattended timeout. Preserve the change in the Chronicle/audit trail.
- If a dynamic obstruction leaves no permitted route home, persist `return blocked` independently of health, enemy-search phase and banked inventory. Reopening the game cannot fabricate a route or credit extraction.
- An exclusion forbidding an active current position, forced relocation across a boundary or mutually contradictory orders must produce a visible conflict. Exact validation for mid-expedition edits remains OPEN, but no teleport or secret waiver is permitted.
- Retained fog discoveries, opened gates and permanent boss clear remain independent of a failed extraction, even when the player-caused exclusion contributes to death.

## Workshop 11 — Persisting skip-and-continue faithfully (LOCK L14)
- Persist the **ordered original objectives**, immutable result for each resolved task (`Completed`, `Skipped — Blocked`, `Cancelled by player`), skip reason, current active index, any pending field edits and current observed position. A skipped task must not disappear merely because it was not accomplished.
- Store the non-skippable **Return intent/extraction state independently** of the ordinary task queue. When the queue is exhausted, the game attempts Return, even if zero objectives succeeded. An impossible Return is `Extraction blocked`, not `Skipped`, `Completed` or an eligible bank event.
- Skip is a recorded gameplay outcome, not an automatic revision of avoidance. If a route ban prevented success, the specific exclusion remains active until separately edited by the player. Restoring from a save must not soften that ban.
- A new shortcut or different enemy arrangement discovered after a skip can change future route feasibility, but does not retroactively mark the skipped task complete, refund its missed prize or reinsert it without the player's explicit order.
- A prerequisite dependent on a skipped task should be independently marked skipped for its own observed cause; subsequent unrelated tasks still execute. Never assume the skipped interaction happened just because the character proceeds.
- For Chronicle consistency, record `objective skipped` as a unique event, with timestamp/order, task identity, observed cause and next attempted task. Save/resume must not emit duplicate skip events or duplicated rewards.
- Conflict with a later Retreat or death resolves by event ordering: a valid skip committed before Retreat remains in history, but unprocessed objectives switch to `Suspended by Retreat` rather than also being marked skipped. Death does not retroactively alter completed/skipped tasks.

## Workshop 12 — Pending decisions and sealed-gate persistence
- Record discoveries as permanent map state without implying consent to enter a major fight. A seen/sealed gate is distinct from an unlocked gate; opened gate and boss defeated are separate permanent flags.
- Persist active `safe consequential decision pending` independently of the simulation's combat state. Browser interruption or player absence never equals `chose upgrade`, `spent key`, `engaged encounter`, `won` or `extracted`.
- Proposed key state partitions: `banked at camp`, `allocated/carried at risk`, `spent exactly once`. If gate opening commits, consume eligible key and store opened-gate flag together; otherwise neither changes. No free refund if the valid gate unlock has committed and the hero later dies.
- Mini-boss identity and clear state are separate from major boss clear. No rematch can cause the original first-clear boss to respawn in ordinary territory; rematch gate is opt-in and free of additional *unlock* charge.
- L13 absolute avoidance still forbids intentional entry into opened gate routes if region marked excluded. L14 blocked-task continuation applies when a requested gate/encounter cannot legally occur.
- Save restoration after `gate opened, before encounter confirmed` must remain precisely in that state, not auto-start combat. This preserves the no-surprise-boss player promise.
- See `21` for access state machine and failure scenarios.

## Workshop 13 — Key-type state separation and anti-softlock
Store universal Gate Key balances distinctly from any proposed rare special-key identity. A key's lifecycle (found/carried, banked, assigned, spent) is conceptually separate from a gate's permanent opened flag. Opening must atomically consume **the matching key type** once. No conversion or default substitution between universal and optional special key; an unopened mandatory gate never depends on the rare special category. Validate required route/key supply reachability after optional ordinary-gate spends and key losses so the campaign cannot become permanently stranded. Exact replenishment and whether field-found keys must be banked before use remain OPEN.

## Workshop 14 — Universal Gate Key source state, recovery and consistency
**Creator LOCK L18:** authored discovery rewards and repeatable challenge rewards are different source categories, not interchangeable persistent flags. Track each one-off source's `discovered`, `eligible`, and `claimed` state independently of whether its awarded key is currently banked, carried, cached or spent. A repeatable challenge needs `eligible this expedition`, `attempted`, and `claimed this expedition` states and must reset only when a genuinely new expedition begins. A map reload or room re-entry is not a new expedition.

**PROPOSED key ledger invariant:** every awarded key has exactly one present disposition: carried, banked, assigned, recoverable cache, irrevocably lost per approved cache policy, or consumed through one irreversible gate-open event. An irreversible gate-opening transaction updates key stock and permanent gate state together; an interruption before commit changes neither. A disconnect cannot grant a trial twice or mark a key claimed with no item, outside explicitly recorded loss/spend. An opened gate is independent of boss-first-clear state and the gold bank.

Validate design world reachability for every relevant campaign milestone: there must be a keyless route from camp to a repeatable ordinary-key source despite optional gate unlocks and key losses, except that an intentionally player-forbidden region may prevent the current **ordered** route. Such a ban is a reported restriction, not a content softlock or licence to disobey L13. The keyless trial must not reside only behind a proposed exceptional optional key gate. See 22.

## Workshop 15 — First-bank provenance and atomic world-state commitments (L19)
**World/camp state:** banked universal Gate Key stock; per-gate permanently opened flags; one-time source claim flags; repeatable trial claim per eligible expedition.

**Expedition state:** carried fresh/unbanked keys, carried previously banked/issued eligible keys, active objectives, exclusions, current arena approval state. **Recovery state (if P02 approved):** dropped key counts **and prior banking eligibility**. A key in a death cache may not be treated as newly banked merely because the player physically picks it up. Camp storage is not remotely accessible at gates.

**Critical consistency tests:** A claim event cannot also bank the key; only actual camp extraction can. A gate first-unlock spends an eligible carried key and sets the opened flag together or neither change. A reload between extraction and subsequent launch cannot spawn duplicate banked and carried copies. Repeating an expedition after crashing cannot re-award a one-time source or a trial already claimed in that expedition. If a key was legitimately spent, it cannot reappear in the cache even if death happens in the same frame. If the player loads a save with only fresh keys at a gate, present ineligible—not `Open`.

Exact loss on second death remains PROPOSED P02; eligible prepared-key carrying limit is LOCKED L20 at two. See 23 for the conceptual ledger.

## Workshop 16 — L20 keyring capacity and ledger consistency
Record camp-safe universal key balance independently from each expedition's prepared **two-slot maximum** (`0`, `1` or `2`) and fresh unbanked key cargo. Persist a key's first-bank provenance separately from its current location, and record which gate consumed each eligible prepared unit. If a previously banked key is recovered while both keyring slots are occupied, do not secretly create a third simultaneously spendable prepared key. The overflow-to-cargo treatment is PROPOSED, pending O05/O06; preserve provenance and no duplicate item ownership. Persist individual first-open gate flags and independent boss-clear flags; a successful unlock is an indivisible key-consumption + gate-open event. Validate save/resume against camp bank underflow, remote spending, multiple simultaneous opening prompts, replaying a spend after reload and phantom refunds. See `24`.
