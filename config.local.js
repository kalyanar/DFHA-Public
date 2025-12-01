// config.local.js
// Local development configuration using LocalStack and ElasticMQ

module.exports = {
    // Environment
    environment: 'local',
    
    // AWS Configuration (LocalStack)
    awsRegion: 'us-east-1',
    awsProfile: 'local',
    
    // DynamoDB (LocalStack)
    dynamoEndpoint: 'http://localhost:4566',
    dynamoAccessKeyId: 'test',
    dynamoSecretAccessKey: 'test',
    
    // SQS (ElasticMQ)
    sqsEndpoint: 'http://localhost:9324',
    sqsAccessKeyId: 'test',
    sqsSecretAccessKey: 'test',
    
    // Queue Names
    queues: {
        rulesEngineRequests: 'rosetta-rules-engine-requests',
        rulesEngineResponses: 'rosetta-rules-engine-responses',
        aiDecisions: 'rosetta-ai-decisions',
        workflowExecution: 'rosetta-workflow-execution',
        
        // Dead Letter Queues
        rulesEngineDLQ: 'rosetta-rules-engine-dlq',
        aiDecisionsDLQ: 'rosetta-ai-decisions-dlq'
    },
    
    // DynamoDB Table Names
    tables: {
        executionTraces: 'RosettaExecutionTraces',
        minedPatterns: 'RosettaMinedPatterns',
        synthesizedWorkflows: 'RosettaSynthesizedWorkflows',
        thompsonSampling: 'RosettaThompsonSampling',
        workflowState: 'RosettaWorkflowState'
    },
    
    // Pattern Mining Configuration
    patternMining: {
        minTracesRequired: 3,
        alignmentThreshold: 0.7,
        consensusThreshold: 0.8,
        confidenceThreshold: 0.75,
        miningInterval: 3600000 // 1 hour in ms
    },
    
    // Workflow Synthesis Configuration
    workflowSynthesis: {
        confidenceThreshold: 0.75,
        maxWorkflowComplexity: 20,
        enableAutoDeployment: true
    },
    
    // Thompson Sampling Configuration
    thompsonSampling: {
        priors: {
            deterministic: { alpha: 1, beta: 1 },
            synthesized: { alpha: 1, beta: 1 },
            llm: { alpha: 1, beta: 1 }
        },
        explorationRate: 0.1
    },
    
    // Execution Timeouts
    timeouts: {
        task: 30000,        // 30 seconds
        workflow: 120000,   // 2 minutes
        llmCall: 60000      // 1 minute
    },
    
    // LLM Configuration (for mock/testing)
    llm: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        mockMode: true  // Use mock responses for local testing
    },
    
    // Logging
    logging: {
        level: 'debug',
        outputDir: './logs'
    },
    
    // Evaluation Configuration
    evaluation: {
        domains: ['it_support', 'financial', 'healthcare', 'ecommerce'],
        tracesPerDomain: 100,
        warmupTraces: 10,
        evaluationRounds: 5,
        outputDir: './evaluation_results'
    },
    
    // Data Generation
    dataGeneration: {
        outputDir: './data/synthetic_traces',
        tracesPerPattern: 50,
        variationRate: 0.3,
        noiseRate: 0.1
    }
};
