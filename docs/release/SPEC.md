# Idle Souls: mobile release plan

Source: the user-supplied release plan, adopted for milestone 1 on 2026-10-24. This document owns release requirements; it does not assert that they are implemented. Its original assessment below describes the planning pass at `d4219b1`. See [BASELINE.md](BASELINE.md) for subsequent execution evidence and [ISSUES.md](ISSUES.md) for ownership and priorities. Historical handoffs and the design library remain technical references only where compatible.

## 1. Product direction and current assessment

Build an **Android-first idle expedition RPG**: prepare an adventurer, explore a persistent world, watch autonomous combat, extract valuable loot, and use cleared territory to earn resources while away. Follow with iOS after Android meets the release gates.

The game will be free, with optional rewarded ads and a **one-time Premium upgrade** that replaces watching ads with immediate claims at identical limits and includes cosmetics. The campaign remains playable without spending.

This plan supersedes conflicting design locks and older handoff documents.

**Assessment:** the repository contains a substantial prototype, but needs product development before release polish. At inspected commit `d4219b1`:

- Animated combat and the expedition interface are separate experiences.
- Saves preserve camp and world state but lack active-expedition recovery.
- Progression largely resets per expedition; documented campaign simulations stall before major milestones.
- Later enemies, environments, and boss presentation still need production art.
- Mobile performance, audio, accessibility, and player comprehension lack physical-device or human validation.

These findings come from source inspection and repository reports; tests and gameplay were not independently run during this planning pass. The [calibration report](https://github.com/kavemankai/Idle-souls-/blob/d4219b1dbb761a7014a7df0dd01e663df06e6d63/docs/slice/CALIBRATION.md) establishes why progression repair comes first.

## 2. Game and commercial design

### Core loop

**Collect idle earnings → improve equipment and camp → choose an expedition → explore and fight → extract or recover → unlock better farming.**

- Keep autonomous combat, physical retreat, persistent exploration, shortcuts, and deliberate boss challenges.
- Replace the exposed testing controls with player-facing progression. Starting levels and combat attributes must come from earned upgrades.
- Introduce permanent adventurer mastery, equipment upgrades, and camp improvements. Keep temporary expedition bonuses as a separate layer.
- Make permanent equipment safe on death; carried expedition rewards remain recoverable through the existing cache system.
- Give every currency a useful sink. Launch with gold, crafting materials, and mastery; retain gate keys as progression items rather than another shop currency.
- Remove mandatory repeat trips whose only purpose is key administration. First-use keys can open gates during the expedition in which they are found, with deliberate confirmation or a preselected objective.
- Ensure every required gate has a repeatable, reachable key source.

### Idle progression

- Unlock safe farming after clearing and extracting from a region.
- Run one selected farming assignment alongside active expeditions.
- Accrue gold and common upgrade materials for up to **12 hours**, equally for free and Premium players.
- Farming never discovers new rooms, defeats first-time bosses, generates gate keys, or risks death.
- Calculate earnings from elapsed time and a versioned rate table; do not simulate hours of combat on reopening.
- Pause active expeditions when the app backgrounds. Resume their saved state when it returns; only safe farming advances offline.
- Clamp negative elapsed time, cap long absences, and prevent repeated claims. Clock anomalies must not delete progress or punish ordinary timezone changes.

### Campaign and presentation

Use the existing world as the foundation for a complete first campaign:

- Four distinct regions: Old Road, Watchtower, Sunken Passage, and the Crypt.
- One regional boss per region, including the existing Warden and Castellan; a clear ending and optional challenge rematches.
- Three viable build identities: defensive, aggressive, and counterattack, expressed through equipment and upgrades.
- Target first dispatch within two minutes, first extraction and upgrade within five minutes, and first boss attempt within 30–45 minutes.
- Target 8–12 hours of active campaign play, supported by optional offline progress rather than required waiting.
- Prioritize portrait phone play, with responsive tablet layouts.
- Use bottom navigation for Camp, Expedition, World, and Journal; keep retreat visible during expeditions.
- Integrate animated combat into the actual expedition view. The renderer reads simulator state and never invents combat outcomes.
- Retain the dark-fantasy identity and existing sprite pipeline, but replace weak silhouettes, muddy environments, confusing effects, and placeholder assets without preserving outdated art locks.

### Monetization

- No forced interstitials, banners, subscriptions, energy purchases, paid revives, or paid extraction.
- Offer one optional reward: **one hour of the currently unlocked farming rate**, up to three claims per rolling 24 hours.
- Premium grants those same claims without ads, permanently, plus a cosmetic set.
- Proposed launch Premium price: **US$6.99 base tier**, localized through the stores.
- No other purchases in version 1.0.
- Balance progression against players who never watch an ad or purchase Premium.
- Place offers at camp, after the first successful expedition; never interrupt combat or exploit a death screen.

## 3. Implementation milestones

| Milestone | Required work | Exit condition |
|---|---|---|
| **1. Establish a trustworthy baseline** | Reproduce installation, builds, simulator checks, browser tests, and balance reports. Investigate documented zoom/parity failures. Replace contradictory documentation with one release specification and prioritized issue list. | Reproducible baseline; every failing check has a confirmed cause and owner. |
| **2. Prove the mobile foundation** | Package the existing Phaser/TypeScript game with Capacitor. Add Android lifecycle handling, safe areas, system-back behavior, audio interruption handling, and release builds. Separate developer scenes from the player app. | Installable Android build survives backgrounding and works on physical low- and mid-range phones. |
| **3. Make progress durable** | Implement transactional saves, active-run checkpoints, recovery backups, migrations, permanent upgrades, and offline farming. | Killing the app cannot duplicate rewards, erase banked progress, or reset a valid expedition. |
| **4. Deliver the first complete region** | Connect planning, animated exploration/combat, extraction, upgrades, farming, onboarding, and the first boss. Rebalance using complete journeys. | New players finish the loop without developer instructions or debug settings. |
| **5. Finish the campaign** | Complete all four regions, bosses, equipment, encounter variety, progression, ending, rematches, art, animation, and audio. | Fresh-save campaigns can reach the ending without ads, purchases, or artificial starting levels. |
| **6. Add commercial services** | Implement rewarded ads, Premium purchase/restore, verification service, consent handling, diagnostics, and release analytics. | Purchase and reward flows pass sandbox, interruption, duplication, and offline tests. |
| **7. Validate and release** | Closed Android testing, balance iteration, accessibility review, store materials, staged production rollout, then iOS adaptation and TestFlight. | All technical and player-experience release gates below pass. |

**Technology decision:** retain Phaser and TypeScript; use Capacitor for native packaging and device integrations. Capacitor supports Android and iOS while retaining web application code. This is a recommendation based on the existing architecture, not proof that current performance is sufficient. [Capacitor documentation](https://capacitorjs.com/docs)

Do not start a speculative engine rewrite. If physical-device profiling reveals a fundamental blocker after targeted optimization, stop expansion and produce a measured migration proposal before replacing the engine.

### Important architecture and interface changes

- **Simulation boundary:** move expensive simulation into a worker with ordered commands and readonly render snapshots. Preserve deterministic seeded outcomes across playback speeds.
- **Persistence:** replace synchronous browser-only storage with an asynchronous transactional repository. Use native SQLite for packaged apps and IndexedDB for browser development.
- **Save format:** migrate version 2 into a new version containing permanent progression, farming state, active expedition state, rules/content versions, and processed transaction IDs. Keep a last-known-good backup.
- **Active-run recovery:** persist seed, complete runtime state including RNG, orders, inventory, and progression. Save at meaningful events and periodic checkpoints; do not rely solely on a final background callback.
- **Settlement:** preserve a single authoritative settlement function. Commit reward application, expedition completion, and transaction identity atomically.
- **Validation:** make parsing return structured failures for malformed nested data and migrations. Validate finite values, known identifiers, and invariants before loading or importing.
- **Offline rewards:** expose `previewOfflineRewards()` and transactional `claimOfflineRewards(claimId)`; version rates and prevent replay.
- **Native services:** isolate lifecycle, audio, haptics, ads, billing, and storage behind platform adapters.
- **Commerce service:** verify purchases and ad completions, maintain an idempotent reward ledger, acknowledge purchases, and process refunds/revocations. Keep entitlement data separate from editable game-save exports.
- **Guest-first play:** no required login, multiplayer, leaderboard, or cross-device gameplay sync in version 1.0. Provide native save export/import and clear backup guidance. Store purchases remain restorable through the store account.

Google recommends purchase verification before granting entitlements; rewarded ads support server-side verification. Build retries and duplicate-event protection into both flows. [Play Billing](https://developer.android.com/google/play/billing/integrate), [AdMob verification](https://developers.google.com/admob/android/ssv)

## 4. Testing and release gates

### Correctness and resilience

- Existing lint, type checks, unit tests, world-generation checks, simulator regressions, builds, and browser tests pass.
- Intentional balance changes update golden results with documented explanations; old balance numbers are not immutable.
- Test fresh installs, version-2 migrations, corrupt saves, storage exhaustion, interrupted writes, restore, and importing invalid data.
- Kill the app during combat, extraction, upgrade spending, offline claims, and purchase completion.
- Verify repeated callbacks and retries never duplicate loot, purchases, or ad rewards.
- Verify a game update can resume or safely recover an older active expedition.
- Test offline mode, missing ad inventory, declined consent, pending/cancelled purchases, refunds, and purchase restoration.
- Preserve gameplay when commerce or analytics services are unavailable.

### Balance and player understanding

- Run at least 1,000 seeded complete campaign simulations across all three build identities.
- Demonstrate campaign completion using only organically earned progression.
- Remove the documented early progression wall, dominant upgrade choices, weak healing, and routes that make bosses practically unreachable.
- Require at least 80% of a 20-person newcomer test group to complete their first extraction and upgrade without coaching.
- Require players to explain carried versus banked loot, retreat, farming, and death recovery after onboarding.
- Evaluate deaths by whether players understand the cause and can name a useful adjustment.
- Test the whole free experience with ads disabled.

### Physical-device quality

Proposed release budgets:

- Cold launch to usable camp within **five seconds** on the baseline phone.
- Sustained **30 FPS minimum** on low-range hardware; target 60 FPS on mid-range hardware.
- Routine UI response within **100 ms**; simulation must not cause visible input stalls.
- No escalating memory use, thermal collapse, or excessive battery drain during a 30-minute session.
- Validate small phones, tall screens, notches, tablets, and enlarged text.
- Complete TalkBack and VoiceOver reviews, reduced-motion checks, color-independent cues, audio audition, and touch-target checks.
- No unresolved critical/high-severity bugs or reproducible save-loss defects.
- At least **99.5% crash-free sessions** across a minimum of 1,000 beta sessions.

### Store and rollout readiness

- Produce signed Android App Bundles, secure signing backups, versioned release artifacts, and a hotfix procedure.
- Complete privacy disclosures, Data Safety declarations, consent behavior, age rating, asset-license audit, support contact, screenshots, trailer, and accurate store copy.
- Verify target API, billing-library, SDK, and store requirements again at submission.
- Budget for the applicable Play testing process. Current guidance requires qualifying new personal accounts to run a closed test with at least 12 continuously opted-in testers for 14 days. [Google Play testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
- Roll out Android gradually: 5%, 25%, then 100%, advancing only after crash, save, purchase, and progression metrics remain healthy.
- Use remote switches to disable problematic ads or offers without disabling the game.
- Begin iOS release validation after Android is stable; repeat lifecycle, purchase, privacy, and physical-device checks rather than assuming parity.

## 5. Assumptions and delivery priorities

- Quality takes precedence over a fixed launch date; release is gated by evidence.
- Target audience: players who enjoy low-input RPG progression and consequential planning; the product is not designed specifically for children.
- English first, with localization-ready UI and no text baked into artwork.
- Portrait is the primary phone orientation.
- Core gameplay works offline; ads and new purchase verification require connectivity.
- Cross-device saves, social features, seasonal passes, additional campaigns, and competitive rankings are post-launch work.
- Staff the work across gameplay/economy, mobile engineering, UI/UX, art/animation, audio, and QA. Sequence content production behind validation of the first complete region.
- The first deliverable is **one reliable, enjoyable, fully presented region on a real phone**. Expand to the complete campaign only after that experience proves the progression and mobile foundation.

## 6. Business measurement definitions

The second supplied attachment is a truncated continuation. Its complete requirements are retained here; its unfinished sentence supplies no store-fee assumption.

Track organic and paid cohorts separately. Reconcile revenue with store and advertising reports; unavailable attribution must remain unknown rather than being counted as organic.

- **Contribution LTV:** cumulative revenue per acquired player after applicable store deductions, refunds and variable operating costs, before acquisition spending.
- **Acquisition cost:** advertising and attributable creator spending divided by acquired players.
- **Acquisition contribution:** contribution LTV minus acquisition cost.
- **Business profit:** total contribution minus marketing, development, content production and fixed operating costs.

Use actual fee eligibility and market terms when building the business model. No universal store fee is specified by the supplied material.
