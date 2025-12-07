const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_MEMORY_MB = parseInt(process.env.DEFAULT_MEMORY_LIMIT_MB || '512', 10);
const DEFAULT_CPUS = parseFloat(process.env.DEFAULT_CPU_SHARES || '1.0');

// Create temp directory
async function createTempDir() {
  const dir = path.join(os.tmpdir(), 'judge', uuidv4());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Write code files to temp directory
async function writeFiles(tmpDir, files) {
  await Promise.all(
    files.map(f => fs.writeFile(path.join(tmpDir, f.name), f.content))
  );
}

// Map language to Docker image
function buildDockerImageForLanguage(language) {
  switch (language.toLowerCase()) {
    case 'python':
      return 'judge-python:latest';
    case 'cpp':
      return 'judge-cpp:latest';
    case 'java':
      return 'judge-java:latest';
    default:
      return 'judge-generic:latest';
  }
}

// Run code inside Docker container
async function runInDocker({
  language,
  files,
  stdin = '',
  timeoutMs = 5000,
  memoryMb = DEFAULT_MEMORY_MB,
  cpus = DEFAULT_CPUS,
}) {
  const tmpDir = await createTempDir();
  try {
    await writeFiles(tmpDir, files);
    const image = buildDockerImageForLanguage(language);

    // Determine execution command based on language
    let execCmd;
    switch (language.toLowerCase()) {
      case 'python':
        execCmd = ['python3', '/sandbox/main.py'];
        break;
      case 'cpp':
        execCmd = ['bash', '-c', 'g++ /sandbox/Main.cpp -o /sandbox/a.out && /sandbox/a.out'];
        break;
      case 'java':
        execCmd = ['bash', '-c', 'javac /sandbox/Main.java && java -cp /sandbox Main'];
        break;
      default:
        execCmd = ['bash', '-c', 'echo "Unsupported language"'];
    }

    // Full Docker run command
    const dockerCmd = [
      'run',
      '--rm',
      '--network', 'none',
      `--memory=${memoryMb}m`,
      `--cpus=${cpus}`,
      '--pids-limit=200',
      '-v', `${tmpDir}:/sandbox`,
      image,
      ...execCmd
    ];

    return await new Promise((resolve, reject) => {
      const docker = spawn('docker', dockerCmd, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      const killTimer = setTimeout(() => docker.kill('SIGKILL'), timeoutMs);

      docker.stdout.on('data', d => (stdout += d.toString()));
      docker.stderr.on('data', d => (stderr += d.toString()));

      docker.on('error', err => {
        clearTimeout(killTimer);
        reject(err);
      });

      docker.on('close', code => {
        clearTimeout(killTimer);
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code });
      });

      if (stdin) docker.stdin.write(stdin);
      docker.stdin.end();
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { runInDocker };
