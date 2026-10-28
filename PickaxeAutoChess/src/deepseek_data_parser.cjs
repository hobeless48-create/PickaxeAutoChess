// C:\Users\s0846\Desktop\Files\Pickaxe\PickaxeAutoChess\src\deepseek_data_parser.cjs

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
            temperature: 0.1,
            max_tokens: 8000
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

async function run() {
    console.log("Loading markdown files...");
    const rosterPath = "C:/Users/s0846/Desktop/Files/Pickaxe/plan_template/5_unit_roster.md";
    const itemsPath = "C:/Users/s0846/Desktop/Files/Pickaxe/plan_template/3_items_and_loot.md";

    const rosterMd = fs.readFileSync(rosterPath, 'utf8');
    const itemsMd = fs.readFileSync(itemsPath, 'utf8');

    // 1. Generate units_catalog.json
    console.log("Generating units_catalog.json via DeepSeek V3...");
    const rosterSystemPrompt = "You parse markdown lists of game units and output a structured JSON array. Return ONLY raw JSON. No markdown code blocks, no explanation text.";
    const rosterUserPrompt = `Parse this unit roster markdown and convert all 61 units into a JSON array of objects.
    Each object should have: name, cost (number), faction (Origin), traits (array of string), baseStats (object with hp, atk, def, mdef numbers).
    Units catalog data:\n${rosterMd}`;

    const rosterJsonRaw = await callDeepSeek(rosterSystemPrompt, rosterUserPrompt);
    const cleanRosterJson = rosterJsonRaw.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const targetDataDir = path.join(__dirname, "core/data");
    if (!fs.existsSync(targetDataDir)) {
        fs.mkdirSync(targetDataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDataDir, "units_catalog.json"), cleanRosterJson);
    console.log("units_catalog.json written successfully!");

    // 2. Generate recipes.json
    console.log("Generating recipes.json via DeepSeek V3...");
    const itemsSystemPrompt = "You parse markdown lists of game items and output a structured JSON array. Return ONLY raw JSON. No markdown code blocks, no explanation text.";
    const itemsUserPrompt = `Parse this item combination markdown and convert the items recipes into a JSON array of objects.
    Each object should have: result (name of combined item), componentA (base component name), componentB (base component name), stats (object containing stat increments).
    Items data:\n${itemsMd}`;

    const itemsJsonRaw = await callDeepSeek(itemsSystemPrompt, itemsUserPrompt);
    const cleanItemsJson = itemsJsonRaw.replace(/```json/g, "").replace(/```/g, "").trim();
    fs.writeFileSync(path.join(targetDataDir, "recipes.json"), cleanItemsJson);
    console.log("recipes.json written successfully!");
}

run().catch(console.error);
