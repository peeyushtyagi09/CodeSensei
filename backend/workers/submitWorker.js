require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('../queue/queues');
const { runInDocker } = require('../utils/dockerRunner');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const logger = console;

function normalize(s = '') {
  return String(s).replace(/\r\n/g, '\n').trimEnd();
}

const submitWorker = new Worker(
  'submitQueue',
  async job => {
    const {
      language,
      code,
      questionId,
      version = '*',
      runHidden = false,
      userId,
      submissionId // 👈 coming from controller
    } = job.data;

    const submission = await Submission.findById(submissionId);
    if (!submission) throw new Error('Submission not found for this job');

    submission.status = 'running';
    await submission.save();

    const question = await Question.findById(questionId).lean();
    if (!question) throw new Error('Question not found');

    const files = [
      {
        name:
          language === 'python'
            ? 'main.py'
            : 'Main.' + (language === 'java' ? 'java' : 'txt'),
        content: code
      }
    ];

    const runCases = runHidden
      ? question.testCases
      : question.testCases.filter(tc => !tc.hidden);

    const results = [];
    let allPassed = true;

    for (const tc of runCases) {
      const stdin = tc.input ?? '';
      const expected = normalize(tc.output ?? '');
      try {
        const start = Date.now();
        const r = await runInDocker({
          language,
          files,
          stdin,
          timeoutMs: parseInt(process.env.RUN_TIMEOUT_MS || '5000', 10)
        });
        const timeMs = Date.now() - start;

        const stdoutN = normalize(r.stdout ?? '');
        const stderrN = String(r.stderr ?? '').trim();

        const passed = normalize(r.stdout) === expected && !stderrN && r.exitCode === 0;
        if (!passed) allPassed = false;

        results.push({
          input: stdin,
          expected,
          stdout: stdoutN,
          stderr: stderrN,
          exitCode: r.exitCode,
          timeMs,
          memoryKb: 0,
          passed,
          hidden: !!tc.hidden
        });
      } catch (err) {
        allPassed = false;
        results.push({
          input: tc.input,
          expected: normalize(tc.output ?? ''),
          stdout: '',
          stderr: err.message || 'Execution error',
          exitCode: null,
          timeMs: 0,
          memoryKb: 0,
          passed: false,
          hidden: !!tc.hidden
        });
      }
    }

    submission.status = 'completed';
    submission.results = results;
    submission.allPassed = allPassed;
    submission.scorePercent =
      runCases.length > 0
        ? Math.round(
            (results.filter(r => r.passed).length / results.length) * 100
          )
        : 0;
    submission.completedAt = new Date();
    await submission.save();

    return submission.toObject();
  },
  { connection }
);
