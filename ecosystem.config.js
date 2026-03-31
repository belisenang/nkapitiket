module.exports = {

  apps: [

    {
      name: "api-belisenang",

      script: "./server.js",

      instances: "max",

      exec_mode: "cluster",

      watch: false,

      max_memory_restart: "500M",

      env: {

        NODE_ENV: "production",

        PORT: process.env.PORT || 3000

      }

    },

    {
      name: "ticket-worker",

      script: "./worker.server.js",

      instances: 1,

      max_memory_restart: "300M"

    }

  ]

}