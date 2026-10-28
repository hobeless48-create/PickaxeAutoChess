// src/view/3d/ModelFactory.ts

import * as THREE from 'three';

export class ModelFactory {
    /**
     * Creates a high-detail, visually distinct 3D character model mesh for any unit.
     * Uses unit name, faction, cost, and traits to build unique 3D character meshes with custom weapons, headwear, and colors.
     */
    public static createUnit3DModel(
        unitName: string,
        faction: string,
        cost: number,
        traits: string[] = [],
        starLevel: number = 1,
        team: 'player' | 'enemy' = 'player'
    ): THREE.Group {
        const root = new THREE.Group();
        root.name = `Unit3D_${unitName}`;

        const teamColor = team === 'player' ? '#3b82f6' : '#ef4444';
        const costColor = this.getCostColor(cost);
        const factionColor = this.getFactionColor(faction);

        // Character Base / Pedestal Ring
        const baseGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.08, 16);
        const baseMat = new THREE.MeshStandardMaterial({
            color: teamColor,
            metalness: 0.6,
            roughness: 0.3,
            emissive: teamColor,
            emissiveIntensity: 0.3
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.04;
        baseMesh.receiveShadow = true;
        root.add(baseMesh);

        // Body Group
        const bodyGroup = new THREE.Group();
        bodyGroup.name = 'BodyGroup';
        bodyGroup.position.y = 0.08;
        root.add(bodyGroup);

        // Determine Archetype from Name, Faction, and Traits
        const lowerName = unitName.toLowerCase();
        const traitsStr = traits.join(' ').toLowerCase();

        let archetype: 'knight' | 'mage' | 'archer' | 'rogue' | 'beast' | 'dwarf' | 'titan' = 'knight';

        if (traitsStr.includes('ranger') || lowerName.includes('archer') || lowerName.includes('ranger') || lowerName.includes('hunter') || lowerName.includes('sniper')) {
            archetype = 'archer';
        } else if (traitsStr.includes('magic') || traitsStr.includes('sorcerer') || lowerName.includes('mage') || lowerName.includes('wizard') || lowerName.includes('element') || lowerName.includes('priest')) {
            archetype = 'mage';
        } else if (traitsStr.includes('rogue') || traitsStr.includes('assassin') || lowerName.includes('rogue') || lowerName.includes('blade') || lowerName.includes('shadow')) {
            archetype = 'rogue';
        } else if (faction.includes('Forge') || traitsStr.includes('dwarf') || lowerName.includes('dwarf') || lowerName.includes('hammer') || lowerName.includes('smith')) {
            archetype = 'dwarf';
        } else if (faction.includes('Ancient') || lowerName.includes('dragon') || lowerName.includes('beast') || lowerName.includes('wolf') || lowerName.includes('golem') || lowerName.includes('demon')) {
            archetype = 'beast';
        } else if (cost >= 4 || lowerName.includes('titan') || lowerName.includes('lord') || lowerName.includes('king') || lowerName.includes('champion')) {
            archetype = 'titan';
        }

        const scale = starLevel === 3 ? 1.4 : starLevel === 2 ? 1.18 : 1.0;

        // Build Distinct 3D Geometry
        switch (archetype) {
            case 'mage':
                this.buildMageMesh(bodyGroup, teamColor, costColor, factionColor);
                break;
            case 'archer':
                this.buildArcherMesh(bodyGroup, teamColor, costColor, factionColor);
                break;
            case 'rogue':
                this.buildRogueMesh(bodyGroup, teamColor, costColor, factionColor);
                break;
            case 'dwarf':
                this.buildDwarfMesh(bodyGroup, teamColor, costColor, factionColor);
                break;
            case 'beast':
                this.buildBeastMesh(bodyGroup, teamColor, costColor, factionColor);
                break;
            case 'titan':
                this.buildTitanMesh(bodyGroup, teamColor, costColor, factionColor);
                break;
            case 'knight':
            default:
                this.buildKnightMesh(bodyGroup, teamColor, costColor, factionColor);
                break;
        }

        bodyGroup.scale.set(scale, scale, scale);

        // Add 3D Star Badge Indicator on Head
        if (starLevel > 1) {
            const starGroup = this.createStarBadge(starLevel);
            starGroup.position.y = 1.95 * scale;
            root.add(starGroup);
        }

        return root;
    }

    private static getCostColor(cost: number): string {
        switch (cost) {
            case 1: return '#94a3b8'; // Slate Silver
            case 2: return '#10b981'; // Emerald Green
            case 3: return '#3b82f6'; // Sapphire Blue
            case 4: return '#8b5cf6'; // Royal Purple
            case 5: return '#f59e0b'; // Radiant Gold
            default: return '#94a3b8';
        }
    }

    private static getFactionColor(faction: string): string {
        if (faction.includes('Human')) return '#3b82f6';
        if (faction.includes('Forge')) return '#ef4444';
        if (faction.includes('Ancient')) return '#8b5cf6';
        if (faction.includes('Elves')) return '#10b981';
        if (faction.includes('Magic')) return '#06b6d4';
        if (faction.includes('Demonic')) return '#a855f7';
        return '#f59e0b';
    }

    private static buildKnightMesh(group: THREE.Group, teamColor: string, costColor: string, factionColor: string) {
        // Torso Armor
        const torsoGeo = new THREE.BoxGeometry(0.48, 0.65, 0.32);
        const armorMat = new THREE.MeshStandardMaterial({ color: costColor, metalness: 0.85, roughness: 0.2 });
        const torso = new THREE.Mesh(torsoGeo, armorMat);
        torso.position.y = 0.6;
        torso.castShadow = true;
        group.add(torso);

        // Faction Shoulder Pads (Pauldrons)
        const pauldronGeo = new THREE.BoxGeometry(0.2, 0.2, 0.25);
        const pauldronMat = new THREE.MeshStandardMaterial({ color: factionColor, metalness: 0.9 });
        const pLeft = new THREE.Mesh(pauldronGeo, pauldronMat);
        pLeft.position.set(-0.32, 0.85, 0);
        group.add(pLeft);

        const pRight = new THREE.Mesh(pauldronGeo, pauldronMat);
        pRight.position.set(0.32, 0.85, 0);
        group.add(pRight);

        // Helmet
        const headGeo = new THREE.SphereGeometry(0.21, 14, 14);
        const helmMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.9 });
        const head = new THREE.Mesh(headGeo, helmMat);
        head.position.y = 1.08;
        head.castShadow = true;
        group.add(head);

        // Visor Glow
        const visorGeo = new THREE.BoxGeometry(0.24, 0.07, 0.15);
        const visorMat = new THREE.MeshBasicMaterial({ color: teamColor });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.08, 0.13);
        group.add(visor);

        // Left Heraldic Shield
        const shieldGeo = new THREE.BoxGeometry(0.1, 0.55, 0.38);
        const shieldMat = new THREE.MeshStandardMaterial({ color: teamColor, metalness: 0.7, roughness: 0.3 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.set(-0.35, 0.6, 0.12);
        shield.castShadow = true;
        group.add(shield);

        // Right Broadsword
        const swordBladeGeo = new THREE.BoxGeometry(0.05, 0.85, 0.1);
        const swordMat = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.95 });
        const sword = new THREE.Mesh(swordBladeGeo, swordMat);
        sword.position.set(0.35, 0.75, 0.18);
        sword.rotation.x = -0.3;
        sword.castShadow = true;
        group.add(sword);
    }

    private static buildArcherMesh(group: THREE.Group, _teamColor: string, costColor: string, factionColor: string) {
        // Tunic Body
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.72, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: factionColor, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.58;
        group.add(body);

        // Hood & Head
        const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: '#fde047' });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.02;
        group.add(head);

        const hoodGeo = new THREE.ConeGeometry(0.26, 0.3, 8);
        const hoodMat = new THREE.MeshStandardMaterial({ color: costColor });
        const hood = new THREE.Mesh(hoodGeo, hoodMat);
        hood.position.y = 1.18;
        group.add(hood);

        // Large 3D Wooden Bow in Left Hand
        const bowGeo = new THREE.TorusGeometry(0.42, 0.035, 8, 20, Math.PI * 1.1);
        const bowMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.4 });
        const bow = new THREE.Mesh(bowGeo, bowMat);
        bow.position.set(-0.35, 0.7, 0.15);
        bow.rotation.y = Math.PI / 2;
        group.add(bow);

        // Arrow Quiver on Back
        const quiverGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
        const quiverMat = new THREE.MeshStandardMaterial({ color: '#78350f' });
        const quiver = new THREE.Mesh(quiverGeo, quiverMat);
        quiver.position.set(0.15, 0.75, -0.2);
        quiver.rotation.z = -0.3;
        group.add(quiver);
    }

    private static buildMageMesh(group: THREE.Group, teamColor: string, costColor: string, factionColor: string) {
        // Wizard Robe
        const robeGeo = new THREE.ConeGeometry(0.38, 0.85, 8);
        const robeMat = new THREE.MeshStandardMaterial({ color: factionColor, roughness: 0.6 });
        const robe = new THREE.Mesh(robeGeo, robeMat);
        robe.position.y = 0.52;
        group.add(robe);

        // Head
        const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: '#fef08a' });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.02;
        group.add(head);

        // Pointy Wizard Hat
        const hatGeo = new THREE.ConeGeometry(0.32, 0.6, 8);
        const hatMat = new THREE.MeshStandardMaterial({ color: costColor, roughness: 0.3 });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 1.35;
        hat.rotation.z = -0.15;
        group.add(hat);

        // Tall Magic Staff with Floating Glowing Orb
        const staffGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.35);
        const staffMat = new THREE.MeshStandardMaterial({ color: '#78350f', metalness: 0.3 });
        const staff = new THREE.Mesh(staffGeo, staffMat);
        staff.position.set(0.32, 0.75, 0.1);
        group.add(staff);

        const orbGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: teamColor });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.set(0.32, 1.48, 0.1);
        group.add(orb);
    }

    private static buildRogueMesh(group: THREE.Group, _teamColor: string, costColor: string, factionColor: string) {
        // Shadow Leather Armor Body
        const bodyGeo = new THREE.BoxGeometry(0.36, 0.68, 0.24);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#1e1b4b', metalness: 0.6, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.58;
        group.add(body);

        // Masked Ninja Head
        const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: costColor });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.0;
        group.add(head);

        // Dual Glowing Daggers
        const daggerGeo = new THREE.ConeGeometry(0.045, 0.45, 4);
        const daggerMat = new THREE.MeshBasicMaterial({ color: factionColor });

        const d1 = new THREE.Mesh(daggerGeo, daggerMat);
        d1.position.set(0.3, 0.65, 0.18);
        d1.rotation.x = Math.PI / 2;
        group.add(d1);

        const d2 = new THREE.Mesh(daggerGeo, daggerMat);
        d2.position.set(-0.3, 0.65, 0.18);
        d2.rotation.x = Math.PI / 2;
        group.add(d2);
    }

    private static buildDwarfMesh(group: THREE.Group, _teamColor: string, costColor: string, _factionColor: string) {
        // Wide Dwarf Torso
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.55, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', metalness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.45;
        group.add(body);

        // Dwarf Head & Red Beard
        const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: '#fef08a' });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.85;
        group.add(head);

        const beardGeo = new THREE.BoxGeometry(0.3, 0.25, 0.2);
        const beardMat = new THREE.MeshStandardMaterial({ color: '#ea580c' });
        const beard = new THREE.Mesh(beardGeo, beardMat);
        beard.position.set(0, 0.72, 0.15);
        group.add(beard);

        // Massive Battle Hammer
        const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9);
        const headMat2 = new THREE.MeshStandardMaterial({ color: costColor, metalness: 0.95 });
        const handle = new THREE.Mesh(handleGeo, headMat2);
        handle.position.set(0.38, 0.65, 0.1);
        group.add(handle);

        const hammerHeadGeo = new THREE.BoxGeometry(0.25, 0.25, 0.4);
        const hammerHead = new THREE.Mesh(hammerHeadGeo, headMat2);
        hammerHead.position.set(0.38, 1.05, 0.1);
        group.add(hammerHead);
    }

    private static buildBeastMesh(group: THREE.Group, _teamColor: string, costColor: string, _factionColor: string) {
        // Monster Beast Body
        const bodyGeo = new THREE.DodecahedronGeometry(0.48);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.65;
        group.add(body);

        // Large Monster Horns
        const hornGeo = new THREE.ConeGeometry(0.09, 0.45, 5);
        const hornMat = new THREE.MeshStandardMaterial({ color: costColor, metalness: 0.5 });

        const h1 = new THREE.Mesh(hornGeo, hornMat);
        h1.position.set(0.25, 1.1, 0);
        h1.rotation.z = -0.35;
        group.add(h1);

        const h2 = new THREE.Mesh(hornGeo, hornMat);
        h2.position.set(-0.25, 1.1, 0);
        h2.rotation.z = 0.35;
        group.add(h2);
    }

    private static buildTitanMesh(group: THREE.Group, _teamColor: string, costColor: string, factionColor: string) {
        // Huge Armored Colossus
        const bodyGeo = new THREE.BoxGeometry(0.72, 0.9, 0.48);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.95, roughness: 0.1 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.78;
        group.add(body);

        // Glowing Power Core
        const coreGeo = new THREE.SphereGeometry(0.2, 14, 14);
        const coreMat = new THREE.MeshBasicMaterial({ color: costColor });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 0.88, 0.25);
        group.add(core);

        // Giant Colossus Greatsword
        const swordGeo = new THREE.BoxGeometry(0.09, 1.25, 0.18);
        const swordMat = new THREE.MeshStandardMaterial({ color: factionColor, metalness: 0.95 });
        const sword = new THREE.Mesh(swordGeo, swordMat);
        sword.position.set(0.52, 0.85, 0.22);
        group.add(sword);
    }

    private static createStarBadge(starLevel: number): THREE.Group {
        const starGroup = new THREE.Group();
        const starColor = starLevel === 3 ? '#f59e0b' : '#3b82f6';

        for (let i = 0; i < starLevel; i++) {
            const starGeo = new THREE.OctahedronGeometry(0.09);
            const starMat = new THREE.MeshBasicMaterial({ color: starColor });
            const star = new THREE.Mesh(starGeo, starMat);
            const offset = (i - (starLevel - 1) / 2) * 0.24;
            star.position.x = offset;
            starGroup.add(star);
        }
        return starGroup;
    }
}
