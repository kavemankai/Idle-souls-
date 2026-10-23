# 19 — Onboarding, Difficulty and Accessibility
**Owner:** First-session player understanding and difficulty curve  
**Status:** Proposed guidance; no separate creator lock

## First-play promise
Within one short session the player should understand: (1) the adventurer fights on its own, (2) the player chooses destinations and policies, (3) resources remain at risk until camp, (4) fog and shortcuts persist, and (5) retreat is a journey, not a rescue button.

## Teaching sequence
**Camp:** present a default simple itinerary with sword/shield kit and a recommended measured doctrine.  
**Old Road:** one readable low-risk enemy; show what automatic guarding/attack looks like.  
**First fork:** show Safe vs Direct route preference; no giant tutorial modal.  
**First loot:** clearly label carried/unbanked.  
**First threat escalation:** surface Retreat and return-route assessment.  
**First discovery:** persist a mapped shortcut or landmark.  
**First sanctuary:** show rest/major choice and prominently “No banking here.”  
**First death/extraction:** show Chronicle plus one next-step invitation without shaming player.

Do not artificially force player death to teach recovery. If naturally dying, present fair recovery and starter-kit fallback. If extracting successfully, celebrate smart conservatism rather than implying they played incorrectly.

## Fair difficulty
Difficulty comes from planning trade-offs, known hazards and competence limits, not stealth stat scaling or random unavoidable danger. Low-risk paths should support genuine recovery. Riskier paths should clearly offer something unique or more valuable. Permanent upgrades should not erase skill/knowledge relevance.

## Readability and access
Support touch/mouse, high-contrast map, color-blind-friendly status indicators, adjustable HUD scale, large labels, motion/flash reduction, meaningful pause/resume, subtitles for all important audio information, and predictable click targets. Portrait vs landscape is undecided: design flexible panel arrangements until tested.

## Player input burden
Use presets to keep default launch fast; offer advanced tuning only when asked. Safe prompts should have a sensible default, not lock a player out for being briefly inattentive. Continuous attention shouldn't be required on a routine encounter. One large visible Retreat control is preferable to a complex tactical command palette.

## Difficulty transparency
After a loss, show cause chain (e.g. ran out of healing → engaged at junction → retreat too late) rather than opaque difficulty score. Do not display false certainty as a percentage survival chance. The player can inspect last-known route risks, current carried value and consequences of death before pushing onward.

## Usability tests
New tester identifies unbanked currency and Retreat without instruction; can explain one reason for death; sees shortcut remain on map after death; understands that boss victory and extraction are independent; can plan second attempt without needing a wiki.

## Workshop 09 — Onboarding hybrid route planning (PROPOSED)
First expedition: preselected Explore template, target known frontier or visible point, and a simple route preview; one tap can select the goal and launch with clearly presented defaults. Second/third expedition: teach **one optional waypoint** at a fork. Only after encountering a meaningful dangerous region introduce **Avoid**. Do not teach a complex routing editor on first launch. In a recovery mission, auto-suggest the outstanding death cache; do not make players hand-build the route after a loss.

Map route patterns, warnings, fog boundary and waypoint numbers must be distinguishable without color. Touch interface requires accessible alternatives to long-press and drag-and-drop; itinerary should support explicit Move Up/Move Down actions. Show `Return to camp to bank` even when the waypoint plan looks complete. A blocked goal needs a repair action, not only a red error.

## Workshop 10 — Teaching the cost of absolute avoidance
Once the player learns optional avoidance, onboarding must explicitly explain: **`Avoid` forbids entry, even to retreat.** A preview of a banned direct path and its legal detour should be paired with a warning that absolute bans can make the journey home impossible if conditions change. Never teach Avoid as merely a danger-rating preference.

**Proposed tutorial:** With a legal alternate available, mark one dangerous region forbidden and show the planned route adjust. Then display a simulated `No permitted route home` warning in a nonlethal example, with explicit `Edit Avoid` action. Accessibility requires a separate remove control, non-colour hatch and plain text explanation; no accidental one-tap override.

## Workshop 11 — Teach automatic objective skips (LOCK L14)
The first guided expedition should demonstrate a harmless blocked **ordinary** task: `Gate cannot be opened → Skipped — Blocked → Continue to the next waypoint`, with a short, legible reason. Explain that `Skipped` is neither `Failed expedition` nor `Completed`; rewards are still secured only by physically reaching camp.

The player should also see that **Return to Camp cannot be skipped** and hard Avoid marks are binding. For new players, propose warning before knowingly selecting incompatible forbidden regions and initial objectives. Tutorial decisions should never permanently override locked avoidance or create free extraction. The exact tutorial staging remains PROPOSED.

## Workshop 12 — Teach consequential pause vs routine auto-choice
Tutorial encounters should first demonstrate automatic discovery (no modal), followed by a secure sanctuary choice (player control), then a visible **sealed boss fog gate** clearly labelled `Key required`. Explain that `Discovered` is not `Unlocked`, `Unlocked` is not `Enter boss`, and neither spends nor banks resources without explicit interaction. Never train players that approaching a gate launches combat. Every meaningful interruption must be resumable and accessible by touch, mouse and keyboard. The gate barrier's visuals must differ from persistent exploration fog. Explain that keys spent to unlock permanently do not need to be paid again on future returns/rematches.

## Workshop 15 — Teach camp-first key eligibility (L19)
The first key tutorial should explicitly show the chain: **discover key → carry it home → secure at camp → pack it for the next expedition → consciously open a fog gate**. Show an unobtrusive `Unbanked: cannot open gates yet` label when the player first finds a key. Do not force an accidental boss fight: opening the gate and entering the encounter are two independently authorised decisions. Repeatable trial and keyless route should become understandable naturally if the first key is lost. Avoid misleading the player into believing merely visiting a sanctuary or finishing a boss banks rewards.


### Workshop 20 visual validation reference (PROPOSED)
See `28_VISUAL_STYLE_AND_ART_DIRECTION.md` for proposed colour/shape redundancies, grayscale testing, portrait/landscape reference viewports, adjustable motion, 44×44 CSS-pixel target touch controls, legible combat telegraphs and independent labels for sealed/opened gates, sanctuary and camp banking. **Primary mobile orientation remains OPEN.** Validate on actual devices before accepting numbers as production minima.
