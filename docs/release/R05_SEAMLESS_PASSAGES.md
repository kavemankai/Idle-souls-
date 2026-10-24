# R05 — Seamless connected passage renderer (implementation trial)

This milestone changes only the presentation layer and player HUD. The authoritative expedition still advances inside `WorldRunner` and `RoomRunner`; combat, RNG, navigation, loot, saves, permanent progression, and journal semantics are unchanged.

## Implemented
- The redundant full-width expedition HP meter is removed. Screen-reader-compatible numerical health in `#xstatus` is preserved; in-world HP and stamina bars remain.
- A compact action chip below the in-world HP bar reports simulator/runner-owned state (including attacking, windup/recovery, guarding, dodging, resting, travelling and retreating).
- Every room is drawn at its authored world position from `room.plan.center`.
- Hallways derive from the exact two paired door centres and the existing `WorldRunner.walkPassage()` straight-line travel, including angled connections. They are NOT alternate navigation collision or independent teleport triggers.
- The camera and actor/HP renderers survive room transitions; there is no scene clear or camera recenter on a doorway.
- Distant geometry is culled; visible rooms and corridors are cached. Only rooms in the expedition's discovered set are drawn. A currently traversed corridor can be visible before its destination room is discovered, but the undiscovered room is not revealed. Sealed links display blockers; opening a persistent link removes its blocker.
- Existing runtime textures are reused. Generated room art remains *prototype composition*, not an authored four-region environment.

## Limitations
- Connecting-room presentation follows existing simulation's straight-line door-to-door passage. Long diagonal links may look like broad exterior causeways rather than architecturally hand-designed bends. A later authored hallway/path topology would require a separate navigation-geometry migration with simulator golden revalidation.
- Room art currently reuses the Old Road floor and wall materials, and most later-region enemies still have labelled proxy figures.
- The first physical Android playtest must inspect camera readability, clipping and frame rate, especially around O2's branching north/south doors. Automated tests do not certify every physical phone.
- Simulator ticks may advance by several steps per visual frame at 16x; render-only motion remains frame-sampled, while authoritative coordinates and combat outcomes remain deterministic.

## Verification
`tests/connectedDungeon.test.ts` covers paired doors, real passage line, fog, sealed/unsealed gates, non-teleporting world movement and unchanged Chronicle. `tests/expeditionVisual.test.ts` verifies hero/world and enemy/world coordinates. The production-player browser spec checks one surviving Phaser canvas after crossing into O1, HUD cleanup, hero action and hallway visibility.

Run lint, typecheck, unit, simulator regression guards, browser and player tests and Android debug/release packaging. Physical-phone confirmation remains separate from CI.
