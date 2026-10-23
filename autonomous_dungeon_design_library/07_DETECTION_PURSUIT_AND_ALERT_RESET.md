# 07 — Detection, Regional Pursuit and Quick Alert Reset
**Owner:** World awareness and pursuit rules; combat tactics owned separately  
**Status:** Regional pursuit and quick reset LOCKED; durations/ranges PROPOSED

## Locked behaviour
Ordinary enemies may pursue through connected rooms and corridors **within recognisable territory boundaries**. Losing line of sight causes investigation of last-known position rather than instant amnesia. After a short unsuccessful search, surviving enemies return to their default patrol/guard role promptly. There is **no persistent regional alert escalation** during the run and **no cross-expedition memory of the adventurer**. Enemies do not respawn on disengagement. Bosses remain arena-bound.

This intentionally rejects lingering vigilance systems. A player who successfully escapes may revisit the same region without a hidden detection penalty, though ordinary enemies that still exist may detect them again normally.

## Awareness states
| State | Meaning | World action |
|---|---|---|
| Unaware | No confirmed contact | Patrol/guard normal route |
| Suspicious | A plausible cue was heard/briefly seen | Turn/look/move to cue source |
| Alerted | Confirmed hostile target | Pursue/engage or summon only nearby permitted aid |
| Searching | Target not currently visible | Move to last seen location, inspect locally |
| Resetting | Search failed or territory limit reached | Return to assigned territory and default awareness |

Do not treat suspicion as full omniscient target lock. After visual contact is broken, enemies only know a last-observed position plus subsequent plausible cues. They must not track the exact current location through walls without special authored senses.

## Detection factors
Facing and visible arc, distance, terrain occlusion, light/fog, movement/noise, enemy class and exceptional nearby proximity. Both sides obey the same environmental premise: a fog condition may hinder both adventurer and enemy detection. The player UI distinguishes a currently observed enemy from a last-known sighting.

## Local communication
An enemy may alert allies if they are physically nearby and sound/travel rules permit. No regional hive mind and no spawning reinforcement out of thin air. An ally still must walk to the encounter and respect its own territory/path constraints.

## Territory rules
Assign recognizable zones defined by geography (gate, bridge, defensible passage), not camera boundary. Pursuing foes may enter connected rooms inside their zone and react to intrusions near its edge. At border, stop extending chase, defend the border appropriately, briefly investigate if already losing contact, then return to post. A foe must not stand immobile on an imaginary line allowing free chip damage.

## Quick reset specification
- **Search**: short, bounded investigation at last contact location.
- **Reset**: return to normal patrol/guard without an accumulating vigilance meter.
- **Revisit**: renewed detection treated as a fresh contact based on current sight/noise.
- **Persistence**: no alert debt across expeditions; defeated bodies are still absent until next run if ordinary respawn rules allow it.

Exact search duration, search distance and reacquisition threshold are PROPOSED tuning values and should be set based on player-observed legibility. Optimize for comprehensible animation: investigate, fail to reacquire, resume route.

## Boss exception
A guardian fights only within its arena. If the adventurer leaves and abandonment criteria are met, an unfinished encounter resets health/state; previously cleared bosses are not resurrected. Optional rematches use a separate temporary instance/state and do not change world-clear permanence.

## Avoided failure cases
- Lose sight for 0.2 seconds → enemy forgets instantly (too exploitable).
- Enemy remembers player forever or summons entire map (violates lock).
- Kill ordinary group → group respawns because player re-enters room (violates encounter lifecycle).
- Chase reaches arbitrary region cut → enemy freezes within free attack range (unfair/exploitable).
- Enemy sees adventurer through a solid wall despite no special sense (dishonest).

## Interface to expedition orders
When alert level changes, world system provides only observed threat, pursuer count/location confidence and whether escape contact is broken. Expedition controller may evaluate return route; tactical combat AI decides how to evade/block/disengage. Player can issue a retreat order anytime, but it does not forcibly set enemy awareness to Unaware.

## Acceptance scenarios
1. Enemy pursues across two connected rooms, loses line of sight, searches last seen position, then returns to patrol.
2. Adventurer revisits a few minutes later; ordinary detection works, no invisible higher vigilance.
3. Enemy at territory exit doesn't follow into next region; remains coherent and non-exploitable.
4. A defeated foe stays defeated for the remainder of expedition.
5. A boss encounter reset never overwrites the persistent boss-clear flag.
