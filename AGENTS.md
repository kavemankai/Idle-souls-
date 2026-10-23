# Idle Souls implementation
Read CODEX_VISUAL_PRODUCTION_HANDOFF.md and the design library index before changes.
16_DECISIONS_AND_OPEN_QUESTIONS.md owns locks. L22/L23/L24 are binding: Blender-to-2D characters, fixed +75° orthographic camera, eight locomotion/guard facings, selective attacks with honest coverage. No mirroring asymmetric gear.
Ashen Reliquary appearance, scale and palette remain PROPOSED; record trial choices in docs/visual_proof/DECISIONS.md.
No authoritative combat implementation is present. src/presentation/visualSequence.ts is a VISUAL-ONLY fixture, never tactical AI. Rendering consumes readonly contracts; do not invent damage, AI, hitboxes or timing to fit art.
Run npm run lint, npm run typecheck, npm test, npm run build and npm run test:browser for runtime changes. Keep editable sources and reproducible exports. Do not mark human/device/combat QA passed without evidence.
