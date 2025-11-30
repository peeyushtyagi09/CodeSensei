const Question = require("../models/Question");
const { runWithPiston } = require("../utils/codeRunner");

function getFileName(language){
    switch(language) {
        case "python": return "main.py";
        case "cpp":
        case "c++": return "main.cpp";
        case "javascript":
        case "node": return "main.js";
        case "java": return "Main.java";
        case "c": return "main.c";
        case "go": return "main.go";
        case "typescript": return "main.ts";
        default: return "main.txt";
    }
}

exports.generateTestcases = async(req, res) => {
    try {
        const { questionId } = req.params;
        const question = await Question.findById(questionId);

        if(!question.generatorScript || !question.referenceSolution) {
            return res.status(400).json({ error: "Generator script and refernce solution required"});
        }

        const totalCases = Math.floor(Math.random() * (1500 - 1200 + 1)) + 1200;
        const visibleLimit = 20;
        const testCases = [];

        const genFile = getFileName(question.generatorLanguage);
        const solFile = getFileName(question.solutionLanguage);
        

        for(let i = 0; i < totalCases; i++){
            const genResp = await runWithPiston({
                language: question.generatorLanguage,
                version: question.genartorVersion || "*",
                files: [{ name: genFile, content: question.generatorScript}],
                stdin: ""
            });
            const input = genResp.run?.stdout?.trim() || "";


            // 2. Run refernce solution (any language)
            const solResp = await runWithPiston({
                language: question.solutionLanguage,
                version: question.solutionVersion || "*",
                files: [{ name: solFile, content: question.referenceSolution}],
                stdin: input
            });

            const outputData = solResp.run?.stdout?.trim() || "";

            testCases.push({
                input: input,
                output: outputData,hidden: i >= visibleLimit
            });
        }

        question.testCases = testCases;
        question.testCaseCount = testCases.length;
        await question.save();

        return res.json({
            success: true,
            generated: totalCases,
            visible: visibleLimit, 
            hidden: totalCases - visibleLimit
        });
    }catch (err) {
        console.error("Generator Error:", err.message);
        return res.status(500).json({ error: 'Generator failed', details: err.message });
    }
}