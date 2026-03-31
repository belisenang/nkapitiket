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