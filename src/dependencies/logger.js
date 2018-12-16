"use strict";

const winston = require("winston"),
    process = require("process"),
    logger = winston.createLogger({
        level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "error",
        format: winston.format.combine(
            winston.format.printf(info => {
                const {
                        level,
                        message
                    } = info,
                    context = info;
                delete context.level;
                delete context.message;
                return `${(new Date()).toISOString()} - ${level} - ${message} - ${JSON.stringify(context)}`;
            })
        ),
        transports: [
            new winston.transports.Console()
        ]
    });
module.exports = logger;
