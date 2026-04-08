/**
 * generate-seed.js
 * 
 * Reads the TypeScript mockData.ts, strips TS-specific syntax to produce
 * valid JS, then evaluates it to extract mock data arrays.
 * Outputs each dataset as a JSON file into server/data/.
 * 
 * Run: node server/generate-seed.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const MOCK_DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'mockData.ts');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function main() {
    ensureDataDir();

    console.log('📖 Reading mockData.ts...');
    let source = fs.readFileSync(MOCK_DATA_PATH, 'utf-8');

    // Strip TypeScript-specific syntax to make it valid JS
    // 1. Remove the import type line
    source = source.replace(/^import\s+type\s+.*$/gm, '');
    // 2. Remove type annotations on variables: `: UserProfile[]`, `: Team[]`, etc.
    source = source.replace(/:\s*(UserProfile|Team|Chat|Message|NewsPost|Achievement|Rating)\[\]/g, '');
    source = source.replace(/:\s*(UserProfile)\s*=/g, ' =');
    // 3. Convert export const to just const for eval context
    // Actually, we don't need to because we can use dynamic import tricks
    // Let's just write as a temp .mjs file and import it

    // Write cleaned file as temp module
    const tempFile = path.join(__dirname, '_temp_seed.mjs');
    fs.writeFileSync(tempFile, source, 'utf-8');

    // Dynamic import
    import(tempFile).then((mod) => {
        const datasets = [
            { key: 'mockUsers', filename: 'users.json' },
            { key: 'mockTeams', filename: 'teams.json' },
            { key: 'mockChats', filename: 'chats.json' },
            { key: 'mockMessages', filename: 'messages.json' },
            { key: 'mockNewsFeed', filename: 'news.json' },
        ];

        for (const { key, filename } of datasets) {
            if (mod[key]) {
                const filepath = path.join(DATA_DIR, filename);
                fs.writeFileSync(filepath, JSON.stringify(mod[key], null, 2), 'utf-8');
                console.log(`  ✓ ${filename} (${mod[key].length} records)`);
            } else {
                console.error(`  ✗ Could not find export: ${key}`);
            }
        }

        // Create passwords file
        const passwords = {};
        if (mod.mockUsers) {
            mod.mockUsers.forEach((u) => {
                passwords[u.email.toLowerCase()] = 'password123';
            });
        }
        fs.writeFileSync(path.join(DATA_DIR, 'passwords.json'), JSON.stringify(passwords, null, 2), 'utf-8');
        console.log(`  ✓ passwords.json (${Object.keys(passwords).length} entries)`);

        // Create empty files
        fs.writeFileSync(path.join(DATA_DIR, 'saved_profiles.json'), '{}', 'utf-8');
        fs.writeFileSync(path.join(DATA_DIR, 'business_canvases.json'), '[]', 'utf-8');
        console.log('  ✓ saved_profiles.json');
        console.log('  ✓ business_canvases.json');

        // Mark as seeded
        fs.writeFileSync(path.join(DATA_DIR, '.seeded'), new Date().toISOString(), 'utf-8');

        // Cleanup temp file
        fs.unlinkSync(tempFile);

        console.log('\n✅ Seed data generated successfully!');
        console.log(`📁 Files stored in: ${DATA_DIR}`);
    }).catch((err) => {
        console.error('Failed to import temp seed file:', err);
        // Cleanup temp file on error too
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        process.exit(1);
    });
}

main();
