require("dotenv").config();
const { Worker } = require("bullmq");
const { connection } = require("../queue/queues");
const { runInDocker } = require("../utils/dockerRunner");
const Submission = require('../models/Submission');
const logger = console;

// Optional: fix Redis options for Redis Stack
const workerConnection = {
  ...connection.options,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

const runWorker = new Worker(
  'runQueue',
  async job => {
    const {
      submissionId, // 👈 must be passed from controller
      language,
      code,
      stdin = '',
      version = '*',
      userId,
      filename
    } = job.data;

    // Step 1: fetch the existing submission
    const submission = await Submission.findById(submissionId);
    if (!submission) throw new Error('Submission not found for this job');

    submission.status = 'running';
    await submission.save();

    // Step 2: prepare file payload
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
        timeoutMs: job.data.timeoutMs || parseInt(process.env.RUN_TIMEOUT_MS || "5000")
      });
      const timeMs = Date.now() - start;

      // Step 3: update same submission
      submission.status = "completed";
      submission.results = [
        {
          input: stdin,
          expected: "",
          stdout: resp.stdout,
          stderr: resp.stderr,
          exitCode: resp.exitCode,
          timeMs,
          memoryKb: 0,
          passed: resp.exitCode === 0 && resp.stderr.trim() === "" && resp.stdout.trim() !== ""
        }
      ];

      submission.allPassed = submission.results.every(r => r.passed);
      submission.scorePercent = submission.allPassed ? 100 : 0;
      submission.completedAt = new Date();

      await submission.save();

      logger.log("✅ Run job completed:", submission._id);
      return submission.toObject();

    } catch (err) {
      logger.error("❌ runWorker error:", err.message);

      submission.status = "failed";
      submission.completedAt = new Date();
      await submission.save();

      throw err;
    }
  },
  { connection: workerConnection }
);

console.log("🚀 Run Worker is running and waiting for jobs...");
