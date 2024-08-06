const winston = require('winston');
const path = require('path');

class CustomLogger {
    static getLogger(name) {
        const logFilePath = 'run.log'; // Specify the log file path

        const logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }),
                winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`)
            ),
            transports: [
                new winston.transports.File({
                    filename: logFilePath,
                    level: 'info',
                    format: winston.format.combine(
                        winston.format.printf(info => `${info.timestamp} - ${name} - ${info.level.toUpperCase()} - ${info.message}`)
                    )
                }),
                new winston.transports.Console({
                    level: 'info',
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(info => `${info.timestamp} - ${name} - ${info.level.toUpperCase()} - ${info.message}`)
                    )
                })
            ]
        });

        return logger;
    }
}

module.exports = CustomLogger;
