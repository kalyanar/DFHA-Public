# DFHA: Deterministic-First Hybrid Agents with Dynamic Workflow Synthesis

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Paper](https://img.shields.io/badge/Paper-IEEE%20Access-blue)](https://ieeexplore.ieee.org)

> **Official Implementation**: "Deterministic-First Hybrid Agents: Progressive Workflow Synthesis from Runtime Execution Traces"
> Gopal Kalyanaraman (Georgia Tech) and Vijay K. Madisetti (Georgia Tech)
> submitted for review in IEEE Access, 2025

## 📖 Overview

**DFHA** is a novel agent architecture that progressively learns from LLM-driven execution traces to synthesize deterministic workflows at runtime. Unlike traditional approaches that rely entirely on LLMs or require manual workflow authoring, DFHA automatically mines execution patterns and generates reusable deterministic workflows, achieving:

- **71.9% reduction** in LLM calls compared to pure LLM approaches
- **65% lower latency** (696ms vs 1,988ms)
- **71% cost reduction** ($0.0125 vs $0.0426 per query)
- **97.5% success rate** maintained across all execution modes

## 🏗️ Architecture

DFHA consists of four core components:

### 1. **Execution Trace Collector**
Captures comprehensive execution traces including:
- Task sequences and dependencies
- Input/output schemas
- Data flow patterns
- Decision points and guard conditions
- Performance metrics (latency, cost, success rate)

### 2. **Pattern Mining Service**
Implements Algorithm 1 from the paper:
- **Multiple Sequence Alignment**: Uses Dynamic Time Warping to align execution traces
- **Consensus Extraction**: Identifies common task sequences (θ_consensus = 0.8)
- **Variable Region Identification**: Detects parameterizable fields
- **Guard Condition Mining**: Learns branching logic

### 3. **Workflow Synthesizer**
Converts mined patterns into executable workflows:
- Generates deterministic state machines
- Creates input/output contracts
- Validates workflow correctness
- Compiles to executable format

### 4. **Thompson Sampling Router**
Intelligently routes queries between:
- **Deterministic workflows** (predefined, manually authored)
- **Synthesized workflows** (automatically generated from traces)
- **LLM fallback** (for unknown queries)

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **Docker** and **Docker Compose** (for local evaluation)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/DFHA-Public.git
cd DFHA-Public

# Install dependencies
npm install
```

### Run the POC Evaluation

This implementation includes a complete proof-of-concept that validates all paper results using LocalStack (DynamoDB) and ElasticMQ (SQS).

```bash
# Start infrastructure (LocalStack + ElasticMQ)
npm run docker:up

# Wait for services to be ready
npm run wait

# Setup infrastructure (create tables and queues)
npm run setup:infrastructure

# Generate synthetic evaluation data
npm run generate:data

# Run full evaluation
npm run evaluate

# Analyze results and generate LaTeX tables
npm run analyze
```

Or run everything in one command:

```bash
npm run full-poc
```

## 📊 Reproducing Paper Results

See [REPRODUCTION.md](./docs/REPRODUCTION.md) for detailed step-by-step instructions to reproduce all tables and figures from the paper.

Key results files generated:
- `results/main_results.csv` - Table II from paper
- `results/domain_comparison.csv` - Table III from paper
- `results/coverage_progression.json` - Figure 3 data
- `results/latex_tables.tex` - Ready-to-use LaTeX tables

## 📁 Repository Structure

```
DFHA-Public/
├── src/
│   ├── tracing/
│   │   └── ExecutionTraceCollector.js    # Trace collection (Section 4.2)
│   ├── pattern_mining/
│   │   └── PatternMiningService.js        # Algorithm 1 implementation
│   ├── workflow_synthesis/
│   │   └── WorkflowSynthesizer.js         # Workflow generation (Section 4.3)
│   └── routing/
│       └── ThompsonSamplingRouter.js      # Intelligent routing (Section 5.1)
│
├── evaluation/
│   ├── domains/
│   │   └── DomainTemplates.js             # 10 domain templates
│   ├── baselines/
│   │   └── BaselineComparators.js         # All 4 baseline approaches
│   └── run_evaluation.js                  # Main evaluation harness
│
├── scripts/
│   ├── setup_infrastructure.js            # DynamoDB/SQS setup
│   └── generate_synthetic_data.js         # Synthetic trace generation
│
├── config/
│   └── hyperparameters.yaml               # All paper hyperparameters
│
├── docs/
│   ├── REPRODUCTION.md                    # Step-by-step reproduction guide
│   ├── HYPERPARAMETERS.md                 # Parameter documentation
│   └── CITATION.md                        # BibTeX citation
│
└── results/                               # Evaluation outputs (generated)
```

## 🔬 Key Hyperparameters

All hyperparameters from the paper are documented in [HYPERPARAMETERS.md](./docs/HYPERPARAMETERS.md).

Critical parameters:
- **θ_align** = 0.7 (alignment threshold)
- **θ_consensus** = 0.8 (consensus threshold)
- **θ_confidence** = 0.75 (minimum synthesis confidence)
- **min_traces** = 3 (minimum traces for pattern mining)

## 📈 Evaluation Domains

The POC validates DFHA across 10 diverse domains:

1. **IT Support**: Incident investigation, transaction tracing, performance analysis
2. **Financial**: Fraud detection, credit applications, account reconciliation
3. **Healthcare**: Patient triage, medication review, lab result analysis
4. **E-commerce**: Order fulfillment, return processing, product recommendations
5-10. (Additional domains in full evaluation)

## 🎯 Main Results

Reproduction of Table II from the paper:

| Approach | Success Rate | Avg Latency | Avg Cost | LLM Reduction |
|----------|-------------|-------------|----------|---------------|
| Deterministic-only | 0.0% ± 0% | 10 ± 0 ms | $0.000 ± 0 | 100% |
| LLM-only | 95.0% ± 3.4% | 1,988 ± 142 ms | $0.0426 ± 0.002 | 0% |
| Simple Cache | 97.5% ± 2.4% | 1,378 ± 118 ms | $0.0290 ± 0.003 | 33.8% ± 4.2% |
| **DFHA (Ours)** | **97.5% ± 2.4%** | **696 ± 89 ms** | **$0.0125 ± 0.002** | **71.9% ± 3.1%** |

*95% confidence intervals from 160 steady-state executions (n=40 per domain)*

## 📝 Citation

If you use this code or build upon this work, please cite:

```bibtex
@article{kalyanaraman2025dfha,
  title={Deterministic-First Hybrid Agents: Progressive Workflow Synthesis from Runtime Execution Traces},
  author={Kalyanaraman, Gopal and Dialani, Vijay},
  journal={IEEE Access},
  year={2025},
  publisher={IEEE}
}
```

See [CITATION.md](./docs/CITATION.md) for additional citation formats.

## 🔗 Related Resources

- **Paper PDF**: [Link to IEEE Xplore]
- **Zenodo Archive**: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)
- **Supplementary Materials**: [Link to supplementary materials]

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Docker Infrastructure

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
docker-compose logs -f localstack
docker-compose logs -f elasticmq
```

## 📊 Monitoring

### DynamoDB Admin UI
```
http://localhost:8001
```

### ElasticMQ UI
```
http://localhost:9325
```

### LocalStack Health
```bash
curl http://localhost:4566/_localstack/health
```

## 🤝 Contributing

This repository contains the reference implementation for the IEEE Access paper. For questions, please:

1. Check [REPRODUCTION.md](./docs/REPRODUCTION.md) for detailed instructions
2. Review [HYPERPARAMETERS.md](./docs/HYPERPARAMETERS.md) for configuration
3. Open an issue on GitHub

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Georgia Tech OMSCS program for research support
- IEEE Access reviewers for valuable feedback
- Open-source community for foundational tools (LocalStack, ElasticMQ)

## 📧 Contact

- **Gopal Kalyanaraman** - gkalyanaraman3@gatech.edu - Georgia Institute of Technology
- **Vijay K. Madisetti** - vm10@gatech.edu - Georgia Institute of Technology

## 🔄 Version History

- **v1.0.0** (2025-XX-XX): Initial release
  - Complete POC implementation
  - All evaluation scripts
  - Synthetic data generation
  - Paper reproduction tools

---

**Ready to reproduce the paper results?** 🚀

```bash
npm run full-poc
```

Results will be generated in `./results/` with LaTeX-ready tables and JSON data for plotting.
