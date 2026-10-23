import Phaser from 'phaser';
import type { CombatantView, CombatView } from '../contracts/presentation';
/** In-world combat cues drawn from the read-only CombatView. Programmatic placeholders, not authored art. */
const PHASE_FILL = { windup: 0xe0a64a, active: 0xd2563f, recovery: 0x9aa39a } as const;
export function drawCues(g: Phaser.GameObjects.Graphics, v: CombatView, opts: { ghosts: boolean }) {
  g.clear();
  for (const c of v.combatants) {
    if (c.hp.value <= 0 && c.id !== 'hero') continue;
    if (c.attack) {
      const a = c.attack, fill = PHASE_FILL[a.phase], reach = a.range + c.radius;
      g.fillStyle(fill, a.phase === 'active' ? .3 : .14).beginPath().moveTo(c.x, c.y);
      g.arc(c.x, c.y, reach, c.heading - a.arc, c.heading + a.arc).closePath().fillPath();
      g.lineStyle(1, fill, .8).beginPath().moveTo(c.x, c.y).arc(c.x, c.y, reach, c.heading - a.arc, c.heading + a.arc).closePath().strokePath();
    }
    if (c.blocking || c.guardStance) g.lineStyle(c.guardStance ? 5 : 3, c.guardStance ? 0xe3c27a : 0x9ed6d0, .9).beginPath().arc(c.x, c.y, c.radius + 6, c.heading - c.guardArc, c.heading + c.guardArc).strokePath();
    if (c.parryActive) g.lineStyle(c.parryWindowLive ? 6 : 2, c.parryWindowLive ? 0x86d49a : 0xa9b3a4, .95).beginPath().arc(c.x, c.y, c.radius + 9, c.heading - .9, c.heading + .9).strokePath();
    if (c.invulnerable) g.lineStyle(2, 0x7fe0ee, .7).strokeCircle(c.x, c.y, c.radius + 4);
    if (c.staggered) for (let k = 0; k < 8; k++) g.lineStyle(2, 0xf3efe0, .8).beginPath().arc(c.x, c.y, c.radius + 5, k * Math.PI / 4, k * Math.PI / 4 + Math.PI / 8).strokePath();
    if (c.flash > 0) g.fillStyle(0xffffff, Math.min(.5, c.flash / 8 * .5)).fillCircle(c.x, c.y, c.radius + 2);
    bars(g, c);
  }
  if (opts.ghosts) for (const b of v.beliefs) for (let k = 0; k < 10; k++) g.lineStyle(1.5, 0xc9d1c0, .8).beginPath().arc(b.x, b.y, b.radius, k * Math.PI / 5, k * Math.PI / 5 + Math.PI / 10).strokePath();
}
function bars(g: Phaser.GameObjects.Graphics, c: CombatantView) {
  const w = 46, x = c.x - w / 2;
  let y = c.y - c.radius - 44;
  const bar = (frac: number, color: number) => { g.fillStyle(0x0f1b18, .85).fillRect(x, y, w, 4); g.fillStyle(color, 1).fillRect(x, y, w * Math.max(0, Math.min(1, frac)), 4); y += 6; };
  bar(c.hp.value / c.hp.max, 0xc4553f);
  if (c.id === 'hero') bar(c.stamina.value / c.stamina.max, 0xd9a443); else bar(c.poise.value / c.poise.max, 0x9aa39a);
}
