#!/usr/bin/env node

/**
 * Script to automatically fix import paths after copying files to new structure
 * Run this after copy_remaining_files.sh
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Files to update and their import path mappings
const filesToFix = [
    {
        file: 'src/workflow_synthesis/WorkflowSynthesizer.js',
        replacements: [
            { old: "require('./utils/Logger')", new: "require('../utils/Logger')" },
            { old: "require('./TemplateProcessor')", new: "require('../utils/TemplateProcessor')" }
        ]
    },
    {
        file: 'src/routing/ThompsonSamplingRouter.js',
        replacements: [
            { old: "require('./utils/Logger')", new: "require('../utils/Logger')" },
            { old: "new AWS.DynamoDB.DocumentClient()", new: "new AWS.DynamoDB.DocumentClient()" }
        ]
    },
    {
        file: 'evaluation/domains/DomainTemplates.js',
        replacements: [
            // DomainTemplates should be mostly self-contained
        ]
    },
    {
        file: 'evaluation/baselines/BaselineComparators.js',
        replacements: [
            // BaselineComparators uses crypto which is built-in
        ]
    },
    {
        file: 'scripts/generate-synthetic-data.js',
        replacements: [
            { old: "require('../evaluation/DomainTemplates')", new: "require('../evaluation/domains/DomainTemplates')" }
        ]
    }
];

console.log('================================================');
console.log('Fixing import paths in copied files');
console.log('================================================\n');

let filesFixed = 0;
let filesSkipped = 0;

filesToFix.forEach(({ file, replacements }) => {
    const filePath = path.join(ROOT, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠ Skipping ${file} (not found)`);
        filesSkipped++;
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ old, new: newPath }) => {
        if (content.includes(old)) {
            content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed ${file}`);
        filesFixed++;
    } else {
        console.log(`○ No changes needed for ${file}`);
    }
});

console.log('\n================================================');
console.log(`✅ Import path fixing complete!`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Files skipped: ${filesSkipped}`);
console.log('================================================\n');

console.log('Next step: npm install && npm run verify\n');
