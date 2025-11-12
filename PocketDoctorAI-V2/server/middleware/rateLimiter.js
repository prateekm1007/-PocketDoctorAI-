const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (e) => console.error('Redis error:', e));
}

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && { store: new RedisStore({ client: redisClient, prefix: 'rl:general:' }) })
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  ...(redisClient && { store: new RedisStore({ client: redisClient, prefix: 'rl:upload:' }) })
});

const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  ...(redisClient && { store: new RedisStore({ client: redisClient, prefix: 'rl:analysis:' }) })
});

module.exports = { generalLimiter, uploadLimiter, analysisLimiter };
