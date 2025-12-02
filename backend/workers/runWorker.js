require("dotenv").config();
const { Worker } = require("bullmq");
const { connection } = require("../queue/queues");
const { runInDocker } = require("../utils/dockerRunner");
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const logger = console;

const runWorker = new Worker('runQueue', async job => {
    const { language, code, stdin = '', version = '*', userId, filename } = job.data;
    const submission = new submission({
        userId: userId || null,
        questionId: job.data.questionId || null,
        language,
        version, 
        code,
        status: 'running',
    });
    await submission.save();

    const files = [{ name: filename || (language === 'python' ? 'main.py' : 'Main.' + (language === 'java' ? 'java' : 'txt')), content: code }];
    try {
        const start = Date.now();
        const resp = await runInDocker({ language, files, stdin, timeoutMs: job.data.timeoutMs || parseInt(process.env.RUN_TIMEOUT_MS) });
        const timeMs = Date.now() - start;

        submission.status = 'completed';
        submission.result = [{
            input: stdin, 
            expected: '',
            stdout: resp.stdout,
            stderr: resp.stderr,
            exitCode : resp.exitCode,
            timeMs,
            memoryKb: 0, 
            passed: resp.stderr === '' && resp.exitCode === 0
        }];
        submission.allPassed = submission.result.every(r => r.passed);
        submission.scorePrecent = submission.allPassed ? 100 : 0;
        submission.completedAt = new Date();
        await submission.save();
        return submission.toObject();
  } catch (err) {
    logger.error('runWorker error', err);
    submission.status = 'failed';
    submission.completedAt = new Date();
    await submission.save();
    throw err;
  }
}, { connection });