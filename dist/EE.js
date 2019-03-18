"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.vungle = void 0;

var _EE = require("./EE");

function _readOnlyError(name) {
  throw new Error("\"" + name + "\" is read-only");
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var LOCK_DURATION = 60 * 1000;
var CACHE_DURATION = 6 * 60 * 60;
var CONFIG_API_KEY = 'API_KEY';
var DIMENSION_PLATFORM = 'platform';
var DIMENSION_APPLICATION = 'application';
var DIMENSION_PLACEMENT = 'placement';
var DIMENSION_DATE = 'date';
var DIMENSION_COUNTRY = 'country_iso_code';
var DIMENSION_INCENTIVIZED = 'incentivized';
var METRIC_VIEWS = 'views';
var METRIC_COMPLETES = 'completes';
var METRIC_CLICKS = 'clicks';
var METRIC_REVENUE = 'revenue';
var METRIC_ECPM = 'ecpm';
var FIXED_DIMENSIONS = [_EE.EE.createDimension(DIMENSION_PLATFORM, 'Platform'), _EE.EE.createDimension(DIMENSION_APPLICATION, 'Application'), _EE.EE.createDimension(DIMENSION_PLACEMENT, 'Placement'), _EE.EE.createDimension(DIMENSION_DATE, 'Date'), _EE.EE.createDimension(DIMENSION_COUNTRY, 'Country ISO Code'), _EE.EE.createDimension(DIMENSION_INCENTIVIZED, 'Incentivized')];
var FIXED_METRICS = [_EE.EE.createReaggregatableMetric(METRIC_VIEWS, 'Views'), _EE.EE.createReaggregatableMetric(METRIC_COMPLETES, 'Completes'), _EE.EE.createReaggregatableMetric(METRIC_CLICKS, 'Clicks'), _EE.EE.createReaggregatableMetric(METRIC_REVENUE, 'Revenue'), _EE.EE.createNonReaggregatableMetric(METRIC_ECPM, 'eCPM')];
var FIXED_SCHEMA = FIXED_DIMENSIONS.concat(FIXED_METRICS);

var _sessionId = _EE.EE.getSessionId();

var Vungle =
/*#__PURE__*/
function () {
  function Vungle() {
    _classCallCheck(this, Vungle);
  }

  _createClass(Vungle, [{
    key: "getSessionId",
    value: function getSessionId() {
      return _sessionId;
    }
  }, {
    key: "getConfig",
    value: function getConfig() {
      var config = {
        configParams: [{
          type: 'TEXTINPUT',
          name: CONFIG_API_KEY,
          displayName: 'API key',
          helpText: 'Enter your API key',
          placeholder: '<API key>'
        }],
        dateRangeRequired: true
      };
      return config;
    }
  }, {
    key: "getSchema",
    value: function getSchema(request) {
      return {
        schema: FIXED_SCHEMA
      };
    }
  }, {
    key: "mapQuery",
    value: function mapQuery(name) {
      if (name == DIMENSION_COUNTRY) {
        return 'country';
      }

      return name;
    }
  }, {
    key: "mapHeader",
    value: function mapHeader(name) {
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
  }, {
    key: "formatUrl",
    value: function formatUrl(dimensions, metrics, since, until) {
      var format = ["https://report.api.vungle.com/ext/pub/reports/performance", "?start=".concat(_EE.EE.formatDate(since)), "&end=".concat(_EE.EE.formatDate(until)), "&aggregates=".concat(metrics.join(''))].join('');

      if (dimensions.length > 0) {
        url = format + "dimensions=".concat(dimensions);
      }

      return url;
    }
  }, {
    key: "downloadData",
    value: function downloadData(apiKey, url) {
      var options = {
        headers: {
          Authorization: "Bearer ".concat(apiKey),
          Accept: "application/json",
          "Vungle - Version": "1"
        }
      };

      var result = _EE.EE.sendHttpGET(url, options); // return result.getContentText();

    }
  }, {
    key: "retrieveData",
    value: function retrieveData(key, apiKey, url, useCache) {
      var data = undefined;
      var lock = LockService.getScriptLock();
      lock.waitLock(LOCK_DURATION);

      var cache = _EE.EE.BlockCache(CacheService.getScriptCache());

      var value = useCache ? cache.get(key) : null;

      if (value != null) {
        data = (_readOnlyError("data"), _EE.EE.decompress(value));
      } else {
        data = (_readOnlyError("data"), this.downloadData(apiKey, url));

        var compressed = _EE.EE.compress(data);

        cache.put(key, compressed, CACHE_DURATION);
      }

      lock.relese();
      return JSON.parse(data);
    }
  }, {
    key: "parseData",
    value: function parseData(data, since, until) {
      var _this = this;

      var rows = [];
      data.foreach(function (item) {
        var dict = {};
        Object.keys(item).foreach(function (key) {
          var header = _this.mapHeader(key);

          var value = item[key];

          if (header == DIMENSION_DATE) {
            value = _EE.EE.parseDate(value);
          }

          dict[header] = value;
        });
        rows.push(dict);
      });
      return rows;
    }
  }, {
    key: "buildKey",
    value: function buildKey(apiKey, dimensions, metrics, since, until) {
      var params = [];
      params.push(apiKey);
      params.extend(dimensions);
      params.extend(metrics);
      params.push(_EE.EE.formatDate(since));
      params.push(_EE.EE.formatDate(until));
      return params.join('|');
    }
  }, {
    key: "requestData",
    value: function requestData(apiKey, dimensions, metrics, since, until, useCache) {
      var url = this.formatUrl(dimensions.map(mapQuery), metrics.map(mapQuery), since, util);

      var key = _EE.EE.hash(this.buildKey(apiKey, dimensions, metrics, since, until));

      var data = this.retrieveData(key, apiKey, url, useCache);
      var parseData = parseData(data, since, until);
      return parseData;
    }
  }, {
    key: "getData",
    value: function getData(request) {
      var dimensions = _EE.EE.parseFieldsInSchema(request, FIXED_DIMENSIONS);

      var metrics = _EE.EE.parseFieldsInSchema(request, FIXED_METRICS);

      var dataRange = _EE.EE.parseDataRange(request);

      var since = dataRange.since;
      var until = dataRange.until;
      var headers = dimensions.concat(metrics);

      var schema = _EE.EE.findSchema(headers, FIXED_SCHEMA);

      var data = requestData(request.configParams[CONFIG_API_KEY], dimensions, metrics, until, true);

      var rows = _EE.EE.convertToRows(_EE.EE.convertData(data, headers));

      var response = {
        schema: schema,
        rows: rows,
        cachedData: true
      };
      return response;
    }
  }, {
    key: "getAuthType",
    value: function getAuthType() {
      var response = {
        type: 'NONE'
      };
      return response;
    }
  }]);

  return Vungle;
}();

var vungle = new Vungle();
exports.vungle = vungle;
