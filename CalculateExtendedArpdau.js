const http = require('http');
const hostName = '127.0.0.1';
const port = 3000;
const EE = require('./EE')
const ee = new EE();

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/plan');
    res.end('Yay Me\n');
});

server.listen(port, hostName, () => {
    console.log(`Server running at http:// ${hostName}:${port}/`);
});

const data = [{
        "date": "20180801",
        "revenue": 122.42
    },
    {
        "date": "20180810",
        "revenue": 30.34
    }, {
        "date": "20180812",
        "revenue": 68.96000000000001
    }, {
        "date": "20180813",
        "revenue": 53.28
    }, {
        "date": "20180814",
        "revenue": 59.89
    }, {
        "date": "20180815",
        "revenue": 104.55
    }, {
        "date": "20180816",
        "revenue": 62.290000000000006
    }, {
        "date": "20180817",
        "revenue": 85.4
    }, {
        "date": "20180818",
        "revenue": 72.9
    }, {
        "date": "20180819",
        "revenue": 49.23
    }, {
        "date": "20180820",
        "revenue": 98.35999999999999
    }, {
        "date": "20180821",
        "revenue": 78.08
    }, {
        "date": "20180822",
        "revenue": 92.96000000000001
    }, {
        "date": "20180823",
        "revenue": 99.02000000000001
    }, {
        "date": "20180824",
        "revenue": 99.15
    }, {
        "date": "20180825",
        "revenue": 125.81
    }, {
        "date": "20180826",
        "revenue": 36.82
    }, {
        "date": "20180827",
        "revenue": 54.38
    }, {
        "date": "20180828",
        "revenue": 102.09
    }, {
        "date": "20180829",
        "revenue": 109.30000000000001
    }, {
        "date": "20180830",
        "revenue": 146.54
    }, {
        "date": "20180831",
        "revenue": 115.19
    }, {
        "date": "20180901",
        "revenue": 146.27
    }, {
        "date": "20180902",
        "revenue": 35.42
    }, {
        "date": "20180903",
        "revenue": 92.34
    }, {
        "date": "20180904",
        "revenue": 134.75
    }, {
        "date": "20180905",
        "revenue": 77.65
    }, {
        "date": "20180906",
        "revenue": 79.18
    }, {
        "date": "20180930",
        "revenue": 142.63
    }
];

var DIMENSION_DATE = 'date';
var DIMENSION_PLATFORM = 'platform';
var METRIC_ARPDAU = 'arpdau'; // Daily.
var METRIC_ARPDAU_7 = 'arpdau_7'; // Weekly.
var METRIC_ARPDAU_30 = 'arpdau_30'; // Monthly.
var METRIC_REVENUE = 'revenue'; // Daily.
var DIMENSION_APPLICATION = 'application';

var dimensions = [METRIC_REVENUE, DIMENSION_APPLICATION, DIMENSION_DATE];
var metrics = [METRIC_REVENUE, METRIC_ARPDAU, METRIC_ARPDAU_7];

function calculateExtendedArpdau(data, dimensions, metrics, since, until) {
    console.log("start calculate extended Arpdau");
    var calculateWeeklyRevenue = metrics.includes(METRIC_ARPDAU_7);
    var calculateMonthlyRevenue = metrics.includes(METRIC_ARPDAU_30);
    if (!calculateWeeklyRevenue && !calculateMonthlyRevenue) {
        return;
    }

    // Calculate hash for a row.
    var calculateHash = function (item) {
        var hashableKeys = [];
        Object.keys(item).forEach(function (key) {
            if (dimensions.includes(key) && key !== DIMENSION_DATE) {
                hashableKeys.push(key);
            }
        });
        hashableKeys.sort();
        return hashableKeys.map(function (key) {
            return item[key];
        }).join();
    };

    var cloneItem = function (item) {
        var result = {};
        Object.keys(item).forEach(function (key) {
            if (dimensions.includes(key)) {
                // Date must be added later.
                if (key !== DIMENSION_DATE) {
                    result[key] = item[key];
                }
            } else {
                // Zero metric value.
                result[key] = 0;
            }
        });
        return result;
    };

    // Prepare hash table.
    table = {};
    data.forEach(function (item) {
        // Calculate hash if necessary, will be removed later.
        var id = item.hashId = item.hashId || calculateHash(item);
        var date = item[DIMENSION_DATE];
        var arpdau = item[METRIC_ARPDAU];
        table[id] = table[id] || {};
        table[id][date] = arpdau;

        // Keep a original item.
        table[id].cloneItem = table[id].cloneItem || cloneItem(item);
    });

    // Calculated dates.
    var dates = calculateDates(since, until);
    var dateCount = dates.length;

    //Transform into prefix table.
    Object.keys(table).forEach(function (id) {
        var dict = table[id]; // Store {date, arpdau}.
        var getRevenue = function (date) {
            if (!(date in dict)) {
                // Create an empty entry.
                var entry = JSON.parse(JSON.stringify(dict.cloneItem)); // Clone.
                entry[DIMENSION_DATE] = date;
                entry.hashId = id;
                data.push(entry);
                dict[date] = 0;
            }
            return dict[date];
        };
        // Process next days.
        for (var i = 1; i < dateCount; ++i) {
            var date = dates[i];
            dict[date] = getRevenue(dates[i - 1]) + getRevenue(date);
        }
    });

    data.forEach(function (item) {
        var id = item.hashId;
        var date = item[DIMENSION_DATE];
        var endSum = table[id][date];
        if (calculateWeeklyRevenue) {
            var beginSum = 0;
            var beginDate = EE.parseDate(EE.formatDate(EE.convertStringToDate(date).addDays(-7)));
            if (beginDate >= since) {
                beginSum = table[id][beginDate];
            }
            item[METRIC_ARPDAU_7] = (endSum - beginSum) / 7;
        }
        if (calculateMonthlyRevenue) {
            var beginSum = 0;
            var beginDate = EE.parseDate(EE.formatDate(EE.convertStringToDate(date).addDays(-30)));
            if (beginDate >= since) {
                beginSum = table[id][beginDate];
            }
            item[METRIC_ARPDAU_30] = (endSum - beginSum) / 30;
        }

        // Remove calculated hash.
        delete item.hashId;
    });
}

function calculateDates(since, until) {
    var dates = [];
    var current = since;
    while (current <= until) {
        dates.push(current);
        var next = ee.parseDate(ee.formatDate(ee.convertStringToDate(current).addDays(+1)));
        current = next;
    }
    console.log("calculate dates " + dates);
    return dates;
}

calculateExtendedArpdau(data, dimensions, metrics, "20180907", "20181029");