import type { BuildView, CombatantView, CombatView } from '../contracts/presentation';
/** HTML for the combat tabs. Pure functions of the read-only views; the scene only inserts the result. */
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const gauge = (label: string, g: { value: number; max: number }, cls: string) => {
  const w = g.max > 0 ? Math.max(0, Math.min(100, g.value / g.max * 100)) : 0;
  return `<div class="gauge ${cls}" role="img" aria-label="${label} ${Math.round(g.value)} of ${Math.round(g.max)}"><i style="width:${w.toFixed(1)}%"></i><span>${label} ${Math.round(g.value)}/${Math.round(g.max)}</span></div>`;
};
const chips = (c: CombatantView) => [
  c.staggered && 'Staggered', c.blocking && 'Blocking', c.guardStance && 'Guard stance', c.parryWindowLive ? 'Parry window live' : c.parryActive && 'Parry', c.invulnerable && 'Invulnerable',
  c.attack && `${c.attack.name}: ${c.attack.phase}`,
].filter(Boolean).map(t => `<b class="chip">${esc(String(t))}</b>`).join('');
const fighter = (c: CombatantView, hero: boolean) =>
  `<section class="fighter"><h4>${esc(c.name)}</h4>${gauge('Health', c.hp, 'hp')}${hero ? gauge('Stamina', c.stamina, 'st') : gauge('Poise', c.poise, 'po')}${hero ? gauge('Poise', c.poise, 'po') : ''}<p class="chips">${chips(c) || '<span class="muted">Idle</span>'}</p></section>`;

export function combatPane(v: CombatView | undefined): string {
  if (!v) return '<p class="muted">No fight yet. The adventurer has not been seen.</p>';
  const m = v.mind;
  return `${v.combatants.map((c, i) => fighter(c, i === 0)).join('')}<section class="mind"><h4>Adventurer's mind</h4>
    <dl><dt>Thinks</dt><dd>${esc(m.thought) || '<span class="muted">nothing yet</span>'}</dd>
    ${m.truth ? `<dt>Actually</dt><dd class="warn">${esc(m.truth)}</dd>` : ''}
    <dt>Doing</dt><dd>${esc(m.intent) || '<span class="muted">none</span>'}</dd>
    <dt>Parry odds</dt><dd>${m.parryChance === null ? '<span class="muted">not weighing a parry</span>' : `${Math.round(m.parryChance * 100)}%`}</dd>
    <dt>Target</dt><dd>${esc(m.target)}</dd></dl></section>`;
}
export function totalsPane(v: CombatView | undefined): string {
  if (!v) return '<p class="muted">Totals start when a fight does.</p>';
  const t = v.totals, rows: [string, number][] = [['Damage dealt', t.dealt], ['Damage taken', t.taken], ['Blocks', t.blocks], ['Perfect blocks', t.perfects], ['Parries', t.parries], ['Dodges', t.dodges], ['Rolling slashes', t.dodgeCounters], ['Punishes', t.punishes], ['Guard breaks dealt', t.guardBreaksDealt], ['Hits countered by enemy', t.counteredHits]];
  const top = Math.max(1, ...v.causes.map(c => c.damage));
  return `<table class="totals"><tbody>${rows.map(([k, n]) => `<tr><th scope="row">${k}</th><td>${n}</td></tr>`).join('')}</tbody></table>
    <h4>Damage taken, by what went wrong</h4>${v.causes.some(c => c.damage) ? '' : '<p class="muted">No damage taken yet.</p>'}
    <ul class="causes">${v.causes.filter(c => c.damage).sort((a, b) => b.damage - a.damage).map(c => `<li><span>${esc(c.label)} <small>${esc(c.stat)}</small></span><i style="width:${(c.damage / top * 100).toFixed(0)}%"></i><b>${c.damage}</b></li>`).join('')}</ul>`;
}
export function buildPane(b: BuildView | undefined): string {
  if (!b) return '';
  return `<p class="muted">Level ${b.level} (${b.pointsSpent} points), ${esc(b.focus)} focus, ${esc(b.doctrine)} doctrine, health ${b.health}.</p>${b.families.map(f => `<section class="family"><h4>${esc(f.name)}</h4><dl>${f.stats.map(s => `<dt>${esc(s.name)} <b>${s.value}</b></dt><dd>${esc(s.line)}</dd>`).join('')}</dl></section>`).join('')}`;
}
const clock = (tick: number) => `${Math.floor(tick / 1800)}:${String(Math.floor(tick / 30) % 60).padStart(2, '0')}`;
export function logPane(v: CombatView | undefined): string {
  if (!v || !v.events.length) return '<p class="muted">Nothing has happened yet.</p>';
  return `<ol class="fightlog">${v.events.map(e => `<li class="${esc(e.kind)}"><time>${clock(e.tick)}</time> ${esc(e.text)}</li>`).join('')}</ol>`;
}
