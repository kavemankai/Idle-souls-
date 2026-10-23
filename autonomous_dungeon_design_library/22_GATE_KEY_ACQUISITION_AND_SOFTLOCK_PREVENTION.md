# 22 — Gate Key Acquisition, Extraction, Recovery and Progression Safety
**Owner:** Key source design, challenge contracts, resource lifecycle, progression reachability  
**Status:** Creator LOCK L18 = guaranteed one-time discoveries + challenging repeatable replenishment. First-use at a fog gate requires prior physical bank at camp (LOCKED L19). Detailed payout quantities, contract selection, carried-loss/cache policy and first-region layout PROPOSED/OPEN.  
**Updated:** 2026-10-23  
**Related:** 02, 03, 04, 08, 09, 11, 12, 15, 16, 17, 20, 21

## 1. Explicit design commitment (L18)
Ordinary fog gates for main bosses and minibosses consume the **universal Gate Key** type on **first permanent unlock only** (L16–L17). Universal keys enter the economy by **two complementary channels**, both of which must exist in the finished system:

1. **Guaranteed authored discoveries:** deliberately placed, discoverable one-time rewards that supply useful early progress and reward map exploration. Guaranteed means *the authored source grants a key when its conditions are met*, **not** that an undiscovered key is delivered automatically or becomes banked for free.
2. **Challenging, repeatable replenishment:** a deterministic way to earn additional Gate Keys on future expeditions after meeting a visible challenge and successfully extracting the award. The economy must still function when the player has spent optional keys, died with a key, or lost an older death cache.

These sources **must not require paid purchases, advertisements, random rare drops or an external-time wait** to make mandatory campaign progress. Creator has not chosen exact contract design or source counts; standard gate price is locked L21 at one and keyring capacity is locked L20 at two; recommendations below are PROPOSED. The bank-before-first-use rule is LOCKED L19.

## 2. Player-facing promises
- A player can **always rebuild access to mandatory progression** through at least one accessible, reliable key source, provided they are willing to complete the challenge and obey their own route restrictions. Replenishment guarantees an *opportunity*, not a free success, an automatic delivery or guaranteed extraction.
- Discovering or carrying a key is **not** permission to spend it or fight a boss. A first gate unlock and actual boss engagement require separate explicit consent (L16).
- Unlocking a gate permanently is not equivalent to defeating its boss, extracting equipment or securing gold. An opened gate persists after death and requires no second key, including on optional rematches.
- A sanctuary is never a deposit location. Carried keys are never made safe merely by resting (L06).
- The player can see **where the next known key opportunity is**, why it is currently inaccessible (if so), and whether a currently available repeatable challenge could replenish stock.

## 3. Supply architecture
| Source | Availability | Risk and engagement | Proposed payout | Progression role |
|---|---|---|---|---|
| First authored find | One time on legitimate discovery/objective completion | Requires exploration into first region and physical extraction | One universal key | Introduces first gate economy |
| Later unique finds | One time per authored location | Discover/clear obstacles; extraction remains risky | Small fixed key reward | Rewards mapping new regions |
| Repeatable `Trial` expedition | Re-available on later expeditions | Visible, challenging route objective with an actual return journey | One earned universal key per successfully completed claim, provisional | Recovery from optional spending or loss |
| Rare optional special key | Unrelated side-content prerequisite only (P16) | Authored optional discovery | Exact reward open | **Never** required for campaign end |

**Important:** the repeatable source should be reachable from camp *without an unspent universal key, without entry to an unopenable mandatory gate and without any special optional key*. The world authoring process must check this reachability after every permanent world-change state. Existing absolute bans (L13) can be intentionally self-imposed obstacles; the game must explain this rather than silently lifting them.

## 4. Recommended challenge design, not an approved lock
Offer a small number of **Key Trials**, not a repeatable low-risk resource node. A player opts into a trial through the standard hybrid expedition itinerary. It consists of a fixed, understandable challenge in a familiar **keyless-accessible** branch, where patrol variation can change tactical execution without randomising whether the reward is available. Examples (conceptual, not content locks):

- **Watchpost Sweep:** reach and secure an isolated watchpost, then take the trial cache home.
- **Deep Cache Recovery:** collect a key from a defended return-path pocket and navigate out with limited supplies.
- **Route Circuit:** visit two independently accessible checkpoints before claiming the key at a final landmark; neither should demand an unopened boss gate.

The initial slice needs **one** repeatable challenge, not a procedural mission board. It can have encounters, travel and extraction risk; it must not require repeatedly killing the same regenerating enemy inside one expedition. Use one claim per eligible expedition/source completion as a provisional limit. No countdowns, streak penalties, paid refreshes or artificial attempts-per-day limits.

A player whose map is heavily unexplored may not know a later unique key location, but must discover a *legitimate early source* naturally before needing the first mandatory gate. The initial repeatable source should be signposted through exploration or the camp journal, not reveal exact hidden geometry through fog of war.

## 5. Key resource lifecycle (camp-first eligibility LOCKED L19; some loss rules remain proposed)
**Relevant states:** `Unseen source` → `Eligible source` → `Key claimed in expedition` → (`Banked at camp` or `Dropped in recoverable cache` / lost by cache replacement) → `Allocated/carried for gate` → `Spent on permanent first unlock`.

- An authored one-time discovery is flagged claimed **once**, not rewarded on each visit. If its key is dropped, the cache rules govern recovery. The repeatable path ensures the one-time key being irrecoverable cannot softlock a campaign.
- A trial is eligible again on a subsequent expedition, but claiming it twice on the same expedition is not allowed. Reward cannot be re-triggered by exiting/re-entering a room, browser reload, disconnect or checkpoint restore.
- A key obtained in the field is **carried and not first-use-eligible until physical camp extraction (LOCKED L19)**. A dead character provisionally drops unspent carried keys into the death cache (one-cache replacement remains PROPOSED). A recovered key is again carried at risk until extraction.
- A deliberately spent key does **not** enter the death cache. The gate opened with it is already permanently unlocked; gate state and key consumption are one indivisible committed event. Neither death nor rematch refunds/recharges it.
- **LOCKED L19:** first-use spending requires a key previously extracted and banked at camp, then physically issued on a later expedition. A field-found or trial-earned key is ineligible to spend at a gate during the acquisition expedition, even if it is present in carried loot. See `23`.
- A sanctuary rest cannot bank an unspent key, protect the key from later death, or make a missing key available remotely.

### Example ledger (illustrative, no numerical balance commitment)
A player finds the one-time Watchpost Key (`carried=1`). They die and the unspent key moves into their recovery cache (`carried=0, cache=1`). If they recover it and reach camp, it becomes `banked=1`. The player takes it to an optional miniboss and confirms the unlock: `spent=1, gate=open`, even if the boss then kills the character. A future mandatory gate remains sealed, so the player can tackle a repeatable Key Trial and physically extract the next reward. No special key, paid key or random drop is required to resume the main campaign.

## 6. Mandatory-progression anti-softlock invariants
Every campaign authored state must satisfy all applicable checks:
1. **Early access:** the first obligatory fog gate has at least one legitimate key opportunity reachable without entering that gate or any other permanently unopened required gate.
2. **Replenishment route:** as long as a mandatory ordinary gate remains sealed, there exists at least one renewable universal-key route reachable from camp without any new key spend, in the player's possible world state (ignoring player-chosen absolute exclusions but surfacing them clearly).
3. **No optional-spend deadlock:** spending a key on an optional miniboss gate must never exhaust the only feasible route to further ordinary keys.
4. **No death-cache deadlock:** losing a key in a cache, replacing the cache with a later death or disconnecting cannot permanently remove all ways to earn another ordinary key.
5. **No circular costs:** ordinary Gate Key replenishment may not require a boss or gate whose only unlock depends on that very replenishment source.
6. **Campaign independent of P16:** the optional special key and special boss are excluded from main-path reachability proofs.
7. **No artificial delivery:** replenishment is possible by play, not triggered as a pity pop-up; a player can still fail the trial or die before extracting.
8. **No hidden dependence on paid features:** no purchases, ads, timers or account-engagement streaks can gate required key supply.

The authoring validation is a **design requirement**. This document does not specify engine code or algorithms.

## 7. Expedition, objective and route interactions
- `Collect first discovery key`: the key can only be collected if legitimately revealed and reached. A completed discovery objective records the permanent one-time claim flag, while banking requires a later safe return.
- `Earn trial key`: the expedition itinerary explicitly targets an available trial; completion grants carried reward; physical return still needed to bank.
- `Open sealed gate`: requires matching universal key present and deliberate first-spend permission. If unavailable/forbidden, objective is `Skipped — Blocked`, then remaining permitted tasks proceed in original order (L14).
- `Enter boss`: a separate, intentional encounter commitment after successful first unlock or at an already opened gate. If the player did not commit, exploration defaults must not enter.
- `Return to camp`: non-skippable terminal intention; no sanctuary, trial completion or gate opening banks key rewards. Absolute excluded regions remain excluded even during retreat (L13).
- If a key-source quest is impossible due to a player exclusion, the system reports `Source blocked by your avoid order`. It **does not** supply an emergency key or override the exclusion.

## 8. Transparent UX vocabulary
Distinct counts/labels are required for `Keys banked`, `Keys allocated to this expedition`, `Keys found/carried and at risk`, `Key currently in recovery cache`, `Keys already spent` and `Ordinary gates permanently opened`. For repeatable challenges, identify whether the current expedition already claimed that trial reward. For unique key locations, display `Cleared/claimed` only after legitimate discovery; preserve fog of war.

At a sealed gate, show: `Universal Gate Key required`, `available in this expedition`, `unlock is permanent`, `unlock does not start combat`, and `unlock cost` (once numeric tuning is locked). At key-source objectives, show estimated known route exposure qualitatively, not fabricated success percentages.

## 9. Economy and retention guardrails
- Repeatable challenge should be **worth a deliberate expedition**, not the optimal trivial 45-second farm; reward design should account for route risk and return exposure.
- Do **not** make keys purchasable only for real money or convert paid currency into mandatory progression access.
- Do not create a contract refresh purchase, rewarded-ad bypass, paid recovery of lost keys or unfair skip of extraction.
- Don't bind keys to a daily/weekly schedule. Repeatability means a player can retry through play, including immediately on a subsequent expedition after failure.
- Avoid an exponentially increasing key cost per main gate; standard **one key per ordinary gate** is a PROPOSED starting hypothesis, not locked.
- Reward first-time exploration so trial farming is an emergency replenishment/back-up loop, not the dominant path through the game.

## 10. Acceptance scenarios for economy sign-off
1. Find authored key and extract: one key added to bank exactly once. Revisiting location does not add a second.
2. Find authored key and die: at-risk key follows provisional death-cache lifecycle; location doesn't duplicate it.
3. Recover dropped key and die before camp: only one recovered key exists after death resolution.
4. Lose all available keys to optional gate opens and cache replacement: accessible repeatable source still permits a new one.
5. Complete a repeatable challenge and return alive: one universal key becomes banked; repeat challenge on a future expedition can award another.
6. Fail or leave a repeatable challenge before completion: no free reward; no permanent supply lockout.
7. Re-enter a completed challenge area in same expedition: no additional key claim.
8. Die after valid gate unlock: gate stays opened, key stays spent, ordinary boss status independent.
9. Player excludes source region: report a player-caused route conflict, don't override absolute avoidance or grant free currency.
10. Optional special-boss key is missing: main campaign remains completable through universal key sources.
11. Disconnect or reload during key claim/unlock: no duplicated awards, lost transactions or doubled key charges.
12. Sanctuary rest, fog reveal or boss victory never automatically banks any carried unspent keys.

## 11. Remaining decisions
- **RESOLVED by L19:** First-use requires successful camp extraction and subsequent expedition issue; field-found key spending in the same expedition is prohibited.
- **RESOLVED O26 via L21:** exactly one universal Gate Key for every ordinary first-unlock boss/miniboss gate.
- **OPEN:** Exact early guaranteed-key location, first trial objective, difficulty, payout and per-expedition claim limit.
- **OPEN:** Final one-cache death replacement approval and treatment of unbanked key inventory if cache is overwritten.
- **OPEN:** Does an exceptional optional-boss key exist as an authored one-time relic, and is it consumed or retained after unlocking?

**Priority for the next workshop:** resolve the number of previously banked keys that may be physically carried on one expedition and the gate-price balance. All combat AI tactical implementation remains with its separate workstream.

## Workshop 15 — L19 acquisition-to-gate cycle, not a forced timer
**LOCKED:** authored and trial-earned Gate Keys enter the expedition as **fresh/unbanked**, therefore cannot be used on fog gates. Their route is `claim → carry at risk → return physically to camp → bank → issue on a later expedition → deliberately spend at selected gate`. There is no real-world timer or required number of combat wins between banking and the next launch. A sanctuary never satisfies the camp step. Trial re-entry and browser reload do not produce additional bank events.

If an expedition finds two keys, the player may extract both; the player can *bring back out* at most two previously banked universal keys under L20. If the adventurer dies with a fresh key, the ordinary recoverable-cache proposal applies, but recovery only changes location, not banking eligibility. A replacement-cache loss cannot destroy progression because an accessible repeatable source must remain. A banked key left in camp is not exposed to that expedition's death risk.

The gate planner must check **eligible previously banked keys physically carried** (not camp stock plus fresh field finds). It should label blocked objectives accurately and apply L14 skip-and-continue without silent purchases. No special-boss key assumption is locked; P16 remains optional. See `23` for design-level states and test matrix.

## Workshop 16 — Two-key provisioning versus guaranteed supply
With L20, a player may issue **zero, one or two** banked universal keys per run and leave the remainder protected at camp. The keyless-accessible challenging trial path required by L18 must still exist when both prepared keys are lost, spent on optional gates or stranded in a proposed death cache. The renewable key award is *fresh cargo*, not a third prepared key or a replenishment for an emptied ring slot (L19). Under L21's locked one-key standard price, a two-key expedition can open two distinct gates with independent explicit approvals, but the player cannot spend home stock remotely. Do not author a mandatory gate needing more than two keys in a single payment while L20 applies. See `24`.
