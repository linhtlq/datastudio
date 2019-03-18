const EE = require('../EE');
const ee = new EE();
const sleep = require('sleep');
var LOCK_DURATION = 60 * 1000;
const AsyncLock = require('async-lock');
var lock = new AsyncLock({
    timeout: LOCK_DURATION
});
var LOCK_DURATION = 60 * 1000;
var _sessionId = ee.getSessionId();

class FacebookAd {
    getSessionId() {
        return _sessionId;
    }

    mapQuery(name) {
        if (name == DIMENSION_COUNTRY) {
            return 'country';
        }
        return name;
    }

    mapHeader(name) {
        if (name == 'country') {
            return DIMENSION_COUNTRY;
        }
        return name;
    }

    addDay(date) {
        var result = new Date(date);
        result.setDate(result.getDate() + 1);
        return result;
    }

    formatQueryUrl(appId, accessToken, breakdowns, metrics, since, until) {
        var format = [
            `https://graph.facebook.com`,
            `/v${2.11}`,
            `/${appId}`,
            `/adnetworkanalytics`,
            `?access_token=${accessToken}`,
            `&breakdowns=[${ee.joinWithQuote(breakdowns)}]`,
            `&metrics=[${ee.joinWithQuote(metrics)}]`,
            `&since=${ee.formatDate(addDay(since))}`,
            `&until=${ee.formatDate(addDay(until))}`,
            `&aggregation_period=day`
        ].join('');
        return format;
    }

    formatQueryResultUrl(appId, accessToken, queryIds) {
        var format = [
            `https://graph.facebook.com`,
            `/v${2.11}`,
            `/${appId}`,
            `/adnetworkanalytics_results`,
            `?query_ids=[${ee.joinWithQuote(queryIds)}]`,
            `&access_token=${accessToken}`
        ].join('');
        return format;
    }

    retrieveQueryId(url) {
        var result = ee.sendHttpPOST(url, options).then(res => {
            return res.json();
        }).then(json => {
            dict[JSON.parse(json)];
            return dict.query_id;
        });
        return result;
    }

    retrieveData(url) {
        var result = ee.sendHttpGET(url, {}).then(res => {
            return res.json();
        }).then(json => {
            dict[JSON.parse(json)];
            return dict.data;
        });
        return result;

        // Format:
        // {
        //   "data": [{
        //     "query_id": "xxxx",
        //     "status": "invalid"
        //   }, {
        //     "query_id": "xxxx",
        //     "status": "requested"
        //   }, {
        //     "query_id": "xxxx",
        //     "status": "running",
        //   }, {
        //     "query_id": "xxxx",
        //     "status": "complete",
        //     "results": [{
        //       "time": "yyyy-MM-ddThh:mm:ss+xxx",
        //       "metric": "xxxx",
        //       "breakdowns: [{
        //         "key": "xxxx",
        //         "value": "xxxx"
        //       }],
        //       "value": "xxxx"
        //     }]
        //   }]
        // }
    }

    retrieveQueryIds(appIds, accessToken, dimensions, metrics, since, until, maxRange) {
        var dimensionsWithoutDate = dimensions.filter(function (item) {
            return item != DIMENSION_DATE;
        });

        var urls = [];
        while (since <= until) {
            var next = new Date(since);
            next.setDate(next.getDate() + maxRange);
            if (next > until) {
                next = until;
            }
            urls.extend(appIds.map(function (appId) {
                return formatQueryUrl(
                    appId,
                    accessToken,
                    dimensionsWithoutDate.map(mapQuery),
                    metrics,
                    since,
                    next
                );
            }));
            since = new Date(next);
            since.setDate(since.getDate() + 1);
        }

        console.log(Utilities.formatString('%s: urls = %s', getSessionId(), JSON.stringify(urls)));
        var queryIds = urls.map(function (url) {
            return retrieveQueryId(url);
        });

        return queryIds;
    }

    retrieveRawData(appId, accessToken, queryIds, maxAttempts, sleepDuration) {
        var attempts = 0;
        var results = [];
        while (queryIds.length > 0 && attempts < maxAttempts) {
            sleep.sleep(sleepDuration);
            ++attempts;

            var queriedIds = [];
            queryIds.forEach(function (queryId) {
                var url = this.formatQueryResultUrl(appId, accessToken, [queryId]);
                var data = this.retrieveData(url);

                data.forEach(function (item) {
                    var id = item.query_id;
                    var status = item.status;
                    if (status == 'complete' || status == 'invalid') {
                        queriedIds.push(id);
                        if (status == 'complete') {
                            if ('results' in item) {
                                results.extend(item.results);
                            }
                        }
                    }
                });
            });

            queriedIds.forEach(function (queryId) {
                // Remove from the queue.          
                var index = queryIds.indexOf(queryId);
                queryIds.splice(index, 1);
            });
        }
        return results;
    }

    parseData(data, useDate, metrics) {
        data.sort(function (lhs, rhs) {
            if (lhs.time != rhs.time) {
                return lhs.time < rhs.time ? -1 : 1;
            }
            if ('breakdowns' in lhs) {
                var lhsBreakdowns = JSON.stringify(lhs.breakdowns);
                var rhsBreakdowns = JSON.stringify(rhs.breakdowns);
                if (lhsBreakdowns != rhsBreakdowns) {
                    return lhsBreakdowns < rhsBreakdowns ? -1 : 1;
                }
            }
            if (lhs.metric != rhs.metric) {
                return lhs.metric < rhs.metric ? -1 : 1;
            }
            return 0;
        });

        var parsedData = [];
        for (var i = 0; i < data.length; i += metrics.length) {
            var dict = {};
            var item = data[i];
            if (useDate) {
                dict[DIMENSION_DATE] = ee.parseDate(item.time);
            }
            if ('breakdowns' in item) {
                item.breakdowns.forEach(breakdown => {
                    var header = mapHeader(breakdown.key);
                    var value = breakdown.value;
                    dict[header] = value;
                });
            }
            for (var j = 0; j < metrics.length; ++j) {
                var k = i + j;
                var metric = mapHeader(data[k].metric);
                var value = data[k].value;
                dict[metric] = value;
            }
            parsedData.push(dict);
        }

        return parsedData;
    }

    buildKey(appIds, accessToken, dimensions, metrics, since, until) {
        var params = [];
        params.extend(appIds);
        params.push(accessToken);
        params.extend(dimensions);
        params.extend(metrics);
        params.push(ee.formatDate(since));
        params.push(ee.formatDate(until));
        return params.join('|');
    }

    requestHttp(appIds, accessToken, dimensions, metrics, since, until, useCache) {
        var parsedData = undefined;
        var result = lock.acquire(key, (done) => {
            data = this.downloadData(username, secretKey, url);
            var useDate = dimensions.includes(DIMENSION_DATE);
            parsedData = this.parseData(data, useDate, metrics);
            done();
        }, (err, ret) => {
            return parsedData;
        })

        return result;
    }
}

module.exports = FacebookAd;