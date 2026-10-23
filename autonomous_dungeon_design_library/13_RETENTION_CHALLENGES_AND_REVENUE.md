# 13 — Replayability, Retention and Revenue
**Owner:** Product economy and long-term engagement  
**Status:** Ethical/strategic direction PROPOSED; platform economics require reconfirmation

## Retention must come from the game
Three major arcs:
1. **Discovery:** fill persistent map, learn routes and threats, extract first rewards.
2. **Conquest:** plan boss approaches, permanently defeat area guardians, alter world, finish campaign.
3. **Mastery:** optional rematches, route efficiency, expedition contracts, full discovery and personal bests.

Retention hooks should be intrinsic: failed extraction yields a solvable recovery problem; opening a shortcut changes next run; a map gap presents a concrete exploration goal. Avoid daily-login punishment, streak anxiety, endless mandatory grind or compulsory ad recovery.

## Repeatable content tools
- Variable but bounded encounters and weather within fixed regional identities.
- Mission templates: Survey, Supply, Recovery, Boss, Custom.
- Clearly stated optional challenges (no healing used, extract a rare treasure, explore alternate route, boss rematch + return).
- Expedition Chronicle as self-comparison, route overlay and improvement evidence.
- Potential periodic **fixed-seed challenges** so participants face equal start conditions; ranked scoring should require actual extraction and prohibit paid advantages.

## Core session funnels to measure
Launch -> first meaningful encounter/discovery -> first choice -> retreat decision -> extraction/death -> second launch. Report whether players make route/standing-order changes after a failed run; mere session length is not evidence of engagement. Watch for long periods of unengaging auto-walking, high early death rate and repeated farming of one safe route.

## Revenue design constraints
RUN creator pages currently describe in-game currency spending, ads and a standard 70% creator revenue share, but terms, denomination names, eligibility and SDK offerings may change and must be checked during integration. Public sources, checked during preparation:
- https://get.run.world/creators/revshare/
- https://run.world/blog/revenue-share-is-coming-to-run/
- https://run.world/blog/introducing-the-rungame-sdk-direct-platform-access-for-developer-creators
- https://series-1.gitbook.io/rundot-docs
Treat this as business context, **not a revenue guarantee**. Current SDK/API behaviour is outside game-design sign-off.

## Recommended business model (PROPOSED)
Playable free core experience, supported by optional cosmetic purchases and possibly substantial optional region expansions. Cosmetic categories: traveller appearance, shield finish, camp dressing, atlas styles, non-gameplay travel effects. Paid content should never covertly improve boss odds or extraction success. The main campaign must be satisfyingly complete without a purchase if marketed as such.

## Advertisements
If the platform and audience allow, use optional rewarded ads only at natural, non-combat breaks such as camp or completed extraction. A safe default is a cosmetic or noncompetitive convenience reward, **not** a paid rescue from death. Avoid inserting interstitials at boss failure, during hazardous retreat or before revealing a death cache. No business model should require ads to complete ordinary progression.

## Explicitly reject
Paid instant extraction, paid recovery of lost equipment, paid invulnerability, paid boss continuation, permanent power multiplier sold for cash, exploitative scarcity or pressure based on emotional loss. The extraction risk must remain authentic and fair.

## Content updates
Expand along authored new regions/bosses, encounter variations and optional contracts, not uncontrolled power/stat escalation. Don't make a full live-service roadmap until the first player's first hour is fun. Campaign remains completable with an ending.

## Revenue experiment hygiene
Separate cosmetic conversion from engagement quality; revenue per active player without player satisfaction is not success. Distinguish free-return retention vs incentivized returns. Challenge participation, cosmetic uptake and purchase flow may be tested later; no monetization dependency in vertical slice.

## Decision points still open
Premium purchase vs cosmetic F2P and expansion pricing; entitlement ownership; cosmetic scope; whether rematch leaderboards are platform-supported and worth moderation; age/region restrictions; actual RUN publishing/revenue rules at release. Avoid publishing a pricing promise before these are verified.

## Workshop 12 — Gate repetition and ethical retention
First-time sealed boss/miniboss gates provide a natural repeat-exploration loop: locate a gate, seek a suitable key, **extract it**, prepare and return. This is **repeat play through knowledge and planning**, not a paid energy barrier. A shared gate-key resource may create meaningful competition between optional and progression gates, but prices must preserve viable campaign advancement. No paid emergency key, no monetized access requirement for primary campaign completion and no repeated rematch entry toll after opening. Evaluate drop-off on first key acquisition and return-to-gate conversion before adding more gate types. Key-as-currency breadth remains PROPOSED.

## Workshop 13 — Key strategy without a paywall
Universal Gate Keys are LOCKED as the shared first-unlock currency for ordinary boss/miniboss access. They create choices between opening a progression gate and opening optional content; this is meaningful only if key acquisition has dependable rules and cannot hard-softlock essential progress. Optional secret-boss special keys (P16) may support collection and mastery, but are **never a monetisation lock** or mandatory campaign toll. Track `universal keys banked`, `spent on optional gate`, `needed for next required gate`, `special gate discovered` and `post-discovery optional pursuit`. Do not require advertisements, direct purchases or paid retries to obtain either key type.

## Workshop 15 — Gate Keys and repeat-expedition value (L19)
The bank-before-first-use rule creates a natural cadence of acquisition/extraction and later boss preparation. This must be made engaging through distinct goals and shorter mastered routes rather than forcing arbitrary waiting, energy timers or purchasable shortcuts. Do not sell guaranteed mandatory Gate Keys, paid banking, key-loss refunds or paid bypasses for sealed fog gates. Measure completion of the first full key cycle and perceived friction before scaling key content or pricing cosmetics.

## Workshop 16 — Key scarcity without monetised friction
L20's two-slot prepared keyring introduces concentration of risk and intentional allocation: bring one key for a targeted unlock, bring two for more flexibility, or bring none on exploratory/replenishment runs. Revenue **must not** sell additional prepared keyring slots, guaranteed main-path Gate Keys, key bank bypasses, loot insurance or reduced unlock charges. Test whether optional miniboss rewards create a compelling choice and whether a flat one-key cost produces purposeful expeditions without repetitive mandatory farming. Numeric costs and rewards remain PROPOSED, not locked. See `24`.
