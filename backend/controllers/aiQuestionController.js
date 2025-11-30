const Question = require('../models/Question');
const {generateFullQuestionPackage}  = require('../utils/aiClient');
const { runWithPiston } = require('../utils/codeRunner');

function getFileName(language) {
    switch ((language || '').toLowerCase()) {
      case 'python': return 'main.py';
      case 'cpp':
      case 'c++': return 'main.cpp';
      case 'javascript':
      case 'node': return 'main.js';
      case 'java': return 'Main.java';
      case 'c': return 'main.c';
      case 'go': return 'main.go';
      case 'typescript': return 'main.ts';
      default: return 'main.txt';
    }
}

async function runCodeOnce({ language, version= '*', files, stdin = '', timeout = 5000}){
    const resp = await runWithPiston({
        language, 
        version, 
        files, 
        stdin, 
        timeout,
    });
    return resp.run || resp;
}

exports.createAIQuestion = async (req, res) => {
    try {
        const { seed = '', total = 1200, visible = 20 } = req.body || {};

        const pkg = await generateFullQuestionPackage(seed);

        const required = ['title', 'description', 'generatorScript', 'referenceSolution', 'bruteForceSolution'];
        for(const k of required) {
            if(!pkg[k]) return res.status(400).json({ error: `AI package missinh ${k}` });
        }

        const draft = new Question({
            title: pkg.title, 
            description: pkg.description, 
            examples: pkg.examples || [],
            constraints: pkg.constraints || "",
            difficulty: pkg.difficulty || 'medium',
            topic: pkg.topic || '',
            generatorScript: pkg.generatorScript,
            generatorLanguage: pkg.generatorLanguage || 'python',
            generatorVersion: pkg.generatorVersion || '*',
            referenceSolution: pkg.referenceSolution,
            solutionLanguage: pkg.solutionLanguage || 'python',
            solutionVersion: pkg.solutionVersion || '*',
        });
        await draft.save();

        const verifyRuns = 30;
        const genLang = draft.generatorLanguage;
        const genFile = getFileName(genLang);

        const solLang = draft.solutionLanguage;
        const solFile = getFileName(solLang);

        const bruteLang = draft.solutionLanguage || 'python';
        const bruteFile = getFileName(bruteLang);
     for (let i = 0; i < verifyRuns; i++) {
      // run generator
      const genResp = await runCodeOnce({
        language: genLang,
        version: draft.generatorVersion || '*',
        files: [{ name: genFile, content: draft.generatorScript }],
        stdin: ''
      });

      const input = (genResp.stdout || '').trim();
      if (!input) throw new Error(`Generator produced empty input on verification run ${i}`);

      // run reference solution
      const solResp = await runCodeOnce({
        language: solLang,
        version: draft.solutionVersion || '*',
        files: [{ name: solFile, content: draft.referenceSolution }],
        stdin: input
      });
      const solOut = (solResp.stdout || '').trim();

      // run brute-force solution
      const bruteResp = await runCodeOnce({
        language: bruteLang,
        version: draft.solutionVersion || '*',
        files: [{ name: bruteFile, content: pkg.bruteForceSolution }],
        stdin: input
      });
      const bruteOut = (bruteResp.stdout || '').trim();

      if (solOut !== bruteOut) {
        // Ask AI to regenerate once — for simplicity, fail fast and return error so admin can retry
        await Question.findByIdAndDelete(draft._id);
        return res.status(422).json({
          error: 'Verification failed',
          details: `Reference solution and brute-force outputs mismatch on iteration ${i}`,
          inputSample: input,
          refOut: solOut,
          bruteOut
        });
      }
    }

    // 3) Generate full testcases if verification passed
    const testCases = [];
    const totalCases = Math.max(100, total); // ensure at least 100
    for (let i = 0; i < totalCases; i++) {
      const genResp = await runCodeOnce({
        language: genLang,
        version: draft.generatorVersion || '*',
        files: [{ name: genFile, content: draft.generatorScript }],
        stdin: ''
      });
      const input = (genResp.stdout || '').trim();
      if (!input) {
        // skip empty generation
        continue;
      }
      const solResp = await runCodeOnce({
        language: solLang,
        version: draft.solutionVersion || '*',
        files: [{ name: solFile, content: draft.referenceSolution }],
        stdin: input
      });
      const out = (solResp.stdout || '').trim();
      testCases.push({ input, output: out, hidden: i >= visible });
      // light throttle to avoid overloading Piston / local runner
      if (i % 50 === 0) await new Promise(r => setTimeout(r, 50));
    }

    // finalize question
    draft.testCases = testCases;
    draft.testCaseCount = testCases.length;
    await draft.save();

    return res.json({
      success: true,
      questionId: draft._id,
      generated: testCases.length,
      visible,
      hidden: Math.max(0, testCases.length - visible)
    });

  } catch (err) {
    console.error('AI create error', err);
    return res.status(500).json({ error: 'AI create failed', details: err.message });
  }
};