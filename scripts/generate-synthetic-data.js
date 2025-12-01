// scripts/generate-synthetic-data.js
const fs = require('fs').promises;
const path = require('path');
const DomainTemplates = require('../evaluation/domains/DomainTemplates');
const crypto = require('crypto');

class SyntheticDataGenerator {
    constructor(config = {}) {
        this.config = {
            outputDir: config.outputDir || './data/synthetic_traces',
            tracesPerPattern: config.tracesPerPattern || 50,
            variationRate: config.variationRate || 0.3,
            noiseRate: config.noiseRate || 0.1,
            ...config
        };
        
        this.templates = new DomainTemplates();
        this.generatedTraces = {
            it_support: [],
            financial: [],
            healthcare: [],
            ecommerce: []
        };
    }
    
    async generateAllDomains() {
        console.log('Generating synthetic traces for all domains...\n');
        
        const domains = this.templates.getAllDomains();
        const summary = {};
        
        for (const domain of domains) {
            console.log(`Generating traces for domain: ${domain}`);
            const traces = await this.generateDomainTraces(domain);
            summary[domain] = traces.length;
            
            // Save to file
            await this.saveTraces(domain, traces);
            console.log(`  Generated ${traces.length} traces\n`);
        }
        
        // Generate summary report
        await this.generateSummaryReport(summary);
        
        console.log('Synthetic data generation complete!');
        console.log('Summary:', summary);
        
        return summary;
    }
    
    async generateDomainTraces(domain) {
        const traces = [];
        const patterns = this.templates.getPatternNames(domain);
        
        for (const patternName of patterns) {
            const template = this.templates.getTemplate(domain, patternName);
            
            for (let i = 0; i < this.config.tracesPerPattern; i++) {
                const trace = this.generateSingleTrace(domain, template, i);
                traces.push(trace);
            }
        }
        
        // Shuffle traces to mix patterns
        this.shuffle(traces);
        
        this.generatedTraces[domain] = traces;
        return traces;
    }
    
    generateSingleTrace(domain, template, index) {
        // Select query template
        const queryTemplate = template.queryTemplates[
            Math.floor(Math.random() * template.queryTemplates.length)
        ];
        
        // Fill in variables
        const query = this.fillQueryTemplate(queryTemplate, domain, index);
        
        // Generate execution path
        const executionPath = this.generateExecutionPath(template);
        
        // Add variations
        if (Math.random() < this.config.variationRate) {
            this.addVariations(executionPath, template);
        }
        
        // Add noise
        if (Math.random() < this.config.noiseRate) {
            this.addNoise(executionPath);
        }
        
        // Calculate metrics
        const totalDuration = executionPath.reduce((sum, task) => sum + task.duration, 0);
        
        return {
            traceId: `${domain}_${template.name}_${Date.now()}_${index}`,
            domain,
            pattern: template.name,
            query,
            questionFingerprint: this.generateFingerprint(query),
            normalizedQuery: this.normalizeQuery(query),
            
            executionSequence: executionPath.map((task, idx) => ({
                index: idx,
                taskId: `task_${idx}_${Date.now()}`,
                taskName: task.name,
                taskType: this.classifyTaskType(task.name),
                
                input: {
                    schema: this.generateSchema(template.inputSchema),
                    values: this.generateInputValues(template.inputSchema, index),
                    source: idx === 0 ? 'user' : `task:task_${idx-1}`
                },
                
                output: {
                    schema: this.generateOutputSchema(task.name),
                    summary: `Output from ${task.name}`,
                    keyValues: this.generateKeyValues(task.name)
                },
                
                duration: task.duration,
                startTime: task.startTime,
                endTime: task.endTime,
                retries: 0,
                
                metadata: {
                    domain,
                    pattern: template.name,
                    synthetic: true
                }
            })),
            
            taskDependencies: this.generateDependencies(executionPath),
            dataFlow: this.generateDataFlow(executionPath),
            decisionPoints: this.generateDecisionPoints(template, executionPath),
            
            metrics: {
                totalDuration,
                taskDurations: executionPath.map(t => t.duration),
                taskCount: executionPath.length,
                deterministicTasks: executionPath.filter(t => !t.usedLLM).length,
                llmCalls: executionPath.filter(t => t.usedLLM).length
            },
            
            success: Math.random() > 0.05,
            confidence: 0.7 + Math.random() * 0.3,
            timestamp: Date.now() + index * 1000,
            
            metadata: {
                synthetic: true,
                generatorVersion: '1.0.0',
                template: template.name,
                variations: executionPath.filter(t => t.variation).length
            }
        };
    }
    
    fillQueryTemplate(template, domain, index) {
        const variables = {
            // IT Support
            issue: ['high CPU', 'memory leak', 'deadlock', 'slow response'][index % 4],
            component: ['web server', 'database', 'cache', 'queue'][index % 4],
            service: ['API', 'frontend', 'backend', 'worker'][index % 4],
            application: ['app1', 'app2', 'app3'][index % 3],
            endpoint: ['/api/users', '/api/orders', '/api/products'][index % 3],
            timeframe: ['last hour', 'today', 'this week'][index % 3],
            error_pattern: ['NullPointer', 'Timeout', 'Connection refused'][index % 3],
            transaction_id: `TXN_${1000000 + index}`,
            alert_type: ['CPU', 'memory', 'disk', 'network'][index % 4],
            severity: ['critical', 'high', 'medium', 'low'][index % 4],
            
            // Financial
            txn_id: `TXN_${2000000 + index}`,
            account_id: `ACC_${3000000 + index}`,
            customer_id: `CUST_${4000000 + index}`,
            merchant: ['Amazon', 'Walmart', 'Target', 'BestBuy'][index % 4],
            amount: (100 + Math.random() * 10000).toFixed(2),
            app_id: `APP_${5000000 + index}`,
            customer: `John Doe ${index}`,
            ssn: `***-**-${1000 + index}`,
            portfolio_id: `PORT_${6000000 + index}`,
            
            // Healthcare
            symptoms: ['fever', 'chest pain', 'headache', 'fatigue'][index % 4],
            condition: ['cardiac', 'respiratory', 'neurological'][index % 3],
            patient_id: `PAT_${7000000 + index}`,
            patient: `Patient ${index}`,
            test_type: ['blood test', 'X-ray', 'MRI', 'ECG'][index % 4],
            medications: ['aspirin', 'insulin', 'antibiotics'][index % 3],
            patient_profile: `Profile_${index}`,
            
            // E-commerce
            order_id: `ORD_${8000000 + index}`,
            tracking_number: `TRACK_${9000000 + index}`,
            product_category: ['electronics', 'clothing', 'books', 'home'][index % 4],
            warehouse_id: `WH_${index % 5}`
        };
        
        return template.replace(/{(\w+)}/g, (match, key) => variables[key] || key);
    }
    
    generateExecutionPath(template) {
        const path = [];
        let currentTime = Date.now();
        
        // Base sequence
        for (const taskName of template.baseSequence) {
            const duration = 50 + Math.random() * 200;
            path.push({
                name: taskName,
                duration,
                startTime: currentTime,
                endTime: currentTime + duration,
                usedLLM: false,
                variation: false
            });
            currentTime += duration;
        }
        
        // Add conditional tasks
        if (Math.random() > 0.3 && template.conditionalTasks) {
            const conditions = Object.keys(template.conditionalTasks);
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            
            for (const taskName of template.conditionalTasks[condition]) {
                const duration = 50 + Math.random() * 200;
                path.push({
                    name: taskName,
                    duration,
                    startTime: currentTime,
                    endTime: currentTime + duration,
                    usedLLM: Math.random() < 0.1,
                    variation: true,
                    condition
                });
                currentTime += duration;
            }
        }
        
        return path;
    }
    
    addVariations(executionPath, template) {
        // Insert additional task
        if (Math.random() > 0.5 && executionPath.length > 2) {
            const insertIndex = 1 + Math.floor(Math.random() * (executionPath.length - 2));
            executionPath.splice(insertIndex, 0, {
                name: 'additional_check',
                duration: 30 + Math.random() * 100,
                startTime: Date.now(),
                endTime: Date.now() + 100,
                usedLLM: false,
                variation: true
            });
        }
        
        // Skip optional task
        if (Math.random() > 0.5 && executionPath.length > 3) {
            const skipIndex = Math.floor(Math.random() * executionPath.length);
            executionPath[skipIndex].skipped = true;
        }
    }
    
    addNoise(executionPath) {
        // Add retry
        if (executionPath.length > 0) {
            const retryIndex = Math.floor(Math.random() * executionPath.length);
            executionPath[retryIndex].retries = 1 + Math.floor(Math.random() * 2);
        }
        
        // Add delay
        if (executionPath.length > 1) {
            const delayIndex = Math.floor(Math.random() * executionPath.length);
            executionPath[delayIndex].duration *= (1.5 + Math.random());
        }
    }
    
    generateSchema(templateSchema) {
        if (!templateSchema) return {};
        
        const schema = {};
        Object.entries(templateSchema).forEach(([key, type]) => {
            schema[key] = type.split(':')[0]; // Extract base type
        });
        return schema;
    }
    
    generateInputValues(templateSchema, index) {
        if (!templateSchema) return {};
        
        const values = {};
        Object.entries(templateSchema).forEach(([key, type]) => {
            if (type.startsWith('enum:')) {
                const options = type.split(':')[1].split('|');
                values[key] = options[index % options.length];
            } else if (type === 'string') {
                values[key] = `${key}_value_${index}`;
            } else if (type === 'number') {
                values[key] = Math.floor(Math.random() * 1000);
            } else if (type === 'boolean') {
                values[key] = Math.random() > 0.5;
            } else if (type === 'array') {
                values[key] = [`item1_${index}`, `item2_${index}`];
            } else if (type === 'object') {
                values[key] = { field1: `value1_${index}`, field2: index };
            }
        });
        return values;
    }
    
    generateOutputSchema(taskName) {
        const schemas = {
            fetch: { data: 'array', count: 'number' },
            analyze: { result: 'object', confidence: 'number' },
            process: { success: 'boolean', id: 'string' },
            validate: { valid: 'boolean', errors: 'array' },
            calculate: { value: 'number', formula: 'string' }
        };
        
        const taskType = taskName.split('_')[0];
        return schemas[taskType] || { result: 'object' };
    }
    
    generateKeyValues(taskName) {
        return {
            status: 'completed',
            result: `${taskName}_result`,
            confidence: Math.random(),
            timestamp: Date.now()
        };
    }
    
    generateDependencies(executionPath) {
        const dependencies = {};
        
        executionPath.forEach((task, index) => {
            dependencies[`task_${index}`] = {
                dependsOn: index > 0 ? [`task_${index - 1}`] : [],
                enabledTasks: index < executionPath.length - 1 ? [`task_${index + 1}`] : [],
                dataInputFrom: index > 0 ? [`task_${index - 1}`] : []
            };
        });
        
        return dependencies;
    }
    
    generateDataFlow(executionPath) {
        const dataFlow = [];
        
        for (let i = 1; i < executionPath.length; i++) {
            dataFlow.push({
                from: `task_${i - 1}`,
                to: `task_${i}`,
                dataTransformed: ['filtering', 'aggregation', 'enrichment'][i % 3],
                fields: ['field1', 'field2']
            });
        }
        
        return dataFlow;
    }
    
    generateDecisionPoints(template, executionPath) {
        const decisionPoints = [];
        
        // Find conditional tasks in execution path
        const conditionalIndices = executionPath
            .map((task, idx) => ({ task, idx }))
            .filter(item => item.task.condition)
            .map(item => item.idx);
        
        conditionalIndices.forEach(idx => {
            decisionPoints.push({
                taskId: `task_${idx}`,
                decisionType: 'conditional',
                condition: executionPath[idx].condition,
                outcome: 'branch_taken',
                alternativePaths: Object.keys(template.conditionalTasks || {})
            });
        });
        
        return decisionPoints;
    }
    
    classifyTaskType(taskName) {
        if (taskName.includes('fetch') || taskName.includes('get')) return 'data_retrieval';
        if (taskName.includes('analyze') || taskName.includes('process')) return 'processing';
        if (taskName.includes('validate') || taskName.includes('check')) return 'validation';
        if (taskName.includes('calculate') || taskName.includes('compute')) return 'computation';
        return 'general';
    }
    
    generateFingerprint(query) {
        const normalized = query.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
    }
    
    normalizeQuery(query) {
        return query.toLowerCase()
            .replace(/[0-9]+/g, 'N')
            .replace(/[^a-z\s]/g, '')
            .trim();
    }
    
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    async saveTraces(domain, traces) {
        const filePath = path.join(this.config.outputDir, `${domain}.json`);
        
        // Ensure directory exists
        await fs.mkdir(this.config.outputDir, { recursive: true });
        
        // Save traces
        await fs.writeFile(filePath, JSON.stringify(traces, null, 2));
    }
    
    async generateSummaryReport(summary) {
        const report = {
            generationTime: new Date().toISOString(),
            config: this.config,
            summary,
            statistics: {}
        };
        
        // Calculate statistics per domain
        for (const [domain, traces] of Object.entries(this.generatedTraces)) {
            if (traces.length === 0) continue;
            
            const stats = {
                totalTraces: traces.length,
                patterns: [...new Set(traces.map(t => t.pattern))],
                avgTaskCount: traces.reduce((sum, t) => sum + t.executionSequence.length, 0) / traces.length,
                avgDuration: traces.reduce((sum, t) => sum + t.metrics.totalDuration, 0) / traces.length,
                successRate: traces.filter(t => t.success).length / traces.length,
                llmUsageRate: traces.reduce((sum, t) => sum + t.metrics.llmCalls, 0) / 
                             traces.reduce((sum, t) => sum + t.metrics.taskCount, 0)
            };
            
            report.statistics[domain] = stats;
        }
        
        // Save report
        const reportPath = path.join(this.config.outputDir, 'generation_report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }
}

// Main execution
if (require.main === module) {
    const generator = new SyntheticDataGenerator({
        tracesPerPattern: 50,
        variationRate: 0.3,
        noiseRate: 0.1
    });
    
    generator.generateAllDomains()
        .then(summary => {
            console.log('\nGeneration complete!');
            console.log('Files saved to: ./data/synthetic_traces/');
        })
        .catch(console.error);
}

module.exports = SyntheticDataGenerator;
