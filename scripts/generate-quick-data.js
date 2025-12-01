#!/usr/bin/env node

/**
 * Quick Data Generator - Creates minimal synthetic data for testing
 * This is a simplified version for quick testing
 */

const fs = require('fs').promises;
const path = require('path');

async function generateQuickData() {
    console.log('Generating quick test data...\n');

    const dataDir = path.join(__dirname, '../data/synthetic_traces');
    await fs.mkdir(dataDir, { recursive: true });

    const domains = ['it_support', 'financial', 'healthcare', 'ecommerce'];

    for (const domain of domains) {
        const traces = [];

        // Generate 20 simple traces per domain for quick testing
        for (let i = 0; i < 20; i++) {
            traces.push({
                traceId: `${domain}_test_${i}`,
                domain,
                pattern: 'test_pattern',
                query: `Test query ${i} for ${domain}`,
                questionFingerprint: `fp_${domain}_${i}`,
                normalizedQuery: `test query for ${domain}`,
                executionSequence: [
                    {
                        index: 0,
                        taskId: `task_${i}_0`,
                        taskName: 'fetch_data',
                        taskType: 'data_retrieval',
                        input: { schema: { query: 'string' }, values: { query: `query_${i}` }, source: 'user' },
                        output: { schema: { data: 'array' }, summary: 'Fetched data', keyValues: { status: 'success' } },
                        duration: 100 + Math.random() * 200,
                        startTime: Date.now(),
                        endTime: Date.now() + 150,
                        retries: 0,
                        metadata: { domain, pattern: 'test_pattern', synthetic: true }
                    },
                    {
                        index: 1,
                        taskId: `task_${i}_1`,
                        taskName: 'process_data',
                        taskType: 'processing',
                        input: { schema: { data: 'array' }, values: { data: [] }, source: 'task:task_0' },
                        output: { schema: { result: 'object' }, summary: 'Processed data', keyValues: { count: 10 } },
                        duration: 50 + Math.random() * 100,
                        startTime: Date.now() + 150,
                        endTime: Date.now() + 200,
                        retries: 0,
                        metadata: { domain, pattern: 'test_pattern', synthetic: true }
                    }
                ],
                taskDependencies: {
                    task_0: { dependsOn: [], enabledTasks: ['task_1'], dataInputFrom: [] },
                    task_1: { dependsOn: ['task_0'], enabledTasks: [], dataInputFrom: ['task_0'] }
                },
                dataFlow: [
                    {
                        from: 'task_0',
                        to: 'task_1',
                        dataTransformed: 'filtering',
                        fields: ['data']
                    }
                ],
                decisionPoints: [],
                metrics: {
                    totalDuration: 150 + Math.random() * 300,
                    taskDurations: [150, 75],
                    taskCount: 2,
                    deterministicTasks: 2,
                    llmCalls: 0
                },
                success: Math.random() > 0.05,  // 95% success rate
                confidence: 0.8 + Math.random() * 0.15,
                timestamp: Date.now() + i * 1000,
                metadata: {
                    synthetic: true,
                    generatorVersion: '1.0.0-quick',
                    template: 'test_pattern',
                    variations: 0
                }
            });
        }

        const filePath = path.join(dataDir, `${domain}.json`);
        await fs.writeFile(filePath, JSON.stringify(traces, null, 2));
        console.log(`✓ Generated ${traces.length} traces for ${domain}`);
    }

    console.log('\n✅ Quick test data generated!');
    console.log(`\nData saved to: ${dataDir}/`);
    console.log('\nNow you can run: node evaluation/run_evaluation.js --quick\n');
}

generateQuickData()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
