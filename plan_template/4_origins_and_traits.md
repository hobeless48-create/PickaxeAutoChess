# Part 4: Faction Origins & Class Traits Directory

This document lists the design specifications, roster capacities, and threshold multipliers for all Faction Origins and Class Traits in Aetheria.

*   **Roster Constraint:** A maximum of **7 unique units** exist in any individual synergy. Reaching ultimate tiers (8, 9, or 10) requires finding crests/emblems through Enchanted drafts.

---

## 1. Faction Origins (9 Total)

### 1. Human (Growth & Command Focus: 3 / 5 / 7)
*   **Description:** Adaptable and ambitious, humans gain power directly from their commander's growth.
*   **Mechanic:** Gains scaling stats based on the Player's Level.
*   **Thresholds:**
    *   **(3) Humans:** Humans gain +30 Max Health and +3% Physical & Magic Attack per Player Level.
    *   **(5) Humans:** Humans gain +60 Max Health and +6% Physical & Magic Attack per Player Level.
    *   **(7) Humans:** [Needs 1 Crest] All allied units gain 50% of the Human level-scaling bonuses. Humans gain +10% Damage Amplification and 20% Max HP.

### 2. Ancient (High-Risk Cashout Focus: 2 / 4 / 5 / 6)
*   **Description:** Mystical relic-keepers whose power grows when they fall, storing energy in a sacred chest.
*   **Roster Composition:** 6 unique units total (2 x 1-cost, 2 x 2-cost, 1 x 3-cost, 1 x 4-cost).
*   **Stack Accumulation Rules (Lose rounds to gain stacks):**
    *   **(2) Ancients:** Gain **+2 stacks** every time an allied unit dies (any unit, not just Ancients), and gain **$5 \times \text{current lose streak}$** when you lose a round.
    *   **(4) Ancients:** Gain **+5 stacks** every time an allied unit dies, and gain **$7 \times \text{current lose streak}$** when you lose a round.
    *   **(5) Ancients:** Gain **+7 stacks** every time an allied unit dies, and gain **$10 \times \text{current lose streak}$** when you lose a round.
    *   **(6) Ancients:** Gain **+10 stacks** every time an allied unit dies, and gain **$15 \times \text{current lose streak}$** when you lose a round.
*   *Chest Thresholds & Rewards (Player chooses OPEN or KEEP at each prep phase):*
    *   **(100) Relic Coffer:** 4 Gold, 1 3-cost Ancient unit (Runecarver 1-star).
    *   **(200) Gilded Reliquary:** 10 Gold, 1 2-star 3-cost Ancient unit (Runecarver), 2 Lesser Duplicators, **Uxtil's Leap** (+5 Mana Regen/sec; on Tomb Raider: mana 0/65 -> 0/45).
    *   **(400) Sarcophagus of Kings:** 20 Gold, 1 2-star 4-cost Ancient unit (Relic Colossus), 3 Lesser Duplicators, **Darkest Light** (+40 DEF, +40 MDEF, +1% dmg reduction per targeting unit; on Stone Protector: taunts 1 nearest + 3 farthest).
    *   **(700) Vault of Aeons:** 50 Gold, 1 3-star 3-cost unit, 1 2-star 4-cost Ancient unit, **True Uxtil's Leap** (+50% ATK, +5 Mana Regen/sec; on Ancients: -20 max mana), **True Darkest Light** (4% dmg reduction per attacker; 4 farthest enemies target wearer first, -10% their damage).
    *   **(1100) Primordial Ark:** 90 Gold, 1 2-star 5-cost Ancient unit, **Helios's Cascade** (+90% AP; damage inflicts -40% DEF/MDEF & -33% healing; on Runecarver: skills also activate Sunlight for 50% AP to all enemies).
    *   **(1500) Pinnacle:** **Pinnacle** artifact (+10000 HP, 99% dmg reduction, 50 Mana Regen/sec; battle start: all enemies become 1-star permanently; skill use: Annihilate dealing 100% max HP to 3 targets).

### 3. Noble (Economy & Taxation Focus: 3 / 6 / 9)
*   **Description:** Haughty royalty and wealthy merchant lords who buy victory.
*   **Mechanic:** Increase base economy.
*   **Thresholds:**
    *   **(3) Nobles:** Gain +1 Gold at end of even rounds.
    *   **(6) Nobles:** Interest limit increases to 70 Gold (+1 gold for every 10g saved; 40g gives +5g interest, 70g maxes at 8g interest). Nobles gain +1% Damage Amplification for every 2 Gold in your bank (max 40%). Every 2 interest gold earned at round end permanently grants Nobles +5 HP.
    *   **(9) Nobles:** [Needs 2 Crests] At round end, gain 25% of your total gold balance. Damage Amplification max increases to 100%. Permanent HP gain increases to +20 HP per 2 interest gold.

### 4. Dwarven Forge (Item Crafting Focus: 3 / 6 / 9)
*   **Description:** Master smiths and engineers who upgrade the team's weaponry.
*   **Mechanic:** Grants custom masterwork upgrades to equipped items.
*   **Thresholds:**
    *   **(3) Dwarves:** Grants a consumable *Ornate Hammer*. Use it on a unit to choose one of their completed items and upgrade it to an **Ornate Masterwork Artifact**, gaining a powerful secondary passive.
    *   **(6) Dwarves:** Upgrades up to 3 completed items on your board to Ornate Masterwork Artifacts. All Dwarves gain +50% effectiveness from all items equipped on them.
    *   **(9) Dwarves:** [Needs 2 Crests] All equipped items on Dwarves are upgraded to Ornate Artifacts. Dwarves gain +20 DEF and MDEF per equipped item.

### 5. Demonic Pact (High-Risk Summoning: 3 / 6 / 9)
*   **Description:** Dark cultists who sacrifice their own vital essence to summon the Abyss.
*   **Mechanic:** Sacrifices player HP or allied unit souls to summon a boss unit.
*   **Thresholds:**
    *   **(3) Demons:** When combat starts, the lowest-HP Demon is sacrificed, transferring their stats to other Demons as +20% Physical Attack and Magic Attack.
    *   **(6) Demons:** When 3 allied units die, summon a **Lesser Pit Lord** hex-construct with 1000 HP and 80 base damage onto the board.
    *   **(9) Demons:** [Needs 2 Crests] At the start of preparation phase, sacrifice **5 Player HP** (once) to permanently summon a **Great Demon Lord** (5-star Tier boss) into the combat team who inherits all active Demon synergy buffs.

### 6. Magic Tower (Spell Stacking & Burst: 3 / 6 / 9)
*   **Description:** Wizard orders channeling energy through conduits.
*   **Mechanic:** Channeling and Stacking to burst.
*   **Thresholds:**
    *   **(3) Magic Tower:** Every time an allied unit casts a skill, heal the nearest allies by 10% of the caster's Magic Attack (AP) stat.
    *   **(6) Magic Tower:** Every time an allied unit casts their skill, it adds points equal to their gold cost to a global charge pool. When the pool reaches 50 points, summon a meteor dealing 10% current HP Magic Damage to all enemies.
    *   **(9) Magic Tower:** [Needs 2 Crests] All skill casts add points equal to **10x** the unit's gold cost to the pool, triggering rapid meteor cascades.

### 7. Sylvan Elves (Crit & Dodge Focus: 3 / 6 / 9)
*   **Description:** Agile woodland archers and druids who blend into the brush.
*   **Mechanic:** Grants evasion and scales Crit Damage.
*   **Thresholds:**
    *   **(3) Elves:** Elves gain +15% Critical Chance and dodge 10% of basic attacks.
    *   **(6) Elves:** Elves gain +30% Critical Chance and dodge 20% of basic attacks. Every critical strike dealt heals the lowest HP ally for 25% of that damage.
    *   **(9) Elves:** [Needs 2 Crests] Elves gain +50% Critical Chance. Any Critical Chance exceeding 100% is converted into Critical Damage at a **1:5 ratio** (+1% CC = +5% Critical Damage). Healing on critical strike increases from 25% to 100% of damage dealt.

### 8. Necropolis Undead (Reanimation Focus: 3 / 6 / 9)
*   **Description:** Legions of bone and decay that refuse to die.
*   **Mechanic:** Reanimates fallen units as skeletons.
*   **Thresholds:**
    *   **(3) Undead:** The first allied unit to die is resurrected as a *Skeleton Soldier* with 50% HP and 50% Base Damage.
    *   **(6) Undead:** The first two allied units to die are resurrected, and Undead units gain +10% Lifesteal.
    *   **(9) Undead:** [Needs 2 Crests] All dead allied units are resurrected with 10% of their original health and 50% base damage. This cycle continues until every unit on the board is dead (summoned skeletons do not deal damage to player HP on victory).

### 9. Draconic Zealots (Egg Hatching & Growth: 3 / 5 / 7 / 9)
*   **Description:** Worshipers of ancient dragons who incubate massive dragon eggs.
*   **Mechanic:** Incubates a Dragon Egg on the bench that hatches into a legendary unit. 
    *   **Leveling System:** Every time the hatched Dragon participates in a kill (scores a kill or assist), it permanently gains **1 Growth Point**.
    *   **Evolution Thresholds:** Upon reaching **10, 20, and 30 Growth Points**, the player chooses 1 of 3 random passives to permanently enhance the Dragon (e.g., +20% Attack Speed, attacks deal splash damage, or gain +30 DEF/MDEF).
*   **Thresholds:**
    *   **(3) Draconics:** Spawn a *Golden Dragon Egg* on your bench. It gains 1 hatch charge per round. Hatches after 4 rounds into a Drake Hatchling.
    *   **(5) Draconics:** The egg hatches faster (2 charges per round). Draconic units gain +15% Physical Attack.
    *   **(7) Draconics:** The hatched Dragon evolves into an Elder Wyvern, gaining fire-breath AoE skills.
    *   **(9) Draconics:** [Needs 2 Crests] The Dragon ascends to a Legendary Cinder-Dragon, dealing 33% True Damage and gaining immune status to all crowd control.

### 10. Elemental Fairy (3 / 5 / 7)
*   **Description:** Mystical spirits of nature that summon and merge with a massive golem.
*   **Mechanic:** Summons a golem that absorbs adjacent Fairies during the preparation phase to gain their unique elemental properties.
*   **Thresholds:**
    *   **(3) Fairies:** Summon 1 **Elemental Golem** (Tank role) onto the board. All enemies have their Attack Speed slowed by 15%.
    *   **(5) Fairies:** Any Fairy unit placed adjacent (within 1 hex) to the Elemental Golem during the preparation phase merges into the Golem. For every Fairy merged:
        *   Golem gains **+20% Base Stats** and inherits an effect based on the Fairy type:
            *   *Nature Fairy:* Golem regenerates 1% of Max HP per second.
            *   *Fire Fairy:* Golem deals +25% Damage Amplification (skill range increased by +1 Hex).
            *   *Water/Ice Fairy:* Golem attacks apply *Corrosion* (1% Max HP True Damage per second).
            *   *Stone Fairy:* Golem gains +40 DEF and MDEF.
        *   *Tidal Fairy Wave:* Every 8 seconds, summon a Tidal Wave dealing Magic Damage equal to 10% of enemies' Max HP and stunning them for 1 second.
    *   **(7) Fairies:** [Needs 1 Crest] Enemy Attack Speed slow increases to 33%. Tidal Wave triggers every 5 seconds and shreds Magic Defense (MDEF) by 33%. Golem base stats per merged Fairy increase from +20% to **+40%**, and all merged Fairy passive effects are **doubled** (e.g. Nature Fairy grants 2% HP regen).

---

## 2. Combat Traits (15 Total)

### 11. Architect (Facility Integration Specialist: 2 / 4 / 6)
*   **Description:** Master builders who direct fortifications and battle facilities.
*   **Mechanic:** Buffs and alters the **Facility System**.
*   **Thresholds:**
    *   **(2) Architects:** Active Facilities have their Construction Phase delay reduced by **1 round**. Facilities gain +20 Max Health.
    *   **(4) Architects:** Grants **+1 extra Facility capacity** (maximum of 4). Active Facilities heal adjacent units for 3% of their max HP per second.
    *   **(6) Architects:** If a Facility is destroyed, the **Player HP damage penalty is completely negated**. Active Facilities gain +40 DEF and MDEF, and their offensive attack rates are doubled.

### 12. Mercenary (Bounty & Renting: 2 / 4 / 6)
*   **Description:** Blades-for-hire who fight for gold and glory.
*   **Mechanic:** Drops bounty gold and allows hiring temporary units.
*   **Thresholds:**
    *   **(2) Mercenaries:** Scoring a round victory yields +1 "Bounty Box" (can open for 1-3 Gold or an item component).
    *   **(4) Mercenaries:** Mercenary units deal +15% Damage Amplification. At the start of preparation phase, a temporary random high-tier unit is offered in the shop for free, which stays on your board for exactly 1 round.
    *   **(6) Mercenaries:** Winning a round grants a completed item component. Each Mercenary unit gains +5% Lifesteal per item equipped on them.

### 13. Royal Guard (Vanguard Protectors: 2 / 4 / 6)
*   **Description:** Heavily armored knights sworn to protect the Crown.
*   **Mechanic:** Designates the highest-cost allied unit as the "King/Queen" and intercepts damage.
*   **Thresholds:**
    *   **(2) Guards:** At combat start, the highest-cost unit gains +200 HP and +20 DEF. When the King/Queen takes damage, Guards share 15% of that damage.
    *   **(4) Guards:** The King/Queen gains +500 HP, +40 DEF, and is immune to Crowd Control. Guards share 25% of all damage dealt to the King/Queen and gain +30 DEF.
    *   **(6) Guards:** If the King/Queen dies, Guards gain +100% Physical Attack and 33% Damage Reduction for the rest of combat.

### 14. Plague Alchemist (Toxicity Focus: 2 / 4 / 6)
*   **Description:** Corrupted apothecaries spreading biochemical toxins.
*   **Mechanic:** Emits toxic clouds that apply healing reduction and defense shred.
*   **Thresholds:**
    *   **(2) Alchemists:** Alchemists' attacks apply *Plague* for 5 seconds. Plague deals 1% max HP as True Damage per second and applies a 33% healing reduction.
    *   **(4) Alchemists:** Plague now spreads to adjacent enemies upon target death. Alchemists gain +15% Magic Attack.
    *   **(6) Alchemists:** Plagued units have their Physical and Magic Defenses shredded by 33%. Alchemists heal for 30% of all Plague damage dealt.

### 15. Chrono Scholar (Time & Mana Manipulation: 2 / 4 / 6)
*   **Description:** Mages who alter timeline pacing.
*   **Mechanic:** Speeds up ally attack/cast cycles or freezes enemy time.
*   **Thresholds:**
    *   **(2) Scholars:** Every 6 seconds, increase all allies' Attack Speed by +15% (stacks up to 3 times).
    *   **(4) Scholars:** At combat start, increase all allies' starting mana by +20, and delay enemy starting mana regeneration by 2 seconds.
    *   **(6) Scholars:** Once per combat, when an ally falls below 20% HP, freeze time for all enemies in a 2-hex radius for 2.5 seconds (Stun state).

### 16. Gladiators (Dueling & Execution: 2 / 4 / 6)
*   **Description:** Arena fighters who thrive on individual combat.
*   **Mechanic:** Gains stats when fighting alone or executing low-health targets.
*   **Thresholds:**
    *   **(2) Gladiators:** Gladiators deal +10% Damage Amplification. If a Gladiator has no adjacent allies at combat start, they gain a shield equal to 15% Max HP.
    *   **(4) Gladiators:** Gladiators execute target enemies who fall below 15% health, instantly dealing True Damage equal to their remaining HP.
    *   **(6) Gladiators:** Executes trigger at 25% health. Scoring an execution instantly restores 50 mana to the Gladiator.

### 17. Rogues (Backline Infiltration: 2 / 4 / 6)
*   **Description:** Cloaked assassins who strike from the shadows.
*   **Mechanic:** Leaps to the enemy backline at round start and applies critical shreds.
*   **Thresholds:**
    *   **(2) Rogues:** At combat start, Rogues leap to the furthest hex in the enemy backline. Rogues gain +15% Critical Damage.
    *   **(4) Rogues:** Rogues' critical strikes reduce the target's Physical Defense (DEF) by 33% for 5 seconds.
    *   **(6) Rogues:** Scoring a critical strike grants the Rogue stealth for 1 second, resetting enemy targeting aggro.

### 18. High Clerics (Healing & Aura Buffs: 2 / 4 / 6)
*   **Description:** Divine priests channeling healing waves.
*   **Mechanic:** Emits light waves that restore HP and shield allies.
*   **Thresholds:**
    *   **(2) Clerics:** Increase all incoming healing and shielding effects on your board by 20%.
    *   **(4) Clerics:** Every 6 seconds, Clerics emit a holy burst, healing all allies within 2 hexes for 8% of their max HP.
    *   **(6) Clerics:** Holy bursts also grant healed allies a temporary shield equal to 10% of their Max HP for 4 seconds.

### 19. Cavalry Knights (Charging & Disruption: 2 / 4)
*   **Description:** Mounted warriors who charge into battle.
*   **Mechanic:** Charges the furthest enemy at combat start, knocking them back.
*   **Thresholds:**
    *   **(2) Cavalry:** Cavalry units move 50% faster. At combat start, they charge their target, dealing Physical Damage equal to 10% of their Max HP and knocking them back 1 hex.
    *   **(4) Cavalry:** The charge stuns the target for 1.5 seconds and shreds their DEF by 33%.

### 20. Beast Tamers (Companion Summoning: 2 / 3 / 4)
*   **Description:** Forest guardians who fight alongside trained wild beasts.
*   **Mechanic:** Summons a wolf companion whose stats scale with the Tamers' star levels.
*   **Thresholds:**
    *   **(2) Tamers:** Summon a *Tamed Wolf* companion with 500 HP and 40 Base Damage at combat start.
    *   **(3) Tamers:** The Wolf gains +50% HP and basic attacks stun targets for 0.5 seconds.
    *   **(4) Tamers:** Summon a second wolf. All beasts gain +33% Attack Speed.

### 21. Runesmiths (Warding Shields: 2 / 4)
*   **Description:** Enchanters carving defensive runes onto armor.
*   **Mechanic:** Grants temporary runic shields to the frontline.
*   **Thresholds:**
    *   **(2) Runesmiths:** At combat start, frontline allies gain a shield equal to 15% of their Max HP.
    *   **(4) Runesmiths:** While shielded, units reflect 33% of incoming basic attack damage back to attackers.

### 22. Card Gamblers (Luck Draw: 1 / 3)
*   **Description:** Mages using card-magic to draw random combat shifts.
*   **Mechanic:** Draws a card at combat start that applies a random buff/debuff.
*   **Thresholds:**
    *   **(1) Gambler:** Draws one random card at round start:
      * *Ruby Card:* Deal +15% Damage Amplification.
      * *Sapphire Card:* Gain +30 starting mana.
      * *Emerald Card:* Gain +200 HP shield.
    *   **(3) Gamblers:** Draws two cards. Effects apply to all allied units.

### 23. Doom Harbingers (Reapers: 2 / 4)
*   **Description:** Dark executioners wielding scythes of death.
*   **Mechanic:** Grants bonus stats on scoring executions.
*   **Thresholds:**
    *   **(2) Harbingers:** Harbingers deal +10% Damage Amplification. When they kill a unit, they gain +5% Physical Attack for the rest of combat.
    *   **(4) Harbingers:** Harbingers execute targets who fall below 15% HP. Scoring an execution heals the Harbinger for 33% of their missing HP.

### 24. Vanguard Berserkers (Fury: 3 / 5 / 7)
*   **Description:** Wild fighters who grow stronger as health drops.
*   **Mechanic:** Scales Attack Speed based on missing HP percentage.
*   **Thresholds:**
    *   **(3) Berserkers:** Gain +1% Attack Speed for every 2% missing HP.
    *   **(5) Berserkers:** Gain +1% Attack Speed and +0.5% Physical Attack for every 1% missing HP.
    *   **(7) Berserkers:** [Needs 1 Crest] At 20% HP, Berserkers become immune to death for 3 seconds (occurs once per combat).

### 25. Rangers (Marksmen: 2 / 4 / 6)
*   **Description:** Elite archers specializing in rapid long-range firing.
*   **Mechanic:** Grants extra range and scaling Attack Speed.
*   **Thresholds:**
    *   **(2) Rangers:** Rangers gain +1 Hex attack range.
    *   **(4) Rangers:** Every 3 seconds, Rangers gain +15% Attack Speed (stacks up to 5 times).
    *   **(6) Rangers:** [Needs 1 Crest] Stacking Attack Speed increased to +25%. Rangers' critical hits deal +33% bonus True Damage.
