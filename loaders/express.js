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
const { sequelize } = require("../models");
const redis = require("../utils/redisBull");
const { Queue } = require("bullmq")
const connection = require("../utils/redisBull")
module.exports = () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const allowedOrigins = process.env.CORS_ORIGIN

  app.use(cors({
    origin: function (origin, callback) {

      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error("Not allowed by CORS"))
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key"
    ]

  }))

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

  app.get("/health", (req, res, next) => {
    if (req.headers["x-api-key"] !== process.env.HEALTH_KEY) {
      return res.status(403).json({ status: "forbidden" })
    }
    next()
  })

  app.get("/health", async (req, res) => {
    try {

      await sequelize.authenticate()

      await redis.ping()

      const emailQueue = new Queue("ticket-email", { connection })
      const counts = await emailQueue.getJobCounts()

      res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date(),
        services: {
          database: "connected",
          redis: "connected"
        },
        memory: {
          rss: process.memoryUsage().rss,
          heapUsed: process.memoryUsage().heapUsed
        },
        queues: {
          "ticket-email": counts
        }
      })

    } catch (err) {

      res.status(500).json({
        status: "error",
        message: err.message
      })

    }
  })

  app.use(errorHandler);

  return app;
};
