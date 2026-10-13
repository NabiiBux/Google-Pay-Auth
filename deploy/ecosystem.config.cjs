module.exports = {
  apps: [
    {
      name: 'gnbmentor-pay',
      cwd: '/var/www/pay.gnbmentor.com',
      script: 'server.ts',
      interpreter: 'tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'gnbmentor-portal',
      cwd: '/var/www/portal.gnbmentor.com',
      script: 'server.ts',
      interpreter: 'tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
