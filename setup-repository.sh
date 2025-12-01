#!/bin/bash

# Complete Repository Setup Script
# This copies all necessary files and sets up the repository for full replication

set -e

echo "================================================"
echo "DFHA Repository Setup"
echo "================================================"
echo ""

SRC="/Users/kalyanar/Documents/gatech/ieee/code"
DST="/Users/kalyanar/Documents/gatech/ieee/DFHA-Public"

# Check source exists
if [ ! -d "$SRC" ]; then
    echo "❌ Error: Source directory not found: $SRC"
    exit 1
fi

cd "$DST"

echo "Step 1: Copying configuration files..."
cp "$SRC/config.local.js" ./config.local.js 2>/dev/null && echo "  ✓ config.local.js" || echo "  ⚠ config.local.js not found"

echo ""
echo "Step 2: Copying Docker configuration..."
if [ -f "$SRC/docker-compose.yml" ]; then
    cp "$SRC/docker-compose.yml" ./
    echo "  ✓ docker-compose.yml"
elif [ -f "$SRC/docker-compose-fixed.yml" ]; then
    cp "$SRC/docker-compose-fixed.yml" ./docker-compose.yml
    echo "  ✓ docker-compose-fixed.yml (renamed to docker-compose.yml)"
fi

cp "$SRC/elasticmq.conf" ./ 2>/dev/null && echo "  ✓ elasticmq.conf" || echo "  ⚠ elasticmq.conf not found"

echo ""
echo "Step 3: Copying evaluation files..."
mkdir -p evaluation/domains evaluation/baselines
cp "$SRC/evaluation/DomainTemplates.js" ./evaluation/domains/ 2>/dev/null && echo "  ✓ DomainTemplates.js" || echo "  ⚠ DomainTemplates.js not found"
cp "$SRC/evaluation/BaselineComparators.js" ./evaluation/baselines/ 2>/dev/null && echo "  ✓ BaselineComparators.js" || echo "  ⚠ BaselineComparators.js not found"

echo ""
echo "Step 4: Copying scripts..."
cp "$SRC/scripts/generate-synthetic-data.js" ./scripts/ 2>/dev/null && echo "  ✓ generate-synthetic-data.js" || echo "  ⚠ generate-synthetic-data.js not found"
cp "$SRC/scripts/setup-local-tables.js" ./scripts/ 2>/dev/null && echo "  ✓ setup-local-tables.js" || echo "  ⚠ setup-local-tables.js not found"
cp "$SRC/scripts/setup-local-queues.js" ./scripts/ 2>/dev/null && echo "  ✓ setup-local-queues.js" || echo "  ⚠ setup-local-queues.js not found"

echo ""
echo "Step 5: Copying core components..."
mkdir -p src/workflow_synthesis src/routing
cp "$SRC/components/WorkflowSynthesizer.js" ./src/workflow_synthesis/ 2>/dev/null && echo "  ✓ WorkflowSynthesizer.js" || echo "  ⚠ WorkflowSynthesizer.js not found"
cp "$SRC/components/ThompsonSamplingRouter.js" ./src/routing/ 2>/dev/null && echo "  ✓ ThompsonSamplingRouter.js" || echo "  ⚠ ThompsonSamplingRouter.js not found"

echo ""
echo "Step 6: Creating Docker data directory..."
mkdir -p localstack-data
chmod 777 localstack-data 2>/dev/null || sudo chmod 777 localstack-data
echo "  ✓ localstack-data directory created"

echo ""
echo "Step 7: Creating data directories..."
mkdir -p data/synthetic_traces
mkdir -p results
mkdir -p logs
echo "  ✓ Data directories created"

echo ""
echo "================================================"
echo "✅ Repository setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Start Docker services:"
echo "   docker-compose up -d"
echo ""
echo "3. Wait for services:"
echo "   npm run wait"
echo ""
echo "4. Setup infrastructure:"
echo "   npm run setup:infrastructure"
echo ""
echo "5. Generate data:"
echo "   npm run generate:data"
echo ""
echo "6. Run evaluation:"
echo "   npm run evaluate"
echo ""
echo "Or run everything at once:"
echo "   npm run full-poc"
echo ""
