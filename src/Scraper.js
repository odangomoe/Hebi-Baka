const _ = require("lodash");
const mysql2 = require("mysql2");
const Torrent = require("./Torrent.js");
const Tracker = require("./Tracker.js");


const Scraper = function (config) {
    this.config = config;
    this.torrents = [];
    this.trackers = [];
};

Scraper.prototype.init = function () {
    this.conn = mysql2.createConnection(this.config.mysql);
};

Scraper.prototype.done = function (cb) {
    this.conn.destroy();
    cb();
};

Scraper.prototype.run = function (cb) {
    cb = cb || function(){};

    this.init();
    this.loadTorrents((err, torrents) => {
        if (err) {
            return cb(err);
        }

        this.torrents = _.filter(torrents, (torrent) => _.some(this.config.scrape, (tracker) => torrent.hasTracker(tracker)));

        this.loadTrackers((err) => {
            if (err) {
                return cb(err);
            }

            this.scrape((err) => {
                if (err) {
                    return cb(err);
                }

                console.log("Scrape done!");
                this.done(cb);
            });
        })
    });
};

Scraper.prototype.loadTrackers = function (cb) {
    _.each(this.config.scrape, (tracker) => {
        let trackerObj = new Tracker(tracker, _.filter(this.torrents, { takes: tracker }));
        this.trackers.push(trackerObj);
    });

    cb();
};

Scraper.prototype.scrape = function (cb) {
    let trackers = _.concat([], this.trackers);

    next();

    function next() {
        let tracker = trackers.shift();
        console.log(`Started scraping from Tracker[${tracker.url}]`);
        tracker.scrape((err) => {
            if (err) {
                return cb(err);
            }

            console.log(`Tracker[${tracker.url}] is done`);

            if (trackers.length > 0) {
                next();
            } else {
                console.log("Calling callback");
                cb();
            }
        })
    }
};

Scraper.prototype.loadTorrents = function(cb) {
    let torrents = [];

    this.conn.query('SELECT id, info_hash, trackers FROM torrent', (err, torrentRows) => {
        if (err) {
            return cb(err);
        }

        _.each(torrentRows, (torrentRow) => {
            let trackers = torrentRow.trackers.substr(2, torrentRow.trackers.length - 4).split(' | ').map(_.trim).map((a) => this.config.translate[a]||a);
            torrents.push(new Torrent(this.conn, torrentRow.id, torrentRow.info_hash, trackers));
        });

        cb(null, torrents);
    });
};

module.exports = Scraper;