import type { Bank, Cache, Save } from '../save/saveTypes';
import { validateInvariants as checkSave } from '../save/save';
import type { Chronicle } from './chronicle';
import { addBanks, cloneBank, describeBank, isEmptyBank } from './loot';

/** What happened to everything the adventurer carried, in words a player can read. Every line is true of the new save. */
export interface Settlement {
  applied: boolean;
  /** Why nothing was applied, when `applied` is false. */
  refused?: string;
  save: Save;
  banked: Bank;
  /** Left in a new cache where the adventurer fell. */
  cached: Cache | null;
  /** Lost for good: the old cache that a new cache replaced. */
  lost: Bank;
  lines: string[];
}
const none = (): Bank => ({ gold: 0, supplies: {}, gear: [], mastery: 0, keys: 0, prepared: 0 });

/**
 * The only place an expedition's outcome becomes a save (doc 08). Camp is the only banking destination:
 * - extracted: everything carried joins the bank, once; a cache that was picked up is gone.
 * - died: nothing is banked; what was carried (including a cache picked up on this run) becomes the one cache where the adventurer fell, replacing any
 *   cache that was left waiting; carrying nothing leaves the old cache alone and places no ghost marker.
 * - blocked or stopped: not settled. The expedition is still live, so nothing is banked and nothing is lost.
 * Map memory, defeated bosses and the counters change whatever the outcome. `startedAt` must equal the save's expedition count, so the same
 * expedition can never be settled twice.
 */
export function settle(save: Save, c: Chronicle, startedAt: number): Settlement {
  const refuse = (why: string): Settlement => ({ applied: false, refused: why, save, banked: none(), cached: null, lost: none(), lines: [why] });
  if (save.camp.expeditions !== startedAt) return refuse('This expedition was already settled, or the save has moved on.');
  if (c.outcome === 'blocked' || c.outcome === 'stopped') return refuse('The expedition is not over: extraction is blocked, so nothing is banked and nothing is lost.');
  if (c.loot.issued > save.camp.bank.keys) return refuse('More Gate Keys were issued than the camp holds.');
  const next: Save = JSON.parse(JSON.stringify(save));
  const visited = new Set(c.route);
  next.world.discovered = [...new Set([...save.world.discovered, ...visited, ...c.discovered])];
  next.world.defeatedBosses = [...new Set([...save.world.defeatedBosses, ...c.bossesDefeated])];
  // Gates opened and one-time discoveries claimed are permanent whatever happened next. Issued keys leave the bank at launch; spent ones are gone.
  next.world.openedLinks = [...new Set([...save.world.openedLinks, ...c.loot.opened])];
  next.world.claims = [...new Set([...save.world.claims, ...c.loot.claimed])];
  next.camp.bank.keys = save.camp.bank.keys - c.loot.issued;
  next.camp.expeditions = save.camp.expeditions + 1;
  const carried = cloneBank(c.loot.carried), lines: string[] = [];
  let banked = none(), cached: Cache | null = null, lost = none();
  const recovered = c.loot.cacheRecovered;
  if (c.outcome === 'extracted') {
    // Everything carried is banked, and a key banked is a key banked: fresh and unspent issued keys both join the stock.
    banked = { ...carried, keys: carried.keys + carried.prepared, prepared: 0 };
    next.camp.bank = addBanks(next.camp.bank, banked);
    if (recovered) next.camp.cache = null;
    lines.push(`Banked: ${describeBank(banked)}.`);
    if (recovered) lines.push('The recovery cache is secured and gone.');
    else if (save.camp.cache) lines.push(`The recovery cache in ${save.camp.cache.room} is still waiting.`);
  } else {
    next.camp.deaths = save.camp.deaths + 1;
    const spot = c.loot.deathSpot;
    if (!isEmptyBank(carried) && spot) {
      cached = { room: spot.room, x: spot.x, y: spot.y, contents: carried };
      // A cache that was left waiting and not picked up is replaced; its contents are lost for good.
      if (save.camp.cache && !recovered) lost = cloneBank(save.camp.cache.contents);
      next.camp.cache = cached;
      lines.push(`Fell in ${spot.room}. Carried loot is in a recovery cache there: ${describeBank(carried)}.`);
      if (!isEmptyBank(lost)) lines.push(`The earlier cache in ${save.camp.cache!.room} was replaced. Lost for good: ${describeBank(lost)}.`);
    } else {
      if (recovered) next.camp.cache = null;
      lines.push(save.camp.cache && !recovered ? 'Fell carrying nothing. The earlier cache is untouched.' : 'Fell carrying nothing. No cache was left.');
    }
    lines.push('Nothing was banked. The starter sword and shield are never lost.');
  }
  const bad = checkSave(next);
  if (bad.length) throw new Error(`settlement would break the save: ${bad.join('; ')}`);
  return { applied: true, save: next, banked, cached, lost, lines };
}
