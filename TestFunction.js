const http = require('http');
const hostName = '127.0.0.1';
const port = 3000;
const EE = require("./EE")
const ee = new EE();
const CONFIG_VUNGLE_API_KEY = 'VUNGLE_API_KEY';
const configParams = {
    "IRON_SOURCE_SECRET_KEY": "d0afe12655aee19d7225146067e91d19",
    "ANDROID_PUBLISHER_BUCKET_ID": "pubsite_prod_rev_05516955096500763610",
    "VUNGLE_API_KEY": "b9bc51ef7eebd4b46cd879e1eaaebf24",
    "UNITY_ADS_API_KEY": "4f9c2ab6f4930bfbe8603f9d56ca9c3b9d6dd1a699f8039ac4bf8a52cf8f6585",
    "GOOGLE_ANALYTICS_VIEW_ID": "164106735",
    "FACEBOOK_ADS_ACCESS_TOKEN": "EAAMWqGMZA1zMBAAd76ZAFqcbQ9uk9ODhTQRsRLVRAA5p7OB08CZANXDUoLkJAUvskTW4ZBGODA8CvohdsY7yFLeeE9F7R1rRY14aZB9YdCPQ9SZAQJ69RYD5cXjZCHM4EirqlAn4Ef3yJGDZCU8ZCViWSt8lvKovqUkn2wJdtDagIqpA3qdeeLQ8a",
    "IRON_SOURCE_USERNAME": "senspark.prod@gmail.com",
    "FACEBOOK_ADS_APP_ID": "869337403086643",
    "config_unity_ads_android_game_ids": "73406",
    "config_unity_ads_ios_game_ids": "1423604"
}
const apiKey = configParams[CONFIG_VUNGLE_API_KEY];

const url = `https://report.api.vungle.com/ext/pub/reports/performance?start=2019-02-17&end=2019-03-18&aggregates=revenue&dimensions=application,date`;
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/plan');
    res.end('Yay Me\n');
    console.log(vungle.getSessionId());
    console.log(vungle.getConfig());
});

server.listen(port, hostName, () => {
    console.log(`Server running at http:// ${hostName}:${port}/`);
});

async function testFetchApi() {
    var options = {
        headers: {
            Authorization: (`Bearer ${apiKey}`),
            Accept: 'application/json',
            'Vungle-Version': '1'
        }
    };
    options.method = "GET";

    var res = await ee.sendHttp(url, options);
    var data = await res.json();
    return data;
}

var AsyncLock = require('async-lock');
var lock = new AsyncLock({
    timeout: (5000 * 60)
});

function operation(key, name) {
    console.log(key + " " + name + " " + " calling operation");
    lock.acquire(key, (done) => {
        console.log(key + " " + name + " " + " Running operation")
        if (name === 'a') {
            setTimeout(() => {
                console.log(key + " " + name + " Finishing operation")
                done();
            }, 5000)
        } else {
            setTimeout(() => {
                console.log(key + " " + name + " Finishing operation")
                done();
            }, 3000)
        }
    }, function (err, ret) {
        var uuid = '????';
        console.log(key + " " + name + " " + " Freeing lock", uuid);
        console.log("-------------------------");
    }, {});
}


operation('key1', 'a'); // will Run
operation('key1', 'b'); // will Wait the 1st
operation('key1', 'c'); // will Run Paralell with the 1st