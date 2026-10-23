# 11 — Bosses, Campaign Progression and Rematches
**Owner:** Major world progression; tactical boss AI handled elsewhere  
**Status:** Permanent first defeat, optional rematches and first-key encounter fog gates LOCKED; challenge catalogue/key economy PROPOSED

## Boss purpose
A boss is an authored high-risk expedition objective and a permanent world milestone, not merely an oversized farming enemy. First victory alters the world, often opening routes or removing a major obstacle. A finite campaign of major boss milestones culminates in a true ending; postgame remains optional.

## World-boss first defeat
- Boss exists in ordinary world until defeated once.
- At first valid victory, immediately record **boss defeated** and apply authored permanent world alteration.
- The arena becomes traversable and the ordinary boss stays absent in future expeditions.
- Gold, equipment and mastery reward gained from the victory remain carried and vulnerable until extracted.
- Death on the way home does not re-enable the boss or re-lock the opened route.

## Why route choice matters
A boss can be reached via a short dangerous shortcut with fewer preparatory fights or a longer circuit with more temporary XP/upgrades and increased attrition. Neither should be universally optimal. Players should be able to scout arena approach, extract, then return prepared; entering boss area is not automatic boss engagement unless clearly telegraphed and authorized by objective.

## Combat expectations, not AI details
First guardian should communicate blockable pressure, heavy attacks that demand another response, and spatial threat. A proposed two-phase structure tests adaptation. Exact telegraphs, attacks, animation frames, stamina numbers, state machines and spacing rules belong to the separate combat AI session. This document defines boss context and persistence only.

## Optional rematch system
After first defeat, a separate challenge activation appears at or near the cleared arena. It is **opt-in**, never automatically resurrecting the boss during routine exploration. The player should physically travel to the arena and commit to the challenge as part of an expedition. Rematch outcomes affect carried rewards and records, not the original cleared state.

Proposed variant types:
- Standard recreation of the original fight.
- Limited-healing challenge.
- Endurance encounter leading into fight.
- Guard-discipline or clean-performance challenge.
- Successful boss defeat **and** physical camp extraction.

Avoid variants dependent on manual dodge/twitch inputs because combat is autonomous. Score criteria must be meaningfully influenced by loadout, doctrine, route and pre-encounter state; “never block” might be impossible to instruct under current controls and should not be used until supported.

## Rematch rewards
Prefer first-clear records, cosmetic unlocks, new planning sidegrades or finite exceptional materials. Repeating the same boss must not be the fastest unlimited gold/mastery farm. No paywalled re-entry, no purchased rematch advantage, and no paid reclaiming of death losses.

## Rematch and loss
Activation does not secure carried loot. If the adventurer dies, ordinary death-cache rules apply. A rematch loss may reset only the temporary encounter. The main-world boss cleared state and route openings remain intact.

## Boss progress and campaign pacing
Major bosses should change more than the boss room: e.g., drainage reveals routes, unlocking a transport link, opening a downstream shortcut. Prior regions remain relevant as passages, recovery destinations and optional discovery areas, rather than becoming abandoned levels. Exact world count/ending length is OPEN; do not overbuild campaigns before first boss proves worth replaying.

## Boss intelligence journal
Record first discovery, confirmed observed behavior, first defeat and rematch records. Reveal only what the adventurer has plausibly observed, not an omniscient exact win probability. Later scouting remains useful for alternate boss approach and route optimization.

## Acceptance checks
Kill boss, immediately trigger death, verify permanent victory remains. Return to arena on next expedition, ordinary boss absent, exit route open. Opt into rematch and lose: original clear flag untouched. Repeat rematch doesn't duplicate one-time progression reward. Complete rematch and return home: bank eligible reward only on camp arrival.

## Workshop 12 — Key-sealed encounter fog gates (LOCKED access concept)
Both **major bosses and minibosses** stand behind visible key-sealed fog gates. **First gate opening consumes an appropriate key once**. Gate discovery, gate unlocking, encounter commitment, first boss defeat, and extraction/banking are five independent events. A discovered or open gate never causes an accidental boss fight: entering combat requires an explicit player decision at a secure approach/commitment point. A gate stays open after a valid first unlock, including on player death; the boss stays alive until a valid victory. Once defeated, the boss stays absent from normal exploration, while rematches remain opt-in and do not charge another entrance key.

Mini-boss additions expand the existing prototype roster and must be budgeted explicitly: one miniboss is a PROPOSED vertical-slice addition; whether its first defeat persists, its rematch status, and reward are OPEN. Suggested test: a one-time clear that exposes a shortcut or unique loot, not a reusable key farm. Existing world-boss permanence (L07) cannot be silently applied to all optional minibosses as a lock.

**Repeat-run pacing:** likely loop `discover gate → acquire and physically extract key → return prepared to gate → deliberately unlock/engage`. The first-use camp-bank requirement is **LOCKED L19**. It enforces separate acquisition/extraction and later gate-access expeditions without an arbitrary timer. Exact gate/key economy resides in `21`.

## Workshop 13 — Gate key classification and optional pinnacle bosses
**LOCKED L17:** Normal major bosses and minibosses use the universal Gate Key pool for their first fog-gate unlock. The player may choose which standard gate to spend on first. This never overwrites first-clear or rematch persistence rules.

**PROPOSED P16:** A rare *pinnacle/secret optional boss* may use a singular special key acquired through exploration. Place it off the campaign's critical route; it must not guard the only route to a necessary region, main story ending, required sanctuary or necessary supply of universal keys. An optional shortcut behind it is acceptable only when another required route remains usable. The exceptional encounter should offer nonmandatory aspirational rewards, not vital baseline progression. Details of key acquisition, whether multiple special bosses exist and the final reward remain open.

**Scope control:** Prototype still needs only the initial key-gated standard boss. Implement neither a special key nor a special boss in the first slice until gate discovery → key extraction → permanent unlock → separate engagement is proven. No tactical combat AI changes specified here.

## Workshop 14 — Progression safeguards from renewable key supply
L18 ensures that unlocking an **optional** miniboss gate with a shared universal Gate Key can delay, but cannot permanently prevent, access to mandatory ordinary boss gates. Every mandatory progression state must preserve a feasible keyless path to challenging universal-key replenishment, conditional on the player allowing a legal route. Defeating a boss permanently alters the world; the already opened fog gate never charges another key, including optional rematches.

**PROPOSED boss-gate pacing:** major gates commonly cost one universal key, and optional miniboss gates create a genuine competing spend. Both cost amounts remain open. Do not make repeatable Gate Key trials rely on clearing the next unopened boss; do not place the only renewal path behind the optional special-key side boss (P16). Test both `all keys spent on optional content` and `key lost in replaced cache` without handing out an automatic rescue currency. See `22`.

## Workshop 15 — Boss access after camp banking (L19)
A standard boss/miniboss gate may not be opened with a universal key newly found on the same expedition. Discover the source → claim the key → return physically to camp → load that banked key for a later expedition → unlock the selected gate deliberately. Once opened, the gate is permanently traversable (subject to other ordinary topology constraints); the boss remains undefeated until a separately committed fight is won. Rematches never recharge the unlock key. A main-path key source and challenging replenishment route must remain accessible without that unopened boss gate. Standard first-unlock gate price is LOCKED L21 at one universal Gate Key; a rare special-key optional boss remains P16.

## Workshop 16 — Miniboss key investment versus campaign gates
L20 limits each expedition to **two prebanked, deliberately issued universal keys** in a prepared keyring; this does not allow remote payment from camp or use of newly found keys (L19). A deliberately unlocked miniboss gate is permanently open whether or not the fight is attempted or won. **PROPOSED:** flat first unlock cost of one universal key for both ordinary major and miniboss gates (O26). Under this model two prepared keys can unlock two different gates, each with its own deliberate authorisation; two separate fight-entry decisions are still required. A cost of three or more cannot be authored in the current system.

**Miniboss payoff PROPOSED, O22 OPEN:** permanent first-clear change to some optional route, a single at-risk extractable reward, and greater strategic convenience for later runs. Avoid granting a standard automatic replacement universal key on first clear or making repeated miniboss rematches a better key farm than a challenging repeatable Key Trial. Whether the miniboss remains defeated in ordinary geography is still not explicitly locked; recommend permanence to preserve world integrity. Special-key pinnacle boss remains an optional P16 concept only. See `24`.

## Workshop 17–18 — Key price confirmed, authored boss concepts proposed
**LOCKED L21:** Standard miniboss/boss key-sealed fog gates cost exactly 1 universal previously banked + subsequently carried Gate Key on first deliberate unlock. Combat commitment is always separate. Miniboss first-clear persistence and its reward are still OPEN O22.
**PROPOSED roster detail in `25`:** MB01 The Bell Warden (big/medium melee with radial pulse, suggested L4–6), B01 The Siltbound Castellan (big/slow, silt-wave ranged reach, alternating weir-channel arena gimmick, suggested L7–9; nearly impossible for a fresh L1 through ordinary attrition), optional SB01 The Unmoored Surveyor (medium/fast melee+ranged, delayed traced-path strikes, suggested L10–12, secret key *only if P16 adopted*). First boss victory would permanently drain an authored passage as a prototype world effect; miniboss first-clear shortcut + at-risk shield sidegrade remain unapproved proposals. Tactical attack tuning is delegated to separate combat-AI session.
