module.exports = {
  apps: [
    {
      name: 'whaticket-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3000,
        GENERATE_SOURCEMAP: 'false'
      }
    }
  ]
};
EOF < /dev/null