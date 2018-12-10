#!/usr/bin/env node

"use strict";
const path = require("path");


require("yargs")
    .command(
        ["run", "$0"],
        "run feeds watcher",
        (yargs) => {
            yargs
                .positional("input", {
                    alias: "i",
                    describe: "classifier to train"
                });
        },
        (argv) => {
            require(path.join(__dirname, "run"))(argv);
        }
    ).argv;
