const winston = require('winston');

/**
 * Creates a configured winston logger instance.
 * Why: Always log to stdout/stderr in production (Cloud Run captures these).
 * File transports are omitted in production because Cloud Run's filesystem
 * is ephemeral and write attempts cause startup crashes.
 */
const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Always log to stdout — Cloud Run and Cloud Logging capture this automatically
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()          // Structured JSON for Cloud Logging
        : winston.format.simple(),       // Human-readable for local dev
    }),
    // Only write to files in local development — never in production
    ...(!isProduction
      ? [
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: 'combined.log' }),
        ]
      : []),
  ],
});

module.exports = logger;
