#!/bin/bash

# Script to copy remaining files from existing code to new DFHA-Public structure
# Run this from the DFHA-Public directory

set -e  # Exit on error

SRC="/Users/kalyanar/Documents/gatech/ieee/code"
DST="/Users/kalyanar/Documents/gatech/ieee/DFHA-Public"

echo "================================================"
echo "Copying remaining files to DFHA-Public structure"
echo "================================================"
echo ""
echo "Source: $SRC"
echo "Destination: $DST"
echo ""

# Create all necessary directories
echo "Creating directories..."
mkdir -p "$DST/src/workflow_synthesis"
mkdir -p "$DST/src/routing"
mkdir -p "$DST/evaluation/domains"
mkdir -p "$DST/evaluation/baselines"
mkdir -p "$DST/scripts"
mkdir -p "$DST/data/synthetic_traces"
mkdir -p "$DST/results"

# Copy core components
echo ""
echo "Copying core components..."

if [ -f "$SRC/components/WorkflowSynthesizer.js" ]; then
    cp "$SRC/components/WorkflowSynthesizer.js" "$DST/src/workflow_synthesis/"
    echo "  ✓ WorkflowSynthesizer.js"
else
    echo "  ⚠ WorkflowSynthesizer.js not found"
fi

if [ -f "$SRC/components/ThompsonSamplingRouter.js" ]; then
    cp "$SRC/components/ThompsonSamplingRouter.js" "$DST/src/routing/"
    echo "  ✓ ThompsonSamplingRouter.js"
else
    echo "  ⚠ ThompsonSamplingRouter.js not found"
fi

# Copy evaluation files
echo ""
echo "Copying evaluation files..."

if [ -f "$SRC/evaluation/DomainTemplates.js" ]; then
    cp "$SRC/evaluation/DomainTemplates.js" "$DST/evaluation/domains/"
    echo "  ✓ DomainTemplates.js"
else
    echo "  ⚠ DomainTemplates.js not found"
fi

if [ -f "$SRC/evaluation/BaselineComparators.js" ]; then
    cp "$SRC/evaluation/BaselineComparators.js" "$DST/evaluation/baselines/"
    echo "  ✓ BaselineComparators.js"
else
    echo "  ⚠ BaselineComparators.js not found"
fi

# Copy scripts
echo ""
echo "Copying scripts..."

if [ -f "$SRC/scripts/generate-synthetic-data.js" ]; then
    cp "$SRC/scripts/generate-synthetic-data.js" "$DST/scripts/"
    echo "  ✓ generate-synthetic-data.js"
else
    echo "  ⚠ generate-synthetic-data.js not found"
fi

if [ -f "$SRC/scripts/setup-local-tables.js" ]; then
    cp "$SRC/scripts/setup-local-tables.js" "$DST/scripts/"
    echo "  ✓ setup-local-tables.js"
else
    echo "  ⚠ setup-local-tables.js not found"
fi

if [ -f "$SRC/scripts/setup-local-queues.js" ]; then
    cp "$SRC/scripts/setup-local-queues.js" "$DST/scripts/"
    echo "  ✓ setup-local-queues.js"
else
    echo "  ⚠ setup-local-queues.js not found"
fi

# Copy Docker configuration files
echo ""
echo "Copying Docker configuration..."

if [ -f "$SRC/docker-compose.yml" ]; then
    cp "$SRC/docker-compose.yml" "$DST/"
    echo "  ✓ docker-compose.yml"
elif [ -f "$SRC/docker-compose-fixed.yml" ]; then
    cp "$SRC/docker-compose-fixed.yml" "$DST/docker-compose.yml"
    echo "  ✓ docker-compose-fixed.yml (renamed to docker-compose.yml)"
else
    echo "  ⚠ docker-compose.yml not found"
fi

if [ -f "$SRC/elasticmq.conf" ]; then
    cp "$SRC/elasticmq.conf" "$DST/"
    echo "  ✓ elasticmq.conf"
else
    echo "  ⚠ elasticmq.conf not found"
fi

# Copy any config files
echo ""
echo "Copying configuration files..."

if [ -f "$SRC/config.local.js" ]; then
    cp "$SRC/config.local.js" "$DST/config/"
    echo "  ✓ config.local.js"
else
    echo "  ⚠ config.local.js not found (optional)"
fi

# Copy README content if exists
if [ -f "$SRC/README.md" ]; then
    echo ""
    echo "  ℹ Original README.md found - you may want to merge useful content"
fi

echo ""
echo "================================================"
echo "✅ File copying complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Run: node scripts/fix_import_paths.js (to fix import statements)"
echo "2. Review copied files for any manual adjustments needed"
echo "3. Test with: npm install && npm run verify"
echo ""
