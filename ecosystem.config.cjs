module.exports = {
  apps: [
    {
      name: "th1nkmore_web",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      cwd: "./",
      instances: 1, // For Next.js, use 1 instance (it handles clustering internally)
      exec_mode: "fork", // 'fork' mode recommended for Next.js
      watch: false, // Set to true only for development
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      // Advanced settings for robustness
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
    },
  ],
};
