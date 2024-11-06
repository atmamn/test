import winston from "winston";

// Create a Winston logger instance
const logger = winston.createLogger({
  level: "info", // Set the logging level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Log to the console
    new winston.transports.File({ filename: "logs/error.log", level: "error" }), // Log errors to a file
    new winston.transports.File({ filename: "logs/combined.log" }), // Log all messages to a file
  ],
});

// Optional: If not in production, log to the console with colorized output
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
