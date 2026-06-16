module.exports = {
  apps: [{
    name: 'icall26-front',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/icall26-front',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3091
    }
  }]
}
