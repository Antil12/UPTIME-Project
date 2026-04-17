import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: {
    pid: true,
    hostname: true,
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

export default logger;
