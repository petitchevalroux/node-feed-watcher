"use strict";

const path = require("path"),
    FeedWatcher = require(path.join(__dirname, "..", "..", "src", "libraries",
        "feed-watcher")),
    assert = require("assert"),
    sinon = require("sinon"),
    {
        PassThrough
    } = require("stream");

describe("libraries/feedWatcher", () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        sandbox.restore();
    });

    describe("constructor", () => {
        it("set default frequency", () => {
            const feedWatcher = new FeedWatcher();
            assert.equal(typeof(feedWatcher.frequency), "number");
        });
    });

    describe("start", () => {
        it("call feedReader.run", (done) => {
            const feedWatcher = new FeedWatcher();
            sandbox.stub(feedWatcher.feedReader, "run").callsFake(() => {
                assert(feedWatcher.feedReader.run.called);
                done();
            });
            feedWatcher.start();
        });

        it("return a readable stream", () => {
            const stream = (new FeedWatcher()).start();
            assert.equal(typeof stream, "object");
            assert.equal(typeof stream.read, "function");
            assert.equal(typeof stream.pipe, "function");
            assert.equal(typeof stream.on, "function");
        });
    });

    describe("add", () => {
        it("write readable stream content to feedReader.feedsInStream", () => {
            const feedWatcher = new FeedWatcher(),
                stream = new PassThrough({
                    objectMode: true
                }),
                feeds = [];
            feedWatcher.feedReader.feedInStream.on("data", (feed) => {
                feeds.push(feed);
            });
            stream.write({
                "url": "http://example.com/feed-1"
            }, undefined, () => {
                stream.write({
                    "url": "http://example.com/feed-2"
                }, undefined, () => {
                    stream.end();
                });
            });

            return feedWatcher.add(stream).then(() => {
                assert.deepEqual(
                    feeds,
                    [{
                        url: "http://example.com/feed-1"
                    },
                    {
                        url: "http://example.com/feed-2"
                    }
                    ]);
                return feeds;
            });
        });
    });

    it("copy finished feeds to feedReader.feedInStream according to frequency", (done) => {
        const feedWatcher = new FeedWatcher({
            frequency: 0.1
        });
        feedWatcher.feedReader.feedInStream.on("data", (data) => {
            assert(((new Date()).getTime() - data.date.getTime()) >=
                feedWatcher.frequency * 1000);
            done();
        });
        feedWatcher.feedReader.feedOutStream.write({
            "url": "http://example.com/feed-2",
            "date": new Date()
        });
    });



});
