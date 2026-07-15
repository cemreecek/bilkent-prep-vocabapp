const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const dirs = [
    "D:\\Bilkent\\BilkentApp\\BilkentApp\\Prefac\\FALL SEMESTER\\WORDLIST SETS & PRACTICE MATERIALS\\PFC WORD LIST SETS FALL PRACTICE MATERIALS (Updated September 2024)",
    "D:\\Bilkent\\BilkentApp\\BilkentApp\\Upper\\VOCABULARY STRAND\\P 1&3 VOCABULARY SETS & PRACTICE MATERIALS\\PERIODS 1&3 PRACTICE MATERIALS FOR SETS"
];

async function convertAll() {
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            console.log(`Directory not found: ${dir}`);
            continue;
        }

        console.log(`\nProcessing directory: ${dir}`);
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            if (file.startsWith("~$") || !file.endsWith(".docx")) {
                continue;
            }

            const inputPath = path.join(dir, file);
            const outputPath = path.join(dir, path.basename(file, ".docx") + ".md");

            console.log(`Converting ${file}...`);
            try {
                const result = await mammoth.extractRawText({ path: inputPath });
                fs.writeFileSync(outputPath, result.value, "utf8");
                console.log(`✅ Saved ${outputPath}`);
            } catch (err) {
                console.error(`❌ Failed to convert ${inputPath}:`, err.message);
            }
        }
    }
}

convertAll().then(() => console.log("\nDone converting!"));
