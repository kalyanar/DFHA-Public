#!/usr/bin/env node

/**
 * Main Evaluation Harness for DFHA Paper
 * Runs all 4 approaches and compares performance
 */

const fs = require('fs').promises;
const path = require('path');
const {
    DeterministicOnlyBaseline,
    LLMOnlyBaseline,
    SimpleCacheBaseline,
    DynamicSynthesisApproach
} = require('./baselines/BaselineComparators');

class EvaluationHarness {
    constructor(config = {}) {
        // Merge config with defaults (spread first, then override with specific defaults)
        this.config = {
            ...config,
            dataDir: config.dataDir || path.join(__dirname, '../data/synthetic_traces'),
            resultsDir: config.resultsDir || path.join(__dirname, '../results'),
            domains: config.domains || ['it_support', 'financial', 'healthcare', 'ecommerce'],
            warmupTraces: config.warmupTraces || 10,
            learningFraction: config.learningFraction || 0.5,
            quick: config.quick || false
        };

        this.results = {
            timestamp: new Date().toISOString(),
            config: this.config,
            approaches: {},
            domains: {},
            phases: {}
        };
    }

    async run() {
        console.log('================================================');
        console.log('DFHA Evaluation Harness');
        console.log('================================================\n');

        if (this.config.quick) {
            console.log('⚡ Running in QUICK mode (reduced dataset)\n');
        }

        // Ensure results directory exists
        await fs.mkdir(this.config.resultsDir, { recursive: true });

        // Initialize approaches
        const approaches = this.initializeApproaches();

        // Load data
        const data = await this.loadData();

        // Run evaluation for each domain
        for (const domain of this.config.domains) {
            if (!data[domain]) {
                console.log(`⚠ Skipping ${domain} (no data)\n`);
                continue;
            }

            console.log(`\n📊 Evaluating domain: ${domain}`);
            console.log('─'.repeat(50));

            const domainTraces = this.config.quick
                ? data[domain].slice(0, 20)  // Quick mode: only 20 traces
                : data[domain];

            const domainResults = await this.evaluateDomain(domain, domainTraces, approaches);
            this.results.domains[domain] = domainResults;

            this.printDomainSummary(domain, domainResults);
        }

        // Aggregate results across all domains
        this.aggregateResults();

        // Save results
        await this.saveResults();

        // Print final summary
        this.printFinalSummary();

        console.log('\n================================================');
        console.log('✅ Evaluation complete!');
        console.log('================================================\n');
        console.log(`Results saved to: ${this.config.resultsDir}/`);
        console.log('  - evaluation_results.json (full results)');
        console.log('  - main_results.csv (Table II)');
        console.log('  - summary.txt (human-readable)\n');
    }

    initializeApproaches() {
        return {
            deterministic_only: new DeterministicOnlyBaseline(),
            llm_only: new LLMOnlyBaseline(),
            simple_cache: new SimpleCacheBaseline(),
            dfha: new DynamicSynthesisApproach()
        };
    }

    async loadData() {
        console.log('Loading synthetic data...');
        const data = {};

        for (const domain of this.config.domains) {
            const filePath = path.join(this.config.dataDir, `${domain}.json`);

            try {
                const content = await fs.readFile(filePath, 'utf8');
                data[domain] = JSON.parse(content);
                console.log(`  ✓ Loaded ${data[domain].length} traces for ${domain}`);
            } catch (error) {
                console.log(`  ⚠ Could not load ${domain}: ${error.message}`);
            }
        }

        console.log('');
        return data;
    }

    async evaluateDomain(domain, traces, approaches) {
        const results = {};

        for (const [name, approach] of Object.entries(approaches)) {
            console.log(`  Running ${name}...`);

            const phaseResults = await this.runPhasedEvaluation(approach, traces, domain);

            results[name] = {
                warmup: phaseResults.warmup,
                learning: phaseResults.learning,
                steady_state: phaseResults.steady_state,
                overall: this.computeOverallMetrics(phaseResults)
            };
        }

        return results;
    }

    async runPhasedEvaluation(approach, traces, domain) {
        const warmupSize = Math.min(this.config.warmupTraces, traces.length);
        const learningSize = Math.floor((traces.length - warmupSize) * this.config.learningFraction);
        const steadySize = traces.length - warmupSize - learningSize;

        const phases = {
            warmup: traces.slice(0, warmupSize),
            learning: traces.slice(warmupSize, warmupSize + learningSize),
            steady_state: traces.slice(warmupSize + learningSize)
        };

        const results = {};

        for (const [phase, phaseTraces] of Object.entries(phases)) {
            const metrics = {
                executions: [],
                successCount: 0,
                totalLatency: 0,
                totalCost: 0,
                routeCounts: { deterministic: 0, synthesized: 0, cached: 0, llm: 0 }
            };

            for (const trace of phaseTraces) {
                const result = await approach.execute(trace.query, domain);

                metrics.executions.push(result);
                if (result.success) metrics.successCount++;
                metrics.totalLatency += result.latency;
                metrics.totalCost += result.cost;
                metrics.routeCounts[result.route] = (metrics.routeCounts[result.route] || 0) + 1;
            }

            results[phase] = this.summarizePhase(metrics, phaseTraces.length);
        }

        return results;
    }

    summarizePhase(metrics, traceCount) {
        const successRate = metrics.successCount / traceCount;
        const avgLatency = metrics.totalLatency / traceCount;
        const avgCost = metrics.totalCost / traceCount;

        // Calculate LLM reduction (compared to 100% LLM usage)
        const llmCount = metrics.routeCounts.llm || 0;
        const llmReduction = 1 - (llmCount / traceCount);

        return {
            traceCount,
            successRate,
            successCount: metrics.successCount,
            avgLatency,
            avgCost,
            totalCost: metrics.totalCost,
            llmReduction,
            routeCounts: metrics.routeCounts,
            executions: metrics.executions
        };
    }

    computeOverallMetrics(phaseResults) {
        // Combine all phases for overall metrics
        let totalTraces = 0;
        let totalSuccess = 0;
        let totalLatency = 0;
        let totalCost = 0;
        let totalLLMCalls = 0;

        for (const phase of Object.values(phaseResults)) {
            totalTraces += phase.traceCount;
            totalSuccess += phase.successCount;
            totalLatency += phase.avgLatency * phase.traceCount;
            totalCost += phase.totalCost;
            totalLLMCalls += (phase.routeCounts.llm || 0);
        }

        return {
            traceCount: totalTraces,
            successRate: totalSuccess / totalTraces,
            avgLatency: totalLatency / totalTraces,
            avgCost: totalCost / totalTraces,
            totalCost,
            llmReduction: 1 - (totalLLMCalls / totalTraces)
        };
    }

    aggregateResults() {
        // Aggregate across all domains for each approach
        this.results.approaches = {};

        const approachNames = Object.keys(this.results.domains[this.config.domains[0]] || {});

        for (const approachName of approachNames) {
            const aggregated = {
                warmup: this.aggregatePhase('warmup', approachName),
                learning: this.aggregatePhase('learning', approachName),
                steady_state: this.aggregatePhase('steady_state', approachName),
                overall: this.aggregatePhase('overall', approachName)
            };

            this.results.approaches[approachName] = aggregated;
        }
    }

    aggregatePhase(phase, approachName) {
        let totalTraces = 0;
        let totalSuccess = 0;
        let totalLatency = 0;
        let totalCost = 0;
        let totalLLMCalls = 0;

        for (const domain of this.config.domains) {
            const domainResults = this.results.domains[domain];
            if (!domainResults || !domainResults[approachName]) continue;

            const phaseData = domainResults[approachName][phase];
            if (!phaseData) continue;

            totalTraces += phaseData.traceCount;
            totalSuccess += phaseData.successCount || (phaseData.successRate * phaseData.traceCount);
            totalLatency += phaseData.avgLatency * phaseData.traceCount;
            totalCost += phaseData.totalCost || (phaseData.avgCost * phaseData.traceCount);
            totalLLMCalls += (1 - phaseData.llmReduction) * phaseData.traceCount;
        }

        if (totalTraces === 0) {
            return { traceCount: 0, successRate: 0, avgLatency: 0, avgCost: 0, llmReduction: 0 };
        }

        return {
            traceCount: totalTraces,
            successRate: totalSuccess / totalTraces,
            avgLatency: totalLatency / totalTraces,
            avgCost: totalCost / totalTraces,
            totalCost,
            llmReduction: 1 - (totalLLMCalls / totalTraces)
        };
    }

    printDomainSummary(domain, results) {
        console.log('\nSteady State Results:');
        console.log('─'.repeat(50));

        for (const [name, data] of Object.entries(results)) {
            const ss = data.steady_state;
            console.log(`  ${name.padEnd(20)}: ` +
                `Success: ${(ss.successRate * 100).toFixed(1)}% | ` +
                `Latency: ${ss.avgLatency.toFixed(0)}ms | ` +
                `Cost: $${ss.avgCost.toFixed(4)} | ` +
                `LLM-: ${(ss.llmReduction * 100).toFixed(1)}%`);
        }
    }

    printFinalSummary() {
        console.log('\n================================================');
        console.log('FINAL RESULTS (Steady State - All Domains)');
        console.log('================================================\n');

        const table = [];

        for (const [name, data] of Object.entries(this.results.approaches)) {
            const ss = data.steady_state;
            table.push({
                Approach: name,
                'Success Rate': `${(ss.successRate * 100).toFixed(1)}%`,
                'Avg Latency': `${ss.avgLatency.toFixed(0)} ms`,
                'Avg Cost': `$${ss.avgCost.toFixed(4)}`,
                'LLM Reduction': `${(ss.llmReduction * 100).toFixed(1)}%`
            });
        }

        console.table(table);
    }

    async saveResults() {
        // Save full JSON results
        const jsonPath = path.join(this.config.resultsDir, 'evaluation_results.json');
        await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));

        // Save CSV for Table II (main results)
        await this.saveMainResultsCSV();

        // Save human-readable summary
        await this.saveSummary();
    }

    async saveMainResultsCSV() {
        const csvPath = path.join(this.config.resultsDir, 'main_results.csv');

        let csv = 'Approach,Success Rate (%),Avg Latency (ms),Avg Cost ($),LLM Reduction (%)\n';

        for (const [name, data] of Object.entries(this.results.approaches)) {
            const ss = data.steady_state;
            csv += `${name},${(ss.successRate * 100).toFixed(1)},${ss.avgLatency.toFixed(0)},${ss.avgCost.toFixed(4)},${(ss.llmReduction * 100).toFixed(1)}\n`;
        }

        await fs.writeFile(csvPath, csv);
    }

    async saveSummary() {
        const summaryPath = path.join(this.config.resultsDir, 'summary.txt');

        let summary = 'DFHA Evaluation Summary\n';
        summary += '='.repeat(60) + '\n\n';
        summary += `Timestamp: ${this.results.timestamp}\n`;
        summary += `Domains: ${this.config.domains.join(', ')}\n`;
        summary += `Total Traces: ${this.results.approaches.dfha?.overall?.traceCount || 0}\n\n`;

        summary += 'Steady State Results:\n';
        summary += '-'.repeat(60) + '\n';

        for (const [name, data] of Object.entries(this.results.approaches)) {
            const ss = data.steady_state;
            summary += `\n${name.toUpperCase()}:\n`;
            summary += `  Success Rate: ${(ss.successRate * 100).toFixed(1)}%\n`;
            summary += `  Avg Latency: ${ss.avgLatency.toFixed(0)} ms\n`;
            summary += `  Avg Cost: $${ss.avgCost.toFixed(4)}\n`;
            summary += `  LLM Reduction: ${(ss.llmReduction * 100).toFixed(1)}%\n`;
        }

        await fs.writeFile(summaryPath, summary);
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const config = {
        quick: args.includes('--quick'),
        domains: args.includes('--domains')
            ? ['it_support', 'financial', 'healthcare', 'ecommerce']
            : undefined
    };

    const harness = new EvaluationHarness(config);

    harness.run()
        .then(() => {
            console.log('Evaluation completed successfully!\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error during evaluation:', error);
            process.exit(1);
        });
}

module.exports = EvaluationHarness;
