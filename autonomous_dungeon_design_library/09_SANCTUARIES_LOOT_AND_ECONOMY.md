# 09 — Sanctuaries, Loot and Expedition Economy
**Owner:** Resource and sanctuary economy  
**Status:** Sanctuary recovery without banking LOCKED; detailed economy PROPOSED

## Sanctuary purpose
A sanctuary provides a rare safe intermission and a meaningful upgrade/choice opportunity. It can restore limited health/supplies and allow some preparation actions, but **never deposits resources into the permanent bank, never extracts the player, and never secures a death cache**. Leaving the sanctuary exposes all carried valuables again.

## Proposed sanctuary lifecycle
- First eligible rest within one expedition restores a fixed or bounded health amount and a limited consumable benefit.
- One major development choice per expedition is available at an eligible sanctuary (number is PROPOSED).
- Subsequent visits during the same expedition are safe waypoints, not unlimited free healing fountains.
- Purchases, if supported, consume carried gold and obey explicit stock/inventory limits.
- Resting requires a safe state; cannot heal mid-attack by crossing a sanctuary doorway.
- Safe journal/map decisions may be made here; combat doctrine change is permitted here but not during active fighting.

Exact restoration amounts, sanctuary locations, pricing and consumable limits need tuning; don't hardcode arbitrary numbers into lore or UI until tested.

## Loot classes
| Class | Acquisition | Run fate | Design purpose |
|---|---|---|---|
| Currency (gold) | Enemies, caches, objectives | At risk until camp | Spend during run vs bank trade-off |
| Supplies | Chests, finds, limited trade | Used or at risk | Extend survivability |
| Equipment finds | Specific discoveries, rare drops | At risk until camp | Different tactical properties |
| Unique treasure | One-time world discovery | Secured only on extraction | Strong reason to explore |
| Recoverable mastery | Earned from meaningful actions | At risk until camp (PROPOSED) | Unlock strategic preparation options |
| Temporary upgrades | Levels, sanctuary choice | Expire at run end | Build each run's power arc |

## Economy choice: spend now or bank later
Carried gold is deliberately useful *during* a run. Repairing a damaged shield, buying a healing item or receiving a temporary blade treatment increases the odds of survival at the cost of lower final extraction value. No compulsory shop visit should be required for a reasonable starting expedition.

## Price balance principles
- A prudent purchase should frequently be rational, not clearly worse than saving.
- Early safe routes offer enough basic resources to recover from failure but should not dominate long-term earnings.
- Stronger resources or rare finds appear deeper in dangerous or optional locations.
- Every resource source has a finite run allocation; no profitable infinite patrol-reset loop.
- Players see actual purchase effect and carried-resource deduction before confirming.

## Equipment durability — unresolved recommendation
A limited repair mechanic might deepen spending decisions, but risks busywork and punishment. Start without complex durability in the first slice unless the separate combat AI demonstrably benefits from it. A simple temporary buff or supply purchase may test the same trade-off at much lower cost. Mark equipment wear **OPEN**, not locked.

## Loot priority and inventory
PROPOSED: finite practical carrying limits or category slots, never inventory micromanagement in every corridor. The player can instruct auto-loot priorities (unique/valuable > supplies > ordinary). Full inventory should trigger explicit, predictable behaviour: pass low-value items, replace lowest-priority item, or mark intended return based on selected policy. The character must not silently destroy a unique item.

## Two economy loops
**Within expedition:** temporary level, spend gold on survival, collect consumables, manage risk, reach sanctuary, continue or retreat.  
**Between expeditions:** bank resources, unlock equipment variants and expedition-planning options, prepare a new starting loadout. Strong permanent power inflation should be capped; knowledge and planning remain important.

## Exploit checks
Repeated resting does not create infinite supplies. Repeated enemy disengagement does not create repeated kill rewards. Selling/buying the same item cannot generate currency. Death does not create duplicate unique treasures. Purchases made with carried gold are not refunded by recovering a cache.

## Player comprehension checks
At any point, players should distinguish **carried**, **spent**, **banked**, and **permanent knowledge**. Sanctuary UI needs an explicit “No banking here” statement. The value of taking a resource home should remain compelling but not mathematically always superior to spending it.

## Workshop 12 — Key economy and first-time fog-gate access
**LOCKED access premise:** Boss/miniboss entrances use a key-sealed fog gate; first unlock needs a key and is permanent. **LOCKED L17:** One shared universal `Gate Key` resource opens ordinary boss/miniboss fog gates on their first use. Key fragments, gate-specific prices and payout quantities remain OPEN; **first-use bank-before-spend is LOCKED L19**; gold is still the separate everyday currency. A rare special key for an exceptional optional boss is PROPOSED P16, not a mandatory campaign currency.

Recommended first pass: a key obtained in the field is **carried and vulnerable** until physically extracted to camp. Once banked, it may be assigned to a subsequent expedition and presented at a sealed gate. The deliberate `Unlock — spend key` event consumes exactly once and opens the gate permanently, even if the run later ends in death. Gate access and entering boss/miniboss combat require separate player consent; auto-loot does not mean auto-spend. **A sanctuary cannot bank, protect or remotely spend keys** (L06). Recovering a key lost in death follows existing cache rules. A valid spent key never drops again.

Fair supply rules: first key must be available without defeating the boss it unlocks; prevent circular progression. Keys may later offer competing gate unlocks to drive strategy, but mandatory progression should not demand repetitive uninteresting gold farms or purchases. No paid key monopoly, purchased lives or monetised forced failures. Rematches through already unlocked gates **do not require another key**. See `21`.

## Workshop 13 — Universal keys versus exceptional relic keys
Ordinary boss/miniboss gate spending is a **shared scarce-choice economy (LOCKED L17)**: identical universal Gate Keys can go toward mandatory progression or optional encounters. No region-specific baseline currency. An optional special-boss key is an **exceptional content prerequisite (PROPOSED P16)**, not a substitute for gold or universal Gate Keys. Never allow unnoticed conversion, accidental use, or sanctuary banking. No final numerical prices have been locked.

**Progression economy requirement (PROPOSED):** provide a credible way to acquire sufficient universal keys for required gates even if some are spent on optional content or lost during expeditions. Prefer curated, visible sources and recovery opportunities to repeated random-drop farming; avoid infinite easy gold-to-keys arbitrage. An exceptional optional boss should reward something distinctive without making its special key a mandatory power gate.

## Workshop 14 — Universal key supply economy (creator LOCK L18)
Universal Gate Keys are a distinct **scarce access currency** from gold. They have **two locked source categories**: (1) authored once-only discoveries with guaranteed key awards upon legitimate completion and (2) challenging repeatable expeditions with deterministic key payout on successful completion. They must not be random-only drops, purchases or advertising rewards needed for mandatory content. Resource supply must remain feasible if an optional miniboss consumes a key or a carried key is lost.

| Resource | Primary source | Recurring? | Primary sink | Extraction implications |
|---|---|---|---|---|
| Gold | Ordinary encounters, caches, exploration | Yes, finite budget per run | Supplies and temporary improvements | Carried gold banked only at camp |
| Universal Gate Key | Fixed authored discoveries **plus** challenging repeatable trials (L18) | Both one-off and repeatable channels | First unlock of ordinary boss/miniboss fog gates (L16–L17) | Found/earned key carried at risk until camp under LOCKED L19 bank-before-use rule |
| Rare exceptional key | Optional unique side objective (P16) | Unresolved | Optional special-boss gate only | Cannot be required for campaign ending |

**Suggested first prototype:** one visible first-time authored key and one challenging repeatable key opportunity accessible without a key; no fragments, key crafting, exchange rate against gold, daily contracts or paid key replenishment. Trial difficulty should come from objective placement, predictable danger, and physical return rather than a low-drop-rate grind. One successful challenge claim per qualifying expedition is a PROPOSED limit. Exact key payout quantities, trial layout, normal cargo limits and cache replacement remain OPEN; ordinary gate cost is LOCKED to one key under L21; the prepared keyring capacity is now **LOCKED L20 at two** and bank-before-first-use is **LOCKED L19**.

**Sanctuary invariant:** recovery and an upgrade choice never bank or safeguard the key. A successful boss defeat also does not bank carried keys. A key **already consumed on a permanent gate unlock** is not lost again on death and is not part of any death cache. See `22` for source lifecycle, trial fairness and reachability guarantees.

## Workshop 15 — Key economics: bank-before-first-use LOCKED
Universal Gate Keys are **progression access currency**, not ordinary gold and not a consumable that can be spent on the acquisition run. On claiming a guaranteed discovery or repeatable trial reward, the key becomes **fresh carried loot**. Only reaching camp physically moves it into **banked stock**. A subsequent expedition can be provisioned with previously banked keys; those keys become **eligible carried stock** while in the field, remain at risk if unspent, and can be deliberately consumed once at an eligible fog gate. A key left in camp cannot be spent remotely at a gate.

**No sanctuary banking:** resting, selecting a major upgrade, arriving near a gate or defeating the boss never changes fresh-key eligibility. Do not allow gold-to-key purchase as the only viable campaign replenishment or monetise mandatory Gate Keys. On successful first unlock, the chosen gate is permanently open and the consumed key is gone even if the adventurer dies thereafter. Ordinary first-unlock charge is LOCKED L21 at one universal key; the number of previously banked keys issued per expedition is **LOCKED L20: maximum two**. Key status must be legible in camp and expedition inventory. See `23`.

## Workshop 16 — Prepared keyring capacity and gate-price alternatives
**LOCKED L20:** player can deliberately take **at most two previously banked universal Gate Keys** from camp per expedition. They are eligible when physically carried, unspent, and intentionally used; keys left in camp are safe and not remotely accessible. Fresh expedition keys are ordinary at-risk finds and cannot become eligible until extracted and later reissued (L19). Sanctuaries neither bank nor refill prepared slots.

**LOCKED L21:** both ordinary major-boss gates and optional miniboss gates charge **one universal Gate Key** on their first permanent unlock. The earlier alternate candidate (miniboss 1, major 2) is superseded. Authoring a gate cost above two is incompatible with present capacity absent a newly approved mechanism. Gold remains distinct from Gate Keys. Optional miniboss rewards should make the one-key opportunity cost meaningful: proposed permanent shortcut/world benefit + at-risk one-time spoils, but no routine Gate Key refund or repeatable miniboss key farm. Full options, sample ledgers and tests: `24_GATE_COSTS_MINIBOSS_REWARDS_AND_KEY_ALLOCATION.md`.
