# Hyperparameters Documentation

This document provides comprehensive documentation of all hyperparameters used in the DFHA system, including their values from the paper, sensitivity analysis, and tuning guidelines.

## 📊 Overview

All hyperparameters are defined in `config/hyperparameters.yaml` and can be overridden via environment variables or command-line arguments.

## 🎯 Core Algorithm Parameters

### Pattern Mining Parameters

#### `θ_align` - Alignment Threshold
- **Paper Value**: 0.7
- **Range**: [0.5, 0.9]
- **Type**: Float
- **Description**: Minimum alignment score required for sequence alignment to be considered valid. Based on Dynamic Time Warping (DTW) similarity.
- **Impact**: Higher values → stricter alignment → fewer patterns mined
- **Sensitivity**: Medium (±0.1 changes pattern count by ~15%)

```yaml
pattern_mining:
  alignment_threshold: 0.7
```

**Tuning Guidance**:
- Increase (0.75-0.8) for highly structured domains (financial, healthcare)
- Decrease (0.6-0.65) for diverse, less structured domains

#### `θ_consensus` - Consensus Threshold
- **Paper Value**: 0.8
- **Range**: [0.6, 0.95]
- **Type**: Float
- **Description**: Minimum frequency a task must appear at a position to be included in consensus pattern.
- **Impact**: Higher values → stricter consensus → shorter patterns
- **Sensitivity**: High (±0.1 changes avg pattern length by ~25%)

```yaml
pattern_mining:
  consensus_threshold: 0.8
```

**Tuning Guidance**:
- Increase (0.85-0.9) for safety-critical domains (healthcare, finance)
- Decrease (0.7-0.75) for exploratory or diverse workloads

#### `θ_confidence` - Synthesis Confidence Threshold
- **Paper Value**: 0.75
- **Range**: [0.6, 0.95]
- **Type**: Float
- **Description**: Minimum confidence score required to synthesize and deploy a workflow.
- **Impact**: Higher values → fewer synthesized workflows → more LLM calls
- **Sensitivity**: High (±0.1 changes synthesis rate by ~30%)

```yaml
pattern_mining:
  confidence_threshold: 0.75
```

**Tuning Guidance**:
- Increase (0.8-0.85) when failure cost is high
- Decrease (0.65-0.7) to maximize LLM reduction at cost of occasional failures

#### `min_traces` - Minimum Traces for Pattern Mining
- **Paper Value**: 3
- **Range**: [2, 10]
- **Type**: Integer
- **Description**: Minimum number of successful execution traces required before attempting pattern mining.
- **Impact**: Lower values → faster pattern discovery → less reliable patterns
- **Sensitivity**: Medium (doubling this roughly halves synthesis rate)

```yaml
pattern_mining:
  min_traces_required: 3
```

**Tuning Guidance**:
- Increase (5-7) for production deployment
- Decrease (2) for rapid prototyping

## 🔀 Thompson Sampling Parameters

### Prior Distribution

#### `α_prior` and `β_prior` - Beta Distribution Priors
- **Paper Value**: α = 1, β = 1 (uniform prior)
- **Range**: [0.5, 10]
- **Type**: Float
- **Description**: Prior parameters for Beta distribution in Thompson Sampling. α controls success bias, β controls failure bias.

```yaml
thompson_sampling:
  prior_alpha: 1.0
  prior_beta: 1.0
```

**Alternative Priors**:
- **Optimistic**: α = 2, β = 1 (favors exploration)
- **Pessimistic**: α = 1, β = 2 (conservative)
- **Informative**: α = 5, β = 2 (assumes 71% success rate a priori)

#### `exploration_bonus` - Exploration Incentive
- **Paper Value**: 0.0 (pure Thompson Sampling)
- **Range**: [0.0, 0.5]
- **Type**: Float
- **Description**: Additional bonus for less-explored routes (optional UCB-style exploration).

```yaml
thompson_sampling:
  exploration_bonus: 0.0
```

## 🗄️ Data Management Parameters

### Trace Storage

#### `trace_retention_days` - Trace Retention Period
- **Paper Value**: 30 days
- **Type**: Integer
- **Description**: Number of days to retain execution traces in DynamoDB.
- **Cost Impact**: 30 days at 10K queries/day ≈ $3.75/year

```yaml
storage:
  trace_retention_days: 30
```

#### `max_traces_per_fingerprint` - Trace Limit
- **Paper Value**: 10
- **Range**: [5, 50]
- **Type**: Integer
- **Description**: Maximum number of traces to keep per question fingerprint.

```yaml
storage:
  max_traces_per_fingerprint: 10
```

## 📏 Evaluation Parameters

### Synthetic Data Generation

#### `traces_per_pattern` - Traces per Domain Pattern
- **Paper Value**: 50
- **Range**: [10, 200]
- **Type**: Integer
- **Description**: Number of synthetic traces to generate per workflow pattern.

```yaml
evaluation:
  traces_per_pattern: 50
```

#### `variation_rate` - Trace Variation Rate
- **Paper Value**: 0.3 (30%)
- **Range**: [0.1, 0.5]
- **Type**: Float
- **Description**: Probability of adding variations to baseline execution sequence.

```yaml
evaluation:
  variation_rate: 0.3
```

#### `noise_rate` - Trace Noise Rate
- **Paper Value**: 0.1 (10%)
- **Range**: [0.0, 0.3]
- **Type**: Float
- **Description**: Probability of adding noise (retries, delays) to execution.

```yaml
evaluation:
  noise_rate: 0.1
```

### Phases

#### `warmup_traces` - Warmup Phase Size
- **Paper Value**: 10
- **Type**: Integer
- **Description**: Number of initial traces in warmup phase (no pattern mining).

```yaml
evaluation:
  warmup_traces: 10
```

#### `learning_phase_fraction` - Learning Phase Fraction
- **Paper Value**: 0.5 (50%)
- **Type**: Float
- **Description**: Fraction of total traces allocated to learning phase.

```yaml
evaluation:
  learning_phase_fraction: 0.5
```

## 💰 Cost Parameters

### LLM Pricing

#### `input_token_cost` - GPT-4 Input Token Cost
- **Paper Value**: $0.03 per 1K tokens
- **Type**: Float (USD per 1K tokens)
- **Description**: Cost for input tokens (GPT-4 pricing as of 2024).

```yaml
cost:
  input_token_cost_per_1k: 0.03
```

#### `output_token_cost` - GPT-4 Output Token Cost
- **Paper Value**: $0.06 per 1K tokens
- **Type**: Float (USD per 1K tokens)

```yaml
cost:
  output_token_cost_per_1k: 0.06
```

### Infrastructure Costs

#### `lambda_cost_per_invocation` - Lambda Cost
- **Paper Value**: $0.0000002 per invocation
- **Type**: Float (USD)

```yaml
cost:
  lambda_cost_per_invocation: 0.0000002
```

#### `dynamodb_read_cost` - DynamoDB Read Cost
- **Paper Value**: $0.00025 per read unit
- **Type**: Float (USD)

```yaml
cost:
  dynamodb_read_cost_per_unit: 0.00025
```

## 🔬 Sensitivity Analysis

### Impact on Key Metrics

| Parameter | ±10% Change | Success Rate Impact | LLM Reduction Impact | Latency Impact |
|-----------|------------|---------------------|---------------------|----------------|
| θ_align | 0.63-0.77 | ±1.2% | ±12% | ±8% |
| θ_consensus | 0.72-0.88 | ±2.5% | ±18% | ±15% |
| θ_confidence | 0.675-0.825 | ±3.8% | ±25% | ±20% |
| min_traces | 2-4 | ±1.5% | ±10% | ±5% |

### Robust Configurations

**Conservative (Production)**:
```yaml
pattern_mining:
  alignment_threshold: 0.75
  consensus_threshold: 0.85
  confidence_threshold: 0.80
  min_traces_required: 5
```

**Balanced (Paper)**:
```yaml
pattern_mining:
  alignment_threshold: 0.7
  consensus_threshold: 0.8
  confidence_threshold: 0.75
  min_traces_required: 3
```

**Aggressive (Research)**:
```yaml
pattern_mining:
  alignment_threshold: 0.65
  consensus_threshold: 0.75
  confidence_threshold: 0.70
  min_traces_required: 2
```

## 🎛️ Environment Variables

Override any parameter via environment variables:

```bash
# Override alignment threshold
export DFHA_ALIGNMENT_THRESHOLD=0.75

# Override min traces
export DFHA_MIN_TRACES=5

# Override confidence threshold
export DFHA_CONFIDENCE_THRESHOLD=0.80

npm run evaluate
```

## 🧪 Hyperparameter Tuning Guide

### Step 1: Baseline Evaluation

```bash
# Run with paper defaults
npm run evaluate

# Record baseline metrics
```

### Step 2: Grid Search

```bash
# Run grid search over key parameters
npm run tune:grid-search

# Output: results/hyperparameter_tuning.json
```

### Step 3: Sensitivity Analysis

```bash
# Analyze sensitivity of each parameter
npm run analyze:sensitivity

# Output: results/sensitivity_analysis.json
```

### Step 4: Validation

```bash
# Validate best configuration on held-out data
npm run evaluate --config config/tuned_hyperparameters.yaml
```

## 📊 Recommended Settings by Domain

### IT Support / Observability
```yaml
pattern_mining:
  alignment_threshold: 0.7    # Moderate diversity
  consensus_threshold: 0.8    # Standard
  confidence_threshold: 0.75  # Balanced
  min_traces_required: 3
```

### Financial Services
```yaml
pattern_mining:
  alignment_threshold: 0.75   # Stricter (more structure)
  consensus_threshold: 0.85   # High confidence
  confidence_threshold: 0.80  # Safety-critical
  min_traces_required: 5      # More data
```

### Healthcare
```yaml
pattern_mining:
  alignment_threshold: 0.75   # Strict
  consensus_threshold: 0.85   # Very high confidence
  confidence_threshold: 0.85  # Maximum safety
  min_traces_required: 7      # Robust patterns
```

### E-commerce
```yaml
pattern_mining:
  alignment_threshold: 0.65   # More permissive (diverse flows)
  consensus_threshold: 0.75   # Lower threshold
  confidence_threshold: 0.70  # Optimize for LLM reduction
  min_traces_required: 3
```

## 🔗 Cross-References

- **Implementation**: See `src/pattern_mining/PatternMiningService.js` for how parameters are used
- **Paper Justification**: Section 6.1 "Hyperparameter Selection"
- **Ablation Studies**: See paper Section 6.4 for ablation analysis

## 📝 Complete Configuration File

See `config/hyperparameters.yaml` for the complete, commented configuration file with all parameters and their default values.

---

**Questions?** See [REPRODUCTION.md](./REPRODUCTION.md) or open an issue on GitHub.
