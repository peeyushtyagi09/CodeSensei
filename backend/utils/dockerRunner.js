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
    switch(language) {
        case 'Python': return 'judge-python:latest';
        case 'cpp': return 'judge-app:latest';
        case 'java': return 'judge-java:latest';
        default: return 'judge-generic:latest';
    }
}


/**
 * runs uuser code in docker
 * options: 
 * - laguage
 * - files: [{ name, content}]
 * - stdin
 * - timeoutMs
 * - memoryMb
 * - cpus
 */

async function runInDocker({ language, files, stdin = '', timeoutMs = 5000, memoryMb = DEFAULT_MEMORY_MB, cpus = DEFAULT_CPUS }){
    const tmpDir = await createTempDir();
    try {
        await writeFiles(tmpDir, files);
        const image = buildDockerImageForLanguage(language);

        const containerCmd = [
            'run', '--rm',
            '--network', 'none',
            `--memory=${memoryMb}m`,
            `cpus=${cpus}`,
            '--pids-limit=200',
            '-v', `${tmpDir}:/sandbox:ro`,
            image
        ];

        return await new Promise((resolve, reject) => {
            const docker = spawn('docker', containerCmd, { stdio: ['pipe', 'pipe', 'pipe']});

            let stdout = '';
            let stderr = '';
            let timeOut = setTimeout(() => {
                timeOut = true;
                docker.Kill('SIGKILL');
            }, timeoutMs);

            docker.stdout.on('data', d => stdout += d.toString());
            docker.stderr.on('data', d => stderr += d.toString());

            docker.on('error', (err) => {
                clearTimeout(KillTimer);
                reject(err);
            });

            docker.on('close', (code, signal) => {
                clearTimeout(KillTimer);
                resolve({
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: code, 
                    signal,
                    timeOut
                });
            });

            if(stdin) {
                docker.stdin.write(stdin);
            }
            docker.stdin.end();
        });
    } finally {
        try {
            await fs.rm(tmpDir, { recursive: true, force: true});
        }catch (e){

        }
    }
}
module.exports = { runInDocker };