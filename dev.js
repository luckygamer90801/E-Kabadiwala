const { spawn } = require('child_process');
const path = require('path');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', ' Starting Kabadiwala Connect (Server + Client)  ');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

function runService(name, cwd, color) {
  const child = spawn(`${npmCmd} run dev`, {
    cwd: path.join(__dirname, cwd),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m Process exited with code ${code}`);
  });

  return child;
}

const serverProcess = runService('server', 'server', '\x1b[35m'); // magenta
const clientProcess = runService('client', 'client', '\x1b[32m'); // green

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\nShutting down dev servers...');

  const killChild = (child) => {
    if (child && child.pid && !child.killed) {
      if (process.platform === 'win32') {
        try {
          spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
        } catch (_) {}
      } else {
        try {
          child.kill('SIGINT');
        } catch (_) {}
      }
    }
  };

  killChild(serverProcess);
  killChild(clientProcess);

  setTimeout(() => {
    process.exit(0);
  }, 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
