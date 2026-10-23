# 24 — Gate Prices, Miniboss Rewards and Two-Key Allocation
**Owner:** Gate cost balance, optional encounter investment, keyring decisions and player-facing scarcity
**Status:** Carry limit L20 LOCKED; numeric gate charges, miniboss payoff, second-death cache mechanics and preauthorised spends remain PROPOSED/OPEN
**Updated:** 2026-10-23
**Related:** 02, 04, 08, 09, 11, 12, 13, 15, 16, 17, 20, 21, 22, 23

## 1. Explicitly locked input and immutable constraints
- **L20 — Two prepared keys maximum.** At camp the player deliberately provisions **zero, one or two previously banked universal Gate Keys** for the departing expedition. The expedition's *prepared keyring* has exactly two available slots. The player is not required to fill them, and any keys left in the camp bank remain safe from that expedition's death.
- L16/L17: one universal Gate Key type for ordinary boss/miniboss first unlocks; sealed gates remain locked until a deliberate key spend; gate opening is permanent; **opening never starts the fight**.
- L18: supply includes both guaranteed authored discoveries and challenging repeatable replenishment; no campaign softlock after optional spend or dropped cache.
- L19: a newly found or trial-earned key cannot open gates before extraction to camp and being deliberately provisioned on a later expedition. A key found later in the same run does not replenish a depleted prepared keyring.
- L06: sanctuaries do not bank keys. L13: forbidden territory stays forbidden even on retreat. L14: impossible gate objective is skipped and subsequent lawful tasks run. L15: absent player input cannot authorise first spend or start boss fight. L07: first area-boss defeat persists; optional rematches require no new gate opening key.
- **No gate cost beyond two universal keys can be fulfilled by this keyring** absent a later, separately approved mechanic. Do not publish a required three-key ordinary gate or silently use banked camp keys remotely.

## 2. Confirmed first-unlock pricing (L21); alternative pricing below is historical
**Recommendation:** both standard area-boss and standard optional miniboss fog gates charge exactly **one banked-and-provisioned universal Gate Key** for their first permanent unlock. After unlocking, subsequent entry and optional rematch are free of Gate Key cost. This makes the decision a *choice of world investment*, not a higher numerical toll for mandatory content.

| Pricing candidate | Standard miniboss | Standard major boss | Strength | Downside | Decision |
|---|---:|---:|---|---|---|
| **A — Flat standard cost (LOCKED L21)** | 1 | 1 | Simple, legible, respects 2-slot ring; makes optional-vs-critical choice central | Optional miniboss payoff must be compelling | **LOCKED L21** |
| B — Differentiated | 1 | 2 | Major gate feels costly; 2-key expedition has stakes | Forces acquiring/banking two keys before every major unlock; amplifies repetition | OPEN |
| C — Authored tier (1–2) | 1 or 2 | 1 or 2 | Gate-specific strategic variety | Confusing prices, signposting and economy tuning; easy to create unintended bottlenecks | OPEN |

**Never use an escalating surcharge per failed boss attempt.** Charge only on the first valid unlock. Do not charge to enter an already open gate, to defeat the boss, to recover a death cache, to travel a freed shortcut or to opt into a rematch. A player who spends a key and declines the battle still owns the open gate.

## 3. Optional miniboss as a legitimate alternative investment — reward design PROPOSED (O22)
An optional miniboss asks the player to defer a mandatory gate to gain a credible *strategic advantage*. Recommended distinct reward channels:

1. **Permanent world benefit on first clear:** open an alternate corridor, bypass a hazardous approach, disable one fixed obstacle or reveal a useful inter-region connection. This discovery persists immediately even if the adventurer dies on the return trip. The benefit is useful but **never the sole route to a mandatory Gate Key replenishment source, mandatory campaign ending, or essential sanctuary**.
2. **Extractable one-time spoils:** one modest sword-and-shield sidegrade, material, gold cache or permanent mastery unlock. This reward is carried and at risk until camp; it does not count as banked merely because the miniboss died. Avoid a universal best-in-slot piece that renders required bosses trivial.
3. **Future convenience through mastery:** previously guarded side territory becomes more predictable and shortens later expeditions. This is the strongest retention payoff because the map's strategic value changes.

**Recommendation (still PROPOSED):** first miniboss defeat is permanent in normal exploration, with a journal mark; optional rematch could be added later and does not recharge the gate. Ordinary miniboss kills should **not automatically refund a universal Gate Key**. Guaranteed one-key refunds would remove the original optional-vs-mandatory scarcity choice, and repeated miniboss farming should not dominate the intended challenging Key Trial replenishment loop.

A miniboss reward may incidentally lead to a separately earned authored key discovery if balanced, but that should be an explicit authored exception, not the standard miniboss prize or a mandatory key source. Its first-clear flag must be independent of gate-open status.

## 4. Prepared keyring and bag distinctions
| Inventory component | Example | Can pay first standard-gate cost? | Loss/recovery |
|---|---|---|---|
| Camp bank | 3 banked keys, only 1 issued | No remote payment | Keys left home are safe |
| Prepared keyring (two slots) | Key 1 + Key 2 | Yes, if physically carried and authorisation granted | At risk when unspent; cache treatment P02 still OPEN |
| Fresh/unbanked field loot | A key won at a Trial on this run | **Never this run**, even if keyring is empty | At risk, must be physically extracted and banked |
| Previously banked key recovered from death cache | A once-issued key recovered later | Prior bank provenance retained; **slot capacity still enforced** | Overflow policy remains PROPOSED; must not imply >2 usable prepared keys |
| Spent key | Paid to open selected gate | Already consumed | Irrevocable; opened gate remains open |

**Recommended overflow policy — PROPOSED:** reclaiming an additional previously banked key when both prepared slots are full places it into **recoverable cargo**, not an automatically usable third keyring slot. It remains an at-risk recoverable item until camp. A safe, explicit keyring reconfiguration could be explored later; never silently increase the two-slot cap or turn a recovered key into a freshly minted key. Fresh keys use ordinary at-risk loot accounting, but exact inventory carrying capacity is O06.

**Recommended provisioning UX — PROPOSED:** camp displays `Banked: N`, `Prepared: 0/2, 1/2, 2/2`, `Left at camp: N-prepared`, plus the costs of **discovered** unopened gates and current planned gate targets. Never expose sealed gates behind undiscovered fog or imply a route is safely extractable when the return depends on changing encounter conditions. Show the planned budget for each target without authorising a spend.

## 5. Example ledgers, not starting balances or locked prices
**Scenario A — optional investment:** three keys safely banked at camp. Player packs two, leaving one safely at camp. They spend one deliberately opening an optional miniboss gate. The keyring now holds one unspent prepared key. They may withdraw immediately; optional fight is separate. If the next *discovered* standard boss gate costs one under Price Model A, the remaining prepared key could unlock it on the same expedition after a second explicit confirmation. If the adventurer dies beforehand, the optional gate stays open, and the other key follows the provisional death-cache rule; the unissued third key remains safe at camp.

**Scenario B — fresh key cannot refill the ring:** adventurer leaves camp with one prepared key and gains one fresh key from a trial. Even though two keys are physically present, only **one** is eligible to open a standard gate that run. After spending the prepared key, the fresh trial key remains ineligible until camp extraction and later reissue.

**Scenario C — zero keys but progression is possible:** a player spends all banked keys on optional gates, or loses two prepared keys in recoverable loot. The player can still embark on a keyless-accessible challenging Key Trial; after successfully earning its payout and extracting to camp, they can reissue a replenished key on a future run. No monetised bypass or mandatory daily lockout.

**Scenario D — two-key ring and cost conflicts:** under Price Model B, a two-key major gate would consume the entire keyring. A second unopened gate objective on that expedition becomes `Skipped — Blocked` once all valid alternatives have been assessed; unrelated permitted objectives continue (L14). A three-key required gate is invalid under current L20 capacity.

## 6. Planning, approval and priority rules
- Gate route planning previews `Known sealed gate → cost → eligible prepared keys → remaining key budget if deliberately spent`. Cost must be discoverable once the gate is known, not hidden until the confirmation moment.
- A named `Open gate` objective does **not itself imply unlock consent** under L16. The exact option for explicit named preauthorisation remains OPEN O23. Until the creator chooses otherwise, a secure gate-site confirmation is the cautious PROPOSED default; unanswered prompts must never spend a key or start combat.
- If insufficient eligible prepared keys exist, label `Blocked — key quantity`, not `Blocked — key type` or `Blocked — route`. A freshly found key does not clear it. Follow locked skip-and-continue (L14).
- If planned sequential gate spending would exceed two prepared keys, display a preflight *key budget conflict*; do not secretly draw from camp storage or an unbanked discovery.
- A gate that was unlocked in an earlier run costs **zero** for all future passes and rematches. Do not reserve an eligible key for it.
- A player can carry less than two eligible keys to reduce exposure, and could choose a different gate than originally forecast only by an explicit field decision (no silent currency reassignment).

## 7. Miniboss reward value test and retention guardrails
Ask in human testing: Does opening a miniboss gate feel like a defensible decision compared with saving that same key for the main boss? Is the route/supply benefit understood on the map? Is the reward still interesting if the player dies before extracting carried spoils? Can a defeated miniboss be farmed infinitely for major progression currency? Does repeatedly collecting keys feel like purposeful exploration or a chore?

Proposed guardrails: a miniboss first-clear provides **one meaningful persistent map benefit plus one at-risk one-time reward**; repeat encounters (if added) provide mastery/cosmetic reasons, not unlimited Gate Keys. For the first vertical slice, implement only the main gate until key lifetime works; then test one optional miniboss gate against it to validate player trade-offs.

## 8. Open decisions and explicit next lock
- **O26 RESOLVED by L21:** Price A (one key for major/miniboss standard gates) is locked; Price B and tiered prices are superseded. L20's keyring capacity remains two.
- **O22:** whether optional miniboss first-clear permanently removes them from ordinary travel, and the exact minimum promised side benefit.
- **O23:** every unlock confirmed at gate, or explicit named preauthorisation in expedition itinerary; combat consent remains separate either way.
- **O05:** one death-cache replacement policy; prepared-key recovery and overflow have not been approved.
- **O06:** normal loot capacity and whether found keys take cargo space; two-slot *prepared keyring* is settled regardless.
- **P16:** rare special-key optional pinnacle boss is not yet an approved second key economy.

## 9. Design verification cases
1. Pack zero, one or two banked keys; disallow three; bank remainder stays at camp.
2. Spend one of two on a miniboss; second eligible key stays carried and at risk, no auto spend or combat.
3. Obtain a fresh key on a run already carrying two prepared keys; fresh remains ineligible, never grants a third prepared slot.
4. Obtain a fresh key after spending the only prepared key; fresh cannot spend in same run.
5. Recover previously banked key with a full prepared ring; cannot equip as a third eligible key; no loss or duplication from overflow handling.
6. Leave keys in camp and die; home stock unaffected.
7. Open a gate and die immediately; key stays consumed, gate stays permanently open, boss status unchanged.
8. Clear optional miniboss and die returning; immediate permanent benefit stays; carried spoils remain at risk (if cache rules adopted).
9. Spend every saved key on optional gates; challenging keyless-accessible replenishment remains available and repeatable.
10. A gate's first cost cannot exceed prepared keyring's legal capacity in current design.
11. Two planned key spends: correct preflight budget; each still needs its own approval; third planned spend blocked/skipped if no eligible key remains.
12. Reload/disconnect during issue/spend/return restores consistent counts: no duplicate or lost transaction.
13. Banked key held at camp cannot pay while character is away.
14. An unopened ordinary boss or miniboss remains visible but inaccessible without the correct carried and eligible key; ordinary exploration never starts encounter combat.

## Workshop 17 — Creator-confirmed standard price
**LOCKED L21:** One (1) universal Gate Key per standard boss or miniboss fog gate upon first deliberate unlock, regardless of encounter classification. The former multi-price and tiered alternatives are superseded. The one-key charge is not a combat entry price; first gate unlock is permanent, fight requires separate explicit confirmation, and rematches never recharge the key. The proposed miniboss shortcut + loot sidegrade in `25` remains **OPEN O22**.
