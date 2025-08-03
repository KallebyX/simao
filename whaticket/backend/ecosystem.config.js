module.exports = {
  apps: [
    {
      name: 'whaticket-backend',
      script: 'npm',
      args: 'run dev:server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8081,
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USER: 'whaticket',
        DB_PASS: 'whaticket123',
        DB_NAME: 'whaticket',
        REDIS_URI: 'redis://localhost:6379',
        BACKEND_URL: 'http://localhost:8081',
        FRONTEND_URL: 'http://localhost:3000'
      }
    }
  ]
};
EOF < /dev/null