#!/usr/bin/env node

/**
 * Verify Installation Script
 * Checks that all dependencies and structure are correct
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('================================================');
console.log('DFHA Installation Verification');
console.log('================================================\n');

let errors = 0;
let warnings = 0;

function check(description, fn) {
    try {
        const result = fn();
        if (result === true || result === undefined) {
            console.log(`✓ ${description}`);
        } else {
            console.log(`✗ ${description}: ${result}`);
            errors++;
        }
    } catch (error) {
        console.log(`✗ ${description}: ${error.message}`);
        errors++;
    }
}

function warn(description, fn) {
    try {
        const result = fn();
        if (result === true || result === undefined) {
            console.log(`✓ ${description}`);
        } else {
            console.log(`⚠ ${description}: ${result}`);
            warnings++;
        }
    } catch (error) {
        console.log(`⚠ ${description}: ${error.message}`);
        warnings++;
    }
}

// Check Node.js version
console.log('Checking Node.js environment...');
check('Node.js >= 16.0.0', () => {
    const version = process.version.slice(1).split('.');
    const major = parseInt(version[0]);
    if (major >= 16) return true;
    return `Found ${process.version}, need >= 16.0.0`;
});

// Check npm
check('npm installed', () => {
    try {
        execSync('npm --version', { stdio: 'pipe' });
        return true;
    } catch {
        return 'npm not found in PATH';
    }
});

console.log('\nChecking directory structure...');

const requiredDirs = [
    'src/tracing',
    'src/pattern_mining',
    'src/utils',
    'evaluation',
    'scripts',
    'config',
    'docs',
    'data',
    'results'
];

requiredDirs.forEach(dir => {
    check(`Directory: ${dir}`, () => {
        if (fs.existsSync(path.join(__dirname, '..', dir))) return true;
        return 'not found';
    });
});

console.log('\nChecking required files...');

const requiredFiles = [
    'README.md',
    'LICENSE',
    'package.json',
    '.gitignore',
    'config/hyperparameters.yaml',
    'docs/REPRODUCTION.md',
    'docs/HYPERPARAMETERS.md',
    'docs/CITATION.md',
    'src/utils/Logger.js',
    'src/tracing/ExecutionTraceCollector.js',
    'src/pattern_mining/PatternMiningService.js'
];

requiredFiles.forEach(file => {
    check(`File: ${file}`, () => {
        if (fs.existsSync(path.join(__dirname, '..', file))) return true;
        return 'not found';
    });
});

console.log('\nChecking optional files (from original code)...');

const optionalFiles = [
    'src/workflow_synthesis/WorkflowSynthesizer.js',
    'src/routing/ThompsonSamplingRouter.js',
    'evaluation/domains/DomainTemplates.js',
    'evaluation/baselines/BaselineComparators.js',
    'scripts/generate-synthetic-data.js',
    'docker-compose.yml'
];

optionalFiles.forEach(file => {
    warn(`Optional: ${file}`, () => {
        if (fs.existsSync(path.join(__dirname, '..', file))) return true;
        return 'not found (run copy_remaining_files.sh)';
    });
});

console.log('\nChecking Docker (optional)...');

warn('Docker installed', () => {
    try {
        execSync('docker --version', { stdio: 'pipe' });
        return true;
    } catch {
        return 'Docker not found (needed for local evaluation)';
    }
});

warn('Docker Compose installed', () => {
    try {
        execSync('docker-compose --version', { stdio: 'pipe' });
        return true;
    } catch {
        return 'docker-compose not found (needed for local evaluation)';
    }
});

console.log('\n================================================');

if (errors === 0 && warnings === 0) {
    console.log('✅ All checks passed!');
    console.log('================================================\n');
    console.log('Your DFHA repository is ready!');
    console.log('\nNext steps:');
    console.log('  1. Run: bash copy_remaining_files.sh');
    console.log('  2. Run: node scripts/fix_import_paths.js');
    console.log('  3. Run: npm install');
    console.log('  4. Run: npm run full-poc\n');
    process.exit(0);
} else if (errors === 0) {
    console.log(`⚠ ${warnings} warning(s) found`);
    console.log('================================================\n');
    console.log('Core structure is ready, but some optional files are missing.');
    console.log('Run: bash copy_remaining_files.sh to copy remaining code.\n');
    process.exit(0);
} else {
    console.log(`✗ ${errors} error(s) and ${warnings} warning(s) found`);
    console.log('================================================\n');
    console.log('Please fix the errors above before proceeding.\n');
    process.exit(1);
}
