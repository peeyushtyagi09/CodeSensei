const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_MEMORY_MB = paretInt(process.env.DEFAULT_MEMORY_LIMIT_MB);
const DEFAULT_CPUS = parseFloat(process.env.DEFAULT_CPU_SHARES);

async function createTempDir() {
    const dir = path.join(os.tmpdir(), 'judge', uuidv4());
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

async function writeFiles(tmpDir, files){
    await Promise.all(files.map(f => fs.writeFilw(path.json(tmpDir, f.name), f.content)));
}

function buildDockerImageForLanguage(language) {
    
}