# 20 — Content Roadmap, Measurement and Production Gates
**Owner:** Design production governance  
**Status:** Proposed sequence; implementation not requested yet

## Workstream order
1. **Rules freeze:** lock how route planning, retreat, sanctuary recovery, cache loss and temporary/mastery XP operate.
2. **Single-room demonstration:** separate combat AI session validates sword-and-shield readability and competence; this stream validates encounter observation and orders contract.
3. **Looped map:** one small area with two viable return routes, fog reveal, short passage, and camp extraction.
4. **Risk loop:** add resource collection, retreat in danger, death cache, and Chronicle.
5. **Character arc:** automatic temporary leveling, one significant sanctuary upgrade, bounded healing.
6. **Boss milestone:** first boss alters world immediately, clearing opens connection; optional rematch does not affect first clear.
7. **Living variation:** curated patrol variations and temporary condition; quick loss-of-contact reset remains locked.
8. **Usability and balance:** test first hour, route choice, repeat play and fail explanations.
9. **Art and monetization planning:** only once core player interest is demonstrated.

## Content authoring checklist
For each region, provide map diagram, all connection states, enemy territory polygons/anchors, line-of-sight occluders, safe points, encounter budget, variable-condition pool, unique rewards, renewable rewards and Chronicle-relevant discovery labels. Each boss additionally needs authored first-clear world alteration and independent rematch trigger/state.

## Key product metrics (descriptive, no fabricated targets)
First expedition start/completion; first extraction; first death; recovery attempt/success; return to second run; percentage using route shortcuts; plan edits following failure; percentage of time spent observing uneventful travel; sanctuary choice rate; boss-first-win and rematch attempt; post-campaign play. Measure **quality of behaviour**, not just total session time.

## Problem diagnosis
- **Players idle through long walks:** shorten routes or permit faster known travel.
- **Players cannot explain losses:** instrument Chronicle causes and improve telegraphs/status, not simply reduce damage.
- **Players endlessly farm Old Road:** review finite enemy/loot budgets and progression incentives.
- **No one changes doctrine:** changes may be too subtle or not explained.
- **No one uses safe retreat:** thresholds, escape geography or stakes may be wrong.
- **Players ignore boss rematch:** reward/route commitment may be unattractive; don't force it.
- **Players cannot recover caches:** revisit death-marker placement, risk signalling and minimum starter-kit viability.

## Production gates
**G0 Design coherent:** no contradiction between locked rules and subsystem docs.  
**G1 Prototype mechanically complete:** one full plan→run→extraction/death→replan cycle.  
**G2 Fair and legible:** participants understand choices, enemy encounter outcomes and cache risk.  
**G3 Replay credible:** first-route variations and shortcut unlock alter real decisions.  
**G4 Publish-ready:** save reliability, device performance, accessible interface, monetization-policy review, content ownership and crash recovery.

## RUN.world validation checklist (before implementation/release)
Confirm current official SDK/runtime policy, account/login constraints, storage persistence model, screen orientation rules, app lifecycle, ads/purchase entitlements and creator revenue terms using RUN's *current* documentation. Prior posts are context, not authoritative API snapshots. This is deliberately not a programming guide.

## Future abbreviated GDD
Once outstanding creator decisions are resolved and the mechanics survive first tests, produce an abridged document sourced from this library. Do not replace detailed system files with the abridged document; it is a high-level navigational artifact and stakeholder handoff.

## Workshop 12 — Additional content pressure from fog-gated minibosses
Gate/key loop extends vertical-slice scope. Before multiplying minibosses, prove: (1) gate can be discovered without accidental combat, (2) obtain and **extract** first key under proposed model, (3) successfully unlock permanently, (4) opt into encounter separately, (5) abandon without losing opened-gate progress, (6) return for rematch without another unlock key. A single boss with gate is a valid earliest proof; optional miniboss tests come once core loop works. Monitor first-gate discovery → first key banked → later expedition started → first unlock → first intentional boss attempt → boss clear. A repeated trip should reflect agency and progression, not obligatory resource grinding.

## Workshop 13 — Key economy production staging
**v1 proof:** one ordinary major-boss fog gate unlocked with a universal Gate Key; distinct deliberate unlock and battle-entry decisions, permanent opened flag, carried-key/extraction handling. **Later:** second ordinary gate (optional miniboss) to test the shared-currency spending choice. **Post-proof optional content:** consider one authored special-key side-boss and validate that the ending and main travel graph are unaffected when its gate remains sealed. Do not build a crafting tree or second mandatory currency for exceptional keys.

## Workshop 14 — Key economy proof before expansion
Creator-lock L18 adds a specific economic milestone: prototype at least **one authored unique universal-key discovery** and **one challenging repeatable universal-key trial**, with physically risky extraction, before adding numerous miniboss gates. Validate both unique reward retention and repeatable trial eligibility after death, cache loss, all-keys-spent states and gate-open state. Keep key sources reachable without the key needed for the next mandatory gate. Distinguish low-quality repetitive farming from purposeful repeat expeditions in qualitative testing.

Measure: first key discovery, first key claimed, first key banked, percentage losing an unbanked key, recovery attempts, first key-gate unlock, optional-spend choices, trial completion, trial extraction success and lost-key rebound time. Monitor whether first-run key-source breadcrumbs are discoverable, and whether players understand they must still return to camp. Do not optimise for artificially long session lengths or rely on weekly resets. See `22` for authoring and tests.

## Workshop 15 — Milestone after L19
Before adding a second boss, validate end-to-end: collect unique key on run A, physically extract it, visibly bank it, pack it into run B, unlock a gate with deliberate permission, and either fight or leave. Repeat using a trial-earned key; verify a newly found key is rejected at the gate, sanctuary cannot bank it, and a recovery-cache pickup cannot bypass camp. Monitor player understanding of why a key is visible but temporarily ineligible, whether two journeys feel like meaningful preparation rather than repetitive walking, and how often players lose a prepared key before spending. The exact carry cap and cost are future balance decisions, not hidden implementation assumptions.

## Workshop 16 — Two-key economy slice order
**LOCKED:** maximum two prebanked Gate Keys issued per expedition. Test keyring UI and provenance before additional gate price models. **PROPOSED first proof:** initial authored key → extract and bank → issue one → open major fog gate → enter only by explicit consent. **Second proof:** challenging repeatable key trial → extract and bank → pack two → optional miniboss gate versus mandatory gate investment; each spend separate. Only after this validate first miniboss permanent map reward, at-risk spoils and recovery-cache overflow. No extra kit, monetised capacity or gate tiers in initial slice. Add human usability test for spent-versus-at-risk-versus-home key explanations. See `24`.

## Workshop 18 — Content budgeting proposal
Target authoring catalogue 6 regular enemies + 1 optional miniboss + 1 main boss + 1 optional secret boss; this is a content list for the combat AI session, **not** a commitment all nine must ship in minimum viable slice. Prioritise 3 fundamental behaviours (sentry melee, small fast skirmisher, ranged pressure), then heavy and hazard units, then late-region duelist. Implement one main boss and one optional miniboss after normal combat robustness; reserve secret boss for stretch/postgame. See `25`.


### Workshop 20 — Art production gate (PROPOSED)
Do not mass-produce characters and tilesets before one player, one Ashen Sentry, one Mireling, one Old Road wall-aware arena and truthful combat telegraphs pass the phone-scale and grayscale checks in `28_VISUAL_STYLE_AND_ART_DIRECTION.md`. The proposed painterly dark-fantasy style is not creator-locked; approval of one annotated gameplay composition and source/editability rules should precede expensive artwork.


## v0.14 visual validation gate (PROPOSED)
Before asset expansion, review proposed Old Road O1 art sprint in `29`: three silhouettes, calm modular terrain, honest telegraphs, six screenshot captures, mobile/grayscale comprehension and combat event parity. Do not mark complete from screenshot concept alone. Stage a creator approval checkpoint for Ashen Reliquary or style revision. This need not block Claude Code's separate dungeon/combat integration work.

## Workshop 22 hybrid sprite-workstream stage gates
L22 locks Blender-authored 3D characters exported as 2D frames. Gate ART-0: camera/pivot silhouette coupon on painted road, no animation atlas. ART-1: hero guard/light/dodge and two enemies with limited facings. ART-2: Old Road O1 scene painted ground + VFX + real combat-sim parity. ART-3: mobile/desktop performance, texture-memory and readability QA with six capture board. ART-4: explicit visual-style approval before mass roster production. All render scale, frame counts and schedule remain PROPOSED; `30A`/`30B` are tracking specs not evidence of work completed.

## Workshop 23 — production gate after L23
Before authoring eight-way full-body sheets for all enemies, approve a shared +75° orthographic Blender camera/pivot calibration mannequin (N/E/S/NE + shield-side stress), then a modest hero clip set, then Sentry and Mireling. This is **asset production planning only**; no gameplay AI change and no claim of completed art. Source rig/render preset, compass mapping, frame/pivot metadata, prototype zoom/readability and atlas memory are required evidence. Source documents `31`, `31A`, `31B`; overall candidate visual style P18 stays unapproved.

## Art gate after Workshop 24 (L24)
P0 character production now requires **eight-direction locomotion and guard**, with **attack-view selection by actual tell and hit geometry**. Do not commission complete nine-character atlas batches until mannequin -> hero -> Sentry -> Mireling QA and mobile texture budgets pass. Source of truth: `32`, `32A`. No increase to gameplay scope.
