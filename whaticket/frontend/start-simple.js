const { spawn } = require('child_process');

// Configurações de ambiente sem debugger
const env = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=4096',
  BROWSER: 'none',
  PORT: '3000',
  REACT_APP_BACKEND_URL: 'http://localhost:8081'
};

// Remove qualquer configuração de debugger
delete env.NODE_INSPECT;
delete env.NODE_DEBUG;

console.log('Iniciando frontend React...');
console.log('Backend URL:', env.REACT_APP_BACKEND_URL);
console.log('Frontend Port:', env.PORT);

const child = spawn('npm', ['run', 'start-no-debug'], {
  env,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Erro ao iniciar:', err);
});

child.on('exit', (code) => {
  console.log('Processo finalizado com código:', code);
});