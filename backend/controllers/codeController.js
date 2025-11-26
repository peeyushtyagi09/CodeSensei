const asyncHandler = require('../middlewares/asyncHandler');
const { 
    runWithPiston,
    normalizeOutput,
    checkSizeLimits
} = require('../utils/codeRunner');
const Question = require('../models/Question');

function makeFilesPayload({ language, code, filename}) {
    const name = filename || (language === 'python' ? 'main.py' : 'Main.' + (language === 'java' ? 'java' : 'txt'));
    return [{ name, content: code}];
}

exports.runCode = asyncHandler(async (req, res) => {
    
})