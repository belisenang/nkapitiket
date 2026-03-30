module.exports = {
  apps: [

    {
      name: "api-belisenang",

      script: "./server.js",

      instances: 1,
      exec_mode: "fork",

      autorestart: true,

      watch: false,

      max_memory_restart: "300M",

      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    },

    {
      name: "ticket-worker",

      script: "./worker.server.js",

      instances: 1,
      exec_mode: "fork",

      autorestart: true,

      watch: false,

      env: {
        NODE_ENV: "production"
      }
    }

  ]
}