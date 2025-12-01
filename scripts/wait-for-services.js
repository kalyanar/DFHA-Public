#!/usr/bin/env node

/**
 * Wait for Docker services to be ready
 * Checks LocalStack and ElasticMQ health endpoints
 */

const http = require('http');

const SERVICES = [
    { name: 'LocalStack', url: 'http://localhost:4566/_localstack/health', timeout: 120000 },
    { name: 'ElasticMQ', url: 'http://localhost:9325', timeout: 60000 }
];

const POLL_INTERVAL = 2000; // 2 seconds

async function checkService(service) {
    return new Promise((resolve) => {
        const url = new URL(service.url);

        const req = http.get({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            timeout: 5000
        }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(true);
            } else {
                resolve(false);
            }
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function waitForService(service) {
    const startTime = Date.now();

    console.log(`Waiting for ${service.name}...`);

    while (Date.now() - startTime < service.timeout) {
        const isReady = await checkService(service);

        if (isReady) {
            console.log(`  ✓ ${service.name} is ready!`);
            return true;
        }

        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }

    console.log(`\n  ✗ ${service.name} timed out after ${service.timeout / 1000}s`);
    return false;
}

async function main() {
    console.log('================================================');
    console.log('Waiting for Docker services to be ready');
    console.log('================================================\n');

    let allReady = true;

    for (const service of SERVICES) {
        const ready = await waitForService(service);
        if (!ready) {
            allReady = false;
        }
    }

    console.log('\n================================================');

    if (allReady) {
        console.log('✅ All services are ready!');
        console.log('================================================\n');
        console.log('Next steps:');
        console.log('  npm run setup:infrastructure');
        console.log('  npm run generate:data');
        console.log('  npm run evaluate\n');
        process.exit(0);
    } else {
        console.log('✗ Some services failed to start');
        console.log('================================================\n');
        console.log('Troubleshooting:');
        console.log('  1. Check Docker is running: docker ps');
        console.log('  2. View logs: docker-compose logs');
        console.log('  3. Restart services: npm run docker:down && npm run docker:up\n');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
