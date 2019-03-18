var http = require('http');
const EE = require('../EE')
const ee = new EE();
const hostName = '127.0.0.1';
const port = 3000;
const AsyncLock = require('async-lock');
var LOCK_DURATION = 60 * 1000;
var lock = new AsyncLock({
    timeout: LOCK_DURATION
});

var LOCK_DURATION = 60 * 1000;
var DIMENSION_APPLICATION = 'application';
var DIMENSION_PLACEMENT = 'placement';
var DIMENSION_DATE = 'date';
var DIMENSION_COUNTRY = 'country_iso_code';
var _sessionId = ee.getSessionId();

class Vungle {
    mapQuery(name) {
        if (name == DIMENSION_COUNTRY) {
            return 'country';
        }

        return name;
    }

    mapHeader(name) {
        if (name == 'application name') {
            return DIMENSION_APPLICATION;
        }
        if (name == 'country') {
            return DIMENSION_COUNTRY;
        }
        if (name == 'placement name') {
            return DIMENSION_PLACEMENT;
        }
        return name;
    }

    formatUrl(dimensions, metrics, since, until) {
        var format = [
            `https://report.api.vungle.com/ext/pub/reports/performance`,
            `?start=${ee.formatDate(since)}`,
            `&end=${ee.formatDate(until)}`,
            `&aggregates=${metrics.join(',')}`
        ].join('');

        if (dimensions.length > 0) {
            var url = `${format}&dimensions=${dimensions.join(',')}`;
        }
        return url;
    }

    downloadData(apiKey, url) {
        var options = {
            headers: {
                Authorization: (`Bearer ${apiKey}`),
                Accept: 'application/json',
                'Vungle-Version': '1'
            }
        };

        var result = ee.sendHttpGET(url, options).then(res => {
            return res.json();
        }).then(json => {
            return json;
        });

        return result;
    }

    getSessionId() {
        return _sessionId;
    }

    buildKey(apiKey, dimensions, metrics, since, until) {
        var params = [];
        params.push(apiKey);
        params.extend(dimensions);
        params.extend(metrics);
        params.push(ee.formatDate(since));
        params.push(ee.formatDate(until));
        return params.join('|');
    }

    requestHttp(apiKey, dimensions, metrics, since, until, useCache) {
        var url = this.formatUrl(dimensions.map(this.mapQuery), metrics.map(this.mapQuery), since, until);
        return new Promise((resolve, reject) => {
            // var key = ee.hash(this.buildKey(apiKey, dimensions, metrics, since, until));
            this.retrieveData(`key`, apiKey, url).then((data) => {
                var parsedData = this.parseData(data);
                resolve(parsedData);
            });
        });
    }

    mapHeader(name) {
        if (name == 'application name') {
            return DIMENSION_APPLICATION;
        }
        if (name == 'country') {
            return DIMENSION_COUNTRY;
        }
        if (name == 'placement name') {
            return DIMENSION_PLACEMENT;
        }
        return name;
    }

    retrieveData(key, apiKey, url) {
        var data = undefined;
        lock.acquire(key, (done) => {
            data = this.downloadData(apiKey, url).then(result => {
                done();
                return result;
            }).catch((error) => {
                console.log("Error " + error);
                done();
            });
        }, (err, ret) => {})
        return data;
    }

    parseData(data) {
        var rows = [];
        data.forEach(item => {
            var dict = {};
            Object.keys(item).forEach(key => {
                var header = this.mapHeader(key);
                var value = item[key];
                if (header == DIMENSION_DATE) {
                    value = ee.parseDate(value);
                }
                dict[header] = value;
            });
            rows.push(dict);
        });
        return rows;
    }
}

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/plan');
    res.end('Yay Me\n');
});

server.listen(port, hostName, () => {
    console.log(`Server running at http:// ${hostName}:${port}/`);
});

function __testVungle() {
    const dimensions = ["application", "date"];
    const metrics = ["revenue"]
    const since = `2019-02-17`;
    const until = `2019-03-18`;
    const requestParams = {
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
    const CONFIG_VUNGLE_API_KEY = 'VUNGLE_API_KEY';
    var vungle = new Vungle();
    var data = vungle.requestHttp(requestParams[CONFIG_VUNGLE_API_KEY], dimensions, metrics, since, until, true);
    data.then((data) => {
        console.log(data);
    }).catch(error => {
        console.log("error " + error);
    });
}

__testVungle();
module.exports = Vungle;