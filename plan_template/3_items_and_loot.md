# Part 3: Items, Crafting & Consumables Ledger

This document registers the base components, 36 completed item recipes, alchemical items, and consumable rules.

---

## 1. Base Components
1.  **Blunt Sword:** +10% Physical Attack (ATK).
2.  **Mana Crystal:** +2 Mana Regen.
3.  **Magic Orb:** +10% Magic Attack (AP).
4.  **Bow:** +10% Attack Speed.
5.  **Chestplate:** +20 Physical Defense (DEF) [Flat].
6.  **Cloak:** +20 Magic Defense (MDEF) [Flat].
7.  **Dagger:** +15% Critical Chance.
8.  **Belt:** +150 Max Health (HP) [Flat].

---

## 2. Completed Items Recipes (36 Combinations)

#### 1. Blunt Sword Combinations
*   **Sovereign's Edge** (Sword + Sword): +25% Physical Attack. Passive: *Glory* - Gain +10% Physical Attack whenever the wearer scores a kill or assist (stacks up to 5 times).
*   **Sage's Spear** (Sword + Mana Crystal): +15% Physical Attack, +6 Mana Regen. Passive: *Shojin's Wisdom* - Basic attacks restore +8 additional mana.
*   **Aether Blade** (Sword + Magic Orb): +15% Physical Attack, +15% Magic Attack. Passive: *Soul Feast* - Heals the wearer for 20% of all magic and true damage dealt by their skills.
*   **Colossus Sunderer** (Sword + Bow): +15% Physical Attack, +25% Attack Speed. Passive: *Giant Slayer* - Attacks deal 25% bonus damage to targets with over 1600 Max HP.
*   **Gloomward Shroud** (Sword + Chestplate): +15% Physical Attack, +35 DEF. Passive: *Night's Shield* - At 50% HP, briefly enter Stealth for 1.5 seconds, dropping enemy target aggro and gaining a shield equal to 25% of max health.
*   **Vampiric Greatsword** (Sword + Cloak): +15% Physical Attack, +35 MDEF. Passive: *Bloodthirsty* - Gain +25% Lifesteal. Once per combat, at 40% HP, gain a shield equal to 30% max HP for 5 seconds.
*   **Ruinous Edge** (Sword + Dagger): +15% Physical Attack, +30% Critical Chance. Passive: *Precision* - Wearer's basic attacks and skills can critically strike. Gain +40% Critical Damage.
*   **Hero's Crest** (Sword + Belt): +15% Physical Attack, +250 HP. Passive: *Sterak's Might* - Once per combat at 60% HP, increase size, gain +25% Physical Attack, and gain a shield equal to 25% max HP.

#### 2. Mana Crystal Combinations
*   **Aura of Clarity** (Mana Crystal + Mana Crystal): +12 Mana Regen. Passive: *Deep Flow* - Reduces the wearer's Max Mana requirement by 10.
*   **Archmage's Codex** (Mana Crystal + Magic Orb): +6 Mana Regen, +20% Magic Attack. Passive: *Ascension* - Casting a skill grants the wearer +15% Magic Attack for the rest of combat (stacks up to 5 times).
*   **Stormcharged Bow** (Mana Crystal + Bow): +6 Mana Regen, +25% Attack Speed. Passive: *Static Conduit* - Every 3rd attack fires chain lightning at up to 4 targets, dealing Magic Damage equal to 100% of physical attack power and reducing their MDEF by 33% for 5 seconds.
*   **Vanguard's Vow** (Mana Crystal + Chestplate): +6 Mana Regen, +35 DEF. Passive: *Protector's Guard* - Once per combat at 40% HP, shield the wearer and the closest ally for 25% max HP for 5 seconds and grant them +35 DEF.
*   **Aura of Redemption** (Mana Crystal + Cloak): +6 Mana Regen, +35 MDEF. Passive: *Holy Radiance* - Every 5 seconds, heal adjacent allies for 5% of their missing HP and grant them 15% Damage Reduction for 5 seconds.
*   **Chalice of Justice** (Mana Crystal + Dagger): +6 Mana Regen, +30% Critical Chance. Passive: *Dual Fate* - At combat start, randomly roll to gain either +40% Physical/Magic Attack, or +20% Lifesteal and Spell Lifesteal for the round.
*   **Guardian's Pendant** (Mana Crystal + Belt): +6 Mana Regen, +250 HP. Passive: *Verdant Echo* - When the wearer casts their skill, heal the lowest HP ally for 10% of the wearer's max health.

#### 3. Magic Orb Combinations
*   **Archmage's Crown** (Magic Orb + Magic Orb): +30% Magic Attack. Passive: *Pure Arcana* - Amplifies all magic damage dealt by +25%.
*   **Berserker's Glaive** (Magic Orb + Bow): +15% Magic Attack, +25% Attack Speed. Passive: *Guinsoo's Rage* - Basic attacks grant +6% Attack Speed for the rest of combat (stacks infinitely).
*   **Crown of Valor** (Magic Orb + Chestplate): +15% Magic Attack, +35 DEF. Passive: *Bastion Shield* - At combat start, gain a shield equal to 30% max HP for 8 seconds. While shielded, gain +30% Magic Attack.
*   **Static Ward** (Magic Orb + Cloak): +15% Magic Attack, +35 MDEF. Passive: *Ionic Spark* - Enemies within 2 hexes have their Magic Defense reduced by 33%. When they cast a skill, they take Magic Damage equal to 200% of their max mana.
*   **Spellweaver's Gloves** (Magic Orb + Dagger): +15% Magic Attack, +30% Critical Chance. Passive: *Jeweled Magic* - Wearer's magic skills can critically strike. Gain +15% Critical Chance.
*   **Burning Grimoire** (Magic Orb + Belt): +15% Magic Attack, +250 HP. Passive: *Burn* - Dealing Magic Damage burns the target, dealing 1% of their max HP per second as True Damage and reducing healing received by 33% for 5 seconds.

#### 4. Bow Combinations
*   **Marksman's Longbow** (Bow + Bow): +50% Attack Speed. Passive: *Eagle Eye* - Increases the wearer's attack range by +1 Hex.
*   **Titan's Resolve** (Bow + Chestplate): +25% Attack Speed, +35 DEF. Passive: *Titan's Vigor* - When attacking or taking damage, gain 2% Physical Attack and 2% Magic Attack (stacks up to 25 times). At max stacks, gain +30 DEF and MDEF.
*   **Zephyr's Tempest** (Bow + Cloak): +25% Attack Speed, +35 MDEF. Passive: *Runaan's Gale* - Basic attacks fire a minor bolt at another nearby enemy, dealing 40% of the wearer's Physical Attack as physical damage.
*   **Shredding Arrow** (Bow + Dagger): +25% Attack Speed, +30% Critical Chance. Passive: *Armor Sunder* - Dealing Physical Damage reduces the target's Physical Defense by 33% for 5 seconds.
*   **Stinger Bow** (Bow + Belt): +25% Attack Speed, +250 HP. Passive: *Nashor's Fang* - After casting a skill, gain +40% Attack Speed for 5 seconds.

#### 5. Chestplate Combinations
*   **Thornmail Vest** (Chestplate + Chestplate): +80 DEF. Passive: *Spike Carapace* - Reduces incoming critical strike damage by 30%. When hit by basic attacks, deal 80 Magic Damage to all adjacent enemies (cooldown 1 second).
*   **Gargoyle Stoneplate** (Chestplate + Cloak): +45 DEF, +45 MDEF. Passive: *Stonewall* - Wearer gains +10 DEF and MDEF for each enemy currently targeting them.
*   **Stalwart Shield** (Chestplate + Dagger): +35 DEF, +30% Critical Chance. Passive: *Blindside* - Dodge 15% of basic attacks. At combat start, shoot a shroud that delays the first skill cast of enemies hit by 35%.
*   **Sunfire Cape** (Chestplate + Belt): +35 DEF, +250 HP. Passive: *Immolation* - Every 2 seconds, deal 2% max HP as Magic Damage to adjacent enemies and apply a 33% healing reduction.

#### 6. Cloak Combinations
*   **Dragon's Scale** (Cloak + Cloak): +80 MDEF. Passive: *Spell Barrier* - Reduces incoming magic damage taken by 20%. Regenerate 2% of Max HP every second.
*   **Mithril Cloak** (Cloak + Dagger): +35 MDEF, +30% Critical Chance. Passive: *Quick Barrier* - Wearer is immune to crowd control (stuns, silences, freezes) for the first 12 seconds of combat.
*   **Evenshroud** (Cloak + Belt): +35 MDEF, +250 HP. Passive: *Aura of Sunder* - Reduces the Physical Defense of enemies within 2 hexes by 33%. Allies within 1 hex adjacent gain +10 DEF and +10 MDEF for 15 seconds.

#### 7. Dagger Combinations
*   **Gambler's Dice** (Dagger + Dagger): +60% Critical Chance. Passive: *Thief's Trick* - At the start of preparation phase, temporarily equip 2 random completed items. Spawns different items every round.
*   **Shattering Hammer** (Dagger + Belt): +30% Critical Chance, +250 HP. Passive: *Shieldbreaker* - Attacks and skills deal 40% bonus damage to targets shielded by temporary HP shields.

#### 8. Belt Combinations
*   **Warmog's Armor** (Belt + Belt): +500 HP. Passive: *Colossus HP* - Increases wearer's max health by 15% of their base health.

---

## 3. Consumable Items

*   **Tiny Duplicator:** Place this item on a **1-cost unit** on your bench to instantly spawn a 1★ copy of that unit on a free bench slot.
*   **Lesser Duplicator:** Place this item on any **1, 2, or 3-cost unit** on your bench to instantly spawn a 1★ copy of that unit on a free bench slot.
*   **Artifact Duplicator:** Place this item on **any cost unit**, but it will **only** successfully trigger if that unit currently appears as a card in your active shop roster.
*   **Ornate Hammer:** Graced by Dwarven Forge. Drag this item onto any unit holding completed items. It opens a select menu allowing the player to select one completed item to permanently upgrade into an **Ornate Masterwork Artifact**.
*   **Akashic's Tome:** Place this item on any unit on your board to open a selection menu showing that unit's active Origin and Classes. Choosing one consumes the Tome and spawns a corresponding **Emblem/Crest** consumable item on your bench (which can then be equipped on other units to grant them that synergy).

