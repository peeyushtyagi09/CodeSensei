const IORedis = require("ioredis");
const { REDIS_URL } = process.env;
const redis = new IORedis(REDIS_URL);

module.exports = redis;