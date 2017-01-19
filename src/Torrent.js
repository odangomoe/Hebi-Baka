const Torrent = function (conn, id, infoHash, trackers) {
    this.conn = conn;
    this.id = id;
    this.infoHash = infoHash;
    this.trackers = trackers;
    this.takes = false;
};

Torrent.prototype.hasTracker = function (tracker) {

    let yes = this.trackers.indexOf(tracker) !== -1;
    if (yes) {
        this.takes = tracker;
    }

    return yes;
};

Torrent.prototype.save = function (success, tracker, seeders, leeches, downloaded, cb) {
    console.log(`Saving Torrent[${this.infoHash}#${this.id}] with [${seeders}, ${leeches}, ${downloaded}] for Tracker[${tracker}]`);
    this.conn.query(
        "INSERT INTO torrent_status (`torrent_id`, `success`, `tracker`, `seeders`, `leechers`, `downloaded`, `last_updated`, `created_at`) VALUES " +
        "(?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `success`= ?, `tracker` = ?, `seeders` = ?, `leechers` = ?, `downloaded` = ?, `last_updated` = ?",
        [
            this.id,
            success,
            tracker,
            seeders,
            leeches,
            downloaded,
            new Date(),
            new Date(),
            success,
            tracker,
            seeders,
            leeches,
            downloaded,
            new Date()
        ],
        cb
    );
};

module.exports = Torrent;