const axios = require("axios");
const { promisify } = require("util");

const DEFAULT_TIMEOUT = parseInt(process.env.RUN_TIMEOUT_MS || '5000', 10);

function normalizeOutput(output){
    if(typeof output !== 'string') return String(output);
    return output.replace(/\r\n/g, '\n').trim();
}

async function runWithPiston({ language, version = '*', files, stdin = '', timeout = DEFAULT_TIMEOUT}) {
    const pistonUrl = process.env.PISTON_URL;
    const payload = {
        language, 
        version,
        files,
        stdin: `${stdin}\n`,
        run_timeout: Math.ceil(timeout / 1000),
    }

    const resp = await axios.post(pistonUrl, payload, { timeout: timeout + 2000 });
    return resp.data;
}

function checkSizeLimits(codeString, inputString) {
    const codeMax = parseInt(process.env.CODE_MAX_BYTES, 10);
    const inputMax = parseInt(process.env.INPUT_MAX_BYTES, 10);
    if(Buffer.byteLength(codeString, 'utf8') > codeMax){
        const err = new Error('Code size exceeds allowed limit');
        err.code = 'COED_TOO_LARGE';
        throw err;
    }
}

module.exports = {
    runWithPiston,
    checkSizeLimits,
    normalizeOutput,
}