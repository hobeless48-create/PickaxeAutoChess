# Part 5: Aetheria Unit Roster & Ability Catalog

This catalog outlines the complete roster of **61 unique units** grouped by their Faction Origin. Each unit contains 1 main Origin and 1 or 2 Class Traits, covering diverse roles like tanks, magic carries, physical DPS, and support.

## Balancing Reference Table (TFT / GS / Magic Chess Standard)

| Cost | HP Range   | ATK Range | AP Range | DEF/MDEF | Mana Cost | 1★ Dmg Mult | 2★ Dmg Mult | 3★ Dmg Mult |
|------|------------|-----------|----------|-----------|-----------|-------------|-------------|-------------|
| 1G   | 450–650    | 40–55     | 0–55     | 10–30     | 55–90     | 120–150%    | 180–225%    | 290–330%    |
| 2G   | 550–800    | 50–65     | 55–70    | 15–40     | 65–100    | 155–185%    | 230–265%    | 360–420%    |
| 3G   | 700–900    | 60–80     | 65–82    | 20–52     | 55–100    | 200–225%    | 295–325%    | 460–510%    |
| 4G   | 950–1150   | 82–95     | 78–95    | 30–58     | 65–110    | 250–270%    | 365–390%    | 565–600%    |
| 5G   | 975–1400   | 95–115    | 95–115   | 28–70     | 80–130    | 285–325%    | 425–475%    | 680–860%    |

*   **Skill Scaling Notation:** Values scale by star level as `[1★ / 2★ / 3★]` based on **ATK** (Physical) or **AP** (Magic).
*   **Star Level Stat Multiplier:** 2★ units gain **+80% Base Stats** from 1★. 3★ units gain **+80%** from 2★ (≈ ×3.24 total from 1★).
*   **Mana Notation:** `(Starting Mana / Max Mana)`. Starting Mana = pre-filled passive charge (e.g., `20/80` = starts with 20, needs 60 more to cast).

## Combat Base Stats (15 Stats Directory)

1. **Max Health**: The maximum hit points of the unit (represented in the unit's health bar).
2. **Max Mana**: The maximum energy required to cast the unit's skill.
3. **Mana Regen**: The amount of mana generated gradually per second (separate from default 15 mana per attack).
4. **Range**: How far (in board tiles/hexes) the unit can attack.
5. **Attack Speed**: How many times the unit can attack per second.
6. **Attack Power**: The base physical damage dealt by basic attacks and physical skills.
7. **Magic Power (AP)**: The base magical damage dealt by magical skills.
8. **Physical Def (Armor/DEF)**: Reduces incoming physical damage.
9. **Magical Def (Magic Resist/MDEF)**: Reduces incoming magical damage.
10. **Damage Reduction**: The final percentage reduction applied to incoming damage (defaults to 0%).
11. **Crit Chance**: The percentage chance to deal critical damage (defaults to 10%).
12. **Crit Damage**: The extra damage bonus multiplier applied when landing a critical strike (defaults to +75%, for 175% total damage).
13. **Final Damage**: Increases all outgoing damage dealt by the unit by a percentage (defaults to 0%).
14. **Lifesteal**: Restores health to the unit based on a percentage of damage dealt (defaults to 0%).

---

## 1. Human (Growth & Command Faction)

### 1.1 Vanguard Squire
*   **Cost:** 1 Gold
*   **Origin:** Human | **Traits:** Cavalry Knight
*   **Base Stats:** HP: 600 | ATK: 50 | AP: 0 | Atk Speed: 0.65 | Mana: (0/80) | DEF: 30 | MDEF: 20
*   **Skill:** *Shield Bash* — Slams shield into the nearest enemy, dealing `[130% / 195% / 305%]` of ATK as Physical Damage and **stunning** the target for **1.5s**.
*   **Role:** Frontline CC / Tank.

### 1.2 Archer Apprentice
*   **Cost:** 1 Gold
*   **Origin:** Human | **Traits:** Rangers
*   **Base Stats:** HP: 450 | ATK: 48 | AP: 0 | Atk Speed: 0.75 | Mana: (0/65) | DEF: 15 | MDEF: 15
*   **Skill:** *Steady Shot* — Fires a piercing arrow at the farthest enemy, dealing `[150% / 225% / 330%]` of ATK as Physical Damage.
*   **Role:** Backline Physical Carry.

### 1.3 Royal Shieldbearer
*   **Cost:** 2 Gold
*   **Origin:** Human | **Traits:** Royal Guard, Runesmith
*   **Base Stats:** HP: 750 | ATK: 52 | AP: 0 | Atk Speed: 0.60 | Mana: (0/100) | DEF: 40 | MDEF: 30
*   **Skill:** *Fortify* — Raises shield, granting self a `[220 / 380 / 600]` HP shield and granting all adjacent allies **+20 DEF** for **4s**.
*   **Role:** Defensive Guardian.

### 1.4 Spellscribe
*   **Cost:** 3 Gold
*   **Origin:** Human | **Traits:** Chrono Scholar
*   **Base Stats:** HP: 650 | ATK: 42 | AP: 65 | Atk Speed: 0.65 | Mana: (20/90) | DEF: 20 | MDEF: 35
*   **Skill:** *Haste Rune* — Inscribes a rune beneath the ally with the highest Attack Speed, boosting their Attack Speed by `[30% / 45% / 70%]` for **5s**.
*   **Role:** Utility Buffer / Mage Support.

### 1.5 Cavalry Captain
*   **Cost:** 4 Gold
*   **Origin:** Human | **Traits:** Cavalry Knight, Gladiators
*   **Base Stats:** HP: 1000 | ATK: 88 | AP: 0 | Atk Speed: 0.75 | Mana: (0/85) | DEF: 50 | MDEF: 35
*   **Skill:** *Lance Charge* — Charges the farthest enemy, dealing `[260% / 380% / 580%]` of ATK as Physical Damage and **knocking back** all enemies in the charge path by **1 hex**.
*   **Role:** Frontline Bruiser / Disruptor.

### 1.6 High Commander
*   **Cost:** 5 Gold
*   **Origin:** Human | **Traits:** Royal Guard, Mercenaries
*   **Base Stats:** HP: 1150 | ATK: 95 | AP: 0 | Atk Speed: 0.75 | Mana: (0/100) | DEF: 60 | MDEF: 45
*   **Skill:** *Commanding Rally* — Rallies all allies: grants `[250 / 430 / 800]` HP shield and **+20% / +30% / +50% Damage Amplification** for **6s**, and simultaneously **stuns all enemies** for **1s**.
*   **Role:** Frontline Commander / Team-wide Buffer.

---

## 2. Ancient (High-Risk Cashout Faction)

### 2.1 Relic Squire
*   **Cost:** 1 Gold
*   **Origin:** Ancient | **Traits:** Runesmith
*   **Base Stats:** HP: 600 | ATK: 46 | AP: 0 | Atk Speed: 0.65 | Mana: (0/85) | DEF: 30 | MDEF: 25
*   **Skill:** *Warding Seal* — Activates a runic barrier equal to `[180 / 310 / 490]` HP for **4s**, reflecting **15%** of incoming basic-attack damage while active.
*   **Role:** Defensive Tank.

### 2.2 Tomb Raider
*   **Cost:** 1 Gold
*   **Origin:** Ancient | **Traits:** Rogues
*   **Base Stats:** HP: 500 | ATK: 52 | AP: 0 | Atk Speed: 0.75 | Mana: (0/65) | DEF: 15 | MDEF: 15
*   **Skill:** *Quick Slash* — Leaps behind the target, dealing `[140% / 205% / 320%]` of ATK as Physical Damage and generating **+15 Mana**.
*   **Role:** Backline Assassin.

### 2.3 Ancient Scribe
*   **Cost:** 2 Gold
*   **Origin:** Ancient | **Traits:** Chrono Scholar
*   **Base Stats:** HP: 575 | ATK: 38 | AP: 58 | Atk Speed: 0.65 | Mana: (30/100) | DEF: 20 | MDEF: 30
*   **Skill:** *Time Lock* — Fires a temporal orb at the nearest enemy, **pausing their mana generation for 3s** and dealing `[165% / 245% / 385%]` of AP as Magic Damage.
*   **Role:** Single-target CC / Mage.

### 2.4 Stone Protector
*   **Cost:** 2 Gold
*   **Origin:** Ancient | **Traits:** Royal Guard
*   **Base Stats:** HP: 775 | ATK: 52 | AP: 0 | Atk Speed: 0.60 | Mana: (0/100) | DEF: 40 | MDEF: 30
*   **Skill:** *Relic Aegis* — Braces for impact, gaining `[25 / 45 / 70]` flat DEF and MDEF for **5s** and taunting the nearest enemy.
*   **Role:** Main Tank.

### 2.5 Runecarver
*   **Cost:** 3 Gold
*   **Origin:** Ancient | **Traits:** Runesmith, Card Gamblers
*   **Base Stats:** HP: 700 | ATK: 48 | AP: 72 | Atk Speed: 0.70 | Mana: (0/85) | DEF: 25 | MDEF: 40
*   **Skill:** *Runic Cascade* — Carves explosive sigils on the ground, dealing `[210% / 305% / 480%]` of AP as Magic Damage to all enemies in a **1-hex radius**.
*   **Role:** AoE Magic Carry.

### 2.6 Relic Colossus
*   **Cost:** 4 Gold
*   **Origin:** Ancient | **Traits:** Gladiators
*   **Base Stats:** HP: 1100 | ATK: 90 | AP: 0 | Atk Speed: 0.65 | Mana: (0/100) | DEF: 55 | MDEF: 40
*   **Skill:** *Colossal Smash* — Slams both fists down, dealing `[255% / 375% / 580%]` of ATK as Physical Damage and **stunning all enemies** in a **2-hex straight line** for **2s**.
*   **Role:** CC Frontline Tank.

---

## 3. Noble (Taxation & Gold Scaling Faction)

### 3.1 Merchant Guard
*   **Cost:** 1 Gold
*   **Origin:** Noble | **Traits:** Cavalry Knight
*   **Base Stats:** HP: 625 | ATK: 48 | AP: 0 | Atk Speed: 0.65 | Mana: (0/80) | DEF: 30 | MDEF: 20
*   **Skill:** *Guarded Cleave* — Swings halberd in a short arc, dealing `[130% / 195% / 305%]` of ATK as Physical Damage and gaining **+15 DEF** for **4s**.
*   **Role:** Off-Tank.

### 3.2 Tax Collector
*   **Cost:** 2 Gold
*   **Origin:** Noble | **Traits:** Rogues
*   **Base Stats:** HP: 575 | ATK: 62 | AP: 0 | Atk Speed: 0.75 | Mana: (0/65) | DEF: 20 | MDEF: 20
*   **Skill:** *Gold Extract* — Backstabs the target, dealing `[185% / 270% / 425%]` of ATK as Physical Damage. If it **kills** the target, gain **+1 Gold**.
*   **Role:** Single-target Executioner.

### 3.3 Aristocrat Duelist
*   **Cost:** 3 Gold
*   **Origin:** Noble | **Traits:** Gladiators
*   **Base Stats:** HP: 750 | ATK: 72 | AP: 0 | Atk Speed: 0.85 | Mana: (0/55) | DEF: 30 | MDEF: 25
*   **Skill:** *Noble Thrust* — Pierces the target's vital spot, dealing `[220% / 320% / 500%]` of ATK as Physical Damage and **ignoring 30%** of the target's DEF.
*   **Role:** Duelist Physical Carry.

### 3.4 Royal Alchemist
*   **Cost:** 3 Gold
*   **Origin:** Noble | **Traits:** Plague Alchemist
*   **Base Stats:** HP: 650 | ATK: 45 | AP: 68 | Atk Speed: 0.70 | Mana: (0/90) | DEF: 20 | MDEF: 30
*   **Skill:** *Midas Touch* — Hurls a gilded elixir at the nearest enemy, dealing `[210% / 305% / 480%]` of AP as Magic Damage and **stunning** the target for **1.5s**.
*   **Role:** Ranged Mage / CC.

### 3.5 Gilded Baron
*   **Cost:** 4 Gold
*   **Origin:** Noble | **Traits:** Mercenaries
*   **Base Stats:** HP: 975 | ATK: 85 | AP: 0 | Atk Speed: 0.70 | Mana: (0/80) | DEF: 40 | MDEF: 35
*   **Skill:** *Bribe* — Pelts the target with coins, dealing `[250% / 365% / 565%]` of ATK as Physical Damage and **disarming** the target (cannot basic attack) for **3s**.
*   **Role:** Single-target Disarmer / Physical Carry.

### 3.6 Noble Duchess
*   **Cost:** 5 Gold
*   **Origin:** Noble | **Traits:** High Clerics
*   **Base Stats:** HP: 950 | ATK: 42 | AP: 95 | Atk Speed: 0.70 | Mana: (40/120) | DEF: 25 | MDEF: 50
*   **Skill:** *Gilded Blessing* — Calls upon noble grace, healing all allies for `[20% / 35% / 70%]` of their **missing HP** and shielding each for `[250 / 430 / 800]` HP for **5s**.
*   **Role:** Backline Support / Healer.

---

## 4. Dwarven Forge (Weapon Upgrading Faction)

### 4.1 Apprentice Blacksmith
*   **Cost:** 1 Gold
*   **Origin:** Dwarven Forge | **Traits:** Vanguard Berserker
*   **Base Stats:** HP: 625 | ATK: 52 | AP: 0 | Atk Speed: 0.65 | Mana: (0/65) | DEF: 25 | MDEF: 20
*   **Skill:** *Hammer Strike* — Smashes with a forge hammer, dealing `[140% / 210% / 325%]` of ATK as Physical Damage and **shredding** the target's DEF by **25%** for **4s**.
*   **Role:** Shred Bruiser.

### 4.2 Dwarven Cannoneer
*   **Cost:** 2 Gold
*   **Origin:** Dwarven Forge | **Traits:** Rangers
*   **Base Stats:** HP: 550 | ATK: 58 | AP: 0 | Atk Speed: 0.70 | Mana: (0/75) | DEF: 20 | MDEF: 15
*   **Skill:** *Blackpowder Shell* — Fires an explosive shell at the target, dealing `[170% / 250% / 390%]` of ATK as Physical Damage in a **1-hex blast** radius.
*   **Role:** Ranged Splash DPS.

### 4.3 Forge Mason
*   **Cost:** 3 Gold
*   **Origin:** Dwarven Forge | **Traits:** Architect
*   **Base Stats:** HP: 825 | ATK: 62 | AP: 0 | Atk Speed: 0.65 | Mana: (0/85) | DEF: 45 | MDEF: 35
*   **Skill:** *Fortified Brick* — Erects a barricade, granting self a `[280 / 460 / 750]` HP shield and granting all adjacent allies **+30 DEF** for **4s**.
*   **Role:** Defensive Tank / Protector.

### 4.4 Ironbound Sentry
*   **Cost:** 3 Gold
*   **Origin:** Dwarven Forge | **Traits:** Royal Guard
*   **Base Stats:** HP: 875 | ATK: 65 | AP: 0 | Atk Speed: 0.60 | Mana: (0/90) | DEF: 50 | MDEF: 35
*   **Skill:** *Iron Will* — Enters an iron defensive stance, reducing **all incoming damage** by `[20% / 30% / 45%]` for **4s** and taunting the nearest two enemies.
*   **Role:** Primary Tank.

### 4.5 Shieldbreaker Berserker
*   **Cost:** 4 Gold
*   **Origin:** Dwarven Forge | **Traits:** Vanguard Berserker, Gladiators
*   **Base Stats:** HP: 1025 | ATK: 88 | AP: 0 | Atk Speed: 0.75 | Mana: (0/75) | DEF: 40 | MDEF: 30
*   **Skill:** *Sunder* — Delivers a devastating strike, dealing `[260% / 380% / 590%]` of ATK as Physical Damage. Deals **+50% bonus damage** if the target has an active shield.
*   **Role:** Melee Carry / Shield Breaker.

### 4.6 Master Runesmith
*   **Cost:** 5 Gold
*   **Origin:** Dwarven Forge | **Traits:** Runesmith, Architect
*   **Base Stats:** HP: 1100 | ATK: 78 | AP: 88 | Atk Speed: 0.70 | Mana: (0/100) | DEF: 55 | MDEF: 55
*   **Skill:** *Runic Armament* — Enchants all allied units with runic plating, granting each a `[280 / 490 / 900]` HP shield. While shielded, units **reflect 30%** of incoming basic-attack damage.
*   **Role:** Board-wide Support Tank.

---

## 5. Demonic Pact (Abyssal Summoning Faction)

### 5.1 Cultist Initiate
*   **Cost:** 1 Gold
*   **Origin:** Demonic Pact | **Traits:** Plague Alchemist
*   **Base Stats:** HP: 525 | ATK: 42 | AP: 50 | Atk Speed: 0.70 | Mana: (0/75) | DEF: 15 | MDEF: 20
*   **Skill:** *Acid Spit* — Spews acid at the nearest enemy, dealing `[130% / 195% / 305%]` of AP as Magic Damage and **shredding** the target's MDEF by **25%** for **4s**.
*   **Role:** Frontline Mage / MDEF Shredder.

### 5.2 Blood Zealot
*   **Cost:** 2 Gold
*   **Origin:** Demonic Pact | **Traits:** Vanguard Berserker
*   **Base Stats:** HP: 675 | ATK: 60 | AP: 0 | Atk Speed: 0.70 | Mana: (0/55) | DEF: 25 | MDEF: 20
*   **Skill:** *Frenzied Strike* — Recklessly attacks the nearest enemy, dealing `[170% / 250% / 390%]` of ATK as Physical Damage and **restoring HP equal to 25%** of the damage dealt.
*   **Role:** Melee Bruiser / Sustain Fighter.

### 5.3 Shadow Warlock
*   **Cost:** 3 Gold
*   **Origin:** Demonic Pact | **Traits:** Doom Harbingers
*   **Base Stats:** HP: 700 | ATK: 48 | AP: 75 | Atk Speed: 0.70 | Mana: (0/80) | DEF: 20 | MDEF: 35
*   **Skill:** *Doom Edict* — Seals a target's fate, dealing `[210% / 305% / 480%]` of AP as Magic Damage over **4s** (DoT). If the target **dies** during the effect, **summon a Skeleton Minion** (200 HP, 30 ATK).
*   **Role:** DoT Damage Carry / Summoner.

### 5.4 Underworld Pitlord
*   **Cost:** 4 Gold
*   **Origin:** Demonic Pact | **Traits:** Gladiators, Cavalry Knight
*   **Base Stats:** HP: 1100 | ATK: 88 | AP: 0 | Atk Speed: 0.65 | Mana: (0/100) | DEF: 50 | MDEF: 40
*   **Skill:** *Abyssal Slam* — Crashes down with twin axes, dealing `[255% / 375% / 580%]` of ATK as Physical Damage and **stunning** the target for **2s**.
*   **Role:** CC Tank / Disruptor.

### 5.5 Demon Summoner
*   **Cost:** 4 Gold
*   **Origin:** Demonic Pact | **Traits:** High Clerics
*   **Base Stats:** HP: 875 | ATK: 42 | AP: 88 | Atk Speed: 0.70 | Mana: (20/120) | DEF: 25 | MDEF: 42
*   **Skill:** *Demonic Circle* — Tears open a shadow rift, summoning a **Demonic Sentinel** with `[350 / 600 / 1100]` HP and **30 base ATK** that absorbs enemy attacks and blocks the nearest hex to your backline.
*   **Role:** Support Summoner.

### 5.6 Lord of Torment
*   **Cost:** 5 Gold
*   **Origin:** Demonic Pact | **Traits:** Rogues, Doom Harbingers
*   **Base Stats:** HP: 1100 | ATK: 105 | AP: 95 | Atk Speed: 0.85 | Mana: (30/85) | DEF: 38 | MDEF: 38
*   **Skill:** *Tormenting Sweep* — Teleports to the highest-HP enemy and sweeps a shadow scythe, dealing `[300% / 440% / 700%]` of ATK as Physical Damage. Enemies at or **below 20% HP** are **instantly executed**.
*   **Role:** Hyper Assassin / Executioner Carry.

---

## 6. Magic Tower (Spellburst Faction)

### 6.1 Tower Novice
*   **Cost:** 1 Gold
*   **Origin:** Magic Tower | **Traits:** Chrono Scholar
*   **Base Stats:** HP: 475 | ATK: 35 | AP: 52 | Atk Speed: 0.65 | Mana: (30/90) | DEF: 15 | MDEF: 25
*   **Skill:** *Spark Shot* — Launches a magic spark at the nearest enemy, dealing `[135% / 200% / 315%]` of AP as Magic Damage.
*   **Role:** Ranged Mage.

### 6.2 Frost Wielder
*   **Cost:** 2 Gold
*   **Origin:** Magic Tower | **Traits:** Plague Alchemist
*   **Base Stats:** HP: 575 | ATK: 40 | AP: 65 | Atk Speed: 0.65 | Mana: (0/95) | DEF: 20 | MDEF: 30
*   **Skill:** *Frostbite* — Fires a frostbolt at the nearest enemy, dealing `[175% / 255% / 400%]` of AP as Magic Damage and **stunning** them for **1.5s**.
*   **Role:** Single-target CC Mage.

### 6.3 Storm Warden
*   **Cost:** 3 Gold
*   **Origin:** Magic Tower | **Traits:** Runesmith
*   **Base Stats:** HP: 825 | ATK: 52 | AP: 72 | Atk Speed: 0.65 | Mana: (0/85) | DEF: 35 | MDEF: 35
*   **Skill:** *Lightning Shield* — Surges with electricity, gaining a `[220 / 370 / 600]` HP shield and dealing **60 Magic Damage** to any attacker that hits it while the shield holds.
*   **Role:** Mage Tank / Counter-Attacker.

### 6.4 Arcane Illusionist
*   **Cost:** 3 Gold
*   **Origin:** Magic Tower | **Traits:** Rogues
*   **Base Stats:** HP: 650 | ATK: 48 | AP: 76 | Atk Speed: 0.75 | Mana: (0/75) | DEF: 20 | MDEF: 25
*   **Skill:** *Mirror Image* — Blinks to a random adjacent hex, leaving an illusion that taunts the nearest enemy and detonates for `[120% / 175% / 275%]` of AP as Magic Damage before vanishing.
*   **Role:** Evasion Mage / Rogue Utility.

### 6.5 Battle Mage
*   **Cost:** 4 Gold
*   **Origin:** Magic Tower | **Traits:** Gladiators, Cavalry Knight
*   **Base Stats:** HP: 975 | ATK: 78 | AP: 82 | Atk Speed: 0.70 | Mana: (0/85) | DEF: 45 | MDEF: 40
*   **Skill:** *Spell Blade* — Imbues weapon with arcane energy, dealing `[255% / 375% / 580%]` of AP as Magic Damage on the next basic attack and gaining **+30 DEF** for **3s**.
*   **Role:** Frontline Bruiser Mage.

### 6.6 High Archmage
*   **Cost:** 5 Gold
*   **Origin:** Magic Tower | **Traits:** Chrono Scholar, Architect
*   **Base Stats:** HP: 900 | ATK: 48 | AP: 105 | Atk Speed: 0.75 | Mana: (50/130) | DEF: 25 | MDEF: 55
*   **Skill:** *Time Distortion* — Tears open a temporal rift over the battlefield. All allies gain **+50% Attack Speed**. All enemies are **Silenced** and take `[350% / 520% / 850%]` of AP as Magic Damage over **4s**.
*   **Role:** Global CC / Mage Carry.

---

## 7. Sylvan Elves (Crit & Dodge Faction)

### 7.1 Leaf Ranger
*   **Cost:** 1 Gold
*   **Origin:** Sylvan Elves | **Traits:** Rangers
*   **Base Stats:** HP: 475 | ATK: 50 | AP: 0 | Atk Speed: 0.75 | Mana: (0/65) | DEF: 15 | MDEF: 15
*   **Skill:** *Quick Arrow* — Fires two rapid shots at the nearest enemy, dealing `[75% + 75% / 110% + 110% / 165% + 165%]` of ATK as Physical Damage per hit (total 150% / 220% / 330%).
*   **Role:** Ranged Physical Carry.

### 7.2 Forest Guardian
*   **Cost:** 2 Gold
*   **Origin:** Sylvan Elves | **Traits:** Beast Tamers
*   **Base Stats:** HP: 725 | ATK: 52 | AP: 0 | Atk Speed: 0.65 | Mana: (0/90) | DEF: 35 | MDEF: 25
*   **Skill:** *Vine Snare* — Entangles the nearest enemy with vines, dealing `[155% / 230% / 360%]` of ATK as Physical Damage and **rooting** them in place for **2s**.
*   **Role:** Frontline CC Tank.

### 7.3 Shrine Priestess
*   **Cost:** 2 Gold
*   **Origin:** Sylvan Elves | **Traits:** High Clerics
*   **Base Stats:** HP: 525 | ATK: 36 | AP: 62 | Atk Speed: 0.65 | Mana: (40/100) | DEF: 20 | MDEF: 30
*   **Skill:** *Leaf Shower* — Calls down a shower of sacred leaves, restoring `[180 / 310 / 495]` HP to the **2 lowest HP allies**.
*   **Role:** Healer Support.

### 7.4 Wind Dancer
*   **Cost:** 3 Gold
*   **Origin:** Sylvan Elves | **Traits:** Rogues, Gladiators
*   **Base Stats:** HP: 700 | ATK: 74 | AP: 0 | Atk Speed: 0.85 | Mana: (0/55) | DEF: 25 | MDEF: 20
*   **Skill:** *Blade Whirl* — Spins dual blades in a close arc, dealing `[215% / 315% / 490%]` of ATK as Physical Damage and gaining **+20% Dodge Chance** for **4s**.
*   **Role:** Evasive Melee Carry.

### 7.5 Elder Druid
*   **Cost:** 4 Gold
*   **Origin:** Sylvan Elves | **Traits:** Beast Tamers, Chrono Scholar
*   **Base Stats:** HP: 875 | ATK: 52 | AP: 82 | Atk Speed: 0.70 | Mana: (30/110) | DEF: 30 | MDEF: 40
*   **Skill:** *Nature's Grasp* — Erupts vines from the ground in a **2-hex straight line**, dealing `[225% / 330% / 515%]` of AP as Magic Damage and **silencing** all hit enemies for **2s**.
*   **Role:** AoE CC Mage.

### 7.6 Elf Monarch
*   **Cost:** 5 Gold
*   **Origin:** Sylvan Elves | **Traits:** Rangers, Royal Guard
*   **Base Stats:** HP: 1050 | ATK: 100 | AP: 0 | Atk Speed: 0.90 | Mana: (0/80) | DEF: 40 | MDEF: 35
*   **Skill:** *Solar Arrow* — Nocks a solar-charged arrow and fires at the lowest HP enemy, dealing `[300% / 440% / 720%]` of ATK as Physical Damage. Enemies **below 15% HP** are **instantly executed**.
*   **Role:** Ranged Hyper Carry / Executioner.

---

## 8. Necropolis Undead (Reanimation Faction)

### 8.1 Crypt Skeleton
*   **Cost:** 1 Gold
*   **Origin:** Necropolis Undead | **Traits:** Gladiators
*   **Base Stats:** HP: 550 | ATK: 55 | AP: 0 | Atk Speed: 0.70 | Mana: (0/55) | DEF: 20 | MDEF: 15
*   **Skill:** *Jagged Swing* — Swings a bone shard at the nearest enemy, dealing `[140% / 205% / 320%]` of ATK as Physical Damage and **restoring 80 HP**.
*   **Role:** Frontline Bruiser / Sustain.

### 8.2 Wandering Ghost
*   **Cost:** 2 Gold
*   **Origin:** Necropolis Undead | **Traits:** Rogues
*   **Base Stats:** HP: 525 | ATK: 60 | AP: 0 | Atk Speed: 0.75 | Mana: (30/75) | DEF: 15 | MDEF: 20
*   **Skill:** *Haunt* — Phases through the battlefield to strike the backline target, dealing `[170% / 250% / 390%]` of ATK as Physical Damage and **silencing** them for **2s**.
*   **Role:** Backline Assassin.

### 8.3 Plague Bearer
*   **Cost:** 3 Gold
*   **Origin:** Necropolis Undead | **Traits:** Plague Alchemist
*   **Base Stats:** HP: 825 | ATK: 52 | AP: 72 | Atk Speed: 0.65 | Mana: (0/90) | DEF: 35 | MDEF: 30
*   **Skill:** *Toxic Cloud* — Releases a putrid cloud centered on self, dealing `[185% / 270% / 425%]` of AP as Magic Damage to all nearby enemies and applying a **33% healing reduction** for **5s**.
*   **Role:** Frontline AoE Debuffer.

### 8.4 Grave Keeper
*   **Cost:** 3 Gold
*   **Origin:** Necropolis Undead | **Traits:** Cavalry Knight, Royal Guard
*   **Base Stats:** HP: 875 | ATK: 62 | AP: 0 | Atk Speed: 0.60 | Mana: (0/100) | DEF: 45 | MDEF: 35
*   **Skill:** *Grave Shield* — Raises a shield of grave energy worth `[280 / 460 / 750]` HP. While the shield holds, adjacent enemies take **25 Magic Damage per second**.
*   **Role:** Defensive Tank / Area Punisher.

### 8.5 Reaper of Souls
*   **Cost:** 4 Gold
*   **Origin:** Necropolis Undead | **Traits:** Doom Harbingers, Gladiators
*   **Base Stats:** HP: 975 | ATK: 90 | AP: 0 | Atk Speed: 0.80 | Mana: (0/65) | DEF: 32 | MDEF: 30
*   **Skill:** *Soul Harvest* — Reaps through the target, dealing `[260% / 380% / 590%]` of ATK as Physical Damage. If the target **dies**, the Reaper **restores 30% of its max HP**.
*   **Role:** Executioner Carry.

### 8.6 Lich Lord
*   **Cost:** 5 Gold
*   **Origin:** Necropolis Undead | **Traits:** High Clerics, Card Gamblers
*   **Base Stats:** HP: 975 | ATK: 48 | AP: 100 | Atk Speed: 0.70 | Mana: (40/120) | DEF: 28 | MDEF: 50
*   **Skill:** *Death Wave* — Unleashes a wave of necrotic energy across the board, dealing `[290% / 430% / 700%]` of AP as Magic Damage to all enemies and **healing all undead allies for 250 HP**.
*   **Role:** Board-wide Mage Carry / Undead Healer.

---

## 9. Draconic Zealots (Dragon Incubator Faction)

### 9.1 Fire Breeder
*   **Cost:** 1 Gold
*   **Origin:** Draconic Zealots | **Traits:** Runesmith
*   **Base Stats:** HP: 575 | ATK: 46 | AP: 50 | Atk Speed: 0.65 | Mana: (0/80) | DEF: 25 | MDEF: 20
*   **Skill:** *Flame Ward* — Cloaks self in flame, generating a `[140 / 240 / 380]` HP shield. While the shield holds, basic attacks deal an additional **+20 Magic Damage**.
*   **Role:** Mage Tank.

### 9.2 Cinder Hatchling
*   **Cost:** 1 Gold
*   **Origin:** Draconic Zealots | **Traits:** Rangers
*   **Base Stats:** HP: 475 | ATK: 46 | AP: 0 | Atk Speed: 0.75 | Mana: (0/65) | DEF: 15 | MDEF: 15
*   **Skill:** *Ember Spit* — Spits a fireball at the farthest enemy, dealing `[140% / 205% / 320%]` of ATK as Physical Damage and **burning** the target for **15 True Damage per second** for **5s**.
*   **Role:** Ranged DPS.

### 9.3 Wyvern Rider
*   **Cost:** 2 Gold
*   **Origin:** Draconic Zealots | **Traits:** Cavalry Knight
*   **Base Stats:** HP: 725 | ATK: 62 | AP: 0 | Atk Speed: 0.70 | Mana: (0/85) | DEF: 35 | MDEF: 25
*   **Skill:** *Dive Strike* — Swoops from above on a dive, dealing `[175% / 255% / 400%]` of ATK as Physical Damage and **knocking the target back 1 hex**.
*   **Role:** Cavalry Disruptor.

### 9.4 Dragon Priest
*   **Cost:** 3 Gold
*   **Origin:** Draconic Zealots | **Traits:** High Clerics, Architect
*   **Base Stats:** HP: 725 | ATK: 42 | AP: 72 | Atk Speed: 0.65 | Mana: (20/90) | DEF: 25 | MDEF: 35
*   **Skill:** *Dragon's Breath* — Breathes a warm restorative wind, healing the **3 allied units** in the front rows for `[180 / 310 / 500]` HP each.
*   **Role:** Frontline Support / Healer.

### 9.5 Scale Zealot  *(New Unit)*
*   **Cost:** 4 Gold
*   **Origin:** Draconic Zealots | **Traits:** Vanguard Berserker, Runesmith
*   **Base Stats:** HP: 1025 | ATK: 88 | AP: 45 | Atk Speed: 0.75 | Mana: (0/85) | DEF: 48 | MDEF: 38
*   **Skill:** *Draconic Frenzy* — Channels draconic fury, dealing `[255% / 375% / 580%]` of ATK as Physical Damage in a **cone** in front of the caster. Each enemy hit grants the caster **+8% Attack Speed** for **4s** (stacks per enemy hit).
*   **Role:** AoE Bruiser / Self-Buffer.

### 9.6 Cinder Dragon  *(Draconic Cultist Boss)*
*   **Cost:** 5 Gold
*   **Origin:** Draconic Zealots | **Traits:** Vanguard Berserker, Gladiators
*   **Base Stats:** HP: 1350 | ATK: 112 | AP: 105 | Atk Speed: 0.80 | Mana: (30/100) | DEF: 65 | MDEF: 62
*   **Skill:** *Inferno Breath* — Rears back and unleashes a massive fire cone, dealing `[320% / 470% / 780%]` of AP as Magic Damage to all enemies in the cone and **burning** their **Max HP by 8% as True Damage** over **4s**.
*   **Role:** Legendary Carry / Board-Control.

---

## 10. Elemental Fairy (Golem Absorbing Faction)

### 10.1 Sprout Sprite  *(Nature Fairy)*
*   **Cost:** 1 Gold
*   **Origin:** Elemental Fairy | **Traits:** High Clerics
*   **Base Stats:** HP: 500 | ATK: 36 | AP: 52 | Atk Speed: 0.65 | Mana: (30/90) | DEF: 20 | MDEF: 25
*   **Skill:** *Dewdrop* — Sprinkles healing dew, restoring `[130 / 225 / 360]` HP to the lowest HP ally.
*   **Role:** Healer.
*   **Golem Merge Effect:** Golem regenerates **1% Max HP/sec**.

### 10.2 Ember Pixie  *(Fire Fairy)*
*   **Cost:** 1 Gold
*   **Origin:** Elemental Fairy | **Traits:** Rangers
*   **Base Stats:** HP: 450 | ATK: 52 | AP: 0 | Atk Speed: 0.80 | Mana: (0/65) | DEF: 15 | MDEF: 15
*   **Skill:** *Spark Flare* — Hurls a burning orb at the farthest enemy, dealing `[145% / 215% / 335%]` of ATK as Physical Damage.
*   **Role:** Ranged DPS.
*   **Golem Merge Effect:** Golem gains **+25% Damage Amplification** and **+1 Hex skill range**.

### 10.3 Wave Sylph  *(Water Fairy)*
*   **Cost:** 2 Gold
*   **Origin:** Elemental Fairy | **Traits:** Chrono Scholar
*   **Base Stats:** HP: 550 | ATK: 42 | AP: 62 | Atk Speed: 0.65 | Mana: (0/85) | DEF: 20 | MDEF: 30
*   **Skill:** *Splash* — Launches a water orb at the nearest enemy, dealing `[170% / 250% / 390%]` of AP as Magic Damage and **delaying their next basic attack by 35%**.
*   **Role:** Utility Mage.
*   **Golem Merge Effect:** Golem attacks apply **Corrosion** (1% Max HP True Damage/sec).

### 10.4 Pebble Gnome  *(Stone Fairy)*
*   **Cost:** 3 Gold
*   **Origin:** Elemental Fairy | **Traits:** Royal Guard, Runesmith
*   **Base Stats:** HP: 875 | ATK: 58 | AP: 0 | Atk Speed: 0.60 | Mana: (0/100) | DEF: 52 | MDEF: 42
*   **Skill:** *Hard Harden* — Petrifies skin, gaining `[35 / 62 / 100]` flat DEF and MDEF for **5s** and **taunting** all enemies within 2 hexes.
*   **Role:** Primary Tank.
*   **Golem Merge Effect:** Golem gains **+40 DEF and MDEF**.

### 10.5 Gale Sylph  *(Wind Fairy)*
*   **Cost:** 4 Gold
*   **Origin:** Elemental Fairy | **Traits:** Rogues, Gladiators
*   **Base Stats:** HP: 825 | ATK: 80 | AP: 0 | Atk Speed: 0.90 | Mana: (0/65) | DEF: 30 | MDEF: 30
*   **Skill:** *Wind Blade* — Vanishes in a gust and reappears behind the target, dealing `[255% / 375% / 580%]` of ATK as Physical Damage and **knocking the target back 1 hex**.
*   **Role:** Assassin / Physical Carry.
*   **Golem Merge Effect:** *(Wind Fairy stays on board as a fighter — does not merge into Golem).*

### 10.6 Primordial Fairy Queen
*   **Cost:** 5 Gold
*   **Origin:** Elemental Fairy | **Traits:** Card Gamblers, Architect
*   **Base Stats:** HP: 1000 | ATK: 48 | AP: 100 | Atk Speed: 0.70 | Mana: (50/125) | DEF: 30 | MDEF: 50
*   **Skill:** *Tidal Fairy Wave* — Commands all elemental energies, summoning a board-wide wave that deals `[280% / 415% / 680%]` of AP as Magic Damage to all enemies and **stunning** them for **1.5s**.
*   **Role:** Board-wide CC Mage Carry.

---

## Appendix: Rebalancing Notes

### Key Changes from Previous Version

| Category | Old Design Issue | New Standard |
|----------|-----------------|--------------|
| **1-cost skill multipliers** | Up to 400% at 3★ (too high) | Capped at ~300–330% at 3★ |
| **2-cost skill multipliers** | Up to 450% at 3★ (too high) | Normalized to ~380–420% at 3★ |
| **3-cost skill multipliers** | Up to 500% at 3★ (inconsistent) | Normalized to ~460–510% at 3★ |
| **4-cost skill multipliers** | Up to 600% at 3★ | Normalized to ~565–600% at 3★ |
| **5-cost skill multipliers** | Wide variance (700–1000%) | Normalized to ~680–860% at 3★ |
| **Mana costs** | Wildly inconsistent per tier | Standardized per cost bracket |
| **Cultist Initiate** | Skill used AP but listed as ATK scale | Fixed to AP scaling |
| **Draconic Zealots** | Only 5 units — 9.5 was missing | **Added 9.5 Scale Zealot** (4-cost AoE Berserker) |
| **Cinder Dragon** | Under-statted for a 5-cost boss | HP 1300→1350, ATK 110→112, AP 100→105, DEF/MDEF raised |
| **High Archmage** | Mana cost too low for global channel | Mana increased to (50/130) |
| **Elf Monarch** | Attack speed 0.85 (too slow for crit-dodge carry) | Raised to 0.90 |
| **Stone Protector** | No taunt — passive tank with no engagement | Added taunt to Relic Aegis |
| **Pebble Gnome** | No taunt — passive defense with no engagement | Added taunt within 2 hexes to Hard Harden |
| **Iron Will (4.4)** | 50% damage reduction at 3★ was overtuned | Reduced to 45% at 3★ |
| **Shield flat values** | Some 5-cost shields hit 1000 HP (overcapped) | Capped at ~800–900 HP at 3★ |
| **Heal flat values** | Inconsistent with unit AP base | Re-scaled proportionally to AP |
