# 25 — Vertical Slice Enemy, Miniboss, Boss and Secret Boss Roster
**Owner:** Encounter and content design; tactical implementation belongs to the separate combat-AI workstream  
**Status:** Detailed PROPOSED working roster, requested by creator on 2026-10-23. Exact names, attacks and tuning not yet LOCKED.  
**Slice baseline:** One sword-and-shield adventurer, stable interconnected world, regional pursuit, quick alert reset, permanent fog, key-gated boss/miniboss access and physical extraction.

## 1. Design target
A fresh **expedition level 1** adventurer should find even the first region dangerous. One weak enemy is achievable; an overcommitment, a pair, or an early heavy enemy can realistically kill an unprepared character. The main area boss should be **practically unwinnable at level 1**, without arbitrary immunity or a hard level gate. Higher expedition levels, route preparation, consumables, a sanctuary upgrade and learned boss knowledge are the intended path to victory. Permanent character power must not simply trivialise the opening.

**IMPORTANT:** Difficulty comes from authored enemy statistics/behaviour, attrition, encounter combinations and spatial pressure; never secretly scale ordinary enemies to match the current adventurer. The current selected universal fog-gate price is LOCKED at one Gate Key per ordinary boss/miniboss first unlock (L21); a banked key must be deliberately provisioned and unlocking never auto-starts a fight.

## 2. Terminology and scale (PROPOSED)
- **Speed:** Slow ~0.70–0.85×, Medium ~0.90–1.05×, Fast ~1.15–1.35× of the adventurer's normal walk speed. Separate speed from attack startup/damage.
- **Size:** Small ~0.6–0.85×, Medium ~0.9–1.2×, Big ~1.6–2.3× adventurer visual height. Actual collision and attack reach separately tuned.
- **Ranged:** Yes if it has an intentional damaging attack beyond normal melee reach. Area pulses with large reach count as **limited range**, not necessarily a projectile.
- **Readable cues:** Each dangerous move needs visibly distinct anticipation, direction/range indication and recovery. Autonomous combat AI must be able to perceive the same cues a player sees.
- **Illustrative stat anchor only:** Expedition L1 adventurer 100 HP, 100 stamina, sword normal-hit 10 damage, 2 healing charges at +35 HP each. These are design placeholders until tested with combat AI. No numeric values herein are locked.

## 3. Regular-enemy catalogue (6)
| ID | Working name / role | Speed | Size | Ranged | Suggested HP | Typical landed damage | Region / entry |
|---|---|---|---|---|---:|---|---|
| E01 | **Mireling**, skirmish/swarm | Fast | Small | No | 35 | 7–10 | Old Road, earliest |
| E02 | **Ashen Sentry**, basic guard | Medium | Medium | No | 75 | 12–16 | Old Road → Watchtower |
| E03 | **Tower Harrier**, ranged pressure | Medium | Medium | Yes | 52 | 10–14 | Watchtower |
| E04 | **Mudjaw Brute**, heavy guard-break | Slow | Big | No | 140 | 25–35 | Sunken Passage |
| E05 | **Silt Spitter**, ranged area-denial | Slow | Small | Yes | 55 | 7–10 direct + hazard | Sunken Passage → Crypt |
| E06 | **Crypt Duelist**, fast elite common | Fast | Medium | No | 90 | 12–17 per hit | Crypt, late |

### E01 — Mireling
**Silhouette/production:** Low, quick scavenger, little armour, clear lunge posture, large enough to read from top-down. **Purpose:** teach that fast targets and multiple contacts threaten stamina more than raw HP.
- **Quick Bite:** brief startup; short-range blockable poke; low damage.
- **Leaping Lunge:** conspicuous crouch and forward burst; can miss; punishable on landing.
- **Backoff/Re-engage:** moves out briefly after aggression; does not vanish or teleport.
- **Counterplay expectation:** shield handles one; positioning and controlling stamina matter more against two.
- **Avoid:** Three fast attackers plus a ranged enemy in the opening corridor.

### E02 — Ashen Sentry
**Silhouette:** Human-sized ruined sentry, plain sword and shield. **Purpose:** sword/shield mirror to validate blocking and opportunistic strikes.
- **Sword Slash:** blockable frontal arc, normal telegraph.
- **Shield Bash:** short-range stamina pressure, little HP damage; may interrupt careless attacks.
- **Guard/Counter:** occasional short defensive stance, then reply if attacked into guard; must not turtle indefinitely.
- **Counterplay:** force safe openings; flanking or stamina management improves outcomes.

### E03 — Tower Harrier
**Silhouette:** Medium humanoid with long weapon silhouette visible at range. **Purpose:** force cover, target priority and movement beyond melee trading.
- **Aimed Shot:** long bright aim cue and linear projectile; blockable from front or stopped by cover.
- **Quick Shot:** faster but lower damage; used at mid range.
- **Reposition:** steps toward plausible firing lane / away from melee, within regional territory.
- **Counterplay:** cover reduces threat; adventurer can approach during reload/recovery; no omniscient shooting through walls.

### E04 — Mudjaw Brute
**Silhouette:** Oversized heavy, very clear silhouette and pre-swing lift. **Purpose:** teach that shield-blocking everything is not enough.
- **Wide Swing:** slow, broadly telegraphed blockable hit, substantial stamina loss.
- **Crushing Slam:** distinct overhead telegraph; cannot be safely held against with basic guard; evade or move away.
- **Short Charge:** brief committed advance followed by recovery, cannot turn sharply in mid-charge.
- **Counterplay:** patient positioning and recovery punishes; lone L1 adventurer should consider bypassing.

### E05 — Silt Spitter
**Silhouette:** Small grounded ranged creature with enlarged throat/sac and visible shot buildup. **Purpose:** temporary area hazards and avoiding passive guarding.
- **Silt Bolt:** obvious ranged arcing/straight projectile with travel time.
- **Hazard Spit:** visible marked patch; small area remains hazardous for a short bounded time; not an infinite lingering trap.
- **Withdraw:** moves away once approached; slow enough to be cornered.
- **Counterplay:** move off marked floor; approach via cover; shield can address projectile but not safely camp in ground hazard.

### E06 — Crypt Duelist
**Silhouette:** Medium agile humanoid with two clear weapon silhouettes or lightweight blade/shield substitute (not a new player kit). **Purpose:** final nonboss pressure test.
- **Two-hit Combination:** two readable blockable strikes, with a true short pause before the second.
- **Lunging Thrust:** linear advance, punishable on miss.
- **Sidestep → Counter:** repositions to expose the adventurer's flank; limited cooldown to prevent constant evasion loops.
- **Counterplay:** disciplined guard and spacing; should remain dangerous without using instantaneous feints.

## 4. Miniboss MB01 — The Bell Warden (PROPOSED)
**Type:** Armoured guardian / mace and bell. **Speed:** Medium walk, slow attack recovery. **Size:** Big (~1.7× player). **Ranged:** No conventional ranged weapon; **limited-range radial bell pulse**. **Suggested HP:** 420. **Suggested region:** Optional Watchtower/side vault accessible behind a standard 1-key fog gate. **Viability:** L1 exceedingly risky, intended L4–6 with resources and route prep.

**Gimmick — Toll and Silence:** Every third major action, the Warden draws back and rings its bell. The radial shockwave is visually telegraphed by expanding floor rings; a pillar/edge-safe pocket or sufficiently distant position offers avoidance. The bell causes **guard stamina pressure**, not unavoidable full-screen damage. After ringing it is visibly vulnerable for a meaningful recovery window. Below ~50% HP, a second pulse follows the first after a *clear* extra warning, not an instant unannounced hit.

| Move | Readable cue | Effect | Intended counter |
|---|---|---|---|
| Mace Sweep | Broad windup, weapon side raised | Blockable broad frontal attack | Guard or leave arc |
| Gatebreaker | Weapon held overhead, longer windup | Heavy vertical guard-breaking strike | Move/evade; do not simply hold guard |
| Bell Toll | Audible charge + circular floor cue | Radial stagger/stamina pulse | Move to marked safe pocket / beyond reach |
| Recovery | Bell Warden lowers mace after toll/slam | Temporary punish window | Counterattack / reposition |

**First-clear proposals:** Permanent opening of an optional Watchtower–Passage connector, *plus* one unique extractable shield sidegrade (**Warden's Rim:** improves guard stability but slightly slows repositioning). Unlock stays permanent if killed on return; extractable shield remains at risk. Does not automatically refund the key. Optional miniboss rematches remain OPEN, not assumed to share the main boss rematch lock.

## 5. Main area boss B01 — The Siltbound Castellan (PROPOSED)
**Type:** Huge drowned fortress commander / heavy halberd. **Speed:** Slow walking, Medium committed burst steps. **Size:** Big (~2.2× player). **Ranged:** **Yes**, a clearly telegraphed linear silt wave at distance; main combat is melee. **Suggested HP:** 950. **Arena:** a single fixed, readable rectangular weir hall with 3 parallel floor channels and a few blocking pillars. **Intended first-clear level:** L7–9, with reasonable supplies, one sanctuary choice, learned cues, and planned approach. **At L1:** ~95 clean sword hits before mitigation, against a boss capable of eliminating the player in ~3 unblocked heavy hits. Practical victory should be extraordinary, never mechanically forbidden.

**Central gimmick — The Three Weirs:** The Castellan periodically activates *one* of three clearly outlined floor channels. Water/silt sweeps across that channel after advance warning; outside channels remain traversable safe ground. The hazard costs health/stamina and forces positioning; the physical map remains fixed. The marked channel is chosen from a bounded authored sequence/legible cadence, **never secretly targets the only available legal escape tile**. In phase 2 it activates two channels sequentially with separate warnings; always leave a reachable safe region. This is a designed arena hazard, not an arbitrary AI dodge tax.

| Move | Cue | Effect | Response to design/test |
|---|---|---|---|
| Castellan's Arc | Halberd carried low, wide side sweep | Blockable wide attack, heavy stamina pressure | Block with reserves or reposition away from arc |
| Weirbreaker Slam | Long overhead posture and distinct floor warning | Guard-crushing narrow impact | Evade/reposition before impact |
| Silt Wave | Halberd planted toward a visible lane | Ranged line attack, obstructed by solid pillar | Move laterally/use cover; no through-wall hit |
| Flood Channel | One channel glows/pulses before silt rush | Temporary lane hazard | Move to safe lane before surge |
| Recovery Window | Weapon sticks momentarily after slam or wave | Opportunity for offense/heal/disengage | Noticeably punishable, not animation-free reset |

**Phase 1 — Above 45% HP:** One flood channel at a time, long telegraphs, limited combinations. **Phase 2 — At or below 45%:** Alternating channels, modestly shorter gaps, more frequent wave or slam but **no sudden unexplained speed/damage spike**. Between phases give a clear stagger/transition so AI and player can read state.

**First-clear world effect:** The fortress drainage wheel turns permanently; floodwater drains from one previously mapped but impassable passage, creating an authored shortcut and route toward the next campaign district. The Castellan stays defeated in the normal world. Boss-reward loot/XP still requires extraction. **Rematches:** optional, player-authorised at its cleared arena, gate never recharges key; one first-clear challenge reward per variant, no dominant currency farm.

## 6. Secret boss SB01 — The Unmoored Surveyor (OPTIONAL CONCEPT)
**Type:** Lost expedition commander / agile sword wielder with throwing survey pins. **Speed:** Fast. **Size:** Medium (1.1× player). **Ranged:** Yes (short-medium pin throws). **Suggested HP:** 1250. **Intended challenge level:** L10–12 or post-campaign slice progression. **Availability:** Hidden side pocket with **possible special key**, entirely optional and never required for campaign ending, ordinary Gate Key replenishment, required region or sanctuary. The special-key system is PROPOSED, not creator-locked. This boss is **content stretch**, not first core-slice acceptance gate.

**Central gimmick — Traced Footsteps:** The Surveyor marks up to 3 recent adventurer locations with visible surveying stakes. After a generous delay, narrow spectral strikes traverse between stakes in a clearly signalled order. The trick rewards varied movement and knowing when the adventurer should disengage or reposition; it **must not** punish the AI for following mandatory player orders with unavoidable damage. The marks never close every possible safe pocket. No permanent alteration of world geography or fog knowledge.

| Move | Cue | Effect | Counterplay |
|---|---|---|---|
| Surveyor's Cut | Blade and shoulder turn | Fast but blockable short arc | Guard discipline and clear counter window |
| Bearing Pin | Raised glowing arm, visible aim line | Short-medium projectile | Block from front or avoid line |
| Route Mark | Three visible stakes placed on previous path | Delayed connected-line strike | Move off marked segments before pulse |
| False Advance | Feigned approach followed by committed thrust | Punishes premature continuous attacks | Recover stamina; react to committed thrust |
| Phase 2 Echo | Existing marks fire once again in reverse order | Pattern recognition test | Read repeat cue, avoid old routes |

**Rewards:** Optional first-clear trophy/cosmetic and one useful **nonmandatory** sidegrade; no guaranteed replacement universal Gate Key, no campaign-critical route. If it has rematches, they must be deliberate and not required for progression. Gate entry never auto-starts combat.

## 7. Static difficulty curve, not enemy level scaling (PROPOSED)
| Region or encounter | Suggested level when arriving | What an L1 expedition experiences |
|---|---|---|
| Old Road | L1–2 | One weak contact winnable; repeated injuries or 2-at-once dangerous |
| Watchtower | L2–4 | Ranged + guard pair usually forces route/retreat decisions |
| Sunken Passage | L3–5 | Brute and hazardous terrain generally too costly to brute-force |
| Bell Warden (optional) | L4–6 | Possible in theory but impractical for fresh kit |
| Forgotten Crypt | L5–8 | Duelists/mixed patrols test earned skills, supplies and route knowledge |
| Siltbound Castellan | L7–9 | Near-impossible at L1 without prohibiting entry by level |
| Unmoored Surveyor (optional/stretch) | L10–12 | Not a credible L1 challenge; optional late mastery test |

**Level progression constraint:** Combat XP earned *during the expedition* must make L7–9 reachable along a plausible pre-boss route; otherwise a reset-to-L1 expedition can never reach the intended first-clear strength. The first boss must have a route with enough real encounters/discoveries and sanctuary recovery for a credible winning attempt. A fast shortcut offers lower attrition but fewer level-up opportunities; the longer route offers growth and risk. Do not compensate by creating no-telegraph damage or guaranteed loss at L1. Proposed first level-up after ~2–3 ordinary solo contacts, but tune against automated combat results and route length.

**Anchor comparison — testing only:** With example L1 hit of 10, a 950-HP boss needs at least 95 landed hits without factoring mitigation; after temporary levels and upgrades, useful damage could be ~20–25 and require 38–48 hits. Confirm actual combat speed, telegraphs, healing and approach attrition in the other session; do not treat these as balanced production values.

## 8. Encounter distribution (PROPOSED)
- **Old Road:** Mostly E01 and occasional E02. First fight alone; no unfair starting swarm. Gate Key trial access remains independent of unopened fog gates.
- **Watchtower:** E02 + E03 individually, then curated pair encounters; MB01 optional behind key gate.
- **Sunken Passage:** E04 and E05, rarely a pairing with a clear escape route; includes one relevant sanctuary.
- **Forgotten Crypt:** E02, E05, E06; authored warning before high-risk double encounters; leads to B01 standard gated arena.
- **Secret pocket:** SB01 only if player actively discovers the optional route and deliberately authorises its encounter.

Spawn/population placements vary per expedition within these regional sets; enemy *statistics* and telegraph semantics do not auto-scale. Ordinary enemies defeated during an expedition do not respawn until a future expedition. Boss/miniboss access rules and optional rematches remain separate.

## 9. Practical content build order for the parallel enemy/AI session
1. **E02 Ashen Sentry** first: reference for hit, block, guard, stagger, telegraph and retreat.
2. **E01 Mireling** next: fast small collision/pathfinding, flanking and paired encounter safety.
3. **E03 Tower Harrier**: ranged line-of-sight and cover targeting.
4. **E04 Mudjaw Brute**: large hitbox, guard-break vs evade and readable heavy attack.
5. **E05 Silt Spitter**: ranged persistent floor hazard, avoidance/navigation handoff.
6. **E06 Crypt Duelist**: combination timing and spacing without teleporting.
7. **MB01 Bell Warden**: first fog gate, distinct radial pulse, arena clear and first-clear permanent change.
8. **B01 Siltbound Castellan**: phase transition and 3-lane environmental hazard, one permanent world alteration.
9. **SB01 Unmoored Surveyor** last: optional advanced hazard/mark system; do not gate core slice delivery on it.

## 10. Combat-AI handoff (no code)
For each enemy, the separate session should deliver: named telegraphed moves; attack reach and shape; blockable vs guard-breaking classification; minimum recovery after heavy action; collision/size; speed; sight/noise response; regional patrol, pursuit/search/quick-reset compatibility; legal retreat vectors and forbidden-region boundary adherence; expected combat event tags (hit, blocked, guard broken, dodged, encounter cleared, death). Boss additionally needs arena bounds, unlock-but-not-engage handshake, health-phase markers, no automatic reactivation after first defeat, rematch opt-in and nonduplicated first-clear reward.

**Do not specify the tactical decision tree here.** That remains in the other ChatGPT session. This document is an authoring brief and tuning test target for that workstream, not an assertion these behaviours already exist.

## 11. Slice acceptance and difficulty evidence
- Fresh L1 sword/shield adventurer can win an isolated Mireling fight when AI behaves competently; a bad run may still fail.
- Two early opponents materially increase danger; no unavoidable enemy burst kills the avatar without visible counterplay.
- Combat AI can block basic Sentry strikes and evade Brute guard-breaks without manual input; failure is legible.
- Tower Harrier must respect solid cover; Spitter hazards have reachable safe positions.
- L1 attempt on Castellan is almost certainly defeated by ordinary combat attrition, **not** immunity, invisible damage multipliers or locked character-level requirement.
- By reaching L7–9 on a real route and using sanctuary/supplies, boss victory is achievable at credible survival rates after human testing; no promise of a particular percentage before evidence.
- First victory persists after death; boss key was previously banked and explicitly issued; boss does not initiate from gate discovery/opening alone.
- Optional MB01 reward cannot softlock main Gate Key progression; secret boss cannot obstruct mandatory routes.
- All enemies respect known regional populations, and a cleared ordinary enemy does not respawn within the same expedition.
- If the design produces unavoidable deaths because auto AI cannot read a telegraph, revise telegraph/arena/attack rather than make the player compensate by manual combat.

## 12. Open choices after authoring review
1. Confirm exact creature fiction and visual style; names are placeholders.
2. Approve miniboss first-clear permanence and its permanent shortcut + extractable sidegrade proposal (O22).
3. Decide whether optional special key and secret boss belong in v1 launch or only later content (P16).
4. Tune temporary XP curve and stat anchors using the parallel combat AI prototype.
5. Confirm which late-region pairs can appear in the first vertical slice versus only full region expansion.


## Workshop 19 — correction for real attached simulation (IMPORTANT; proposals only)
The previous `100 HP at L1`, `boss-ready at L7–9`, and `Castellan 950 HP` numbers were unbenchmarked working placeholders. In the creator’s attached `combat-sim.js`, true L1 HP=75 and character level is the **sum of stat points invested above 1 across six attributes**. Uniform all-5 gives true L25. Benchmarks (120 seed Measured) show current Breaker L1 win3%, L25 win31%, L55 win83%; a Stalker+Breaker mixed pair stays ~0% at L55. Propose boss readiness L40–65 and INITIAL B1 prototype HP 540–680, MB01 300–420, SB01 680–850 pending 300-seed tests and real-route attrition. Do not preserve earlier numerical placeholders as targets; see `27_COMBAT_BENCH_CALIBRATION_AND_DIFFICULTY_TARGETS.md`.
