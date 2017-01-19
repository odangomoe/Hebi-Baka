const Scraper = require("./src/Scraper.js");

let scraper = new Scraper({
    mysql:{database:'odangodb', user:'root'},
    translate: {
        'http://open.nyaatorrents.info:6544/announce': 'udp://open.nyaatorrents.info:6544/announce'
    },
    scrape: [
        'udp://open.nyaatorrents.info:6544/announce'
    ]
});

scraper.run(() => {
    console.log("Done!");
});
