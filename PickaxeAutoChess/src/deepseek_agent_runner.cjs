// C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess\src\deepseek_agent_runner.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
            model: "deepseek-chat", // DeepSeek-V3 / Coder endpoint
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 4000
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

// Ensure dir exists utility
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

const FILES_TO_GENERATE = [
    {
        name: "UnitFactory.ts",
        path: path.join(__dirname, "core/units/UnitFactory.ts"),
        prompt: "Create UnitFactory.ts in TypeScript. It should support spawning Squire (1G, Human, Cavalry Knight, HP: 600, ATK: 50, DEF: 30, MDEF: 20) and Archer Apprentice (1G, Human, Rangers, HP: 450, ATK: 48, DEF: 15, MDEF: 15) using the roster design. Ensure exports match types."
    },
    {
        name: "BoardState.ts",
        path: path.join(__dirname, "core/board/BoardState.ts"),
        prompt: "Create BoardState.ts in TypeScript. Track grid dimensions (4x8), unit instances, occupied positions, nearest target scanning utilizing HexGrid distance calculations, and path updates. Implement A* pathfinding on the axial hex coordinates."
    },
    {
        name: "UnitView.ts",
        path: path.join(__dirname, "view/UnitView.ts"),
        prompt: "Create UnitView.ts in TypeScript. Present units in Three.js using simple bounding/cylinder mesh placeholders. Handle movement updates by smoothly lerping coordinates from current position to targeted coordinates."
    },
    {
        name: "UIOverlay.ts",
        path: path.join(__dirname, "view/UIOverlay.ts"),
        prompt: "Create UIOverlay.ts in TypeScript. Render and position standard HTML health bars above active units by converting Three.js 3D positions to 2D screen projections using standard camera matrices."
    }
];

async function run() {
    console.log("Starting DeepSeek Agent loop for Phase 2 generation...");

    for (const fileSpec of FILES_TO_GENERATE) {
        console.log(`\n--- Generating ${fileSpec.name} ---`);
        let generatedCode = "";
        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            attempts++;
            console.log(`Calling DeepSeek API (Attempt ${attempts})...`);

            const systemPrompt = "You are an expert game developer writing clean, compile-ready TypeScript code. Return ONLY raw TypeScript code inside your response. Do not wrap code in markdown code block ticks. Do not include explanation text.";
            const userPrompt = `${fileSpec.prompt}\nVerify it imports types correctly from '../hex/HexGrid', '../fsm/UnitFSM', etc.`;

            try {
                const responseText = await callDeepSeek(systemPrompt, userPrompt);
                generatedCode = responseText.replace(/```typescript/g, "").replace(/```/g, "").trim();

                // Save code temporarily
                ensureDirectoryExistence(fileSpec.path);
                fs.writeFileSync(fileSpec.path, generatedCode);
                console.log(`Saved temporary code file to ${fileSpec.path}`);

                // Perform verification compile check
                console.log("Running compilation check...");
                execSync("npx tsc --noEmit", { cwd: path.join(__dirname, "..") });
                console.log("Compilation check PASSED.");
                success = true;
            } catch (err) {
                console.log(`Compilation failed on attempt ${attempts}. Error:\n${err.message || err}`);
                if (attempts < 3) {
                    console.log("Feeding compiler error back to DeepSeek for correction...");
                    fileSpec.prompt += `\nFIX THE PREVIOUS ERROR: ${err.message || err}`;
                }
            }
        }

        if (!success) {
            console.error(`Failed to generate a working version of ${fileSpec.name} after 3 attempts.`);
            process.exit(1);
        }
    }

    console.log("\nAll Phase 2 files generated and compiled successfully!");
}

run();
