const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL);

const runQueue = new Queue('runQueue', { connection });
const submitQueue = new Queue('SubmitQueue', { connection });

module.exports = { runQueue, submitQueue, connection };