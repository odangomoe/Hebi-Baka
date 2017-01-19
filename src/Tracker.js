const Client = require("bittorrent-tracker").Client;
const _ = require("lodash");

const Tracker = function (url, torrents) {
    this.url = url;
    this.torrents = torrents;
    this.torrentsByInfoHash = _.reduce(torrents, (obj, torr) => { obj[torr.infoHash] = torr; return obj }, {});
    this.infoHashes = torrents.map((a) => Buffer.from(a.infoHash, 'hex'));
};

Tracker.prototype.scrape = function (cb) {
    let count = this.torrents.length;
    let batches = _.chunk(_.reverse(this.infoHashes), 50);

    let client = new Client({
        infoHash: [],
        peerId: Buffer.from('01234567890123456789'),
        port: 35456,
        announce: this.url
    });

    client.on("warning", cb);
    client.on("error", cb);

    client.on("scrape", (data) => {
        this.torrentsByInfoHash[data.infoHash].save(true, this.url, data.complete, data.incomplete, data.downloaded, (err) => {
            count -= 1;
            console.log(`${count} torrents left`);
            if (count === 0) {
                console.log(`Im done, going to next Tracker`);
                cb();
            }
        });
    });

    next();

    function next() {
        let batch = batches.shift();
        client.scrape({
            infoHash: batch
        });

        if (batches.length > 0) {
            setTimeout(next, 200);
        }
    }
};

module.exports = Tracker;