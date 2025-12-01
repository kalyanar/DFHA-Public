// scripts/setup-local-tables.js
const AWS = require('aws-sdk');
const config = require('../config.local');

const dynamodb = new AWS.DynamoDB({
    endpoint: config.dynamoEndpoint,
    region: config.awsRegion,
    accessKeyId: config.dynamoAccessKeyId,
    secretAccessKey: config.dynamoSecretAccessKey
});

async function createTables() {
    const tables = [
        {
            TableName: config.tables.executionTraces,
            KeySchema: [
                { AttributeName: 'traceId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'traceId', AttributeType: 'S' },
                { AttributeName: 'questionFingerprint', AttributeType: 'S' },
                { AttributeName: 'timestamp', AttributeType: 'N' }
            ],
            GlobalSecondaryIndexes: [{
                IndexName: 'QuestionFingerprint-index',
                KeySchema: [
                    { AttributeName: 'questionFingerprint', KeyType: 'HASH' },
                    { AttributeName: 'timestamp', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        },
        {
            TableName: config.tables.minedPatterns,
            KeySchema: [
                { AttributeName: 'patternId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'patternId', AttributeType: 'S' }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        },
        {
            TableName: config.tables.synthesizedWorkflows,
            KeySchema: [
                { AttributeName: 'workflowId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'workflowId', AttributeType: 'S' }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        },
        {
            TableName: config.tables.thompsonSampling,
            KeySchema: [
                { AttributeName: 'queryPattern', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'queryPattern', AttributeType: 'S' }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        },
        {
            TableName: config.tables.workflowState,
            KeySchema: [
                { AttributeName: 'flowId', KeyType: 'HASH' },
                { AttributeName: 'taskId', KeyType: 'RANGE' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'flowId', AttributeType: 'S' },
                { AttributeName: 'taskId', AttributeType: 'S' }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
    ];
    
    console.log('Creating DynamoDB tables in LocalStack...\n');
    
    for (const params of tables) {
        try {
            await dynamodb.createTable(params).promise();
            console.log(`✓ Created table: ${params.TableName}`);
        } catch (error) {
            if (error.code === 'ResourceInUseException') {
                console.log(`○ Table already exists: ${params.TableName}`);
            } else {
                console.error(`✗ Error creating ${params.TableName}:`, error.message);
            }
        }
    }
}

// Verify tables
async function verifyTables() {
    console.log('\n=== Verifying Tables ===');
    
    try {
        const result = await dynamodb.listTables().promise();
        console.log(`Found ${result.TableNames.length} tables:`);
        result.TableNames.forEach(name => console.log(`  ✓ ${name}`));
    } catch (error) {
        console.error('Error verifying tables:', error.message);
    }
}

// Main execution
if (require.main === module) {
    createTables()
        .then(() => verifyTables())
        .then(() => {
            console.log('\n✓ DynamoDB table setup complete!');
            console.log('\nDynamoDB Admin UI: http://localhost:8001');
        })
        .catch(error => {
            console.error('\n✗ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { createTables, verifyTables };
