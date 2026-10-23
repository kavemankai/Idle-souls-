# 21 — Sealed Fog Gates, Keys and Encounter Commitment
**Owner:** Encounter access, gate economy, expedition flow; tactical fighting is external  
**Status:** Key-sealed fog gates (L16), universal ordinary Gate Keys (L17), and guaranteed + repeatable universal key acquisition (L18) LOCKED; rare special-key optional boss, numeric balance remain PROPOSED/OPEN; bank-before-first-use LOCKED L19  
**Updated:** 2026-10-23

## Player promise
An adventurer can **discover** a major fight but cannot accidentally start it. A visible, deliberately key-sealed fog gate separates normal exploration from a major boss or miniboss encounter. Its discovery becomes permanent map knowledge; its **first unlock needs a key**; opening it does not itself commit the character to combat. These are gameplay barriers, not a shortcut around normal route bans or physical extraction.

## Names and states
- **Unseen:** Gate not yet located in the permanent map; do not show a live icon through unexplored fog.
- **Discovered, sealed:** World location mapped. Gate is visible and inspectable, but not traversable. Journal notes key requirement, if identifiable.
- **Key ready:** Player has a suitable key available to bring on an expedition; holding one does not spend it automatically.
- **Opened:** A valid key has been deliberately spent; gate opening is a permanent world event. Its ordinary path can thereafter be used subject to route avoidance. A boss behind it may still be alive.
- **Boss undefeated:** Opening a gate does NOT equal a boss kill or world-boss progression.
- **Boss defeated:** Permanent first-clear event; world alteration fires; normal-world boss stays absent. The already opened gate remains open. Rematches use a separate, deliberate opt-in mechanism.

Never combine `gate opened`, `boss engaged`, `boss defeated`, `loot banked` into a single implicit event.

## First-time access lifecycle — recommended baseline
1. Adventurer explores, approaches and **discovers** sealed fog gate. Ordinary discovery defaults can record it and continue the existing plan; no key is spent and no battle begins.
2. A deliberate `Find/secure key` objective sends the adventurer to a known source or frontier likely to contain one; discovering a key is not guaranteed just because a player wants one.
3. **LOCKED L19:** A key obtained during an expedition is carried but ineligible for first gate unlock. Only physical extraction to camp banks it. The player may take that previously banked key on a subsequent expedition; only then can it be spent at a gate. Recovering a previously unbanked key from a death cache does not bypass the requirement.
4. Player equips/assigns an eligible secured key to a later expedition (proposal: a key slot that does not displace sword, shield or standard supplies).
5. When reaching the fog-gate safe approach area, show a deliberate `Unlock permanently — spend 1 key` decision. No automatic spending, timeout consent or default confirmation. If the player is absent, wait in a secure decision state or skip according to explicit pending objective rules; exact resume policy OPEN.
6. The gate-opening event commits *exactly once* and remains open if the character later dies. The key is consumed; it is not placed in a death cache.
7. Beyond the opened entrance, a separate `Enter encounter` decision is required. The player can turn back. Entering under an explicit boss objective with prior player consent may be streamlined in future, but never be triggered merely by moving near a threshold.
8. Major boss defeat is immediately permanent; rewards remain carried until camp. Defeat or death before boss kill does not revoke gate opening.

## Main bosses and minibosses
Both encounter types use sealed gates and deliberate entry. For the first playable slice, a single major boss is mandatory; a miniboss is an **added content proposal** not present in v0.5 baseline. Avoid adding many minibosses before gate loop is tested.

- **Major boss:** First defeat permanently alters world. Optional rematches only after first clear, never mandatory and no further gate-key charge.
- **Miniboss:** A distinctive authored encounter that protects a reward, alternate shortcut or rare supply; exact respawn behavior and whether its defeat persists are OPEN. Recommended first slice: permanently cleared miniboss, with an optional later rematch if justified. Do not quietly make minibosses renewable key farms.
- Both have separate identifiers and journal flags so mini-boss clears cannot accidentally mark major boss defeat.

## Key as resource and possible currency
**LOCKED L17:** Ordinary major-boss gates and ordinary miniboss gates draw from the **same universal `Gate Key` currency**. The player decides where to spend that scarce resource; universal keys are NOT bound to specific regions or named ordinary bosses. Gold remains a separate everyday currency. Normal access requires the gate-specific first unlock only; ordinary rematches do not demand another unlock charge.

**Qualified PROPOSAL P16:** A singular or very rare **special key** may unlock an exceptional optional boss. It must not be required for the main campaign, mandatory routes, normal key supply, story ending, or access to a required sanctuary. This is a constrained exception to universal keys, not a second mandatory progression currency. Its name, location, consumption and rewards are undecided.

Proposed access economy constraints:
- Key sources are discoverable and finite or predictably replenishable; no hidden paid bottleneck, no compulsory ad to obtain a key.
- At least one viable path to a first key remains available without defeating the boss it opens; no circular lock/key dependency.
- Players can see **keys held at camp, keys carried at risk, keys spent, opened gates and remaining gates**.
- Spending a key is irreversible once a gate-opening event successfully commits. If an interruption occurs before commit, do not consume it; if committed, do not charge twice.
- Do not force a player to repeat many low-value identical farming runs for a basic first clear. The meaningful repetition is `discover → acquire/extract → return prepared`, not an excessive material grind.
- Do not grant a free key merely to make an invalid boss objective silently succeed.
- **OPEN:** key loss/cache behavior, exact key price per miniboss vs boss, whether partial progress/key fragments exist, distribution, and whether first keys must be banked before use. Recommended provisional rules above.

## How keys interact with existing instructions
- A sealed gate is a legitimate route blockage; automatic routing cannot pass it even if the player has a key, because spending requires consent.
- If an ordinary itinerary includes `Defeat boss` but no usable key/unlocked gate, that objective is `Skipped — Blocked` only after the planner has assessed permitted alternatives; it then tries remaining objectives in order (L14). If player can stop at gate safely, it may display an explanatory card, but no mandatory interrogation before every skip.
- Absolute forbidden regions remain forbidden, even where the gate is unlocked or the player has enough keys (L13).
- A discovered gate icon must not expose boss details beyond legitimately observed information; fog of war persists.
- No boss/miniboss entry during unattended ordinary exploration. A safe decision point may pause for explicit key spend or encounter commitment; low-stakes discovery defaults do not pause.
- Return to camp and banking are unchanged. A gate (sealed or open) is never an extraction terminal; sanctuaries still never bank.

## Safe interactions and interruption behavior
- Mark a clear **outer staging zone** on the near side of each gate, outside active combat/pursuit. Discovery and map annotation can happen while traveling, but a purchase/unlock decision only occurs while secure.
- Opening a gate is not an instant combat-start or a remote teleport.
- An app interruption while a key spend prompt is displayed must restore the pending prompt and unopened state, without spending the key.
- If app interrupts just after successful unlock, restore the opened state and consumed key once. If just after entry, restore the encounter according to the save policy without a phantom automatic victory.
- If active combat reaches staging area, do not show a free protective pause or sanctuary heal; finish disengagement first.

## UX and sound
Use distinct map and world cues for: `Unknown`, `Seen sealed gate`, `Key available`, `Opened / boss undefeated`, `Boss cleared`, `Rematch available`. Avoid using fog-of-war map shading as the same visual sign as the diegetic encounter fog barrier. Present key-cost confirmation with cost and persistence promise. Encounter commitment should be unmistakable, and the player should know retreat still requires physical travel.

## Economy and pacing examples (not balance locks)
A first exploration trip finds the gate but lacks a key; a following expedition secures a key and returns; a later boss-focused expedition opens the gate and optionally fights. If a player already obtained a banked key earlier, the route may be shorter; no invisible forced run counter is needed. Rematches on subsequent expeditions consume **no additional unlock keys**.

## Acceptance scenarios
1. Adventurer discovers a sealed boss gate with no key: map update, no entry and no battle.
2. Adventurer owns a key but merely passes a gate: no spend and no engagement.
3. Key acquired in run but not extracted: remains carried at risk under chosen key economy; no automatic bank on sanctuary visit.
4. Explicitly spend key in safe gate approach: exactly one key consumed, permanent gate opens, boss remains undefeated.
5. Death after gate unlock but before combat: open state persists; used key not recreated.
6. Death during boss battle: gate stays open, first-clear status remains false unless victory genuinely committed.
7. First victory followed immediately by death: first-clear/world alteration persist, carried reward not banked.
8. Subsequent rematch is opt-in, and opening charge never recurs.
9. Route exclusion covers gate: character cannot deliberately approach/cross despite key availability.
10. Browser interruption before confirmation: no key lost; safe decision resumes coherently.
11. Objective blocked by a sealed gate: skip and continue other permitted objectives, no accidental consent.
12. No key source requires the very gate it opens (reachability test).

## Open workshop decisions
- **RESOLVED L17:** Ordinary gates spend universal Gate Keys. Only an exceptional optional boss may be considered for a special key (P16).
- **RESOLVED by L19:** first-use requires extraction and camp banking before a later expedition.
- How should optional minibosses persist or rematch, and what reward makes one worth a key?
- Can a player preauthorize gate unlock as a standing order, or must every first unlock be explicitly confirmed at the gate? The safer recommendation is explicit confirmation.
- Does encountering a sealed gate while its objective is queued pause for a player or auto-skip as blocked? Keep ordinary blocked-task continuation consistent with L14.

## Workshop 13 — Two-tier access economy and optional-boss exception
### Finalised core rule
- **Universal Gate Keys (LOCKED L17):** One shared class of key is accepted by standard sealed fog gates protecting regular major bosses and minibosses. A player who owns a universal key may choose *which eligible ordinary gate* to unlock first. No region-coloured ordinary keys or arbitrary named-boss keys are required.
- **Rare special key (PROPOSED P16):** An exceptional optional encounter *may* have its own authored key and optional sealed fog gate. This gate cannot sit on the mandatory campaign spine. The optional boss is side content; failing to find the key cannot block the ending or essential travel.
- **Unlock and commitment (LOCKED concept L16):** First unlock is permanent and separate from `enter encounter`, from `boss defeated`, and from `loot extracted`. Passing or inspecting the gate never auto-spends either key type and never starts combat.

### Example of meaningful route and currency choice (illustrative; not cost locks)
A player has one **banked universal Gate Key** and knows of two sealed gates: the required guardian and an optional Warden miniboss. Spending it on the Warden first yields an opportunity for optional side rewards but delays the guardian, unless another universal key can be acquired. Both spend from the *same* key pool. Later, a concealed champion behind a special-key gate can be sought for prestige/unique sidegrade without controlling any required route. No specific quantity or reward is approved yet.

### Progression-safety requirement (PROPOSED level-authoring invariant)
Optional spending must not permanently make required content inaccessible. Author at least one legal route to another universal-key source or a recoverable key when a required standard gate remains sealed. A finite *set* of keys is possible only if campaign-critical reserves cannot be permanently wasted; otherwise design a bounded, reliable replenishment source. Keys should take exploration/extraction effort, not unbounded low-threat grinding. Never sell progression keys as a required purchase and never charge again for an already opened gate.

### Optional exceptional encounter restrictions
- The special-key boss must occupy a side branch, not the only link between core regions.
- Its room may reward a unique treasure, unusual rematch or nonessential alternate connection, but must not contain the only source of universal keys, required upgrades or the campaign ending.
- Mark special-key gates distinctly on the world map after legitimate discovery; do not reveal their hidden contents through fog of war.
- Its special key may be a unique found relic instead of a replenishable currency; exact source and whether one-off use consumes it remain **OPEN**.
- Key source, recovery and entry still obey camp banking (as approved), strict route bans and no accidental combat. Requiring banked keys before unlock is now **LOCKED L19** for ordinary universal Gate Keys. Applying the same rule to a hypothetical exceptional special key is still PROPOSED.

### Consequence for expedition command
If a player assigns `Open ordinary gate`, show the universal key requirement; if they assign `Open exceptional gate`, show its distinct prerequisite. If missing, mark `Skipped — Blocked` and continue permitted later objectives (L14). The character cannot substitute a universal key for a special key or vice versa, and never silently exchanges currencies. A special gate remains permanently opened if a legitimate unlock committed even if the adventurer later dies.

### Acceptance conditions
1. One banked universal key can be presented at either of two standard gates; spending it opens only the selected gate, and the second remains sealed.
2. Every standard major and miniboss gate accepts the same key *type*; no implicit region restriction exists.
3. Special-key gate rejects an ordinary Gate Key and never auto-converts it.
4. Finishing the campaign is possible without finding, purchasing or spending a special key.
5. Optional standard-gate spend cannot irreversibly remove all feasible ways to unlock outstanding mandatory gates (authoring validation).
6. A gate's successful first unlock is permanent, and rematch entry never consumes another gate-opening key.
7. In either key case, proximity and unattended discovery never purchase access or start a fight.

## Workshop 14 — Creator-locked Gate Key acquisition (L18)
**LOCKED:** one-time, guaranteed authored sources **and** challenging repeatable replenishment must both supply the shared universal Gate Key currency. Previous questions phrased as 'whether to use fixed discoveries versus renewable keys' are now **RESOLVED**; do not accidentally revert to a finite-only pool. Standard gates remain first-unlock only and do not re-charge after death/rematch.

**LOCKED L19 acquisition/eligibility lifecycle (quantities remain PROPOSED):** discover first authored key source → meet its condition → carry the key at risk → physically return to camp → optionally allocate a previously banked key to a later expedition → explicitly unlock one chosen fog gate → separately opt into boss combat. The step requiring a previous camp bank is now **LOCKED L19**. Keys from trials similarly require a real return journey to be banked, and a key lost before camp remains governed by provisional cache rules. This sequence is not an artificial run-counter; players may find sources in a different order and return by chosen routes.

**Campaign-safety invariant (required to meet L18's intended purpose):** every mandatory key-locked gate must be recoverably fundable after optional-gate spending, death, missed unique sources and cache replacement. Maintain a trial reachable from camp without spending a new universal key or any optional special key. Player-imposed route bans (L13) can obstruct that trial; display the conflict instead of overriding the order. A trial must have visible victory conditions and deterministic key award on actual completion, not a random rare drop. Losing the award before successful camp extraction does not create a free replacement in inventory, but the trial is available again on a later expedition.

**First-key onboarding (PROPOSED):** the initial authored discovery appears on a legal pre-boss route; the player sees a key-locked fog gate, realises the resource's purpose, and chooses to pursue and extract the discovery. A repeatable source is unlocked/readable early enough to remedy a lost key, without spoiling unexplored fog geography.

**Audit and prevention:** one-time claim flags separate from key inventory; repeatable claim at most once per eligible run (PROPOSED); a permanent opened-gate flag atomically paired with a single universal key consumption; neither app reload nor death duplicates spent or lost keys. Special optional-boss key stays P16, never a substitute for an ordinary Gate Key. Detailed specification and tests: `22_GATE_KEY_ACQUISITION_AND_SOFTLOCK_PREVENTION.md`.

## Workshop 15 — First-use eligibility LOCKED L19
- The inventory must distinguish **fresh/unbanked carried** keys from **previously banked, physically issued** keys; merely counting all keys in one pouch as spendable violates L19.
- Newly claimed keys and keys recovered from a cache **without any earlier completed camp banking** cannot pay a fog-gate charge until the adventurer returns to camp and starts another expedition with the banked key.
- A key previously banked at camp and then brought into the current expedition is eligible for deliberate first unlock while carried, including after recovery from a death cache if it retains that established eligibility. This does **not** make it remotely spendable from camp inventory.
- At a sealed gate with only newly found/unbanked keys, show `Key not yet banked — extract to camp first`. If a valid `Open gate` objective cannot otherwise proceed, mark `Skipped — Blocked` under L14 and continue permitted tasks. Merely passing or seeing the gate does not spend a key or enter combat.
- When the player authorises a spend with enough eligible carried keys, consume the correct amount and permanently open the gate as **one committed world-state change**. Opening is separate from entering combat; subsequent death does not create a refund or another opening fee.
- The number of key slots, exact first-unlock cost, and ability to preauthorise payment remain open, NOT creator locks. **Source of truth:** `23_KEY_BANKING_LOADOUT_AND_FIRST_USE.md`.

## Workshop 16 — First-open key budget under L20
Creator LOCK L20: the expedition prepared keyring carries **at most two previously banked universal Gate Keys**. A fresh key earned mid-expedition does not become spend-eligible even after one keyring slot is emptied; physical camp banking and later reissue are still necessary (L19). The keyring size is fixed L20; the numeric cost is now **LOCKED L21 at exactly one universal Gate Key for each standard miniboss or major-boss first unlock**. Historic alternatives charging two are superseded. Opening and entering remain two independent deliberate permissions, with no idle-time auto-spend or automatic fight. An already opened gate, rematch or first boss kill charges no further key. Full rewards/ledger analysis in `24`.
