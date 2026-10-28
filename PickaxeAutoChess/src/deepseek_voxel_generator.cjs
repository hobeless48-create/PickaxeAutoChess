// C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess\src\deepseek_voxel_generator.cjs

const fs = require('fs');
const path = require('path');

const DEEPSEEK_API_KEY = "sk-778a4e89c3da4263b7c26a3eca54bffc";
const API_URL = "https://api.deepseek.com/v1/chat/completions";

async function callDeepSeek(systemPrompt, userPrompt) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.15,
            max_tokens: 8000
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

async function run() {
    console.log("Generating high fidelity VoxelModelFactory.ts...");
    const systemPrompt = "You are a professional 3D developer writing clean TypeScript for Three.js. You design highly detailed voxel characters. Output ONLY raw TypeScript code. No markdown formatting, no explanations.";
    const userPrompt = `Write a TypeScript class VoxelModelFactory that procedurally constructs detailed 3D voxel-style character groups (THREE.Group) with high color contrast:
    - static createVoxelUnit(name: string): THREE.Group
    It must support:
    1. "Vanguard Squire": Torso, head, arms, legs, iron grey armor plates, silver helmet visor, gold shoulder pads, and a steel sword.
    2. "Archer Apprentice": Green leather clothes, brown bow, yellow hair, holding a small arrow.
    3. "Cinder Dragon": Larger model, dark red scales, orange back spikes, wings made of orange blocks, snout, and glowing yellow eyes.
    Use multiple overlapping box meshes with different offsets to add rich voxel texture. Add shadow casting and receive shadows flags.`;

    const codeRaw = await callDeepSeek(systemPrompt, userPrompt);
    const cleanCode = codeRaw.replace(/```typescript/g, "").replace(/```/g, "").trim();
    
    const targetFile = path.join(__dirname, "view/VoxelModelFactory.ts");
    fs.writeFileSync(targetFile, cleanCode);
    console.log("VoxelModelFactory.ts written successfully!");
}

run().catch(console.error);
