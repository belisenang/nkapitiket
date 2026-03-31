const express = require("express")
require("dotenv").config();

const http = require("http");

const expressLoader = require("./loaders/express");

const sequelizeLoader = require("./loaders/sequelize");

const logger = require("./config/logger");

const startTicketCron = require("./api/cron/ticketSender.cron");

const expireOrderCron = require("./api/cron/expireOrder.cron");

const { initSocket } = require("./utils/socket");

const { exec } = require("child_process")
const crypto = require("crypto")
async function startServer() {

  await sequelizeLoader();

  const app = expressLoader();

  const server = http.createServer(app);

  const io = initSocket(server);

  app.set("io", io);

  const PORT = process.env.PORT || 5000;

  await startTicketCron();

  await expireOrderCron();
  
  app.post("/deploy", express.json({

    verify: (req, res, buf) => {

      req.rawBody = buf

    }

  }), (req, res) => {

    const signature =
      req.headers["x-hub-signature-256"]

    const expected =
      "sha256=" +
      crypto
        .createHmac(
          "sha256",
          process.env.DEPLOY_SECRET
        )
        .update(req.rawBody)
        .digest("hex")

    if (signature !== expected) {

      return res
        .status(403)
        .json({
          success: false,
          message: "invalid signature"
        })

    }

    console.log("github webhook verified")

    exec(
      "sh /www/wwwroot/api.belisenang.id/deploy.sh",
      (err, stdout, stderr) => {

        console.log(stdout)

        if (err) {

          console.error(stderr)

        }

      }
    )

    res.json({

      success: true

    })

  })

  server.listen(

    PORT,

    () => {

      logger.info(

        `🚀 Server running on port ${PORT}`

      );

    }

  );

}

startServer();