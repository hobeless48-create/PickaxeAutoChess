// src/main.ts

import './style.css';
import * as THREE from 'three';
import { SceneManager } from './view/SceneManager';
import { BoardView } from './view/BoardView';
import { UnitView } from './view/UnitView';
import { UIOverlay } from './view/UIOverlay';
import { ShopUI } from './view/ShopUI';
import { EventBridge } from './view/EventBridge';
import { DragControls } from './view/DragControls';
import { UnitInspectUI } from './view/UnitInspectUI';
import { ScreenManager } from './view/ScreenManager';
import { DPSMeterUI } from './view/DPSMeterUI';

import { TickManager } from './core/tick/TickManager';
import { BoardState } from './core/board/BoardState';
import { UnitFactory } from './core/units/UnitFactory';
import { ShopManager } from './core/shop/ShopManager';
import { GameLoopManager } from './core/board/GameLoopManager';
import {
    resolveDamage,
    processUnitStatusTicks,
    processFacilityCombatTicks,
    handleItemCombatStart,
    processOnAttackItemPassives,
    processOnSkillCastItemPassives,
    processItemStatusTicks,
    processGamblersDiceWinBonus
} from './core/combat/CombatEngine';
import { hexToWorld, hexNeighbors, hexDistance } from './core/hex/HexGrid';
import { SynergyManager } from './core/stats/SynergyManager';
import { getActualStat } from './core/stats/ModifierPipeline';
import { AncientManager } from './core/stats/AncientManager';
import { bus } from './core/events/EventBus';
import { skillRegistry } from './core/skills/SkillRegistry';
import { BOARD_Z_OFFSET } from './view/BoardView';
import { ParticleSystem } from './view/ParticleSystem';

const appDiv = document.querySelector<HTMLDivElement>('#app');

if (appDiv) {
  console.log('Bootstrapping Pickaxe AutoChess (2D Presentation & Lobby Architecture)...');

  // 1. Initialize Decoupled Render View & 2D Hex Grid
  const sceneManager = new SceneManager(appDiv);
  const boardView = new BoardView(sceneManager.getScene());
  boardView.renderBoard();

  const particleSystem = new ParticleSystem(sceneManager.getScene());
  const unitView = new UnitView(sceneManager.getScene());
  const uiOverlay = new UIOverlay(appDiv);
  const dpsMeterUI = new DPSMeterUI();

  // 2. Initialize Core Logic States
  const boardState = new BoardState();
  const shopManager = new ShopManager();
  const gameLoop = new GameLoopManager(boardState);
  gameLoop.shopManager = shopManager;

  // Create Ancient synergy manager
  const ancientManager = new AncientManager(boardState, shopManager);
  gameLoop.ancientManager = ancientManager;

  // Create Ancient chest popup (hidden by default)
  const ancientChestPopup = document.createElement('div');
  ancientChestPopup.id = 'ancient-chest-popup';
  document.body.appendChild(ancientChestPopup);
  ancientChestPopup.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:5000;background:rgba(15,23,42,0.85);border:1px solid rgba(139,92,246,0.5);border-radius:20px;padding:28px 36px;color:#f1f5f9;font-family:\'Inter\',system-ui,sans-serif;flex-direction:column;align-items:center;gap:18px;min-width:380px;box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(139,92,246,0.3);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);';
  ancientChestPopup.innerHTML = 
    '<div style="font-size:13px;color:#a855f7;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">[ Ancient Chest Available ]</div>' +
    '<div class="chest-name" style="font-size:22px;font-weight:bold;color:#fbbf24;"></div>' +
    '<div class="chest-desc" style="font-size:13px;color:#cbd5e1;text-align:center;"></div>' +
    '<div style="font-size:12px;color:#94a3b8;">Rewards if opened now:</div>' +
    '<div class="chest-rewards" style="font-size:13px;color:#a3e635;text-align:center;line-height:1.8;font-family:monospace;"></div>' +
    '<div style="font-size:11px;color:#f87171;text-align:center;padding:10px;background:rgba(239,68,68,0.15);border-radius:10px;border:1px solid rgba(239,68,68,0.3);">' +
    '  WARNING: If you keep stacking and lose before the next threshold, you get nothing!' +
    '</div>' +
    '<div style="display:flex;gap:12px;margin-top:4px;">' +
    '<button id="chest-open-btn" style="padding:12px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#8B5CF6,#6D28D9);color:white;font-weight:bold;font-size:14px;cursor:pointer;box-shadow:0 4px 16px rgba(139,92,246,0.4);">OPEN CHEST</button>' +
    '<button id="chest-keep-btn" style="padding:12px 28px;border:1px solid rgba(255,255,255,0.2);border-radius:10px;background:rgba(30,41,59,0.6);color:#94a3b8;font-weight:bold;font-size:14px;cursor:pointer;">KEEP STACKING</button>' +
    '</div>';

  new EventBridge(unitView, uiOverlay, particleSystem, boardState);

  // Create UI bindings & controls
  const shopUI = new ShopUI(appDiv, shopManager, boardState);
  const unitInspectUI = new UnitInspectUI(appDiv, boardState);
  
  new DragControls(
      sceneManager.getCamera(),
      sceneManager.getScene(),
      boardState,
      gameLoop,
      shopManager,
      boardView.getInteractiveTiles(),
      unitInspectUI
  );

  // Initialize ScreenManager (Lobby, Settings, Compendium, Gameplay Screen State Machine)
  new ScreenManager(
      appDiv,
      boardState,
      shopManager,
      gameLoop,
      ancientManager,
      unitView,
      uiOverlay,
      unitInspectUI,
      shopUI
  );

  // Connect Unit Upgrade event listeners to update visual 2D card sprites
  boardState.onUnitUpgrade((oldIds, newUnit) => {
      for (const id of oldIds) {
          bus.emit({ type: 'UNIT_DIED', unitId: id });
      }
      
      const color = newUnit.starLevel === 2 ? '#fbbf24' : '#ef4444';
      if (newUnit.isOnBench) {
          const targetX = BENCH_START_X + newUnit.benchSlotIndex * BENCH_SPACING;
          const targetZ = BENCH_Z;
          unitView.spawnUnit(newUnit.id, { q: 0, r: 0 }, color, newUnit.name, newUnit.starLevel);
          const mesh = sceneManager.getScene().getObjectByName(newUnit.id);
          if (mesh) {
              mesh.position.set(targetX, 0.65, targetZ);
          }
      } else {
          unitView.spawnUnit(newUnit.id, newUnit.hex, color, newUnit.name, newUnit.starLevel);
      }
      uiOverlay.createHPBar(newUnit.id);
  });

  const BENCH_Z = BoardView.getBenchZ();
  const BENCH_START_X = -0.5;
  const BENCH_SPACING = 1.4;
  let buyCount = 0;

  shopUI.onBuyUnit((cardName) => {
      buyCount++;
      const id = `player-${Date.now()}-${buyCount}`;
      const unit = UnitFactory.createUnit(cardName, id);
      if (!unit) return;
      
      unit.faction = 'player';
      
      const success = boardState.addUnitToBench(unit);
      if (success) {
          const freshUnit = boardState.getUnit(unit.id);
          if (freshUnit) {
              unitView.spawnUnit(freshUnit.id, { q: 0, r: 0 }, '#10b981', freshUnit.name, freshUnit.starLevel);
              
              // Move visual 2D card sprite mesh to bench slot coordinates
              const mesh = sceneManager.getScene().getObjectByName(freshUnit.id);
              if (mesh) {
                  mesh.position.set(BENCH_START_X + freshUnit.benchSlotIndex * BENCH_SPACING, 0.65, BENCH_Z);
              }
              uiOverlay.createHPBar(freshUnit.id);
              bus.emit({ type: 'BOARD_UNITS_CHANGED' });
          }
      } else {
          console.warn('[Shop] Bench is full! Cannot buy unit.');
          shopManager.gold += unit.cost; // refund gold
      }
  });

  function recalculateAndApplySynergies() {
      try {
          const units = boardState.getAllUnits();
          
          for (const unit of units) {
              unit.modifiers = unit.modifiers.filter(m => m.source !== 'synergy');
          }

          const activeTraits = SynergyManager.calculateSynergies(units);
          SynergyManager.applySynergiesToUnits(units, activeTraits, shopManager.level, shopManager.gold);
          
          // Update Ancient Manager tier
          const ancientCount = activeTraits.get('Ancient') || 0;
          ancientManager.setTier(ancientCount);
          
          for (const unit of units) {
              unit.maxHP = Math.round(getActualStat(unit.baseStats.hp, unit.modifiers, 'HP'));
              if (gameLoop.phase === 'Preparation' || gameLoop.phase === 'Matchmaking') {
                  unit.currentHP = unit.maxHP;
              }
              unit.effectiveDEF = getActualStat(unit.baseStats.def, unit.modifiers, 'DEF');
              unit.effectiveMDEF = getActualStat(unit.baseStats.mdef, unit.modifiers, 'MDEF');
              
              let asMultiplier = 1.0;
              let dmgAmpBonus = 0.0;
              if (gameLoop.phase === 'Combat') {
                  if (gameLoop.phaseTimer <= 10) {
                      asMultiplier = 2.0;
                      dmgAmpBonus = 1.0;
                  } else if (gameLoop.phaseTimer <= 20) {
                      asMultiplier = 2.0;
                  }
              }

              unit.effectiveAttackSpeed = Math.min(3.0, getActualStat(unit.baseAttackSpeed, unit.modifiers, 'AttackSpeed') * asMultiplier);
              unit.effectiveATK = getActualStat(unit.baseStats.atk, unit.modifiers, 'ATK');
              unit.effectiveAP = getActualStat(unit.baseStats.ap, unit.modifiers, 'AP');
              unit.effectiveManaRegen = getActualStat(unit.baseStats.manaRegen, unit.modifiers, 'ManaRegen');
              unit.effectiveCritChance = getActualStat(unit.baseStats.critChance, unit.modifiers, 'CritChance');
              unit.effectiveCritDamage = getActualStat(unit.baseStats.critDamage, unit.modifiers, 'CritDamage');
              unit.effectiveDamageReduction = getActualStat(unit.baseStats.damageReduction, unit.modifiers, 'DamageReduction');
              unit.effectiveFinalDamage = getActualStat(unit.baseStats.finalDamage, unit.modifiers, 'FinalDamage');
              unit.effectiveLifesteal = getActualStat(unit.baseStats.lifesteal, unit.modifiers, 'Lifesteal');

              // Sync compatibility properties
              unit.damageAmpModifier = unit.effectiveFinalDamage + dmgAmpBonus;
              unit.damageReductionModifier = unit.effectiveDamageReduction;
              unit.lifestealPercent = unit.effectiveLifesteal;
          }

          shopUI.updateHUD(
              gameLoop.playerHP,
              gameLoop.stage,
              gameLoop.round,
              gameLoop.phase,
              gameLoop.phaseTimer,
              gameLoop.opponentHP
          );

          if (gameLoop.phase === 'Combat') {
              dpsMeterUI.show();
              const units = boardState.getAllUnits().map(u => ({
                  id: u.id,
                  name: u.name,
                  damageDealt: u.totalDamageDealt || 0,
                  damageTaken: u.totalDamageTaken || 0,
                  healingDone: 0,
                  isPlayer: u.faction === 'player'
              }));
              dpsMeterUI.update(units);
          } else {
              dpsMeterUI.hide();
          }
      } catch (err) {
          console.error('[Synergy] Error recalculating synergies:', err);
      }
  }

  bus.on('BOARD_UNITS_CHANGED', () => {
      recalculateAndApplySynergies();

      for (const u of boardState.getAllUnits()) {
          const isUnderConstruction = u.isFacility && u.constructionRoundsRemaining > 0;
          const existingMesh = unitView.getUnitMesh(u.id);
          if (!existingMesh || u.isFacility) {
              const color = u.isFacility ? '#f59e0b' : (u.faction === 'enemy' ? '#ef4444' : '#10b981');
              if (u.isOnBench) {
                  const targetX = BENCH_START_X + u.benchSlotIndex * BENCH_SPACING;
                  const targetZ = BENCH_Z;
                  unitView.spawnUnit(u.id, { q: 0, r: 0 }, color, u.name, u.starLevel, isUnderConstruction);
                  const mesh = sceneManager.getScene().getObjectByName(u.id);
                  if (mesh) {
                      mesh.position.set(targetX, 0.65, targetZ);
                  }
              } else {
                  unitView.spawnUnit(u.id, u.hex, color, u.name, u.starLevel, isUnderConstruction);
              }
              uiOverlay.createHPBar(u.id);
          }
      }
  });

  bus.on('UNIT_DIED', (event: any) => {
      const deadUnit = boardState.getUnit(event.unitId);
      if (deadUnit) {
          const activeTraits = SynergyManager.calculateSynergies(boardState.getAllUnits());
          SynergyManager.handleUnitDeath(deadUnit, boardState, activeTraits);
      }
  });

  // Track phase adjustments
  gameLoop.onPhaseChange((phase) => {
      try {
          // Announce phase transition banner
          uiOverlay.showRoundAnnouncement(gameLoop.stage, gameLoop.round, phase);

          if (phase === 'Preparation') {
              gameLoop.restoreBoardSnapshot();
              const wonRound = gameLoop.winStreak > 0;
              const activeTraits = SynergyManager.calculateSynergies(boardState.getAllUnits());
              SynergyManager.handlePreparationPhase(boardState, activeTraits, shopManager, gameLoop);
              shopManager.addRoundGold(wonRound, Math.max(gameLoop.winStreak, gameLoop.lossStreak), activeTraits, gameLoop.round, boardState.getAllUnits());
              shopManager.addXP(2);
              shopManager.rollShop();
              shopUI.updateShopCards();
              bus.emit({ type: 'BOARD_UNITS_CHANGED' });
              
              // Ancient chest choice check
              const chestReward = ancientManager.checkChestAvailability();
              if (chestReward) {
                  const chestEl = document.getElementById('ancient-chest-popup');
                  if (chestEl) {
                      const nameEl = chestEl.querySelector('.chest-name') as HTMLElement;
                      const descEl = chestEl.querySelector('.chest-desc') as HTMLElement;
                      const rewardEl = chestEl.querySelector('.chest-rewards') as HTMLElement;
                      const openBtn = chestEl.querySelector('#chest-open-btn') as HTMLButtonElement;
                      const keepBtn = chestEl.querySelector('#chest-keep-btn') as HTMLButtonElement;
                      if (nameEl) nameEl.textContent = chestReward.name + ' (' + chestReward.threshold + ' stacks)';
                      if (descEl) descEl.textContent = chestReward.desc;
                      if (rewardEl) {
                          let rText = '';
                          if (chestReward.gold > 0) rText += '<div>+' + chestReward.gold + ' Gold</div>';
                          for (const u of chestReward.units) {
                              rText += '<div>' + u.name + ' (' + u.starLevel + '\u2605' + ')</div>';
                          }
                          for (const item of chestReward.items) {
                              rText += '<div>' + item + '</div>';
                          }
                          if (chestReward.extraDuplicators > 0) {
                              rText += '<div>' + chestReward.extraDuplicators + 'x Lesser Duplicator</div>';
                          }
                          rewardEl.innerHTML = rText;
                      }
                      if (openBtn) {
                          openBtn.onclick = () => {
                              ancientManager.openChest(chestReward);
                              chestEl.style.display = 'none';
                              shopUI.updateHUD(gameLoop.playerHP, gameLoop.stage, gameLoop.round, gameLoop.phase, gameLoop.phaseTimer, gameLoop.opponentHP);
                          };
                      }
                      if (keepBtn) {
                          keepBtn.onclick = () => {
                              ancientManager.keepChest();
                              chestEl.style.display = 'none';
                          };
                      }
                      chestEl.style.display = 'flex';
                  }
              }
          } else if (phase === 'Matchmaking') {
              gameLoop.saveBoardSnapshot();
          } else if (phase === 'Combat') {
              recalculateAndApplySynergies();
              const activeTraits = SynergyManager.calculateSynergies(boardState.getAllUnits());
              SynergyManager.handleCombatStart(boardState, activeTraits);
              handleItemCombatStart(boardState.getAllUnits());

              for (const unit of boardState.getAllUnits()) {
                  if (unit.faction === 'enemy') {
                      unitView.spawnUnit(unit.id, unit.hex, '#ef4444', unit.name, unit.starLevel);
                      uiOverlay.createHPBar(unit.id);
                  }
              }
          } else if (phase === 'Resolution') {
              const wonRound = gameLoop.winStreak > 0;
              const lostRound = gameLoop.lossStreak > 0;
              if (wonRound) {
                  processGamblersDiceWinBonus(boardState.getAllUnits(), shopManager);
                  uiOverlay.showVictoryDefeatBanner(true, 'Enemies eliminated!');
              } else if (lostRound) {
                  uiOverlay.showVictoryDefeatBanner(false, `Defenses collapsed! HP: ${gameLoop.playerHP}`);
              } else {
                  uiOverlay.showVictoryDefeatBanner(true, 'Draw round');
              }
          }
          shopUI.updateHUD(
              gameLoop.playerHP,
              gameLoop.stage,
              gameLoop.round,
              gameLoop.phase,
              gameLoop.phaseTimer,
              gameLoop.opponentHP
          );
      } catch (err) {
          console.error('[PhaseChange] Error handling phase transition:', err);
      }
  });

  // 3. Deterministic tick manager loop (20Hz)
  const tickManager = new TickManager(20);
  tickManager.onTick((_tickNum) => {
      if (_tickNum % 20 === 0) {
          gameLoop.tickSecond();
          if (gameLoop.phase === 'Combat') {
              recalculateAndApplySynergies();
          }
          shopUI.updateHUD(
              gameLoop.playerHP,
              gameLoop.stage,
              gameLoop.round,
              gameLoop.phase,
              gameLoop.phaseTimer,
              gameLoop.opponentHP
          );
      }

      // Active combat logic transitions
      if (gameLoop.phase === 'Combat') {
          const units = boardState.getAllUnits();
          const activeTraits = SynergyManager.calculateSynergies(units);
          SynergyManager.handleCombatTick(_tickNum, gameLoop.phaseTimer, boardState, activeTraits);
          processFacilityCombatTicks(units, _tickNum, activeTraits);
          processItemStatusTicks(units, _tickNum);

          // Early combat end check
          let playerAlive = 0;
          let enemyAlive = 0;
          for (const u of units) {
              if (u.isOnBench) continue;
              if (u.state !== 'Dead' && u.state !== 'Dying') {
                  if (u.faction === 'player') playerAlive++;
                  if (u.faction === 'enemy') enemyAlive++;
              }
          }
          if (playerAlive === 0 || enemyAlive === 0) {
              gameLoop.resolveLocalCombat();
          }

          for (const unit of units) {
              if (unit.isOnBench) continue;

              const manaPaused = unit.modifiers.some(m => m.statType === 'ManaPause');
              if (!manaPaused && _tickNum % 20 === 0 && unit.effectiveManaRegen > 0) {
                  unit.mana = Math.min(unit.maxMana, unit.mana + unit.effectiveManaRegen);
              }

              processUnitStatusTicks(unit, _tickNum);

              if (unit.state === 'Dead' || unit.state === 'Dying') {
                  if (unit.state === 'Dying') {
                      unit.state = 'Dead';
                      bus.emit({ type: 'UNIT_DIED', unitId: unit.id });
                      if (unit.faction === 'enemy') {
                          boardState.removeUnit(unit.id);
                      }
                  }
                  continue;
              }

              const isStunned = unit.modifiers.some(m => m.statType === 'Stun');
              const isDisarmed = unit.modifiers.some(m => m.statType === 'Disarmed');
              if (isStunned) {
                  unit.state = 'Idle';
                  continue;
              }

              if (unit.state === 'Idle') {
                  unit.state = 'Searching';
              }

              if (unit.state === 'Searching') {
                  const target = boardState.findNearestEnemy(unit, unit.faction);
                  if (target) {
                      unit.targetId = target.id;
                      unit.state = 'Moving';
                  }
              }

              if (unit.state === 'Moving' && unit.targetId) {
                  const target = boardState.getUnit(unit.targetId);
                  if (!target || target.state === 'Dead') {
                      unit.targetId = null;
                      unit.state = 'Searching';
                      continue;
                  }

                  const currentDist = hexDistance(unit.hex, target.hex);
                  if (currentDist <= unit.attackRange) {
                      unit.state = 'Attacking';
                      continue;
                  }

                  if (unit.moveCooldown > 0) {
                      unit.moveCooldown--;
                      continue;
                  }

                  const neighbors = hexNeighbors(unit.hex);
                  let bestHex = unit.hex;
                  let minD = Infinity;

                  for (const n of neighbors) {
                      if (n.q < 0 || n.q >= 7 || n.r < 0 || n.r >= 8) continue;
                      if (boardState.isHexOccupied(n)) continue;

                      const d = hexDistance(n, target.hex);
                      if (d < minD) {
                          minD = d;
                          bestHex = n;
                      }
                  }

                  if (bestHex.q !== unit.hex.q || bestHex.r !== unit.hex.r) {
                      const prevHex = unit.hex;
                      unit.hex = bestHex;
                      unit.moveCooldown = 6;
                      bus.emit({ type: 'UNIT_MOVED', unitId: unit.id, from: prevHex, to: bestHex });
                  }
              }

              if (isDisarmed) { unit.state = 'Idle'; continue; }
              if (unit.state === 'Attacking' && unit.targetId) {
                  const target = boardState.getUnit(unit.targetId);
                  if (!target || target.state === 'Dead') {
                      unit.targetId = null;
                      unit.state = 'Searching';
                      continue;
                  }
                  if (unit.attackCooldown <= 0) {
                      if (unit.mana >= unit.maxMana) {
                          unit.mana = 0;
                          const skillCritMult = processOnSkillCastItemPassives(unit, target, units);
                          const executed = skillRegistry.execute(unit.name, {
                              caster: unit,
                              target,
                              boardState,
                              shopManager
                          });
                          if (!executed) {
                              bus.emit({ type: 'SKILL_CAST', unitId: unit.id, skillId: 'ultimate-burst' });
                              resolveDamage(unit, target, unit.baseStats.atk * 2.0 * skillCritMult, 'magic');
                          }
                      } else {
                          bus.emit({ type: 'ATTACK_START', unitId: unit.id, targetId: target.id });
                          const attackPassives = processOnAttackItemPassives(unit, target);
                          const rawPhysDmg = ((unit.effectiveATK || unit.baseStats.atk) * attackPassives.critMult) + attackPassives.bonusPhysicalDmg;
                          const finalDmg = resolveDamage(unit, target, rawPhysDmg, 'physical');
                          if (attackPassives.bonusMagicDmg > 0 && target.state !== 'Dying') {
                              resolveDamage(unit, target, attackPassives.bonusMagicDmg, 'magic');
                          }
                          unit.mana = Math.min(unit.maxMana, unit.mana + 10);
                          bus.emit({ type: 'DAMAGE_APPLIED', unitId: target.id, amount: finalDmg, damageType: 'physical' });
                      }
                      
                      unit.attackCooldown = Math.max(1, Math.round(20 / Math.max(0.1, unit.effectiveAttackSpeed)));
                  } else {
                      unit.attackCooldown--;
                  }
              }
          }
      }
      unitInspectUI.update();
  });
  tickManager.start();

  // 4. Visual translation loop updates
  sceneManager.startRenderLoop((deltaTime) => {
      particleSystem.update(deltaTime);
      const units = boardState.getAllUnits();
      for (const unit of units) {
          if (unit.isDragging) continue;
          if (unit.isOnBench) {
              const mesh = sceneManager.getScene().getObjectByName(unit.id);
              if (mesh) {
                  const targetX = BENCH_START_X + unit.benchSlotIndex * BENCH_SPACING;
                  const targetZ = BENCH_Z;

                  const lerpSpeed = 10.0;
                  mesh.position.x += (targetX - mesh.position.x) * lerpSpeed * deltaTime;
                  mesh.position.z += (targetZ - mesh.position.z) * lerpSpeed * deltaTime;
              }
          } else {
              unitView.updatePosition(unit.id, unit.hex, deltaTime);
          }

          const worldPos = unit.isOnBench
              ? new THREE.Vector3(BENCH_START_X + unit.benchSlotIndex * BENCH_SPACING, 0.65, BENCH_Z)
              : new THREE.Vector3(hexToWorld(unit.hex).x, 0.95, hexToWorld(unit.hex).z + BOARD_Z_OFFSET);

          uiOverlay.updateHPBar(
              unit.id,
              unit.currentHP,
              unit.maxHP,
              worldPos,
              sceneManager.getCamera(),
              unit.mana,
              unit.maxMana,
              unit
          );
      }
  });
}
