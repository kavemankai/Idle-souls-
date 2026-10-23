# 10 — Character Kit, Levels and Upgrades
**Owner:** Character-system design; combat AI owns combat tactics  
**Status:** One sword-and-shield starter kit and rare manual upgrades LOCKED; numeric tuning PROPOSED

## Prototype baseline
Exactly one launchable kit: **sword, shield, basic armour**. The adventurer can automatically move, attack/block/evade/reposition through independently designed combat AI. Initial consumables: PROPOSED two basic healing items, subject to balancing. The starter weapon and shield are never permanently forfeited on death; players must always be able to start another expedition.

No second class, bow, magic school, pet, party member or dual-wield alternate kit in first slice. Tactical variety must be proven with one kit.

## Distinguish three axes of development
1. **Expedition level:** temporary growth earned and spent automatically during active run; resets on camp return or death.
2. **Expedition loot/gear:** practical items found and equipped during run; at risk until banked, and future camp reuse rules to be set.
3. **Permanent mastery:** banked progression unlocks **choices and sidegrades**, not unchecked multipliers; geography and boss progress are separate world persistence.

The distinction between *combat XP* and *recoverable mastery XP* is PROPOSED to reconcile resetting a run with banking experience on successful extraction. Avoid labeling this irreversible until validated with players.

## Combat doctrines (behaviour, not stat buff)
- **Guarded:** reserves stamina, favors safe defence and lower-risk commitments.
- **Measured:** balances attack, defence and repositioning.
- **Pressing:** attacks openings more aggressively with higher chance of overextension.

They should visibly affect the combat AI's decisions under equivalent conditions, but the exact tactics and thresholds are defined in the separate combat AI workstream. A doctrine is selected at camp and may be changed at a safe sanctuary, not per incoming enemy swing.

## Automatic run-level allocation
The adventurer automatically selects modest boosts among survivability, attack effectiveness, stamina and defensive stability according to its chosen development priority. Avoid interrupting every level. If an upgrade is unavailable or capped, it chooses a predictable next legal improvement. The player can review what changed in Chronicle/status rather than manually assigning points.

## Major checkpoint choices
At rare safe sanctuary or milestone decisions, offer mutually exclusive meaningful properties. Initial candidate trio:
- **Steadfast:** reduced defensive stamina burden.
- **Riposte:** better payoff from correctly timed defensive openings.
- **Quickstep:** improved mobility while repositioning/disengaging.

These are temporary expedition choices unless an explicit future permanent reward grants starting access. Exactly **one major choice per expedition** is proposed for prototype; the creator has locked only the principle of rare checkpoint choices, not a fixed count.

## Acquired equipment
Better found sword, shield or armour may be used during the current run. Auto-equip rules should respect strategy rather than equating rarity with superiority; e.g., heavy protection at a mobility cost. Truly consequential equipment substitutions could be presented at next safe decision window. Full crafting/affix rarity ladder is out of scope.

## Meaningful failure without stat inflation
If the adventurer dies against an enemy, players should have identifiable responses: choose a better route, change combat doctrine, improve supplies, use different sanctuary upgrade, avoid combination, or practise recovery. Avoid enormous permanent base-stat increments making all earlier threats obsolete.

## Character identity vs death
The character is the current expedition avatar, not a permadeath account reset. Death ends the current run and temporary progression, without deleting the player's map, world clear flags or permanent unlocks. Whether the same named adventurer is narratively revived/recruited anew is an art/story decision OPEN.

## Acceptance criteria
The same sword/shield character creates meaningfully distinct Guarded vs Pressing engagements; a temporary level-up occurs without forced UI interruption; one sanctuary upgrade changes behavior/results in observable ways; death still leaves a working starter kit and persistent world knowledge; successful extraction secures intended bankable value and then starts the next run at baseline temporary power.

## Workshop 12 — Secure major choices and gate keys
L15 confirms normal progression is autonomous, with **selective safe pauses** for rare consequential decisions at checkpoints/sanctuaries. A significant upgrade is never auto-selected solely due to timeout unless a later creator decision explicitly adds a preferred-choice fallback; existing decision may remain pending safely. The starter remains **one sword-and-shield kit**. A proposed dedicated key slot for gate access must not be treated as adding another character class, weapon, or free combat buff. Keys affect access only until their wider economy is approved.
