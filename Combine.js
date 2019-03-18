// step 8
const EE = require('./EE');

var LOCK_DURATION = 5 * 60 * 1000;
var CACHE_DURATION = 6 * 60 * 60;

var CONFIG_VUNGLE_API_KEY = 'VUNGLE_API_KEY';
var CONFIG_UNITY_ADS_API_KEY = 'UNITY_ADS_API_KEY';
var CONFIG_UNITY_ADS_ANDROID_GAME_IDS = 'config_unity_ads_android_game_ids';
var CONFIG_UNITY_ADS_IOS_GAME_IDS = 'config_unity_ads_ios_game_ids';
var CONFIG_IRON_SOURCE_USERNAME = 'IRON_SOURCE_USERNAME';
var CONFIG_IRON_SOURCE_SECRET_KEY = 'IRON_SOURCE_SECRET_KEY';
var CONFIG_IRON_SOURCE_ALL_SOURCES = 'IRON_SOURCE_ALL_SOURCES';
var CONFIG_FACEBOOK_ADS_APP_ID = 'FACEBOOK_ADS_APP_ID';
var CONFIG_FACEBOOK_ADS_ACCESS_TOKEN = 'FACEBOOK_ADS_ACCESS_TOKEN';
var CONFIG_ANDROID_PUBLISHER_BUCKET_ID = 'ANDROID_PUBLISHER_BUCKET_ID';
var CONFIG_GOOGLE_ANALYTICS_VIEW_ID = 'GOOGLE_ANALYTICS_VIEW_ID';
var CONFIG_FIREBASE_WEB_API_KEY = 'FIREBASE_WEB_API_KEY';
var DIMENSION_DATE = 'date';
var DIMENSION_PLATFORM = 'platform';
var DIMENSION_APPLICATION = 'application';
var DIMENSION_COUNTRY = 'country_iso_code';
var DIMENSION_SOURCE = 'source';
var DIMENSION_REVENUE_TYPE = 'revenue_type';
var METRIC_INTERSTITIAL_IMPRESSIONS = 'interstitial_impressions';
var METRIC_VIDEO_REQUESTS = 'video_requests';
var METRIC_VIDEO_SUCCESSFUL_REQUESTS = 'video_successful_requests';
var METRIC_VIDEO_VIEWS = 'video_views';
var METRIC_VIDEO_COMPLETES = 'video_completes';
var METRIC_REVENUE = 'revenue'; // Daily.
var METRIC_REVENUE_7 = 'revenue_7'; // Weekly.
var METRIC_REVENUE_30 = 'revenue_30'; // Monthly.
var METRIC_ARPDAU = 'arpdau'; // Daily.
var METRIC_ARPDAU_7 = 'arpdau_7'; // Weekly.
var METRIC_ARPDAU_30 = 'arpdau_30'; // Monthly.
var _sessionId = EE.getSessionId();
var DIMENSION_DATE = 'date';
var DIMENSION_PLATFORM = 'platform';
var METRIC_ARPDAU = 'arpdau'; // Daily.
var METRIC_ARPDAU_7 = 'arpdau_7'; // Weekly.
var METRIC_ARPDAU_30 = 'arpdau_30'; // Monthly.
var METRIC_REVENUE = 'revenue'; // Daily.

const http = require('http');
const hostName = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/plan');
    res.end('Yay Me\n');
});

server.listen(port, hostName, () => {
    console.log(`Server running at http:// ${hostName}:${port}/`);
});

class Combine {
    getSupportedDimensions(dimensions) {
        return dimensions.filter(function (item) {
            return item != DIMENSION_SOURCE && item != DIMENSION_REVENUE_TYPE;
        });
    }

    getSupportedMetrics(metrics) {
        return metrics.filter(function (item) {
            var excludedMetrics = [
                METRIC_ARPDAU,
                METRIC_ARPDAU_7,
                METRIC_ARPDAU_30
            ];
            return !excludedMetrics.includes(item);
        });
    }
}

function __testUniqueData() {
    var data = '[{"date":"20180815","revenue":8.07},{"date":"20180810","revenue":30.34},{"date":"20180815","revenue":13.9},{"date":"20180820","revenue":31.9},{"date":"20180812","revenue":20.58},{"date":"20180812","revenue":48.38},{"date":"20180813","revenue":13.88},{"date":"20180813","revenue":39.4},{"date":"20180814","revenue":16.58},{"date":"20180814","revenue":43.31},{"date":"20180815","revenue":32.97},{"date":"20180815","revenue":49.61},{"date":"20180816","revenue":12.7},{"date":"20180816","revenue":49.59},{"date":"20180817","revenue":24.44},{"date":"20180817","revenue":60.96},{"date":"20180818","revenue":24.61},{"date":"20180818","revenue":48.29},{"date":"20180819","revenue":13.32},{"date":"20180819","revenue":35.91},{"date":"20180820","revenue":19.31},{"date":"20180820","revenue":47.15},{"date":"20180821","revenue":23.11},{"date":"20180821","revenue":54.97},{"date":"20180822","revenue":27.35},{"date":"20180822","revenue":65.61},{"date":"20180823","revenue":25.65},{"date":"20180823","revenue":73.37},{"date":"20180824","revenue":36.16},{"date":"20180824","revenue":62.99},{"date":"20180825","revenue":52.43},{"date":"20180825","revenue":73.38},{"date":"20180826","revenue":36.82},{"date":"20180801","revenue":85.67},{"date":"20180801","revenue":36.75},{"date":"20180827","revenue":54.38},{"date":"20180828","revenue":29.42},{"date":"20180828","revenue":72.67},{"date":"20180829","revenue":43.24},{"date":"20180829","revenue":66.06},{"date":"20180830","revenue":49.73},{"date":"20180830","revenue":96.81},{"date":"20180831","revenue":42.46},{"date":"20180831","revenue":72.73},{"date":"20180901","revenue":50.82},{"date":"20180901","revenue":95.45},{"date":"20180902","revenue":35.42},{"date":"20180930","revenue":97.07},{"date":"20180930","revenue":45.56},{"date":"20180903","revenue":92.34},{"date":"20180904","revenue":63.22},{"date":"20180904","revenue":71.53},{"date":"20180905","revenue":38.36},{"date":"20180905","revenue":39.29},{"date":"20180906","revenue":34.65},{"date":"20180906","revenue":44.53}]';
    var json = JSON.parse(data);
    var dimensions = [DIMENSION_DATE];
    var metrics = [METRIC_REVENUE, METRIC_ARPDAU, METRIC_ARPDAU_7];
    uniqueData(json, dimensions, metrics);
    var x = 1;
}

function uniqueData(data, dimensions, metrics) {
    var hasArpdau = [
        METRIC_ARPDAU,
        METRIC_ARPDAU_7,
        METRIC_ARPDAU_30
    ].some(function (item) {
        return metrics.includes(item);
    });

    var headers = dimensions.concat(metrics);

    // Convert:
    // - ios to iOS
    // - android to Android
    if (dimensions.includes(DIMENSION_PLATFORM)) {
        var platformMapper = function (item) {
            if (item === 'android') {
                return 'Android';
            }
            if (item === 'ios') {
                return 'iOS';
            }
            if (item === 'unknown' || item === 'Unknown platform') {
                return 'Unknown';
            }
            return item;
        };
        data.forEach(function (item) {
            item[DIMENSION_PLATFORM] = platformMapper(item[DIMENSION_PLATFORM]);
        });
        console.log("unique data");
    }

    // Remove unused values.
    data.forEach(function (item) {
        Object.keys(item).forEach(function (key) {
            if (hasArpdau && key === METRIC_REVENUE) {
                return;
            }
            if (!headers.includes(key)) {
                delete item[key];
            }
        });
    });

    // Compare two data.
    var comparator = function (lhs, rhs) {
        for (var i = 0, n = dimensions.length; i < n; ++i) {
            var key = dimensions[i];
            if (lhs[key] !== rhs[key]) {
                if (lhs[key] < rhs[key]) {
                    return -1;
                } else {
                    return +1;
                }
            }
        }
        return 0;
    };

    // Sort data.
    data.sort(comparator);

    // Combine data with the same dimensions.
    var index = 0; // Would be the new length.
    var nextIndex = 0;
    var length = data.length;
    while (nextIndex < length) {
        data[index] = JSON.parse(JSON.stringify(data[nextIndex])); // Clone.
        // check if it have the same date
        while (nextIndex + 1 < length && comparator(data[index], data[nextIndex + 1]) === 0) {
            ++nextIndex;
            // Combine metrics.
            metrics.forEach(function (key) {
                if (key in data[index] && key in data[nextIndex]) {
                    // Key may not exist, e.g. ARPDAU.
                    data[index][key] = Number(data[index][key]) + Number(data[nextIndex][key]);
                }
            });
        }
        ++index;
        ++nextIndex;
    }
    data.length = index;
    console.log(JSON.stringify(data));
}

module.exports = Combine;
__testUniqueData();