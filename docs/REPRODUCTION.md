# Reproducing Paper Results

This document provides step-by-step instructions to reproduce all tables, figures, and results from the IEEE Access paper "Deterministic-First Hybrid Agents: Progressive Workflow Synthesis from Runtime Execution Traces".

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Environment Setup](#environment-setup)
3. [Reproducing Main Results (Table II)](#reproducing-table-ii)
4. [Reproducing Domain Comparison (Table III)](#reproducing-table-iii)
5. [Reproducing Coverage Progression (Figure 3)](#reproducing-figure-3)
6. [Reproducing Cost Analysis (Figure 4)](#reproducing-figure-4)
7. [Statistical Analysis](#statistical-analysis)
8. [Expected Runtime](#expected-runtime)
9. [Troubleshooting](#troubleshooting)

## 💻 System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 10 GB free space
- **OS**: macOS, Linux, or Windows (with WSL2)

### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Disk**: 20 GB free space

### Software Dependencies
- **Node.js**: >= 16.0.0 (check with `node --version`)
- **npm**: >= 7.0.0 (check with `npm --version`)
- **Docker**: >= 20.10.0 (check with `docker --version`)
- **Docker Compose**: >= 1.29.0 (check with `docker-compose --version`)

## 🔧 Environment Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/DFHA-Public.git
cd DFHA-Public

# Install Node.js dependencies
npm install

# Verify installation
npm run verify
```

### Step 2: Start Infrastructure

```bash
# Start LocalStack (DynamoDB) and ElasticMQ (SQS)
npm run docker:up

# Wait for services to be ready (automatic health check)
npm run wait

# Verify services are running
curl http://localhost:4566/_localstack/health
curl http://localhost:9325
```

### Step 3: Initialize Database

```bash
# Create DynamoDB tables
npm run setup:tables

# Create SQS queues
npm run setup:queues

# Verify setup
npm run verify:infrastructure
```

## 📊 Reproducing Table II: Main Results

**Paper Reference**: Table II (page 7) - "Overall Performance Comparison (Steady State)"

### Generate Data

```bash
# Generate synthetic traces for all domains
npm run generate:data

# This creates:
# - data/synthetic_traces/it_support.json
# - data/synthetic_traces/financial.json
# - data/synthetic_traces/healthcare.json
# - data/synthetic_traces/ecommerce.json
```

### Run Evaluation

```bash
# Run full evaluation with all 4 approaches
npm run evaluate

# This compares:
# 1. Deterministic-Only Baseline
# 2. LLM-Only Baseline
# 3. Simple Cache Baseline
# 4. DFHA (Dynamic Synthesis)
```

### Generate Results

```bash
# Generate LaTeX table
npm run generate:table2

# Output: results/table2_main_results.tex
```

### Expected Output

```latex
\begin{table*}[h!]
\centering
\caption{Overall Performance Comparison (Steady State with 95\% Confidence Intervals)}
\label{tab:main_results}
\begin{tabular}{|l|c|c|c|c|}
\hline
\textbf{Approach} & \textbf{Success Rate} & \textbf{Avg Latency (ms)} &
\textbf{Avg Cost (\$/query)} & \textbf{LLM Reduction} \\
\hline
Deterministic-only & 0.0\% $\pm$ 0\% & 10 $\pm$ 0 & \$0.000 $\pm$ 0 & 100\% \\
LLM-only & 95.0\% $\pm$ 3.4\% & 1,988 $\pm$ 142 & \$0.0426 $\pm$ 0.002 & 0\% \\
Simple Cache & 97.5\% $\pm$ 2.4\% & 1,378 $\pm$ 118 & \$0.0290 $\pm$ 0.003 &
33.8\% $\pm$ 4.2\% \\
\textbf{DFHA} & \textbf{97.5\% $\pm$ 2.4\%} & \textbf{696 $\pm$ 89} &
\textbf{\$0.0125 $\pm$ 0.002} & \textbf{71.9\% $\pm$ 3.1\%} \\
\hline
\end{tabular}
\end{table*}
```

### Validation Criteria

✅ **Success Rate**: DFHA should achieve 97-98% (comparable to baselines)
✅ **Latency**: DFHA should be 60-70% faster than LLM-only
✅ **Cost**: DFHA should reduce cost by 70-75%
✅ **LLM Reduction**: DFHA should achieve 70-75% reduction

## 📈 Reproducing Table III: Domain Comparison

**Paper Reference**: Table III (page 8) - "Performance by Domain"

### Run Domain-Specific Evaluation

```bash
# Run evaluation with domain breakdown
npm run evaluate:domains

# This runs separate evaluations for:
# - IT Support (3 patterns)
# - Financial Services (3 patterns)
# - Healthcare (3 patterns)
# - E-commerce (3 patterns)
```

### Generate Table III

```bash
# Generate LaTeX table
npm run generate:table3

# Output: results/table3_domain_comparison.tex
```

### Expected Output

Each domain should show:
- **Deterministic Coverage**: 60-80% after learning phase
- **LLM Reduction**: 65-85% depending on pattern diversity
- **Success Rate**: ≥ 95% across all domains

## 📉 Reproducing Figure 3: Coverage Progression

**Paper Reference**: Figure 3 (page 9) - "Deterministic Coverage Over Time"

### Generate Progression Data

```bash
# Run phased evaluation (warmup → learning → steady state)
npm run evaluate:phases

# This generates timestamped coverage data
```

### Plot Coverage Progression

```bash
# Generate plot data
npm run generate:figure3

# Output: results/figure3_coverage_progression.json

# Optional: Generate PNG using provided Python script
python3 scripts/plot_figure3.py
# Output: results/figure3_coverage_progression.png
```

### Expected Pattern

The plot should show:
1. **Warmup Phase** (0-10 traces): 0% coverage (all LLM)
2. **Learning Phase** (10-60 traces): Rapid growth to 40-60% coverage
3. **Steady State** (60+ traces): Stabilizes at 70-80% coverage

## 💰 Reproducing Figure 4: Cost Analysis

**Paper Reference**: Figure 4 (page 10) - "Cumulative Cost Comparison"

### Generate Cost Data

```bash
# Run cost-focused evaluation
npm run evaluate:cost

# This tracks cumulative cost for all approaches
```

### Plot Cost Comparison

```bash
# Generate plot data
npm run generate:figure4

# Output: results/figure4_cost_analysis.json

# Optional: Generate PNG
python3 scripts/plot_figure4.py
# Output: results/figure4_cost_analysis.png
```

### Expected Pattern

The plot should show:
- **LLM-Only**: Linear growth (~$0.043/query)
- **Simple Cache**: Sublinear growth after warmup (~$0.029/query)
- **DFHA**: Steep initial learning cost, then minimal growth (~$0.0125/query)
- **Break-Even Point**: DFHA becomes cheaper than Simple Cache after ~56 queries

## 📊 Statistical Analysis

### Confidence Intervals

All confidence intervals are computed using bootstrap resampling (1000 iterations).

```bash
# Compute 95% confidence intervals
npm run analyze:confidence

# Output: results/confidence_intervals.json
```

### Statistical Significance Tests

```bash
# Run paired t-tests comparing DFHA vs baselines
npm run analyze:significance

# Output: results/statistical_tests.json
```

Expected p-values:
- **DFHA vs LLM-Only (latency)**: p < 0.001 ✅ Highly significant
- **DFHA vs Simple Cache (cost)**: p < 0.01 ✅ Significant
- **DFHA vs LLM-Only (success rate)**: p > 0.05 ✅ Not significantly different (good!)

### Effect Sizes

```bash
# Compute Cohen's d effect sizes
npm run analyze:effect-sizes

# Output: results/effect_sizes.json
```

## ⏱️ Expected Runtime

Running the full reproduction:

| Step | Estimated Time | Notes |
|------|---------------|-------|
| Environment Setup | 5-10 minutes | Includes Docker download |
| Data Generation | 2-3 minutes | Generates ~400 synthetic traces |
| Main Evaluation | 10-15 minutes | Runs 4 approaches × 100 queries |
| Domain Evaluation | 15-20 minutes | Detailed per-domain analysis |
| Statistical Analysis | 5 minutes | Bootstrap resampling |
| **Total** | **40-60 minutes** | Full end-to-end reproduction |

### Quick Validation (for reviewers)

If you want to quickly validate the approach works:

```bash
# Run reduced evaluation (10 traces per domain instead of 100)
npm run evaluate:quick

# Expected runtime: ~5 minutes
```

## 🔍 Troubleshooting

### Issue: Docker services won't start

```bash
# Check Docker is running
docker ps

# If not running, start Docker daemon

# Restart services
npm run docker:down
npm run docker:up
```

### Issue: DynamoDB table creation fails

```bash
# Check LocalStack is healthy
curl http://localhost:4566/_localstack/health

# Manually create tables
npm run setup:tables --force

# Verify tables exist
aws dynamodb list-tables --endpoint-url http://localhost:4566 --region us-east-1
```

### Issue: Evaluation produces different numbers

**This is expected!** The evaluation uses:
- Random sampling in Thompson Sampling
- Random variations in synthetic data generation
- Random train/test splits

Numbers should be within:
- ±5% for success rates
- ±10% for latency
- ±10% for cost
- ±8% for LLM reduction

For deterministic results, set random seed:

```bash
export RANDOM_SEED=42
npm run evaluate
```

### Issue: Out of memory during evaluation

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run evaluate
```

## 🎯 Validation Checklist

Before submitting results, verify:

- [ ] Table II numbers match paper ±10%
- [ ] Success rates ≥ 95% for all approaches except Deterministic-Only
- [ ] DFHA achieves 60-80% LLM reduction
- [ ] Coverage progression shows clear learning curve
- [ ] Confidence intervals are non-overlapping for key metrics
- [ ] Statistical tests show p < 0.05 for latency/cost comparisons
- [ ] All LaTeX tables compile without errors

## 📤 Sharing Results

After running evaluation, share:

```bash
# Package all results
npm run package:results

# Output: results/DFHA_reproduction_YYYY-MM-DD.tar.gz

# Upload to Zenodo or include in supplementary materials
```

## 💡 Tips for Paper Reviewers

If you're reviewing this paper and want to quickly validate claims:

1. **Quick Start** (5 minutes):
   ```bash
   npm run full-poc -- --quick
   ```

2. **Focus on Main Claims**:
   - Check Table II (main results)
   - Verify LLM reduction is substantial (>60%)
   - Confirm success rate parity with baselines

3. **Statistical Rigor**:
   - Ensure confidence intervals are reported
   - Verify statistical tests are appropriate
   - Check sample sizes are adequate (n≥40)

## 📞 Support

If you encounter issues reproducing results:

1. Check this document first
2. Review [GitHub Issues](https://github.com/your-username/DFHA-Public/issues)
3. Contact authors: [email@gatech.edu]

---

**Happy reproducing!** 🎉

For questions or clarifications, please open an issue on GitHub.
