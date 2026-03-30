const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression")
const routes = require("../api/routes");
const logger = require("../config/logger");
const errorHandler = require("../api/middlewares/error.middleware");
const sanitize = require('../api/middlewares/xss.middleware');
const path = require("path");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");

module.exports = () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const allowedOrigins = [
    "http://localhost:4000",
    "https://dash-belisenang.vercel.app",
  ];

  app.use(
    cors({
      origin: [
        "http://localhost:4000",
        "https://dash-belisenang.vercel.app",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-api-key"
      ],
    })
  );

  app.use(compression())
  app.use(sanitize);
  app.use(hpp());

  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "http://localhost:3000",
            "http://localhost:3500",
            "https://biodegradable-pat-doubly.ngrok-free.dev",
            "https://*.googleusercontent.com",
          ],
        },
      },
    })
  );
  app.use("/api", routes);
  app.use(
    "/uploads",
    (req, res, next) => {
      res.removeHeader("Cross-Origin-Resource-Policy");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      next();
    },
    express.static(path.join(__dirname, "../public/uploads"))
  );

  app.get("/health", (req, res) => {

    res.status(200).json({

      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date()

    })

  })
  // Load Swagger docs
  // swaggerLoader(app);

  app.use(errorHandler);

  return app;
};
