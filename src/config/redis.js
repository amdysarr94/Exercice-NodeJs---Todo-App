const redis = require('redis');

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.error('Erreur Redis :', err));
redisClient.on('ready', () => console.log('✅ Client Redis connecté'));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
