require("dotenv").config();

const http =
  require("http");

const expressLoader =
  require("./loaders/express");

const sequelizeLoader =
  require("./loaders/sequelize");

const logger =
  require("./config/logger");

const startTicketCron =
  require("./api/cron/ticketSender.cron");

const expireOrderCron =
  require("./api/cron/expireOrder.cron");

const {
  initSocket
} =
  require("./utils/socket");

const { exec } = require("child_process")

async function startServer() {

  await sequelizeLoader();

  const app =
    expressLoader();


  /*
  create HTTP server
  */
  const server =
    http.createServer(app);


  /*
  attach socket
  */
  const io =
    initSocket(server);


  app.set("io", io);


  const PORT =
    process.env.PORT || 3000;


  await startTicketCron();

  await expireOrderCron();

  app.post("/deploy", (req, res) => {

    console.log("github webhook received")

    exec("sh /www/wwwroot/api.belisenang.id/deploy.sh",
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

  }); 

  app.post("/dashboard", (req, res) => {
  
      console.log("webhook dashboard triggered");
  
      exec("/www/wwwroot/deploy-dashboard.sh", (err, stdout, stderr) => {
  
          if (err) {
              console.error(stderr);
              return res.status(500).json({
                  success: false,
                  error: stderr
              });
          }
  
          console.log(stdout);
  
          res.json({
              success: true,
              message: "dashboard deployed"
          });
  
      });
  
  });

  /*
  IMPORTANT
  */
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