# 23 — Gate Key Banking, Expedition Loadout and First-use Eligibility
**Owner:** Gate Key first-use economy and expedition provisioning
**Status:** L19 camp-before-first-use and L20 max two prepared Gate Keys LOCKED; L16/L17/L18/L06 preserved. Numeric gate charges, death-cache replacement and special-key extension OPEN/PROPOSED.
**Updated:** 2026-10-23
**Related:** 04, 08, 09, 11, 12, 15, 16, 17, 21, 22

## 1. Locked design promise
A **newly found or earned universal Gate Key is never immediately spendable at a fog gate**. The character must physically return to **camp**, completing that expedition and banking it. On a **later expedition**, the player may deliberately provision the banked key and carry it to an unopened standard boss or miniboss fog gate. Only eligible, physically carried keys may be consumed for that gate's first permanent unlock. Unlocking does not enter the boss fight. No sanctuary, rest, pause, death-cache pickup, boss victory or UI shortcut can bank a key.

The creator chose first-use option A specifically to create a meaningful **acquisition/extraction run** and a subsequent **prepared gate run**, without any external-time waiting. Nothing in this rule changes the single sword-and-shield starter kit or grants combat AI any currency authority.

## 2. Key location and eligibility are different concepts
| Key condition | Where is it? | Eligible for first gate unlock? | Risk |
|---|---|---|---|
| Freshly discovered / earned | Carried on acquisition run | **No** | At risk until camp |
| Recovered from cache, never previously banked | Carried on recovery run | **No** | Still at risk until camp |
| Banked at actual camp | Safe storage | **Not remotely:** must be issued to an expedition | Safe while left at camp |
| Previously banked and issued from camp | Carried on a later run | **Yes**, once authorised and with sufficient quantity | At risk if unspent |
| Recovered from cache, already banked on an earlier run | Carried, under provisional cache rule | **Yes** if prior eligibility is preserved | At risk until camp/spend |
| Spent on first permanent unlock | Consumed | No longer exists | Gate stays open regardless of later death |

**Provenance matters.** A fresh key plus an issued key must not be merged into an unqualified `2 keys available` number at a gate. Illustrative quantities do not set a carry limit or cost.

## 3. Expedition workflow — what the player actually does
1. At camp, plan a normal exploration or repeatable Key Trial expedition. If no previously banked key is packed, `Open gate` objectives cannot be satisfied by a key that might be found later on this run.
2. Discover or win a universal key through L18's guaranteed or challenging source. Inventory shows `Fresh key — must extract before use`.
3. Optionally complete other **permitted** tasks. Any mandatory open-gate objective encountered without a separately issued eligible key follows L14's `Skipped — Blocked`; no unintended route ban override or automatic boss engagement.
4. Physically extract to camp. The key moves into banked stock **exactly once**; the expedition ends. Reaching a sanctuary, revealing a new shortcut or completing a boss does not bank it.
5. Prepare a later expedition. Player deliberately assigns some previously banked keys to the loadout; the strict **two-slot prepared keyring** is LOCKED L20; the player may issue 0, 1 or 2 banked universal Gate Keys.
6. Navigate on permitted routes. At an unopened gate, player makes a deliberate first-unlock decision. Only eligible carried keys may be spent. The opened flag and eligible key consumption persist together.
7. Independently choose whether to enter combat or withdraw; future rematches and passage through already unlocked gates cost no new first-unlock key.

## 4. Safety and economic balancing
- **Two trips, not a timer.** A player who banks a key at camp can immediately launch a prepared boss expedition; no artificial cooldown, required daily quest or purchasable bypass.
- **No remote spending.** Banked keys stored at camp are not available to the character until physically allocated to that expedition; merely displaying camp stock on the map cannot allow purchase.
- **Key source solvency.** At least one challenging, repeatable key opportunity must remain reachable without spending a key, including after all earlier keys were spent on optional gates or death caches were lost. Route bans imposed by the player remain absolute and may create a self-imposed blockage.
- **No accidental combat.** An opened gate is not an active fight. A skipped gate task or an unanswered discovery prompt never grants unlock consent.
- **Scarcity without coercion.** The economy should make the decision to carry banked keys meaningful; it must not sell paid mandatory keys, paid death recovery or progression skips.

## 5. Recovery, loss, and provenance (cache rule not yet locked)
The existing proposed one-death-cache system remains a proposal. If used, an unspent fresh key can enter the cache on death. Recovering it **does not** make it banked. If a previously banked/issued key dies unspent, it may enter the cache carrying a record that it was once banked; recovering it restores carried eligibility but does **not** remotely restore the bank's safe stock. Spending a key consumes it irrevocably and the gate stays open, so it cannot also drop at the same death event.

A trial's one-time-per-expedition award flag is independent of where the key currently resides. Similarly, a one-time discovery claimed before death cannot be looted a second time by revisiting its source. Future trial replenishment remains available without permanently exhausting universal-key supply.

## 6. UX states and messages
- **At claim:** `Gate Key obtained — must return to camp before first use.`
- **At camp:** `Banked Gate Keys: 2` (illustrative), with a deliberate issue/pack selection of **0–2 prepared Gate Keys** on launch.
- **In expedition inventory:** `Fresh keys: 1 (cannot open gates)` and `Prepared keys: 1 (eligible to unlock)` (illustrative).
- **At sealed gate with no eligible carried keys:** `Previously banked Gate Key required. This newly found key must be secured at camp first.`
- **At gate with eligible key:** `Unlock permanently? [Cost to be finalised]`, followed by distinct `Enter encounter?` choice only after gate is open.
- **On extraction:** `Keys banked: +1; prepared keys returned: +N` (illustrative).
- **On death:** Chronicle distinguishes fresh keys dropped versus prepared keys dropped/spent; source award never reissued from a reload.

## 7. Acceptance examples
| Scenario | Required result |
|---|---|
| Find a key adjacent to boss gate in same run | Gate cannot be opened using that key |
| Earn key from challenging trial, then go to miniboss gate without returning home | Gate cannot be opened using that key |
| Rest at sanctuary carrying fresh key | Key remains fresh and unbanked |
| Die, recover fresh key, then approach gate without visiting camp | Key remains ineligible |
| Extract fresh key at camp, then pack it for new run | It becomes eligible to spend if physically carried |
| Leave key safely at camp and approach gate | Cannot spend camp stock remotely |
| Carry both a fresh and prepared key | Only prepared key counts as spend-eligible |
| Spend eligible key then die | Gate remains open; spent key never respawns or refunds |
| Spend all keys on optional gates | Repeatable, keyless-accessible replenishment still possible |
| Gate task fails due to ineligible key | L14 skip objective, continue remaining permitted tasks |

## 8. Explicitly unresolved choices
1. **O27 RESOLVED by L20:** at most **two** previously banked universal keys may be loaded into the prepared keyring; keys not issued stay in camp. Exact ordinary loot/cargo limits remain O06.
2. **O26 RESOLVED by L21:** Every standard boss/miniboss first unlock costs exactly one universal Gate Key. No varied ordinary gate pricing.
3. **O23 — Unlock authorisation:** always confirm at physical gate, or allow a named, explicit preauthorised spend in the itinerary? Either must be distinct from boss combat consent.
4. **O05/P02 — Recovery cache:** exact second-death replacement treatment and whether all key types have identical recoverability.
5. **P16 — Exceptional optional-boss special key:** if adopted, should L19's camp-first lifecycle apply to it too? Treat as proposal pending creator choice.

## 9. Production boundary
This is a design-state specification only. The separate combat AI session receives validated engage/disengage intent and never handles key minting, banking or unlock approval. Do not write gameplay code from this document until the remaining economy/UI choices are reviewed.

## Workshop 16 — Prepared-key capacity L20 (LOCKED)
The expedition can depart with **zero, one or two** previously banked universal Gate Keys in its prepared keyring. A third cannot be issued in the same run and camp-stored keys are never usable remotely. The two-slot limit does **not** forbid earning fresh universal keys as at-risk loot, but they remain ineligible on that run even if a prepared slot becomes empty after a gate spend (L19). A recovered previously banked key cannot create a third simultaneous eligible prepared slot; proposed overflow handling is specified in `24`. The normal cargo capacity for additional fresh/recovered keys remains OPEN O06. Standard gate price is LOCKED L21: one universal key.
