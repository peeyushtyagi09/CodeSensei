// that is the codebase for run and submit the code using piston and with out docker
// const asyncHandler = require('../middlewares/asyncHandler');
// const { 
//     runWithPiston,
//     normalizeOutput,
//     checkSizeLimits
// } = require('../utils/codeRunner');
// const Question = require('../models/Question');

// function makeFilesPayload({ language, code, filename}) {
//     const name = filename || (language === 'python' ? 'main.py' : 'Main.' + (language === 'java' ? 'java' : 'txt'));
//     return [{ name, content: code}];
// }

// exports.runCode = asyncHandler(async (req, res) => {
//     const { language, code, stdin= '', version } = req.body;
//     if(!language || !code) return res.status(400).json({ error: "language and code are required "});

//     try {
//         checkSizeLimits(code, stdin);
//     }catch (err) {
//         return res.status(413).json({ error: err.message });
//     }

//     const timeout = parseInt(process.env.RUN_TIMEOUT_MS || '5000', 10);

//     try {
//         const files = makeFilesPayload({ language, code});
//         const result = await runWithPiston({ language, version, files, stdin, timeout });

//         const run = result.run || result;
//         const stdout = normalizeOutput(run.stdout || '');
//         const stderr = normalizeOutput(run.stderr || '');
//         const exitCode = run.code ?? run.exitCode ?? null;
//         const timedOut =
//             run.signal === 'SIGKILL' ||
//             run.signal === 'SIGTERM' ||
//             run.output?.includes('Timeout');


//         return res.json({
//             success: true,
//             stdout,
//             stderr,
//             exitCode,
//             timeout,
//             raw: result,
//         });
//     }catch (err) {
//         console.error('runCode error', err?.message|| err);
//         return res.status(500).json({ error: 'Execution failed', details: err.message });
//     }
// });

// exports.submitCode = asyncHandler(async (req, res) => {
//     const { questionId, language, code, version, runHiddenTestcases = false } = req.body;
//     if(!questionId || !language || !code) return res.status(400).json({ error: "questionId, language and code are required "});

//     const question = await Question.findById(questionId).lean();
//     if(!question) return res.status(400).json({ error: 'Question not found'});

//     const allCases = Array.isArray(question.testCases) ? question.testCases : [];
//     const visibleCases = allCases.filter(tc => !tc.hidden);
//     const hiddenCases = allCases.filter(tc => tc.hidden);

//     const runCases = runHiddenTestcases ? allCases : visibleCases;

//     try {
//         checkSizeLimits(code, '');
//     }catch (err) {
//         return res.status(413).json({ error: err.message });
//     }

//     const timeout = parseInt(process.env.RUN_TIMEOUT_MS ||  '5000', 10);
//     const files = makeFilesPayload({ language, code });

//     const results = [];
//     let allPassed = true;
//     for(const tc of runCases) {
//         const stdin = tc.input ?? '';
//         try {
//             const execResp = await runWithPiston({ language, version, files, stdin, timeout });

//             const run = execResp.run || execResp;
//             const rawStdout = run.stdout ?? '';
//             const rawStderr = run.stderr ?? '';
//             const stdout = normalizeOutput(rawStdout);
//             const expected = normalizeOutput(tc.output ?? '');

//             const passed = stdout === expected && !rawStderr;

//             if(!passed) allPassed = false;

//             results.push({
//                 input: tc.input,
//                 expected,
//                 stdout, 
//                 stderr: normalizeOutput(rawStderr),
//                 exitCode: run.code ?? null, 
//                 passed, 
//                 hidden: !!tc.hidden,
//             });
//         }catch (err) {
//             allPassed = false;
//             results.push({
//                 input: tc.input,
//                 expected: normalizeOutput(tc.output ?? ''),
//                 stdout: '',
//                 stderr: err.message,
//                 passed: false,
//                 hidden: !!tc.hidden,
//               });
//         }
//     }
//    // summary metrics
//   const visiblePassed = results.filter(r => !r.hidden && r.passed).length;
//   const visibleTotal = results.filter(r => !r.hidden).length;
//   const hiddenPassed = results.filter(r => r.hidden && r.passed).length;
//   const hiddenTotal = results.filter(r => r.hidden).length;

//   const score = visibleTotal + hiddenTotal > 0 ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0;

//   // store attempt if you have Attempts model (optional). For now, return report.
//   return res.json({
//     success: true,
//     summary: {
//       allPassed,
//       scorePercent: score,
//       visible: { passed: visiblePassed, total: visibleTotal },
//       hidden: { passed: hiddenPassed, total: hiddenTotal },
//     },
//     results,
//   });
// });


/**
 * and the is the new code in with we are running and submitting over code using docker 
 */


const asyncHandler = require('../middlewares/asyncHandler'); // assume exists in your project
const { runQueue, submitQueue } = require('../queue/queues');
const Submission = require('../models/Submission');
const { v4: uuidv4 } = require('uuid');

// /api/code/run -> enqueue quick run
exports.runCode = asyncHandler(async (req, res) => {
  const { language, code, stdin = '', version, filename } = req.body;
  if(!language || !code) return res.status(400).json({ error: "language and code required" });

  // optional: size checks similar to previous codeRunner checkSizeLimits
  const job = await runQueue.add('run', { language, code, stdin, version, filename, userId: req.user?.id || null }, { attempts: 1 });
  return res.json({ success: true, jobId: Submission._id });
});

// /api/code/submit -> enqueue full testcase run
exports.submitCode = asyncHandler(async (req, res) => {
  const { questionId, language, code, version, runHiddenTestcases = false } = req.body;
  if(!questionId || !language || !code) return res.status(400).json({ error: 'questionId, language and code required' });

  const job = await submitQueue.add('submit', { questionId, language, code, version, runHidden: runHiddenTestcases, userId: req.user?.id || null }, { attempts: 1 });
  return res.json({ success: true, submissionJobId: Submission._id });
});
