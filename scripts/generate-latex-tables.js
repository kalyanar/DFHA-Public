#!/usr/bin/env node

/**
 * Generate LaTeX Tables from Evaluation Results
 * Creates paper-ready LaTeX tables for all results
 */

const fs = require('fs').promises;
const path = require('path');

class LaTeXTableGenerator {
    constructor(config = {}) {
        this.config = {
            resultsFile: config.resultsFile || path.join(__dirname, '../results/evaluation_results.json'),
            confidenceFile: config.confidenceFile || path.join(__dirname, '../results/confidence_intervals.json'),
            outputDir: config.outputDir || path.join(__dirname, '../results'),
            ...config
        };
    }

    async generate() {
        console.log('================================================');
        console.log('Generating LaTeX Tables for Paper');
        console.log('================================================\n');

        // Load data
        const results = await this.loadJSON(this.config.resultsFile);
        let confidence = {};
        try {
            confidence = await this.loadJSON(this.config.confidenceFile);
        } catch (error) {
            console.log('⚠ Confidence intervals not found, generating without CIs');
        }

        // Generate all tables
        const tables = {
            table2: this.generateTable2(results, confidence),
            table3: this.generateTable3(results, confidence)
        };

        // Save tables
        await this.saveTables(tables);

        console.log('\n================================================');
        console.log('✅ LaTeX tables generated!');
        console.log('================================================\n');
        console.log('Tables saved to:');
        console.log(`  - ${this.config.outputDir}/table2_main_results.tex`);
        console.log(`  - ${this.config.outputDir}/table3_domain_comparison.tex`);
        console.log(`  - ${this.config.outputDir}/all_tables.tex (combined)\n`);
    }

    async loadJSON(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    }

    generateTable2(results, confidence) {
        console.log('Generating Table II (Main Results)...');

        let latex = `% Table II: Overall Performance Comparison (Steady State)
% Generated: ${new Date().toISOString()}

\\begin{table*}[h!]
\\centering
\\caption{Overall Performance Comparison (Steady State with 95\\% Confidence Intervals)}
\\label{tab:main_results}
\\begin{tabular}{|l|c|c|c|c|}
\\hline
\\textbf{Approach} & \\textbf{Success Rate} & \\textbf{Avg Latency (ms)} &
\\textbf{Avg Cost (\\$/query)} & \\textbf{LLM Reduction} \\\\
\\hline\n`;

        const approaches = [
            { key: 'deterministic_only', label: 'Deterministic-only' },
            { key: 'llm_only', label: 'LLM-only' },
            { key: 'simple_cache', label: 'Simple Cache' },
            { key: 'dfha', label: '\\textbf{DFHA}', bold: true }
        ];

        for (const { key, label, bold } of approaches) {
            const data = results.approaches[key]?.steady_state;
            if (!data) continue;

            const ci = confidence[key] || {};

            const successRate = this.formatWithCI(
                data.successRate * 100,
                ci.successRate?.ci_lower ? ci.successRate.ci_lower * 100 : null,
                ci.successRate?.ci_upper ? ci.successRate.ci_upper * 100 : null,
                0, '%'
            );

            const latency = this.formatWithCI(
                data.avgLatency,
                ci.latency?.ci_lower,
                ci.latency?.ci_upper,
                0, ''
            );

            const cost = this.formatWithCI(
                data.avgCost,
                ci.cost?.ci_lower,
                ci.cost?.ci_upper,
                4, '\\$'
            );

            const llmReduction = this.formatWithCI(
                data.llmReduction * 100,
                ci.llmReduction?.ci_lower ? ci.llmReduction.ci_lower * 100 : null,
                ci.llmReduction?.ci_upper ? ci.llmReduction.ci_upper * 100 : null,
                1, '%'
            );

            const row = bold
                ? `${label} & \\textbf{${successRate}} & \\textbf{${latency}} & \\textbf{${cost}} & \\textbf{${llmReduction}} \\\\\n`
                : `${label} & ${successRate} & ${latency} & ${cost} & ${llmReduction} \\\\\n`;

            latex += row;
        }

        latex += `\\hline
\\multicolumn{5}{l}{\\footnotesize \\textit{Data from ${results.approaches.dfha?.steady_state?.traceCount || 'N'} steady-state executions. 95\\% CIs computed via bootstrap with 1000 resamples.}}
\\end{tabular}
\\end{table*}\n`;

        console.log('  ✓ Table II generated');
        return latex;
    }

    generateTable3(results, confidence) {
        console.log('Generating Table III (Domain Comparison)...');

        let latex = `% Table III: Performance by Domain
% Generated: ${new Date().toISOString()}

\\begin{table*}[h!]
\\centering
\\caption{DFHA Performance by Domain (Steady State)}
\\label{tab:domain_comparison}
\\begin{tabular}{|l|c|c|c|c|}
\\hline
\\textbf{Domain} & \\textbf{Success Rate} & \\textbf{Avg Latency (ms)} &
\\textbf{Avg Cost (\\$/query)} & \\textbf{LLM Reduction} \\\\
\\hline\n`;

        const domainLabels = {
            it_support: 'IT Support',
            financial: 'Financial Services',
            healthcare: 'Healthcare',
            ecommerce: 'E-commerce'
        };

        for (const [domain, label] of Object.entries(domainLabels)) {
            const data = results.domains[domain]?.dfha?.steady_state;
            if (!data) continue;

            const successRate = this.formatValue(data.successRate * 100, 1, '\\%');
            const latency = this.formatValue(data.avgLatency, 0, '');
            const cost = this.formatValue(data.avgCost, 4, '\\$');
            const llmReduction = this.formatValue(data.llmReduction * 100, 1, '\\%');

            latex += `${label} & ${successRate} & ${latency} & ${cost} & ${llmReduction} \\\\\n`;
        }

        latex += `\\hline
\\multicolumn{5}{l}{\\footnotesize \\textit{DFHA performance across different application domains.}}
\\end{tabular}
\\end{table*}\n`;

        console.log('  ✓ Table III generated');
        return latex;
    }

    formatWithCI(value, ciLower, ciUpper, decimals, prefix = '') {
        const formattedValue = value.toFixed(decimals);

        if (ciLower !== null && ciUpper !== null && ciLower !== undefined && ciUpper !== undefined) {
            const margin = ((ciUpper - ciLower) / 2).toFixed(decimals);
            return `${prefix}${formattedValue} $\\pm$ ${margin}`;
        }

        return `${prefix}${formattedValue} $\\pm$ 0`;
    }

    formatValue(value, decimals, prefix = '') {
        return `${prefix}${value.toFixed(decimals)}`;
    }

    async saveTables(tables) {
        await fs.mkdir(this.config.outputDir, { recursive: true });

        // Save individual tables
        for (const [name, content] of Object.entries(tables)) {
            const filename = `${name}_${name === 'table2' ? 'main_results' : 'domain_comparison'}.tex`;
            await fs.writeFile(path.join(this.config.outputDir, filename), content);
        }

        // Save combined file
        const combined = `% All LaTeX Tables for DFHA Paper
% Generated: ${new Date().toISOString()}
%
% Usage: \\input{all_tables.tex} in your paper
%

${tables.table2}

${tables.table3}
`;

        await fs.writeFile(path.join(this.config.outputDir, 'all_tables.tex'), combined);
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    const generator = new LaTeXTableGenerator();

    generator.generate()
        .then(() => {
            console.log('LaTeX table generation completed!\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error generating tables:', error);
            process.exit(1);
        });
}

module.exports = LaTeXTableGenerator;
