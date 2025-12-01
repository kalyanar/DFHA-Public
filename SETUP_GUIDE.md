# Complete Setup Guide

This guide will take you from zero to a fully working DFHA repository ready for publication.

## 🎯 Overview

You've received a pre-configured DFHA repository structure. This guide completes the setup in **3 simple steps**.

## ✅ Step 1: Copy Remaining Code Files (5 minutes)

Run the automated copy script:

```bash
cd /Users/kalyanar/Documents/gatech/ieee/DFHA-Public

# Make the script executable
chmod +x copy_remaining_files.sh

# Run it
bash copy_remaining_files.sh
```

**What this does**:
- Copies WorkflowSynthesizer.js, ThompsonSamplingRouter.js
- Copies DomainTemplates.js, BaselineComparators.js
- Copies all scripts (generate-synthetic-data.js, setup scripts)
- Copies Docker configuration files

**Expected output**:
```
================================================
Copying remaining files to DFHA-Public structure
================================================

Creating directories...

Copying core components...
  ✓ WorkflowSynthesizer.js
  ✓ ThompsonSamplingRouter.js

Copying evaluation files...
  ✓ DomainTemplates.js
  ✓ BaselineComparators.js

... (more files)

✅ File copying complete!
================================================
```

## ✅ Step 2: Fix Import Paths (2 minutes)

Run the automated path fixing script:

```bash
node scripts/fix_import_paths.js
```

**What this does**:
- Updates all `require('./utils/Logger')` → `require('../utils/Logger')`
- Fixes paths in all copied files automatically
- No manual editing needed!

**Expected output**:
```
================================================
Fixing import paths in copied files
================================================

✓ Fixed src/workflow_synthesis/WorkflowSynthesizer.js
✓ Fixed src/routing/ThompsonSamplingRouter.js
○ No changes needed for evaluation/domains/DomainTemplates.js
...

✅ Import path fixing complete!
================================================
```

## ✅ Step 3: Verify Installation (1 minute)

Run the verification script:

```bash
node scripts/verify-installation.js
```

**What this checks**:
- Node.js version (>= 16.0.0)
- Directory structure
- All required files present
- Optional files (from copied code)
- Docker availability

**Expected output**:
```
================================================
DFHA Installation Verification
================================================

Checking Node.js environment...
✓ Node.js >= 16.0.0
✓ npm installed

Checking directory structure...
✓ Directory: src/tracing
✓ Directory: src/pattern_mining
... (all directories)

Checking required files...
✓ File: README.md
✓ File: LICENSE
✓ File: package.json
... (all files)

Checking optional files...
✓ Optional: src/workflow_synthesis/WorkflowSynthesizer.js
✓ Optional: src/routing/ThompsonSamplingRouter.js
... (all optional files)

================================================
✅ All checks passed!
================================================

Your DFHA repository is ready!
```

## 🚀 Quick Test (Optional - 5 minutes)

Test that everything works:

```bash
# Install Node dependencies
npm install

# Verify one more time
npm run verify

# Quick smoke test (if you have Docker)
npm run docker:up
npm run wait
npm run setup:infrastructure
npm run generate:data -- --quick
npm run evaluate -- --quick
```

## 📦 You're Done!

Your repository is now **100% complete** and ready for:

### Option A: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: DFHA reference implementation"
git remote add origin https://github.com/YOUR_USERNAME/DFHA-Public.git
git branch -M main
git push -u origin main
```

### Option B: Create Archive for Reviewers

```bash
cd ..
tar -czf DFHA-Public.tar.gz DFHA-Public/
```

### Option C: Full Evaluation

```bash
npm run full-poc
```

This runs the complete evaluation (~60 minutes):
1. Starts Docker services
2. Generates synthetic data (400 traces)
3. Runs all 4 approaches
4. Computes statistics
5. Generates LaTeX tables

Results appear in `results/`:
- `evaluation_results.json` - Full data
- `main_results.csv` - Table II
- `table2_main_results.tex` - LaTeX for paper
- `confidence_intervals.json` - Statistical analysis

## 📝 What You Have Now

### Core Implementation
✅ ExecutionTraceCollector.js - Trace collection (Section 4.2)
✅ PatternMiningService.js - Algorithm 1 (DTW, consensus extraction)
✅ WorkflowSynthesizer.js - Workflow generation (Section 4.3)
✅ ThompsonSamplingRouter.js - Intelligent routing (Section 5.1)

### Evaluation Framework
✅ 4 baseline approaches (Deterministic-only, LLM-only, Simple Cache, DFHA)
✅ 10 domain templates (IT Support, Financial, Healthcare, E-commerce)
✅ Synthetic data generator (50 traces/pattern, variations, noise)
✅ Evaluation harness (phased: warmup → learning → steady state)
✅ Statistical analysis (bootstrap CIs, t-tests, effect sizes)
✅ LaTeX table generation (Tables II & III)

### Documentation
✅ README.md - Comprehensive overview
✅ REPRODUCTION.md - Step-by-step reproduction guide
✅ HYPERPARAMETERS.md - All parameters documented
✅ CITATION.md - All citation formats
✅ NEXT_STEPS.md - Publishing guide
✅ This SETUP_GUIDE.md

### Configuration
✅ package.json - All npm scripts configured
✅ hyperparameters.yaml - All paper parameters
✅ .gitignore - Proper exclusions
✅ LICENSE - MIT license

## 🎓 For Your IEEE Access Paper

### Data Availability Statement

Add this to your paper:

> **Data Availability**: The code and evaluation data supporting this research are openly available at https://github.com/YOUR_USERNAME/DFHA-Public and archived at Zenodo (DOI: 10.5281/zenodo.XXXXXXX) under the MIT License. The repository includes complete implementations of all algorithms, baseline approaches, synthetic data generation, and reproduction instructions.

### In Your References

```bibtex
@software{kalyanaraman2025dfha_code,
  author = {Kalyanaraman, Gopal and Dialani, Vijay},
  title = {DFHA: Reference Implementation},
  year = {2025},
  publisher = {GitHub},
  url = {https://github.com/YOUR_USERNAME/DFHA-Public}
}
```

## ❓ Troubleshooting

### "Module not found" errors

```bash
# Re-run import path fixing
node scripts/fix_import_paths.js

# Or manually update the require() paths
```

### Files not copied

```bash
# Check original code location
ls /Users/kalyanar/Documents/gatech/ieee/code/

# Re-run copy script
bash copy_remaining_files.sh
```

### Docker issues

```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs

# Restart
npm run docker:down && npm run docker:up
```

## 🎉 Success Checklist

Before publishing, verify:

- [x] All core files present (`verify-installation.js` passes)
- [x] Import paths fixed (no "Module not found" errors)
- [x] npm install works
- [ ] git repository initialized
- [ ] Pushed to GitHub
- [ ] Repository set to Public
- [ ] Zenodo DOI obtained
- [ ] Paper updated with links
- [ ] README badges updated

## 📧 Need Help?

If you encounter issues:

1. **Check verification**: Run `node scripts/verify-installation.js`
2. **Review errors**: Most issues are import path or missing file related
3. **Check original code**: Ensure `/Users/kalyanar/Documents/gatech/ieee/code/` exists
4. **Re-run scripts**: Copy and fix scripts are idempotent (safe to re-run)

## 🚀 You're Ready!

Your DFHA code is now publication-ready.

**Next**: Follow `NEXT_STEPS.md` for GitHub and Zenodo publishing.

---

**Estimated total setup time**: 10-15 minutes

**Questions?** Check the documentation files or run the verification scripts.
