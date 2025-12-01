// ExecutionTraceCollector.js
// Comprehensive trace collection system from the paper

const crypto = require('crypto');
const AWS = require('aws-sdk');
const logger = require('../utils/Logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Execution Trace Collector - Core component of Dynamic Workflow Synthesis
 * Implements trace collection as described in Section 4.2 of the paper
 */
class ExecutionTraceCollector {
    constructor(config = {}) {
        this.dynamoDB = new AWS.DynamoDB.DocumentClient();
        this.tableName = config.tracesTable || 'RosettaExecutionTraces';
        this.fingerprintExtractor = config.fingerprintExtractor;
        this.minTracesForSynthesis = config.minTracesForSynthesis || 3;
    }

    /**
     * Save a complete execution trace with all metadata
     * This is the foundation for pattern mining and workflow synthesis
     */
    async saveExecutionTrace(orchestrationData) {
        const {
            orchestrationId,
            originalQuery,
            refinedQuery,
            context,
            executionPath,
            taskOutputs,
            success,
            totalDuration,
            llmCalls,
            cost,
            sessionId
        } = orchestrationData;

        try {
            // Generate question fingerprint for similarity matching
            const questionFingerprint = this.generateQuestionFingerprint(refinedQuery || originalQuery);

            // Extract matched fingerprints (from your fingerprints.config.js)
            const matchedFingerprints = await this.extractMatchedFingerprints(
                refinedQuery || originalQuery,
                taskOutputs
            );

            // Build the execution trace
            const trace = {
                traceId: uuidv4(),
                orchestrationId,
                questionFingerprint,
                originalQuery,
                refinedQuery,
                normalizedQuery: this.normalizeQuery(refinedQuery || originalQuery),
                matchedFingerprints,
                context: this.sanitizeContext(context),

                // Execution sequence with full details
                executionSequence: this.buildExecutionSequence(executionPath, taskOutputs),

                // Task dependency graph
                taskDependencies: this.extractDependencies(executionPath),

                // Data flow between tasks
                dataFlow: this.extractDataFlow(executionPath, taskOutputs),

                // Decision points and conditions
                decisionPoints: this.extractDecisionPoints(executionPath),

                // Performance metrics
                metrics: {
                    totalDuration,
                    taskDurations: this.extractTaskDurations(executionPath),
                    llmCalls,
                    deterministicTasks: executionPath.filter(t => !t.usedLLM).length,
                    totalTasks: executionPath.length
                },

                // Cost tracking
                cost: {
                    total: cost,
                    breakdown: this.calculateCostBreakdown(executionPath, llmCalls)
                },

                // Outcome
                success,
                errorDetails: orchestrationData.error || null,

                // Metadata
                timestamp: Date.now(),
                sessionId,
                environment: process.env.NODE_ENV || 'production',
                version: process.env.APP_VERSION || '1.0.0'
            };

            // Save to DynamoDB
            await this.dynamoDB.put({
                TableName: this.tableName,
                Item: trace
            }).promise();

            logger.info(`Saved execution trace ${trace.traceId} for ${questionFingerprint}`);

            // Check if pattern mining should be triggered
            await this.checkPatternMiningTrigger(questionFingerprint);

            return trace.traceId;

        } catch (error) {
            logger.error(`Error saving execution trace: ${error.message}`);
            throw error;
        }
    }

    /**
     * Build detailed execution sequence for pattern mining
     */
    buildExecutionSequence(executionPath, taskOutputs) {
        return executionPath.map((step, index) => {
            const taskOutput = taskOutputs[step.taskId] || {};

            return {
                index,
                taskId: step.taskId,
                taskName: step.taskName,
                taskType: step.taskType, // 'deterministic', 'llm', 'synthesized'

                // Input schema and values
                input: {
                    schema: this.extractInputSchema(step.input),
                    values: this.sanitizeInputValues(step.input),
                    source: step.inputSource // 'user', 'previous_task', 'context'
                },

                // Output schema and summary
                output: {
                    schema: this.extractOutputSchema(taskOutput),
                    summary: this.summarizeOutput(taskOutput),
                    keyValues: this.extractKeyValues(taskOutput)
                },

                // Execution metadata
                duration: step.duration,
                startTime: step.startTime,
                endTime: step.endTime,
                retries: step.retries || 0,

                // Task-specific metadata
                metadata: {
                    queueUsed: step.queueName,
                    lambdaInvoked: step.lambdaName,
                    scriptExecuted: step.scriptName,
                    workflowInvoked: step.workflowName
                },

                // For LLM tasks, capture prompts
                llmDetails: step.usedLLM ? {
                    model: step.model,
                    temperature: step.temperature,
                    promptTokens: step.promptTokens,
                    completionTokens: step.completionTokens,
                    totalTokens: step.totalTokens
                } : null
            };
        });
    }

    /**
     * Extract task dependencies for workflow structure learning
     */
    extractDependencies(executionPath) {
        const dependencies = {};

        executionPath.forEach((step, index) => {
            dependencies[step.taskId] = {
                dependsOn: step.dependsOn || [],
                enabledTasks: [],
                dataInputFrom: []
            };

            // Analyze which tasks this enabled
            if (index < executionPath.length - 1) {
                const nextSteps = executionPath.slice(index + 1);
                nextSteps.forEach(nextStep => {
                    if (nextStep.dependsOn && nextStep.dependsOn.includes(step.taskId)) {
                        dependencies[step.taskId].enabledTasks.push(nextStep.taskId);
                    }
                });
            }

            // Track data flow
            if (step.inputSource && step.inputSource.includes('task:')) {
                const sourceTaskId = step.inputSource.split(':')[1];
                dependencies[step.taskId].dataInputFrom.push(sourceTaskId);
            }
        });

        return dependencies;
    }

    /**
     * Extract data flow patterns between tasks
     */
    extractDataFlow(executionPath, taskOutputs) {
        const dataFlow = [];

        executionPath.forEach((step, index) => {
            if (step.inputSource && step.inputSource.includes('task:')) {
                const sourceTaskId = step.inputSource.split(':')[1];
                const sourceOutput = taskOutputs[sourceTaskId];

                if (sourceOutput) {
                    dataFlow.push({
                        from: sourceTaskId,
                        to: step.taskId,
                        dataTransformed: this.analyzeDataTransformation(
                            sourceOutput,
                            step.input
                        ),
                        fields: this.matchedFields(sourceOutput, step.input)
                    });
                }
            }
        });

        return dataFlow;
    }

    /**
     * Extract decision points for control flow learning
     */
    extractDecisionPoints(executionPath) {
        const decisionPoints = [];

        executionPath.forEach((step, index) => {
            if (step.decisionMade) {
                decisionPoints.push({
                    taskId: step.taskId,
                    decisionType: step.decisionType, // 'branch', 'loop', 'conditional'
                    condition: step.condition,
                    outcome: step.outcome,
                    alternativePaths: step.alternativePaths || []
                });
            }
        });

        return decisionPoints;
    }

    /**
     * Generate fingerprint for question similarity matching
     */
    generateQuestionFingerprint(query) {
        // Normalize and hash for consistent fingerprinting
        const normalized = query
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .sort()
            .join(' ');

        return crypto
            .createHash('sha256')
            .update(normalized)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Extract matched fingerprints from query and outputs
     */
    async extractMatchedFingerprints(query, taskOutputs) {
        const fingerprints = new Set();

        // Extract from query using your fingerprint matcher
        if (this.fingerprintExtractor) {
            const queryFingerprints = await this.fingerprintExtractor.match(query);
            queryFingerprints.forEach(fp => fingerprints.add(fp));
        }

        // Extract from task outputs
        Object.values(taskOutputs).forEach(output => {
            if (output?.matchedFingerprints) {
                output.matchedFingerprints.forEach(fp => fingerprints.add(fp));
            }
        });

        return Array.from(fingerprints);
    }

    /**
     * Check if we have enough traces to trigger pattern mining
     */
    async checkPatternMiningTrigger(questionFingerprint) {
        try {
            // Query traces with same fingerprint
            const params = {
                TableName: this.tableName,
                IndexName: 'QuestionFingerprint-index',
                KeyConditionExpression: 'questionFingerprint = :fp',
                ExpressionAttributeValues: {
                    ':fp': questionFingerprint
                },
                Limit: 10,
                ScanIndexForward: false
            };

            const result = await this.dynamoDB.query(params).promise();
            const traces = result.Items || [];
            const successfulTraces = traces.filter(t => t.success);

            if (successfulTraces.length >= this.minTracesForSynthesis) {
                logger.info(`Pattern mining trigger: ${questionFingerprint} has ${successfulTraces.length} successful traces`);

                // Emit event for pattern mining service
                await this.emitPatternMiningEvent({
                    questionFingerprint,
                    traceCount: successfulTraces.length,
                    traces: successfulTraces.map(t => t.traceId)
                });
            }

        } catch (error) {
            logger.error(`Error checking pattern mining trigger: ${error.message}`);
        }
    }

    /**
     * Emit pattern mining event
     */
    async emitPatternMiningEvent(data) {
        const eventBridge = new AWS.EventBridge();

        await eventBridge.putEvents({
            Entries: [{
                Source: 'rosetta.trace-collector',
                DetailType: 'PatternMiningTrigger',
                Detail: JSON.stringify({
                    ...data,
                    timestamp: Date.now()
                })
            }]
        }).promise();
    }

    /**
     * Retrieve traces for pattern mining
     */
    async getTracesForMining(questionFingerprint, limit = 10) {
        const params = {
            TableName: this.tableName,
            IndexName: 'QuestionFingerprint-index',
            KeyConditionExpression: 'questionFingerprint = :fp',
            FilterExpression: 'success = :success',
            ExpressionAttributeValues: {
                ':fp': questionFingerprint,
                ':success': true
            },
            Limit: limit,
            ScanIndexForward: false
        };

        const result = await this.dynamoDB.query(params).promise();
        return result.Items || [];
    }

    // Utility methods for data extraction and sanitization

    extractInputSchema(input) {
        if (!input) return {};

        const schema = {};
        Object.keys(input).forEach(key => {
            schema[key] = typeof input[key];
            if (Array.isArray(input[key])) {
                schema[key] = 'array';
            }
        });
        return schema;
    }

    extractOutputSchema(output) {
        if (!output) return {};

        // Handle nested response structure
        const data = output?.response?.success || output;
        return this.extractInputSchema(data);
    }

    sanitizeInputValues(input) {
        if (!input) return {};

        // Remove sensitive data but keep structure
        const sanitized = {};
        Object.keys(input).forEach(key => {
            if (typeof input[key] === 'string' && input[key].length > 100) {
                sanitized[key] = '[TRUNCATED]';
            } else if (key.toLowerCase().includes('password') ||
                       key.toLowerCase().includes('token') ||
                       key.toLowerCase().includes('secret')) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = input[key];
            }
        });

        return sanitized;
    }

    sanitizeContext(context) {
        if (!context) return {};

        return {
            sessionId: context.sessionId,
            assetType: context.selectedAsset?.type,
            hasAsset: !!context.selectedAsset,
            environment: context.environment
        };
    }

    summarizeOutput(output) {
        if (!output) return 'No output';

        const data = output?.response?.success || output;

        if (Array.isArray(data)) {
            return `Array with ${data.length} items`;
        } else if (typeof data === 'object') {
            const keys = Object.keys(data);
            return `Object with keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`;
        } else if (typeof data === 'string') {
            return data.substring(0, 100) + (data.length > 100 ? '...' : '');
        }

        return String(data);
    }

    extractKeyValues(output) {
        // Extract important values for pattern matching
        const keyValues = {};
        const data = output?.response?.success || output;

        if (typeof data === 'object' && !Array.isArray(data)) {
            // Look for common important fields
            ['id', 'status', 'result', 'count', 'total', 'error', 'message'].forEach(key => {
                if (data[key] !== undefined) {
                    keyValues[key] = data[key];
                }
            });
        }

        return keyValues;
    }

    normalizeQuery(query) {
        return query
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
    }

    extractTaskDurations(executionPath) {
        const durations = {};
        executionPath.forEach(step => {
            durations[step.taskName] = step.duration;
        });
        return durations;
    }

    calculateCostBreakdown(executionPath, llmCalls) {
        return {
            llmCost: llmCalls * 0.02, // Approximate cost per LLM call
            lambdaCost: executionPath.filter(s => s.taskType === 'lambda').length * 0.001,
            deterministicCost: executionPath.filter(s => s.taskType === 'deterministic').length * 0.0001
        };
    }

    analyzeDataTransformation(sourceOutput, targetInput) {
        // Analyze how data was transformed between tasks
        const transformations = [];

        if (typeof sourceOutput === 'object' && typeof targetInput === 'object') {
            // Check for field mappings
            Object.keys(targetInput).forEach(key => {
                if (sourceOutput[key] !== undefined) {
                    transformations.push({
                        type: 'direct_mapping',
                        field: key
                    });
                }
            });
        }

        return transformations;
    }

    matchedFields(sourceOutput, targetInput) {
        const matches = [];

        if (typeof sourceOutput === 'object' && typeof targetInput === 'object') {
            Object.keys(targetInput).forEach(targetKey => {
                Object.keys(sourceOutput).forEach(sourceKey => {
                    if (targetInput[targetKey] === sourceOutput[sourceKey]) {
                        matches.push({
                            source: sourceKey,
                            target: targetKey,
                            value: targetInput[targetKey]
                        });
                    }
                });
            });
        }

        return matches;
    }
}

module.exports = ExecutionTraceCollector;
