"use strict";

const winston = require("winston"),
    process = require("process"),
    logger = winston.createLogger({
        level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "error",
        transports: [
            new winston.transports.Console()
        ]
    });
module.exports = logger;
