// WorkflowSynthesizer.js
const logger = require('./utils/Logger');
const { v4: uuidv4 } = require('uuid');

class WorkflowSynthesizer {
    constructor(config = {}) {
        this.confidenceThreshold = config.confidenceThreshold || 0.75;
        this.templateProcessor = require('./TemplateProcessor');
    }
    
    /**
     * Convert mined pattern to executable workflow
     */
    async synthesizeWorkflow(pattern, traces) {
        logger.info(`Synthesizing workflow from pattern with ${traces.length} traces`);
        
        const workflow = {
            workflowId: `synth-${uuidv4()}`,
            name: this.generateWorkflowName(pattern),
            synthesizedAt: Date.now(),
            confidence: pattern.confidence,
            
            // Build workflow structure
            startAt: 'input_validation',
            states: await this.generateStates(pattern),
            
            // Contracts
            inputContract: this.extractInputContract(pattern, traces),
            outputContract: this.extractOutputContract(pattern, traces),
            
            // Metadata
            sourcePattern: pattern.patternId,
            traceCount: traces.length,
            performance: this.calculateExpectedPerformance(traces)
        };
        
        // Verify synthesized workflow
        const verified = await this.verifyWorkflow(workflow, traces);
        
        if (!verified.valid) {
            logger.warn(`Workflow verification failed: ${verified.reason}`);
            return null;
        }
        
        return this.compileWorkflow(workflow);
    }
    
    generateStates(pattern) {
        const states = {
            input_validation: {
                type: 'validation',
                validateContract: true,
                goto: pattern.consensusSequence[0]?.taskName || 'end'
            }
        };
        
        pattern.consensusSequence.forEach((node, index) => {
            const nextNode = pattern.consensusSequence[index + 1];
            
            if (node.taskName === 'BRANCH') {
                // Generate choice state
                states[`choice_${index}`] = {
                    type: 'choice',
                    choices: this.generateChoices(pattern, index),
                    default: nextNode?.taskName || 'end'
                };
            } else {
                // Generate task state
                states[node.taskName] = {
                    type: 'task',
                    actionIdentifier: this.mapToAction(node.taskName),
                    input: this.generateInputMapping(pattern, index),
                    output: `\${${node.taskName}_output}`,
                    required: node.frequency > 0.9,
                    errorHandler: node.frequency < 0.9 ? 'skip' : 'fail',
                    goto: nextNode ? 
                           (nextNode.taskName === 'BRANCH' ? 
                            `choice_${index + 1}` : 
                            nextNode.taskName) : 
                           'end'
                };
            }
        });
        
        states.end = {
            type: 'end',
            output: '${final_output}'
        };
        
        return states;
    }
    
    extractInputContract(pattern, traces) {
        const contract = {
            required: [],
            optional: [],
            schema: {}
        };
        
        // Analyze all input fields across traces
        const fieldFrequency = {};
        
        traces.forEach(trace => {
            const firstTask = trace.executionSequence[0];
            if (firstTask?.input?.values) {
                Object.keys(firstTask.input.values).forEach(field => {
                    fieldFrequency[field] = (fieldFrequency[field] || 0) + 1;
                });
            }
        });
        
        // Classify fields by frequency
        Object.entries(fieldFrequency).forEach(([field, count]) => {
            const frequency = count / traces.length;
            
            if (frequency > 0.9) {
                contract.required.push(field);
            } else if (frequency > 0.3) {
                contract.optional.push(field);
            }
            
            // Infer schema from values
            contract.schema[field] = this.inferFieldSchema(field, traces);
        });
        
        return contract;
    }
    
    extractOutputContract(pattern, traces) {
        // Analyze final outputs across all traces
        const outputs = traces.map(t => {
            const lastTask = t.executionSequence[t.executionSequence.length - 1];
            return lastTask?.output;
        });
        
        return {
            schema: this.inferOutputSchema(outputs),
            guarantees: this.extractGuarantees(outputs)
        };
    }
    
    inferFieldSchema(field, traces) {
        const values = [];
        
        traces.forEach(trace => {
            trace.executionSequence.forEach(task => {
                if (task.input?.values?.[field] !== undefined) {
                    values.push(task.input.values[field]);
                }
            });
        });
        
        // Infer type and constraints
        const types = values.map(v => typeof v);
        const uniqueTypes = [...new Set(types)];
        
        return {
            type: uniqueTypes.length === 1 ? uniqueTypes[0] : 'mixed',
            examples: values.slice(0, 3),
            nullable: values.includes(null),
            enum: values.length < 10 ? [...new Set(values)] : null
        };
    }
    
    verifyWorkflow(workflow, traces) {
        const checks = {
            hasStartState: !!workflow.states[workflow.startAt],
            hasEndState: !!workflow.states.end,
            allStatesReachable: this.checkReachability(workflow),
            noCycles: !this.detectCycles(workflow),
            inputContractValid: workflow.inputContract.required.length > 0,
            confidenceAboveThreshold: workflow.confidence >= this.confidenceThreshold
        };
        
        const failed = Object.entries(checks)
            .filter(([_, valid]) => !valid)
            .map(([check, _]) => check);
        
        return {
            valid: failed.length === 0,
            reason: failed.join(', '),
            checks
        };
    }
    
    checkReachability(workflow) {
        const visited = new Set();
        const queue = [workflow.startAt];
        
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || visited.has(current)) continue;
            
            visited.add(current);
            const state = workflow.states[current];
            
            if (state?.goto) {
                if (Array.isArray(state.goto)) {
                    queue.push(...state.goto);
                } else {
                    queue.push(state.goto);
                }
            }
            
            if (state?.choices) {
                state.choices.forEach(choice => queue.push(choice.goto));
            }
        }
        
        return visited.size === Object.keys(workflow.states).length;
    }
    
    detectCycles(workflow) {
        const visited = new Set();
        const recStack = new Set();
        
        const hasCycle = (node) => {
            if (recStack.has(node)) return true;
            if (visited.has(node)) return false;
            
            visited.add(node);
            recStack.add(node);
            
            const state = workflow.states[node];
            if (state?.goto) {
                const next = Array.isArray(state.goto) ? state.goto : [state.goto];
                for (const n of next) {
                    if (n !== 'end' && hasCycle(n)) return true;
                }
            }
            
            recStack.delete(node);
            return false;
        };
        
        return hasCycle(workflow.startAt);
    }
    
    compileWorkflow(workflow) {
        // Convert to executable format
        return {
            ...workflow,
            executable: true,
            compiled: true,
            // Add execution function
            execute: async (input) => {
                // This would integrate with your execution engine
                return { success: true, workflowId: workflow.workflowId };
            }
        };
    }
    
    generateWorkflowName(pattern) {
        return `Synthesized_${pattern.normalizedQuery.replace(/\s+/g, '_')}_${Date.now()}`;
    }
    
    mapToAction(taskName) {
        // Map consensus task names to actual actions
        const mapping = {
            'FetchData': 'lambda:fetch_data',
            'Analyze': 'lambda:analyze',
            'Transform': 'lambda:transform',
            'Validate': 'script:validate',
            // Add your specific mappings
        };
        
        return mapping[taskName] || `lambda:${taskName.toLowerCase()}`;
    }
    
    generateInputMapping(pattern, index) {
        const node = pattern.consensusSequence[index];
        const mapping = {};
        
        // Map from context or previous outputs
        if (node.inputSchema) {
            Object.keys(node.inputSchema).forEach(field => {
                if (pattern.variableRegions.find(v => 
                    v.position === index && v.field === field
                )) {
                    mapping[field] = `\${input.${field}}`;
                } else {
                    mapping[field] = `\${context.${field}}`;
                }
            });
        }
        
        return mapping;
    }
    
    generateChoices(pattern, index) {
        const guards = pattern.guardConditions.find(g => g.position === index);
        
        if (!guards) return [];
        
        return Object.entries(guards.conditions).map(([branch, condition]) => ({
            condition: this.formatCondition(condition),
            goto: branch
        }));
    }
    
    formatCondition(condition) {
        // Convert to expression format
        if (typeof condition === 'string') return condition;
        
        if (condition.field && condition.operator && condition.value) {
            return `\${${condition.field}} ${condition.operator} "${condition.value}"`;
        }
        
        return 'true';
    }
    
    calculateExpectedPerformance(traces) {
        const durations = traces.map(t => t.metrics?.totalDuration || 0);
        
        return {
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            p50: this.percentile(durations, 50),
            p95: this.percentile(durations, 95),
            successRate: traces.filter(t => t.success).length / traces.length
        };
    }
    
    percentile(arr, p) {
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
    }
    
    extractGuarantees(outputs) {
        // Find fields that always appear
        const guaranteedFields = [];
        
        if (outputs.length === 0) return guaranteedFields;
        
        const firstOutput = outputs[0];
        if (typeof firstOutput === 'object') {
            Object.keys(firstOutput).forEach(field => {
                if (outputs.every(o => o?.[field] !== undefined)) {
                    guaranteedFields.push(field);
                }
            });
        }
        
        return guaranteedFields;
    }
    
    inferOutputSchema(outputs) {
        if (outputs.length === 0) return {};
        
        const schema = {};
        const sample = outputs[0];
        
        if (typeof sample === 'object') {
            Object.keys(sample).forEach(key => {
                schema[key] = {
                    type: typeof sample[key],
                    required: outputs.every(o => o?.[key] !== undefined)
                };
            });
        }
        
        return schema;
    }
}

module.exports = WorkflowSynthesizer;
