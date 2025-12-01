// scripts/setup-local-queues.js
const AWS = require('aws-sdk');
const config = require('../config.local');

const sqs = new AWS.SQS({
    endpoint: config.sqsEndpoint,
    region: config.awsRegion,
    accessKeyId: config.sqsAccessKeyId,
    secretAccessKey: config.sqsSecretAccessKey
});

async function createQueues() {
    const queuesToCreate = [
        { name: config.queues.rulesEngineRequests, visibilityTimeout: 30 },
        { name: config.queues.rulesEngineResponses, visibilityTimeout: 30 },
        { name: config.queues.aiDecisions, visibilityTimeout: 60 },
        { name: config.queues.workflowExecution, visibilityTimeout: 120 },
        { name: config.queues.rulesEngineDLQ, visibilityTimeout: 30 },
        { name: config.queues.aiDecisionsDLQ, visibilityTimeout: 30 }
    ];
    
    console.log('Creating SQS queues in ElasticMQ...\n');
    
    for (const queue of queuesToCreate) {
        try {
            const result = await sqs.createQueue({
                QueueName: queue.name,
                Attributes: {
                    'VisibilityTimeout': queue.visibilityTimeout.toString(),
                    'ReceiveMessageWaitTimeSeconds': '0',
                    'MessageRetentionPeriod': '86400' // 1 day
                }
            }).promise();
            
            console.log(`✓ Created queue: ${queue.name}`);
            console.log(`  URL: ${result.QueueUrl}`);
        } catch (error) {
            if (error.code === 'QueueAlreadyExists') {
                console.log(`○ Queue already exists: ${queue.name}`);
            } else {
                console.error(`✗ Error creating ${queue.name}:`, error.message);
            }
        }
    }
    
    console.log('\n=== Queue URLs ===');
    const queues = await sqs.listQueues().promise();
    if (queues.QueueUrls) {
        queues.QueueUrls.forEach(url => console.log(`  ${url}`));
    }
}

// Get queue URL helper
async function getQueueUrl(queueName) {
    try {
        const result = await sqs.getQueueUrl({
            QueueName: queueName
        }).promise();
        return result.QueueUrl;
    } catch (error) {
        console.error(`Error getting URL for ${queueName}:`, error.message);
        return null;
    }
}

// Verify queues are accessible
async function verifyQueues() {
    console.log('\n=== Verifying Queues ===');
    
    for (const [key, queueName] of Object.entries(config.queues)) {
        const url = await getQueueUrl(queueName);
        if (url) {
            console.log(`✓ ${key}: ${queueName}`);
        } else {
            console.log(`✗ ${key}: ${queueName} - NOT ACCESSIBLE`);
        }
    }
}

// Main execution
if (require.main === module) {
    createQueues()
        .then(() => verifyQueues())
        .then(() => {
            console.log('\n✓ SQS queue setup complete!');
            console.log('\nElasticMQ UI: http://localhost:9325');
        })
        .catch(error => {
            console.error('\n✗ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { createQueues, getQueueUrl, verifyQueues };
