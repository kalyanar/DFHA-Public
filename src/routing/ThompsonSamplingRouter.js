// ThompsonSamplingRouter.js
class ThompsonSamplingRouter {
    constructor(config = {}) {
        this.dynamoDB = new AWS.DynamoDB.DocumentClient();
        this.tableName = config.routingTable || 'RosettaRoutingStats';
        
        // Initialize with priors
        this.priors = {
            deterministic: { alpha: 1, beta: 1 },
            synthesized: { alpha: 1, beta: 1 },
            llm: { alpha: 1, beta: 1 }
        };
    }
    
    async selectRoute(query, availableOptions) {
        // Load current statistics
        const stats = await this.loadStats(query);
        
        // Sample from Beta distribution for each option
        const samples = {};
        for (const option of availableOptions) {
            const { alpha, beta } = stats[option] || this.priors[option];
            samples[option] = this.sampleBeta(alpha, beta);
        }
        
        // Select option with highest sample
        return Object.entries(samples)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    async updateStats(query, route, success) {
        const stats = await this.loadStats(query);
        
        if (!stats[route]) {
            stats[route] = { ...this.priors[route] };
        }
        
        if (success) {
            stats[route].alpha++;
        } else {
            stats[route].beta++;
        }
        
        await this.saveStats(query, stats);
    }
    
    sampleBeta(alpha, beta) {
        // Simple approximation - use proper library in production
        const mean = alpha / (alpha + beta);
        const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
        const stdDev = Math.sqrt(variance);
        
        // Box-Muller transform for normal approximation
        const u = Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        
        return Math.max(0, Math.min(1, mean + z * stdDev));
    }
    
    async loadStats(query) {
        // Load from DynamoDB or return defaults
        try {
            const result = await this.dynamoDB.get({
                TableName: this.tableName,
                Key: { queryPattern: this.getQueryPattern(query) }
            }).promise();
            
            return result.Item?.stats || { ...this.priors };
        } catch (error) {
            return { ...this.priors };
        }
    }
    
    async saveStats(query, stats) {
        await this.dynamoDB.put({
            TableName: this.tableName,
            Item: {
                queryPattern: this.getQueryPattern(query),
                stats,
                lastUpdated: Date.now()
            }
        }).promise();
    }
    
    getQueryPattern(query) {
        // Extract pattern from query for grouping similar queries
        return query.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .sort()
            .join('_');
    }
}

module.exports = ThompsonSamplingRouter;
