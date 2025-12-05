require("dotenv").config();
const { Worker } = require("bullmq");
const { connection } = require("../queue/queues");
const { runInDocker } = require("../utils/dockerRunner");
const Submission = require('../models/Submission');
const logger = console;

// Fix Redis options required for Redis Stack
const workerConnection = {
  ...connection.options,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

const runWorker = new Worker(
  'runQueue',
  async job => {
    const { language, code, stdin = '', version = '*', userId, filename } = job.data;

    // FIXED: Constructor name
    const submission = new Submission({
      userId: userId || null,
      questionId: job.data.questionId || null,
      language,
      version,
      code,
      status: 'running',
      createdAt: new Date()
    });

    await submission.save();

    const files = [
      {
        name:
          filename ||
          (language === "python"
            ? "main.py"
            : "Main." + (language === "java" ? "java" : "txt")),
        content: code
      }
    ];

    try {
      const start = Date.now();
      const resp = await runInDocker({
        language,
        files,
        stdin,
        timeoutMs:
          job.data.timeoutMs ||
          parseInt(process.env.RUN_TIMEOUT_MS || "5000")
      });
      const timeMs = Date.now() - start;

      submission.status = "completed";

      // FIXED: results array
      submission.results = [
        {
          input: stdin,
          expected: "",
          stdout: resp.stdout,
          stderr: resp.stderr,
          exitCode: resp.exitCode,
          timeMs,
          memoryKb: 0,
          passed: resp.stderr === "" && resp.exitCode === 0
        }
      ];

      submission.allPassed = submission.results.every(r => r.passed);

      // FIXED: scorePercent
      submission.scorePercent = submission.allPassed ? 100 : 0;

      submission.completedAt = new Date();
      await submission.save();

      logger.log("Run job completed:", submission._id);

      return submission.toObject();
    } catch (err) {
      logger.error("runWorker error", err);

      submission.status = "failed";
      submission.completedAt = new Date();
      await submission.save();

      throw err;
    }
  },
  { connection: workerConnection }
);

console.log("Run Worker is running and waiting for jobs...");
